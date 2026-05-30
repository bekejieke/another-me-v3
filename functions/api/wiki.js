// GET/POST /api/wiki — Wiki entries list and creation

import { parseJsonField, jsonField, parsePagination } from '../lib/d1-client.js';
import { buildDocVector, extractWikiLinks } from '../lib/wiki-engine.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const category = url.searchParams.get('category') || '';
  const { limit, offset } = parsePagination(url);

  try {
    let results;
    if (category) {
      const { results: r } = await env.DB.prepare(
        'SELECT id, title, category, tags_json, source_url, source_title, created_at, updated_at, substr(content, 1, 200) as snippet FROM wiki_entries WHERE category = ? ORDER BY updated_at DESC LIMIT ? OFFSET ?'
      ).bind(category, limit, offset).all();
      results = r;
    } else {
      const { results: r } = await env.DB.prepare(
        'SELECT id, title, category, tags_json, source_url, source_title, created_at, updated_at, substr(content, 1, 200) as snippet FROM wiki_entries ORDER BY updated_at DESC LIMIT ? OFFSET ?'
      ).bind(limit, offset).all();
      results = r;
    }

    const entries = (results || []).map((row) => ({
      ...row,
      tags: parseJsonField(row.tags_json, []),
    }));

    return Response.json(entries);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { title, content, category = 'general', tags = [], source_url = '', source_title = '' } = body;

    if (!title || !content) {
      return Response.json({ error: '标题和内容不能为空' }, { status: 400 });
    }

    // Count total docs for IDF calculation
    const { totalDocs } = await env.DB.prepare('SELECT COUNT(*) as totalDocs FROM wiki_entries').first() || { totalDocs: 0 };
    const corpusStats = { totalDocs: (totalDocs || 0) + 1, docFreq: {} };

    const vector = buildDocVector(title, content, corpusStats);

    const result = await env.DB.prepare(
      'INSERT INTO wiki_entries (title, content, category, tags_json, source_url, source_title, vector_tfidf) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(title, content, category, jsonField(tags), source_url, source_title, JSON.stringify(vector)).run();

    // Parse [[wiki-links]] and create cross-references
    const links = extractWikiLinks(content);
    if (links.length > 0) {
      for (const linkTitle of links) {
        const target = await env.DB.prepare('SELECT id FROM wiki_entries WHERE title = ?').bind(linkTitle).first();
        if (target) {
          await env.DB.prepare(
            'INSERT OR IGNORE INTO wiki_links (source_id, target_id) VALUES (?, ?)'
          ).bind(result.meta.last_row_id, target.id).run();
        }
      }
    }

    return Response.json({
      id: result.meta.last_row_id,
      title,
      category,
      tags,
      links_found: links.length,
    }, { status: 201 });
  } catch (error) {
    if (error.message && error.message.includes('UNIQUE constraint')) {
      return Response.json({ error: '该标题已存在' }, { status: 409 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
}
