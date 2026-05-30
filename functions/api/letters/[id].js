// GET/POST /api/letters/:id — Single letter view and reply

import { parseJsonField } from '../../lib/d1-client.js';

export async function onRequestGet(context) {
  const { env, params } = context;
  const letterId = params.id || '';

  try {
    const letter = await env.DB.prepare('SELECT * FROM tree_letters WHERE id = ?').bind(letterId).first();
    if (!letter) {
      return Response.json({ error: '信件不存在' }, { status: 404 });
    }
    return Response.json({
      ...letter,
      replies: parseJsonField(letter.replies_json, []),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function onRequestPost(context) {
  const { request, env, params } = context;
  const letterId = params.id || '';

  try {
    const { content } = await request.json();
    if (!content || !content.trim()) {
      return Response.json({ error: '回复内容不能为空' }, { status: 400 });
    }

    const letter = await env.DB.prepare('SELECT * FROM tree_letters WHERE id = ?').bind(letterId).first();
    if (!letter) {
      return Response.json({ error: '信件不存在' }, { status: 404 });
    }

    const replies = parseJsonField(letter.replies_json, []);
    replies.push(content.trim());

    await env.DB.prepare('UPDATE tree_letters SET replies_json = ? WHERE id = ?')
      .bind(JSON.stringify(replies), letterId).run();

    return Response.json({ ok: true, replies });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
