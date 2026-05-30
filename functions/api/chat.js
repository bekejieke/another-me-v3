// Cloudflare Pages Function — Ark API chat proxy with SSE streaming
// Reads ARK_API_KEY from Cloudflare environment variables (server-side, never exposed)

const SYSTEM_PROMPT = `你是"海海小猫"，Another Me 项目中的 AI 职业导师、毕业季陪伴者与职业树洞引导员。你的核心服务对象是大学毕业生、应届生、实习生、初入职场 0-3 年的年轻人。

核心使命：帮用户理解自己、做职业决策、提升求职能力、处理就业情绪。
工作原则：先接住情绪再拆解问题；给出小到可执行的下一步；不制造确定性幻觉。
输出格式：第一段一句话共情（最多35字）；2-3个编号建议（各最多35字）；一个今天可做的小行动。总量120-220字。

安全边界：你不是心理治疗师。如用户有自伤自杀表达，立即建议联系身边人或心理援助热线。`;

function shanghaiDate() {
  return new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const apiKey = env.ARK_API_KEY;

  if (!apiKey) {
    return Response.json({
      reply: "你好，我是海海小猫。ARK_API_KEY 还没配置，等设置好后我就能帮你分析职业问题了。\n\n1. 现在可以先告诉我：最卡住你的是求职、选择，还是情绪？\n2. 也可以看看页面上的视频资源哦。\n\n今天先聊聊你的情况吧，我在听。",
    });
  }

  try {
    const { messages = [], stream = false } = await request.json();
    const safe = messages
      .filter(m => ["user", "assistant"].includes(m?.role) && typeof m?.content === "string")
      .slice(-12)
      .map(m => ({ role: m.role, content: m.content.slice(0, 1000) }));

    const body = {
      model: "doubao-seed-2-0-pro-260215",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "system", content: `当前日期：${shanghaiDate()}，时区：Asia/Shanghai。请基于当前日期回答用户关于招聘、校招等时效性问题。` },
        ...safe,
      ],
      max_tokens: 420,
      thinking: { type: "disabled" },
      stream,
    };

    if (!stream) {
      const res = await fetch("https://ark.cn-beijing.volces.com/api/v3/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) return Response.json({ reply: "模型服务暂时连不上，请稍后再试。" }, { status: 502 });
      const data = await res.json();
      return Response.json({ reply: data.choices?.[0]?.message?.content?.trim() || "我在这里。" });
    }

    // SSE streaming
    body.stream = true;
    const res = await fetch("https://ark.cn-beijing.volces.com/api/v3/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      // Fallback: non-streaming
      body.stream = false;
      const fb = await fetch("https://ark.cn-beijing.volces.com/api/v3/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const fbData = await fb.json();
      const reply = fbData.choices?.[0]?.message?.content?.trim() || "";
      const { readable, writable } = new TransformStream();
      const w = writable.getWriter();
      const enc = new TextEncoder();
      w.write(enc.encode(`event: delta\ndata: ${JSON.stringify({ text: reply })}\n\n`));
      w.write(enc.encode(`event: done\ndata: ${JSON.stringify({ videos: [], references: [] })}\n\n`));
      w.close();
      return new Response(readable, { headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache" } });
    }

    // Pipe SSE stream directly
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const enc = new TextEncoder();
    const dec = new TextDecoder();

    (async () => {
      try {
        const reader = res.body.getReader();
        let buf = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() || "";
          for (const line of lines) {
            if (line.startsWith("data:") && !line.includes("[DONE]")) {
              try {
                const d = JSON.parse(line.slice(5).trim());
                const delta = d.choices?.[0]?.delta?.content || "";
                if (delta) writer.write(enc.encode(`event: delta\ndata: ${JSON.stringify({ text: delta })}\n\n`));
              } catch {}
            }
          }
        }
      } catch {}
      writer.write(enc.encode(`event: done\ndata: ${JSON.stringify({ videos: [], references: [] })}\n\n`));
      writer.close();
    })();

    return new Response(readable, { headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", "Connection": "keep-alive" } });
  } catch (e) {
    return Response.json({ reply: "出了点小问题，请再试一次。" }, { status: 500 });
  }
}
