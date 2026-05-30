// GET /api/wiki/tags — Tag cloud

import { parseJsonField } from '../../lib/d1-client.js';

export async function onRequestGet(context) {
  const { env } = context;

  try {
    const { results } = await env.DB.prepare('SELECT tags_json FROM wiki_entries').all();

    const tagCounts = {};
    (results || []).forEach((row) => {
      const tags = parseJsonField(row.tags_json, []);
      tags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const tags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

    return Response.json(tags);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
