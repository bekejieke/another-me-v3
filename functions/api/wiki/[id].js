// GET/PUT/DELETE /api/wiki/:id — Single wiki entry CRUD

import { parseJsonField, jsonField } from '../../lib/d1-client.js';
import { buildDocVector, extractWikiLinks } from '../../lib/wiki-engine.js';

export async function onRequestGet(context) {
  const { env, params } = context;
  const id = parseInt(params.id);

  try {
    const entry = await env.DB.prepare('SELECT * FROM wiki_entries WHERE id = ?').bind(id).first();
    if (!entry) {
      return Response.json({ error: '条目不存在' }, { status: 404 });
    }

    const { results: linked } = await env.DB.prepare(
      `SELECT w.id, w.title, w.category FROM wiki_entries w
       JOIN wiki_links l ON w.id = l.target_id WHERE l.source_id = ?
       UNION
       SELECT w.id, w.title, w.category FROM wiki_entries w
       JOIN wiki_links l ON w.id = l.source_id WHERE l.target_id = ?`
    ).bind(id, id).all();

    return Response.json({
      ...entry,
      tags: parseJsonField(entry.tags_json, []),
      linked_entries: linked || [],
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function onRequestPut(context) {
  const { request, env, params } = context;
  const id = parseInt(params.id);

  try {
    const body = await request.json();
    const { title, content, category, tags, source_url, source_title } = body;

    const existing = await env.DB.prepare('SELECT * FROM wiki_entries WHERE id = ?').bind(id).first();
    if (!existing) {
      return Response.json({ error: '条目不存在' }, { status: 404 });
    }

    const newTitle = title || existing.title;
    const newContent = content || existing.content;
    const newTags = tags || parseJsonField(existing.tags_json, []);

    const { totalDocs } = await env.DB.prepare('SELECT COUNT(*) as totalDocs FROM wiki_entries').first() || { totalDocs: 0 };
    const vector = buildDocVector(newTitle, newContent, { totalDocs: totalDocs || 1, docFreq: {} });

    await env.DB.prepare(
      `UPDATE wiki_entries SET title=?, content=?, category=?, tags_json=?, source_url=?, source_title=?, vector_tfidf=?, updated_at=datetime('now') WHERE id=?`
    ).bind(newTitle, newContent, category || existing.category, jsonField(newTags),
           source_url || existing.source_url || '', source_title || existing.source_title || '',
           JSON.stringify(vector), id).run();

    await env.DB.prepare('DELETE FROM wiki_links WHERE source_id = ?').bind(id).run();
    const links = extractWikiLinks(newContent);
    for (const linkTitle of links) {
      const target = await env.DB.prepare('SELECT id FROM wiki_entries WHERE title = ?').bind(linkTitle).first();
      if (target) {
        await env.DB.prepare('INSERT OR IGNORE INTO wiki_links (source_id, target_id) VALUES (?, ?)').bind(id, target.id).run();
      }
    }

    return Response.json({ ok: true, id, links_updated: links.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function onRequestDelete(context) {
  const { env, params } = context;
  const id = parseInt(params.id);

  try {
    await env.DB.prepare('DELETE FROM wiki_entries WHERE id = ?').bind(id).run();
    await env.DB.prepare('DELETE FROM wiki_links WHERE source_id = ? OR target_id = ?').bind(id, id).run();
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
