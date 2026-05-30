// GET /api/videos — Video resource catalog + recommendation

import { parseJsonField } from '../lib/d1-client.js';
import { matchVideos } from '../lib/video-matcher.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim();

  try {
    const { results } = await env.DB.prepare('SELECT * FROM video_resources ORDER BY id').all();

    const videos = (results || []).map((row) => ({
      ...row,
      tags: parseJsonField(row.tags_json, []),
    }));

    // If query provided, return top-5 recommended videos
    if (q) {
      const matched = matchVideos(q, results);
      return Response.json({
        query: q,
        results: matched.slice(0, 5).map((row) => ({
          ...row,
          tags: parseJsonField(row.tags_json, []),
        })),
      });
    }

    // Otherwise return all videos, grouped by tags
    const tags = url.searchParams.get('tags') || '';
    if (tags) {
      const tagList = tags.split(',').map((t) => t.trim().toLowerCase());
      const filtered = videos.filter((v) =>
        v.tags.some((t) => tagList.includes(t.toLowerCase()))
      );
      return Response.json(filtered);
    }

    return Response.json(videos);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
