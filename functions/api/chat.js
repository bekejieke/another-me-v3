// POST /api/chat — AI chat with SSE streaming
// Proxies to Volcano Engine Ark API, stores messages in D1

import { chatCompletionStream, chatCompletion, normalizeMessages } from '../lib/ark-client.js';
import { matchVideos } from '../lib/video-matcher.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const apiKey = env.ARK_API_KEY;

  if (!apiKey) {
    return Response.json({
      error: 'ARK_API_KEY not configured',
      fallback: '我已经准备好做你的职业导师啦。等服务端放好 Ark API key 后，我就能结合资料帮你分析。',
    }, { status: 503 });
  }

  try {
    const { messages = [], stream = false, session_id = 'default' } = await request.json();
    const safeMessages = normalizeMessages(messages);
    const lastUserMsg = safeMessages.filter(m => m.role === 'user').at(-1);
    const userContent = lastUserMsg?.content || '';

    // Store user message asynchronously
    if (userContent) {
      context.waitUntil(
        env.DB.prepare(
          'INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)'
        ).bind(session_id, 'user', userContent).run()
      );
    }

    // Non-streaming fallback
    if (!stream) {
      const result = await chatCompletion(apiKey, safeMessages);
      if (!result.ok) {
        return Response.json({ error: 'Ark API failed', detail: result.detail }, { status: 502 });
      }

      // Match videos
      const { results: videos } = await env.DB.prepare('SELECT * FROM video_resources').all();
      const matched = matchVideos(userContent, videos);

      // Store assistant reply
      context.waitUntil(
        env.DB.prepare(
          'INSERT INTO chat_messages (session_id, role, content, videos_json) VALUES (?, ?, ?, ?)'
        ).bind(session_id, 'assistant', result.data.reply, JSON.stringify(matched)).run()
      );

      return Response.json({ ...result.data, videos: matched });
    }

    // Streaming mode
    const streamResult = await chatCompletionStream(apiKey, safeMessages);
    if (!streamResult.ok) {
      // Fallback to non-streaming
      const fallback = await chatCompletion(apiKey, safeMessages);
      if (!fallback.ok) {
        return Response.json({ error: 'Ark API failed' }, { status: 502 });
      }
      return Response.json(fallback.data);
    }

    // Match videos for streaming response
    const { results: allVideos } = await env.DB.prepare('SELECT * FROM video_resources').all();
    const matchedVideos = matchVideos(userContent, allVideos);

    // Build SSE stream with video injection at end
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    let fullContent = '';

    // Read the Ark SSE stream, forward to client, then store in D1
    const streamDone = (async () => {
      const reader = streamResult.stream.getReader();
      try {
        let buffer = '';
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data:') && !line.includes('[DONE]')) {
              try {
                const data = JSON.parse(line.slice(5).trim());
                const delta = data.choices?.[0]?.delta?.content || '';
                if (delta) {
                  fullContent += delta;
                  writer.write(encoder.encode(`event: delta\ndata: ${JSON.stringify({ text: delta })}\n\n`));
                }
              } catch { /* skip malformed chunks */ }
            }
          }
        }
        // Store reply AFTER stream completes (no race)
        await env.DB.prepare(
          'INSERT INTO chat_messages (session_id, role, content, videos_json) VALUES (?, ?, ?, ?)'
        ).bind(session_id, 'assistant', fullContent || '(empty)', JSON.stringify(matchedVideos)).run();
        // Send videos and references at end
        writer.write(encoder.encode(`event: done\ndata: ${JSON.stringify({ videos: matchedVideos, references: [] })}\n\n`));
      } catch (e) {
        writer.write(encoder.encode(`event: done\ndata: ${JSON.stringify({ videos: matchedVideos, references: [] })}\n\n`));
      } finally {
        writer.close();
      }
    })();

    context.waitUntil(streamDone);

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    return Response.json({ error: 'Chat failed', detail: error.message }, { status: 500 });
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('session_id') || 'default';

  try {
    const { results } = await env.DB.prepare(
      'SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC LIMIT 100'
    ).bind(sessionId).all();

    return Response.json(results || []);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('session_id') || 'default';

  try {
    await env.DB.prepare('DELETE FROM chat_messages WHERE session_id = ?').bind(sessionId).run();
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
