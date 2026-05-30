// GET /api/wiki/search?q=&top_k=5 — Semantic wiki search

import { buildFTSQuery, rankByTFIDF } from '../../lib/wiki-engine.js';
import { parseJsonField } from '../../lib/d1-client.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const query = (url.searchParams.get('q') || '').trim();
  const topK = Math.min(parseInt(url.searchParams.get('top_k')) || 5, 20);

  if (!query) {
    return Response.json({ query: '', results: [], took_ms: 0 });
  }

  const start = Date.now();

  try {
    const ftsQuery = buildFTSQuery(query);
    if (!ftsQuery) {
      return Response.json({ query, results: [], took_ms: Date.now() - start });
    }
    const { results: candidates } = await env.DB.prepare(`
      SELECT w.id, w.title, w.category, w.tags_json, w.vector_tfidf, w.source_url, w.source_title,
             snippet(wiki_fts, 1, '<mark>', '</mark>', '…', 40) AS snippet,
             w.created_at, w.updated_at,
             rank
      FROM wiki_fts f
      JOIN wiki_entries w ON f.rowid = w.id
      WHERE wiki_fts MATCH ?
      ORDER BY rank
      LIMIT 20
    `).bind(ftsQuery).all();

    if (!candidates || !candidates.length) {
      return Response.json({ query, results: [], took_ms: Date.now() - start });
    }

    const scored = rankByTFIDF(query, candidates);
    const results = scored.slice(0, topK).map((r) => ({
      id: r.id,
      title: r.title,
      category: r.category,
      tags: parseJsonField(r.tags_json, []),
      snippet: r.snippet || '',
      score: Math.round(r.score * 100) / 100,
      source_url: r.source_url,
      created_at: r.created_at,
    }));

    return Response.json({ query, results, took_ms: Date.now() - start });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
