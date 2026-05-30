// GET/POST /api/letters — Career Tree Hole letters CRUD
// Replaces localStorage with D1 persistence

import { parseJsonField } from '../lib/d1-client.js';

const SEED_LETTERS = [
  {
    id: 'seed-1',
    topic: '第一份工作和喜欢的方向不一样',
    content: '我收到一个还不错的 offer，但它不是我真正喜欢的方向。身边人都说先稳定下来，可我怕自己以后再也转不回去了。',
    replies: ['可以先把这份工作当成一段观察期：它能给你什么能力、资源和现金流？同时给喜欢的方向保留每周固定的一小段行动。'],
  },
  {
    id: 'seed-2',
    topic: '投了很多简历没有回应',
    content: '毕业后投了很多简历，回应很少。我开始怀疑是不是自己大学几年都白过了，不知道下一步怎么调整。',
    replies: [],
  },
  {
    id: 'seed-3',
    topic: '想去大城市又有点害怕',
    content: '我想去大城市试试，但想到租房、通勤、生活成本就很害怕。留在家附近又觉得不甘心。',
    replies: [],
  },
];

function seedIfNeeded(db) {
  return Promise.all(SEED_LETTERS.map((letter) =>
    db.prepare(
      'INSERT OR IGNORE INTO tree_letters (id, topic, content, replies_json, is_seed) VALUES (?, ?, ?, ?, 1)'
    ).bind(letter.id, letter.topic, letter.content, JSON.stringify(letter.replies)).run()
  ));
}

export async function onRequestGet(context) {
  const { env } = context;

  try {
    await seedIfNeeded(env.DB);
    const { results } = await env.DB.prepare(
      'SELECT * FROM tree_letters ORDER BY created_at DESC LIMIT 100'
    ).all();

    const letters = (results || []).map((row) => ({
      ...row,
      replies: parseJsonField(row.replies_json, []),
    }));

    return Response.json(letters);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { topic, content } = await request.json();
    if (!content || !content.trim()) {
      return Response.json({ error: '内容不能为空' }, { status: 400 });
    }

    const id = `letter-${Date.now()}`;
    const resolvedTopic = topic || (content.length > 18 ? `${content.slice(0, 18)}...` : content);

    await env.DB.prepare(
      'INSERT INTO tree_letters (id, topic, content, replies_json, is_seed) VALUES (?, ?, ?, ?, 0)'
    ).bind(id, resolvedTopic, content.trim(), '[]').run();

    return Response.json({
      id,
      topic: resolvedTopic,
      content: content.trim(),
      replies: [],
      is_seed: false,
      created_at: new Date().toISOString(),
    }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
