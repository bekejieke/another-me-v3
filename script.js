const canvas = document.getElementById("stage");
const ctx = canvas.getContext("2d");
const scene = document.body.dataset.scene;

const SCENE = { width: 720, height: 720 };
const EGG = { width: 370, height: 469 };
const EGG_SRC = "./eggs/golden-egg-cutout.png";
const CAT_SRC = "./pets/jiro-spritesheet.webp";
const ENTER_MS = 1750;
const POST_ENTER_LOOP_MS = 5600;
const REVEAL_MS = 5200;
const HATCH_TO_WORLD_DELAY_MS = 6200;
let hatchRevealStartedAt = null;
const chatMessages = [
  {
    role: "assistant",
    content: "我是海海小猫，可以陪你聊职业规划、求职和职场情绪。\n如果你刚来，也可以先问问下面这些：职业树洞是什么？职业树洞怎么唤醒？怎么开始规划职业？",
  },
];
const CAT_HINTS = [
  "可以跟我聊天哦",
  "要不要聊聊职业规划？",
  "卡住的事，我们一起拆",
  "想了解树洞，也能问我",
];
const LETTER_STORAGE_KEY = "another-me-career-letters";
const seedLetters = [
  {
    id: "seed-1",
    topic: "第一份工作和喜欢的方向不一样",
    content: "我收到一个还不错的 offer，但它不是我真正喜欢的方向。身边人都说先稳定下来，可我怕自己以后再也转不回去了。",
    replies: ["可以先把这份工作当成一段观察期：它能给你什么能力、资源和现金流？同时给喜欢的方向保留每周固定的一小段行动。"],
  },
  {
    id: "seed-2",
    topic: "投了很多简历没有回应",
    content: "毕业后投了很多简历，回应很少。我开始怀疑是不是自己大学几年都白过了，不知道下一步怎么调整。",
    replies: [],
  },
  {
    id: "seed-3",
    topic: "想去大城市又有点害怕",
    content: "我想去大城市试试，但想到租房、通勤、生活成本就很害怕。留在家附近又觉得不甘心。",
    replies: [],
  },
];
let activeLetterIndex = 0;

const FRAMES = {
  0: { x: 18, y: 5, width: 156, height: 198 },
  1: { x: 209, y: 5, width: 157, height: 198 },
  2: { x: 399, y: 5, width: 161, height: 198 },
  3: { x: 592, y: 5, width: 160, height: 198 },
  4: { x: 784, y: 5, width: 159, height: 198 },
  5: { x: 977, y: 5, width: 158, height: 198 },
  6: { x: 1349, y: 235, width: 182, height: 154 },
  7: { x: 5, y: 236, width: 182, height: 152 },
  8: { x: 389, y: 238, width: 182, height: 148 },
  9: { x: 773, y: 239, width: 182, height: 146 },
  10: { x: 581, y: 240, width: 182, height: 143 },
  11: { x: 965, y: 242, width: 182, height: 140 },
  12: { x: 1157, y: 243, width: 182, height: 138 },
  13: { x: 197, y: 246, width: 182, height: 132 },
  22: { x: 16, y: 629, width: 160, height: 198 },
  23: { x: 208, y: 629, width: 159, height: 198 },
  24: { x: 399, y: 629, width: 162, height: 198 },
  25: { x: 595, y: 629, width: 154, height: 198 },
  39: { x: 19, y: 1253, width: 153, height: 198 },
  40: { x: 208, y: 1253, width: 160, height: 198 },
  41: { x: 397, y: 1253, width: 166, height: 198 },
  42: { x: 593, y: 1253, width: 158, height: 198 },
  43: { x: 796, y: 1253, width: 136, height: 198 },
  44: { x: 982, y: 1253, width: 148, height: 198 },
  45: { x: 22, y: 1461, width: 148, height: 198 },
  46: { x: 403, y: 1461, width: 154, height: 198 },
  47: { x: 591, y: 1461, width: 162, height: 198 },
  48: { x: 787, y: 1461, width: 153, height: 198 },
  54: { x: 596, y: 1669, width: 152, height: 198 },
  55: { x: 795, y: 1669, width: 138, height: 198 },
  56: { x: 985, y: 1669, width: 141, height: 198 },
};

const SEQ = {
  calm: [
    { id: 0, ms: 420 },
    { id: 1, ms: 420 },
    { id: 4, ms: 420 },
    { id: 5, ms: 420 },
    { id: 2, ms: 180 },
    { id: 3, ms: 180 },
  ],
  greet: [
    { id: 22, ms: 360 },
    { id: 25, ms: 360 },
    { id: 22, ms: 360 },
  ],
  enter: [
    { id: 7, ms: 95 },
    { id: 13, ms: 95 },
    { id: 8, ms: 95 },
    { id: 10, ms: 95 },
    { id: 9, ms: 95 },
    { id: 11, ms: 95 },
    { id: 12, ms: 95 },
    { id: 6, ms: 95 },
  ],
  thinking: [
    { id: 39, ms: 320 },
    { id: 40, ms: 320 },
    { id: 41, ms: 340 },
    { id: 43, ms: 420 },
    { id: 44, ms: 360 },
    { id: 42, ms: 260 },
    { id: 40, ms: 320 },
  ],
  comfort: [
    { id: 45, ms: 260 },
    { id: 46, ms: 280 },
    { id: 48, ms: 300 },
    { id: 47, ms: 360 },
    { id: 48, ms: 300 },
    { id: 55, ms: 360 },
    { id: 56, ms: 320 },
    { id: 54, ms: 320 },
  ],
  happy: [
    { id: 22, ms: 280 },
    { id: 23, ms: 220 },
    { id: 24, ms: 220 },
    { id: 23, ms: 220 },
    { id: 25, ms: 280 },
    { id: 23, ms: 220 },
    { id: 24, ms: 220 },
    { id: 22, ms: 280 },
  ],
};

const CAT_IDLE_BEHAVIORS = [
  { name: "calm", min: 6500, max: 13000, weight: 52 },
  { name: "thinking", min: 1600, max: 2800, weight: 18 },
  { name: "comfort", min: 1500, max: 2600, weight: 14 },
  { name: "greet", min: 900, max: 1500, weight: 8 },
  { name: "happy", min: 900, max: 1500, weight: 8 },
];

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function easeInOut(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOut(t) {
  return 1 - Math.pow(1 - t, 3);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function progress(t, start, end) {
  return clamp((t - start) / (end - start));
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load ${src}`));
    image.src = src;
  });
}

function frameAt(sequence, elapsed) {
  const total = sequence.reduce((sum, frame) => sum + frame.ms, 0);
  const local = elapsed % total;
  let cursor = 0;
  for (const step of sequence) {
    cursor += step.ms;
    if (local < cursor) return FRAMES[step.id];
  }
  return FRAMES[sequence[0].id];
}

function drawStar(x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r * 0.18, y - r * 0.18);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x + r * 0.18, y + r * 0.18);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r * 0.18, y + r * 0.18);
  ctx.lineTo(x - r, y);
  ctx.lineTo(x - r * 0.18, y - r * 0.18);
  ctx.closePath();
  ctx.fill();
}

function drawRoundedRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawSoftBackground(elapsed) {
  // Background fill is provided by the page (CSS) so the square canvas can be
  // letterboxed full-bleed on a widescreen web stage without a visible seam.
  const pulse = Math.sin(elapsed * 0.003) * 0.5 + 0.5;

  ctx.fillStyle = `rgba(242,193,78,${0.06 + pulse * 0.03})`;
  ctx.beginPath();
  ctx.ellipse(360, 380, 206 + pulse * 12, 232 + pulse * 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(26,26,26,0.06)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i += 1) {
    const y = 500 + i * 22;
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.bezierCurveTo(170, y - 20, 274, y + 22, 414, y - 8);
    ctx.bezierCurveTo(534, y - 34, 618, y + 16, 690, y - 4);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(242,193,78,0.44)";
  [
    [132, 230, 18],
    [586, 204, 14],
    [602, 492, 12],
    [148, 498, 12],
  ].forEach(([x, y, r], index) => {
    ctx.globalAlpha = 0.33 + Math.sin(elapsed * 0.004 + index) * 0.16;
    drawStar(x, y, r);
  });
  ctx.globalAlpha = 1;
}

function eggPose(elapsed, t) {
  const shake = easeInOut(progress(t, 0.08, 0.55));
  const pulse = easeInOut(progress(t, 0.32, 0.9));
  return {
    x: 360 + Math.sin(elapsed * 0.016) * 9 * shake,
    bottom: 590 + Math.sin(elapsed * 0.014) * 5 * shake,
    rotation: Math.sin(elapsed * 0.011) * (0.024 + shake * 0.06) + Math.sin(elapsed * 0.032) * 0.016 * pulse,
    scale: 1 + Math.sin(elapsed * 0.008) * 0.014,
  };
}

function strokeCrack() {
  ctx.beginPath();
  ctx.moveTo(-18, -382);
  ctx.lineTo(2, -360);
  ctx.lineTo(-8, -338);
  ctx.lineTo(12, -314);
  ctx.lineTo(4, -288);
  ctx.lineTo(30, -258);
  ctx.stroke();

  [
    [0, -359, 36, -374, 62, -352],
    [-6, -337, -42, -350, -68, -324],
    [11, -314, 46, -304, 72, -276],
    [4, -288, -28, -270, -44, -238],
  ].forEach(([a, b, c, d, e, f]) => {
    ctx.beginPath();
    ctx.moveTo(a, b);
    ctx.lineTo(c, d);
    ctx.lineTo(e, f);
    ctx.stroke();
  });
}

function drawCracks(elapsed, alpha, burst = 0) {
  if (alpha <= 0.02) return;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const glow = ctx.createRadialGradient(2, -323, 8, 2, -323, 140 + burst * 80);
  glow.addColorStop(0, `rgba(255,235,158,${0.36 * alpha + burst * 0.28})`);
  glow.addColorStop(0.45, `rgba(245,190,58,${0.22 * alpha})`);
  glow.addColorStop(1, "rgba(245,190,58,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(2, -323, 142 + burst * 80, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `rgba(245,190,58,${0.18 + 0.18 * alpha})`;
  ctx.lineWidth = 2.2;
  for (let i = 0; i < 12; i += 1) {
    const angle = -Math.PI * 0.86 + i * (Math.PI * 1.6 / 11);
    const start = 34 + (i % 3) * 4;
    const end = 82 + burst * 48 + Math.sin(elapsed * 0.007 + i) * 13;
    ctx.beginPath();
    ctx.moveTo(2 + Math.cos(angle) * start, -323 + Math.sin(angle) * start);
    ctx.lineTo(2 + Math.cos(angle) * end, -323 + Math.sin(angle) * end);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = alpha * (1 - burst * 0.25);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalCompositeOperation = "lighter";
  ctx.shadowColor = "rgba(245,190,58,0.82)";
  ctx.shadowBlur = 16;
  ctx.strokeStyle = "rgba(245,190,58,0.28)";
  ctx.lineWidth = 10;
  strokeCrack();
  ctx.shadowBlur = 0;
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = "rgba(116,78,21,0.76)";
  ctx.lineWidth = 2.6;
  strokeCrack();
  ctx.strokeStyle = "rgba(255,233,150,0.88)";
  ctx.lineWidth = 1.1;
  strokeCrack();
  ctx.restore();
}

function drawEgg(image, elapsed, t, crackStrength = 0) {
  const pose = eggPose(elapsed, t);
  ctx.save();
  ctx.translate(pose.x, pose.bottom);
  ctx.rotate(pose.rotation);
  ctx.scale(pose.scale, pose.scale);

  ctx.fillStyle = `rgba(242,193,78,${0.06 + crackStrength * 0.07})`;
  ctx.beginPath();
  ctx.ellipse(0, -EGG.height * 0.47, EGG.width * 0.55, EGG.height * 0.51, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.drawImage(image, -EGG.width / 2, -EGG.height, EGG.width, EGG.height);

  ctx.fillStyle = "rgba(26,26,26,0.11)";
  ctx.beginPath();
  ctx.ellipse(0, 20, 130, 24, 0, 0, Math.PI * 2);
  ctx.fill();

  drawCracks(elapsed, crackStrength);
  ctx.restore();
}

function clipLeftShell() {
  ctx.beginPath();
  ctx.moveTo(-EGG.width / 2, -EGG.height);
  ctx.lineTo(-18, -382);
  ctx.lineTo(2, -360);
  ctx.lineTo(-8, -338);
  ctx.lineTo(12, -314);
  ctx.lineTo(4, -288);
  ctx.lineTo(30, -258);
  ctx.lineTo(10, -160);
  ctx.lineTo(2, 0);
  ctx.lineTo(-EGG.width / 2, 0);
  ctx.closePath();
}

function clipRightShell() {
  ctx.beginPath();
  ctx.moveTo(-18, -382);
  ctx.lineTo(EGG.width / 2, -EGG.height);
  ctx.lineTo(EGG.width / 2, 0);
  ctx.lineTo(2, 0);
  ctx.lineTo(10, -160);
  ctx.lineTo(30, -258);
  ctx.lineTo(4, -288);
  ctx.lineTo(12, -314);
  ctx.lineTo(-8, -338);
  ctx.lineTo(2, -360);
  ctx.closePath();
}

function drawShellHalf(image, side, amount) {
  const direction = side === "left" ? -1 : 1;
  const fall = progress(amount, 0.62, 1);
  ctx.save();
  ctx.translate(direction * 92 * amount, -30 * amount + fall * 18);
  ctx.rotate(direction * 0.2 * amount);
  side === "left" ? clipLeftShell() : clipRightShell();
  ctx.clip();
  ctx.globalAlpha = 1 - fall * 0.32;
  ctx.drawImage(image, -EGG.width / 2, -EGG.height, EGG.width, EGG.height);
  ctx.restore();
}

function drawFragments(elapsed, amount) {
  if (amount <= 0.04) return;
  const fragments = [
    [-22, -355, -70, -58, -0.8, 18],
    [18, -365, 54, -70, 0.64, 16],
    [-48, -326, -88, -18, -0.5, 14],
    [46, -322, 86, -26, 0.72, 15],
    [-18, -288, -54, 28, -1.1, 13],
    [34, -278, 58, 24, 1.2, 12],
    [-82, -242, -72, 50, -0.35, 12],
    [92, -230, 66, 46, 0.38, 12],
  ];

  ctx.save();
  ctx.globalAlpha = 1 - progress(amount, 0.76, 1) * 0.42;
  fragments.forEach(([x, y, dx, dy, r, s], index) => {
    const flutter = Math.sin(elapsed * 0.006 + index) * 5;
    ctx.save();
    ctx.translate(x + dx * amount, y + dy * amount + flutter);
    ctx.rotate(r * amount + flutter * 0.012);
    ctx.fillStyle = "rgba(255,239,180,0.94)";
    ctx.strokeStyle = "rgba(224,151,27,0.76)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 0.86, s * 0.5);
    ctx.lineTo(-s * 0.78, s * 0.58);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  });
  ctx.restore();
}

function drawPetFrame(image, frame, cx, bottom, scale, extraY = 0, rotation = 0, flip = false) {
  const drawWidth = frame.width * scale;
  const drawHeight = frame.height * scale;
  ctx.save();
  ctx.translate(cx, bottom + extraY);
  ctx.rotate(rotation);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(image, frame.x, frame.y, frame.width, frame.height, -drawWidth / 2, -drawHeight, drawWidth, drawHeight);
  ctx.restore();
}

function canvasPointFromClient(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const scale = Math.max(rect.width / canvas.width, rect.height / canvas.height);
  const drawW = canvas.width * scale;
  const drawH = canvas.height * scale;
  return {
    x: (clientX - rect.left - (rect.width - drawW) / 2) / scale,
    y: (clientY - rect.top - (rect.height - drawH) / 2) / scale,
  };
}

function screenPointFromCanvas(x, y) {
  const rect = canvas.getBoundingClientRect();
  const scale = Math.max(rect.width / canvas.width, rect.height / canvas.height);
  const drawW = canvas.width * scale;
  const drawH = canvas.height * scale;
  return {
    x: rect.left + (rect.width - drawW) / 2 + x * scale,
    y: rect.top + (rect.height - drawH) / 2 + y * scale,
  };
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
}

function isTreeHit(point) {
  return point.x >= 280 && point.x <= 1000 && point.y >= 165 && point.y <= 665;
}

function isCatHit(point) {
  return Math.abs(point.x - walker.x) < 148 && Math.abs(point.y - (walker.bottom - 82)) < 170;
}

function drawRevealCat(image, elapsed, t) {
  const amount = easeOut(progress(t, 0.52, 0.9));
  if (amount <= 0) return;
  const alpha = progress(amount, 0, 0.22);
  const scale = lerp(0.32, 1.05, amount);
  const bottom = lerp(-44, 18, easeInOut(amount));
  const frame = frameAt(amount > 0.62 ? SEQ.happy : SEQ.calm, elapsed);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(26,26,26,0.13)";
  ctx.beginPath();
  ctx.ellipse(0, bottom + 10, 92 * scale, 20 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  drawPetFrame(image, frame, 0, bottom, scale, -Math.sin(amount * Math.PI) * 22, Math.sin(elapsed * 0.002) * 0.02);
  ctx.restore();
}

function drawHatchScene(egg, cat, elapsed) {
  if (hatchRevealStartedAt !== null) {
    drawRevealScene(egg, cat, elapsed - hatchRevealStartedAt, HATCH_TO_WORLD_DELAY_MS);
    return;
  }

  const t = (elapsed % 5200) / 5200;
  ctx.clearRect(0, 0, SCENE.width, SCENE.height);
  drawSoftBackground(elapsed);
  drawEgg(egg, elapsed, t, easeInOut(progress(t, 0.32, 0.8)) * 0.72);
}

function drawRevealScene(egg, cat, elapsed, revealMs = REVEAL_MS) {
  const t = clamp(elapsed / revealMs);
  const pose = eggPose(elapsed, t);
  const crack = easeInOut(progress(t, 0.1, 0.42));
  const broken = easeOut(progress(t, 0.38, 0.68));
  const whole = 1 - progress(t, 0.4, 0.54);

  ctx.clearRect(0, 0, SCENE.width, SCENE.height);
  drawSoftBackground(elapsed);

  ctx.save();
  ctx.translate(pose.x, pose.bottom);
  ctx.rotate(pose.rotation);
  ctx.scale(pose.scale, pose.scale);

  ctx.fillStyle = "rgba(26,26,26,0.12)";
  ctx.beginPath();
  ctx.ellipse(0, 20, 132, 24, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `rgba(242,193,78,${0.08 + crack * 0.08})`;
  ctx.beginPath();
  ctx.ellipse(0, -EGG.height * 0.47, EGG.width * 0.56, EGG.height * 0.52, 0, 0, Math.PI * 2);
  ctx.fill();

  if (whole > 0.02) {
    ctx.globalAlpha = whole;
    ctx.drawImage(egg, -EGG.width / 2, -EGG.height, EGG.width, EGG.height);
    ctx.globalAlpha = 1;
  }

  drawCracks(elapsed, crack, broken);
  drawRevealCat(cat, elapsed, t);

  if (broken > 0.02) {
    drawShellHalf(egg, "left", broken);
    drawShellHalf(egg, "right", broken);
    drawFragments(elapsed, broken);
  }
  ctx.restore();
}

function petPhase(elapsed) {
  if (elapsed < ENTER_MS) return { name: "enter", pt: elapsed / ENTER_MS };
  const t = ((elapsed - ENTER_MS) % POST_ENTER_LOOP_MS) / POST_ENTER_LOOP_MS;
  if (t < 0.24) return { name: "greet", pt: t / 0.24 };
  if (t < 0.52) return { name: "listen", pt: (t - 0.24) / 0.28 };
  if (t < 0.76) return { name: "comfort", pt: (t - 0.52) / 0.24 };
  return { name: "idle", pt: (t - 0.76) / 0.24 };
}

function drawPetBackground(elapsed) {
  const pulse = Math.sin(elapsed * 0.003) * 0.5 + 0.5;
  const sky = ctx.createLinearGradient(0, 0, 0, SCENE.height);
  sky.addColorStop(0, "#fffdf8");
  sky.addColorStop(0.56, "#f6f4ee");
  sky.addColorStop(1, "#e8f1ed");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, SCENE.width, SCENE.height);

  ctx.fillStyle = "rgba(200,232,74,0.14)";
  ctx.beginPath();
  ctx.ellipse(444, 316, 178 + pulse * 8, 150 + pulse * 5, -0.28, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(26,26,26,0.08)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i += 1) {
    const y = 430 + i * 26;
    ctx.beginPath();
    ctx.moveTo(50, y);
    ctx.bezierCurveTo(180, y - 26, 292, y + 24, 430, y - 12);
    ctx.bezierCurveTo(536, y - 40, 620, y + 14, 690, y - 8);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(255,255,255,0.72)";
  [
    [450, 118, 138, 46, "soft reply"],
    [470, 278, 154, 46, "mood sync"],
    [432, 558, 130, 46, "tiny ritual"],
  ].forEach(([x, y, w, h, text], index) => {
    const lift = Math.sin(elapsed * 0.002 + index) * 8;
    drawRoundedRect(x, y + lift, w, h, 8);
    ctx.fill();
    ctx.fillStyle = index === 1 ? "#e89ba8" : "#1a1a1a";
    ctx.font = "600 18px system-ui";
    ctx.fillText(text, x + 18, y + lift + 29);
    ctx.fillStyle = "rgba(255,255,255,0.72)";
  });

  for (let i = 0; i < 18; i += 1) {
    const x = 72 + ((i * 83 + elapsed * 0.018) % 590);
    const y = 162 + Math.sin(elapsed * 0.002 + i) * 28 + (i % 4) * 44;
    ctx.fillStyle = i % 3 === 0 ? "#c8e84a" : i % 3 === 1 ? "#e89ba8" : "#8fb9a8";
    ctx.globalAlpha = 0.18 + (i % 3) * 0.08;
    ctx.fillRect(x, y, 7, 7);
  }
  ctx.globalAlpha = 1;
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function weightedChoice(items) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let cursor = Math.random() * total;
  for (const item of items) {
    cursor -= item.weight;
    if (cursor <= 0) return item;
  }
  return items[items.length - 1];
}

function isMobileWorldScene() {
  return (scene === "pet" || scene === "world") && window.innerWidth <= 760;
}

function visibleWorldBounds() {
  if (!isMobileWorldScene()) {
    return {
      minX: SCENE.width * 0.2,
      maxX: SCENE.width * 0.82,
      grassMin: SCENE.height * 0.86,
      grassMax: SCENE.height * 0.965,
    };
  }

  const viewportRatio = window.innerWidth / window.innerHeight;
  const worldRatio = SCENE.width / SCENE.height;
  const visibleWidth = viewportRatio < worldRatio
    ? SCENE.height * viewportRatio
    : SCENE.width;
  const cropX = (SCENE.width - visibleWidth) / 2;
  const edgePadding = Math.min(96, visibleWidth * 0.18);

  return {
    minX: cropX + edgePadding,
    maxX: cropX + visibleWidth - edgePadding,
    grassMin: SCENE.height * 0.885,
    grassMax: SCENE.height * 0.935,
  };
}

function settleCat(elapsed, action = "calm", min = 4200, max = 9000) {
  walker.mode = "idle";
  walker.action = action;
  walker.actionUntil = elapsed + randomBetween(min, max);
  walker.nextDecisionAt = walker.actionUntil + randomBetween(800, 2200);
  walker.endAt = elapsed;
}

function chooseCatIdleBehavior(elapsed) {
  const next = weightedChoice(CAT_IDLE_BEHAVIORS);
  settleCat(elapsed, next.name, next.min, next.max);
}

const walker = {
  initialized: false,
  x: 472,
  bottom: 640,
  startX: 472,
  startBottom: 640,
  targetX: 472,
  targetBottom: 640,
  startAt: 0,
  endAt: 0,
  waitUntil: 0,
  nextDecisionAt: 0,
  direction: 1,
  action: "calm",
  actionUntil: 0,
  mode: "idle",
  walksSinceRest: 0,
  hasWalked: false,
  lastWalkAt: 0,
  lastGestureAt: 0,
};

function chooseWalkTarget(elapsed) {
  const bounds = visibleWorldBounds();
  const mobileWorld = isMobileWorldScene();
  const minX = bounds.minX;
  const maxX = bounds.maxX;
  let targetX = randomBetween(minX, maxX);
  const minTrip = mobileWorld ? Math.min(140, (maxX - minX) * 0.58) : 120;
  if (Math.abs(targetX - walker.x) < minTrip) {
    const midpoint = (minX + maxX) / 2;
    targetX = walker.x < midpoint
      ? randomBetween(Math.max(midpoint, minX), maxX)
      : randomBetween(minX, Math.min(midpoint, maxX));
  }

  walker.startX = walker.x;
  walker.startBottom = walker.bottom;
  walker.targetX = targetX;
  // Stay on the grass and only drift a little in depth per trip, so the cat
  // walks roughly along the ground instead of gliding diagonally through the air.
  walker.targetBottom = clamp(
    walker.bottom + randomBetween(mobileWorld ? -10 : -26, mobileWorld ? 10 : 26),
    bounds.grassMin,
    bounds.grassMax,
  );
  walker.startAt = elapsed;
  // Pace travel time to distance so speed stays believable (no slow floating).
  const distance = Math.abs(walker.targetX - walker.startX);
  walker.endAt = elapsed + clamp(distance / 0.22, 2200, 6400);
  walker.waitUntil = walker.endAt + randomBetween(5200, 12500);
  walker.nextDecisionAt = walker.waitUntil;
  walker.direction = walker.targetX >= walker.startX ? 1 : -1;
  walker.mode = "walking";
  walker.walksSinceRest += 1;
  walker.hasWalked = true;
  walker.lastWalkAt = elapsed;
}

function updateWalker(elapsed) {
  if (!walker.initialized) {
    walker.initialized = true;
    const bounds = visibleWorldBounds();
    walker.x = randomBetween(bounds.minX, bounds.maxX);
    walker.bottom = randomBetween(bounds.grassMin, bounds.grassMax);
    walker.lastWalkAt = elapsed - 9000;
    settleCat(elapsed, "calm", 900, 1800);
    return { moving: false, action: walker.action };
  }

  if (walker.mode === "idle" && elapsed < walker.actionUntil) {
    return { moving: false, action: walker.action };
  }

  if (walker.mode === "idle" && elapsed < walker.nextDecisionAt) {
    return { moving: false, action: walker.action };
  }

  if (walker.mode === "idle" && elapsed >= walker.nextDecisionAt) {
    const timeSinceWalk = elapsed - walker.lastWalkAt;
    const shouldRest = walker.walksSinceRest >= 2 && Math.random() < 0.68;
    const shouldWalk = !walker.hasWalked || (timeSinceWalk > 5200 && !shouldRest && Math.random() < 0.68);

    if (shouldWalk) {
      chooseWalkTarget(elapsed);
    } else {
      chooseCatIdleBehavior(elapsed);
      if (walker.action !== "calm") {
        walker.lastGestureAt = elapsed;
      }
      return { moving: false, action: walker.action };
    }
  }

  const amount = clamp((elapsed - walker.startAt) / (walker.endAt - walker.startAt));
  if (amount >= 1) {
    walker.x = walker.targetX;
    walker.bottom = walker.targetBottom;
    const restLong = walker.walksSinceRest >= 2;
    if (restLong) walker.walksSinceRest = 0;
    settleCat(elapsed, "calm", restLong ? 7600 : 3200, restLong ? 11800 : 6200);
    return { moving: false, action: walker.action };
  }

  const eased = easeInOut(amount);
  walker.x = lerp(walker.startX, walker.targetX, eased);
  walker.bottom = lerp(walker.startBottom, walker.targetBottom, eased);
  return { moving: true };
}

function drawPetScene(cat, elapsed) {
  const state = updateWalker(elapsed);
  // Small pet on a large meadow: scale stays modest, nearer (lower) = slightly bigger.
  const depth = clamp((walker.bottom - SCENE.height * 0.86) / (SCENE.height * 0.105));
  const scale = 0.42 + depth * 0.18;
  // Walking: a small stepping bounce (lifts up on each step). Idle: gentle breathing.
  const bob = state.moving
    ? -Math.abs(Math.sin(elapsed * 0.013)) * 6
    : Math.sin(elapsed * 0.0028) * (state.action === "calm" ? 1.8 : 3.2);
  const rotation = state.moving
    ? walker.direction * 0.018 + Math.sin(elapsed * 0.01) * 0.02
    : Math.sin(elapsed * 0.0016) * (state.action === "calm" ? 0.01 : 0.018);
  const sequence = state.moving ? SEQ.enter : SEQ[state.action || walker.action] || SEQ.calm;

  ctx.clearRect(0, 0, SCENE.width, SCENE.height);
  ctx.fillStyle = "rgba(26,26,26,0.18)";
  ctx.beginPath();
  ctx.ellipse(walker.x, walker.bottom + 9, 98 * scale, 22 * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  drawPetFrame(
    cat,
    frameAt(sequence, elapsed * (state.moving ? 1.15 : 1)),
    walker.x,
    walker.bottom,
    scale,
    bob,
    rotation,
    walker.direction < 0,
  );
}

function renderChatMessages() {
  const list = document.getElementById("catChatMessages");
  if (!list) return;
  list.innerHTML = "";
  chatMessages.forEach((message) => {
    const bubble = document.createElement("div");
    bubble.className = `cat-message ${message.role}${message.streaming ? " is-streaming" : ""}`;
    const content = document.createElement("div");
    content.textContent = message.content || (message.streaming ? "..." : "");
    bubble.appendChild(content);
    if (message.references?.length) {
      const refs = document.createElement("div");
      refs.className = "cat-message-refs";
      const refsTitle = document.createElement("span");
      refsTitle.textContent = "参考链接";
      refs.appendChild(refsTitle);
      message.references.forEach((reference, index) => {
        const link = document.createElement("a");
        link.href = reference.url;
        link.target = "_blank";
        link.rel = "noreferrer";
        link.textContent = reference.title || `参考 ${index + 1}`;
        link.title = reference.title || reference.url;
        refs.appendChild(link);
      });
      bubble.appendChild(refs);
    }
    if (message.videos?.length) {
      const videoBlock = document.createElement("div");
      videoBlock.className = "cat-video-shelf";
      const videoTitle = document.createElement("span");
      videoTitle.textContent = "抖音视频补充";
      videoBlock.appendChild(videoTitle);
      const videoList = document.createElement("div");
      videoList.className = "cat-video-list";
      message.videos.forEach((video) => {
        const card = document.createElement("a");
        card.className = "cat-video-card";
        card.href = video.url;
        card.target = "_blank";
        card.rel = "noreferrer";
        card.setAttribute("aria-label", `打开抖音视频：${video.title}`);
        card.innerHTML = `
          <div class="cat-video-thumb${video.cover ? " has-cover" : ""}">
            ${video.cover ? `<img src="${escapeHtml(video.cover)}" alt="" loading="lazy" />` : ""}
            <div class="cat-video-play" aria-hidden="true"></div>
            <strong>${escapeHtml(video.title)}</strong>
          </div>
          <p>${escapeHtml(video.highlight)}</p>
          <small>${escapeHtml(video.creator || "抖音精选")}</small>
        `;
        videoList.appendChild(card);
      });
      videoBlock.appendChild(videoList);
      bubble.appendChild(videoBlock);
    }
    list.appendChild(bubble);
  });
  list.scrollTop = list.scrollHeight;
}

function openCatChat() {
  const chat = document.getElementById("catChat");
  const input = document.getElementById("catChatInput");
  const hint = document.getElementById("catChatHint");
  if (!chat) return;
  closeTreeMail();
  renderChatMessages();
  chat.classList.add("is-open");
  chat.setAttribute("aria-hidden", "false");
  hint?.classList.add("is-hidden");
  if (window.innerWidth > 760) window.setTimeout(() => input?.focus(), 180);
}

function closeCatChat() {
  const chat = document.getElementById("catChat");
  if (!chat) return;
  chat.classList.remove("is-open");
  chat.setAttribute("aria-hidden", "true");
}

function getStoredLetters() {
  try {
    const stored = JSON.parse(localStorage.getItem(LETTER_STORAGE_KEY) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function getLetters() {
  return [...getStoredLetters(), ...seedLetters];
}

function saveUserLetter(letter) {
  const stored = getStoredLetters();
  localStorage.setItem(LETTER_STORAGE_KEY, JSON.stringify([letter, ...stored]));
}

function updateStoredLetter(id, updater) {
  const stored = getStoredLetters();
  const next = stored.map((letter) => letter.id === id ? updater(letter) : letter);
  localStorage.setItem(LETTER_STORAGE_KEY, JSON.stringify(next));
}

function activeLetter() {
  const letters = getLetters();
  return letters[activeLetterIndex % letters.length];
}

function renderActiveLetter() {
  const card = document.getElementById("treeLetterCard");
  if (!card) return;
  const letter = activeLetter();
  if (!letter) {
    card.innerHTML = "<span>EMPTY TREE</span><h2>还没有信</h2><p>先寄出第一封职业困难吧。</p>";
    return;
  }

  const replies = letter.replies?.length
    ? `<div class="tree-letter-replies"><strong>树下已经有回应</strong>${letter.replies.map((reply) => `<p>${escapeHtml(reply)}</p>`).join("")}</div>`
    : "";
  card.innerHTML = `
    <span>ANONYMOUS LETTER</span>
    <h2>${escapeHtml(letter.topic)}</h2>
    <p>${escapeHtml(letter.content)}</p>
    ${replies}
  `;
}

function setTreeMailTab(tabName) {
  document.querySelectorAll("[data-mail-tab]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mailTab === tabName);
  });
  const title = document.querySelector(".tree-mail h1");
  const kicker = document.querySelector(".tree-mail-kicker");
  if (title) title.textContent = tabName === "reply" ? "捞起一封信" : "寄出一封信";
  if (kicker) kicker.textContent = tabName === "reply" ? "DRIFTING LETTER" : "PIXEL ENVELOPE";
  document.getElementById("sendLetterPanel")?.classList.toggle("is-active", tabName === "send");
  document.getElementById("replyLetterPanel")?.classList.toggle("is-active", tabName === "reply");
  if (tabName === "reply") renderActiveLetter();
}

function openTreeMail(tabName = "send") {
  closeCatChat();
  closeTreeActions();
  const panel = document.getElementById("treeMail");
  if (!panel) return;
  panel.classList.add("is-open");
  panel.setAttribute("aria-hidden", "false");
  setTreeMailTab(tabName);
}

function closeTreeMail() {
  const panel = document.getElementById("treeMail");
  if (!panel) return;
  panel.classList.remove("is-open");
  panel.setAttribute("aria-hidden", "true");
}

function nextLetter() {
  const letters = getLetters();
  if (!letters.length) return;
  activeLetterIndex = (activeLetterIndex + 1) % letters.length;
  renderActiveLetter();
}

function closeTreeActions() {
  const actions = document.getElementById("treeActions");
  if (!actions) return;
  actions.classList.remove("is-open");
  actions.setAttribute("aria-hidden", "true");
}

function toggleTreeActions() {
  closeCatChat();
  closeTreeMail();
  const actions = document.getElementById("treeActions");
  if (!actions) return;
  const willOpen = !actions.classList.contains("is-open");
  actions.classList.toggle("is-open", willOpen);
  actions.setAttribute("aria-hidden", String(!willOpen));
}

function setupKeyboardInset() {
  const viewport = window.visualViewport;
  const update = () => {
    const inset = viewport
      ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
      : 0;
    document.body.style.setProperty("--keyboard-inset", `${Math.round(inset)}px`);
    document.body.classList.toggle("keyboard-open", inset > 80);
  };
  viewport?.addEventListener("resize", update);
  viewport?.addEventListener("scroll", update);
  window.addEventListener("resize", update);
  update();
}

function setupTreeMail() {
  const panel = document.getElementById("treeMail");
  const letterForm = document.getElementById("treeLetterForm");
  const replyForm = document.getElementById("treeReplyForm");
  const status = document.getElementById("treeMailStatus");
  const replyStatus = document.getElementById("treeReplyStatus");
  const hint = document.getElementById("treeMailHint");
  const actions = document.getElementById("treeActions");
  if (!panel || !letterForm || !replyForm) return;

  document.getElementById("treeMailClose")?.addEventListener("click", closeTreeMail);
  document.querySelectorAll("[data-tree-open]").forEach((button) => {
    button.addEventListener("click", () => openTreeMail(button.dataset.treeOpen));
  });
  document.querySelectorAll("[data-tree-toggle]").forEach((button) => {
    button.addEventListener("click", toggleTreeActions);
  });
  document.querySelectorAll("[data-mail-tab]").forEach((button) => {
    button.addEventListener("click", () => setTreeMailTab(button.dataset.mailTab));
  });
  document.getElementById("nextLetterButton")?.addEventListener("click", nextLetter);

  letterForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const content = document.getElementById("treeLetterContent").value.trim();
    if (!content) {
      if (status) status.textContent = "写下一点卡住你的地方，信封就能寄出去。";
      return;
    }
    const topic = content.length > 18 ? `${content.slice(0, 18)}...` : content;
    saveUserLetter({
      id: `letter-${Date.now()}`,
      topic: topic || "一封职业困难",
      content,
      replies: [],
    });
    letterForm.reset();
    activeLetterIndex = 0;
    if (status) status.textContent = "信已经寄出。它会像漂流瓶一样，等一个认真回应。";
  });

  replyForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const content = document.getElementById("treeReplyContent").value.trim();
    const letter = activeLetter();
    if (!content || !letter) return;
    const repliedLetterId = letter.id;
    if (letter.id.startsWith("seed-")) {
      letter.replies = [...(letter.replies || []), content];
    } else {
      updateStoredLetter(letter.id, (storedLetter) => ({
        ...storedLetter,
        replies: [...(storedLetter.replies || []), content],
      }));
    }
    document.getElementById("treeReplyContent").value = "";
    nextLetter();
    if (activeLetter()?.id === repliedLetterId) renderActiveLetter();
    if (replyStatus) replyStatus.textContent = "回信已经漂走，下一封来了。";
  });

  const placeHint = () => {
    const busy = panel.classList.contains("is-open")
      || document.getElementById("catChat")?.classList.contains("is-open")
      || actions?.classList.contains("is-open");
    hint?.classList.toggle("is-hidden", busy);
    if (busy) {
      requestAnimationFrame(placeHint);
      return;
    }
    const actionAnchor = screenPointFromCanvas(640, 360);
    if (actions) {
      actions.style.left = `${actionAnchor.x}px`;
      actions.style.top = `${actionAnchor.y + 46}px`;
    }
    if (hint && !busy) {
      const hintAnchor = screenPointFromCanvas(640, 360);
      hint.style.left = `${hintAnchor.x}px`;
      hint.style.top = `${hintAnchor.y}px`;
    }
    requestAnimationFrame(placeHint);
  };

  renderActiveLetter();
  requestAnimationFrame(placeHint);
}

function offlineCatReply(text) {
  if (/面试|offer|工作|求职|简历/.test(text)) {
    return "听起来你在努力靠近下一站。我们先不把整条路想完，今天只挑一个最小动作：改一段简历，或投一个你真正在意的岗位。";
  }
  if (/焦虑|迷茫|害怕|压力|崩/.test(text)) {
    return "这种悬着的感觉很真实。先陪你深呼吸一下：你不是落后，只是在毕业后的新地图里找方向。";
  }
  if (/家|父母|室友|朋友|关系/.test(text)) {
    return "关系里的拉扯会很耗能。你可以先说一句最真实但不伤人的话，我陪你一起把它变柔软。";
  }
  return "我听见啦。毕业后的日子像一片新草地，不用马上跑很远。你现在最想先整理哪一小块心情？";
}

function chatApiEndpoint() {
  const isLocalStatic = location.hostname === "localhost" || location.hostname === "127.0.0.1";
  return isLocalStatic ? "https://another-me-main.vercel.app/api/chat" : "/api/chat";
}

function relatedDouyinVideos(text) {
  const resources = window.DOUYIN_VIDEO_RESOURCES || [];
  const query = text.toLowerCase();
  const intentGroups = [
    [["实习", "暑期", "intern"], ["实习"]],
    [["简历", "经历", "项目"], ["简历", "STAR"]],
    [["面试", "自我介绍", "八股"], ["面试"]],
    [["谈薪", "薪资", "工资", "offer", "三方"], ["谈薪", "薪资", "offer"]],
    [["秋招", "春招", "校招", "投递"], ["秋招", "春招", "校招", "投递"]],
    [["考公", "考编", "公务员", "事业编", "央国企", "国企"], ["考公", "考编", "央国企", "体制内"]],
    [["焦虑", "迷茫", "孤独", "心态", "找不到工作"], ["焦虑", "心态", "找工作"]],
    [["转行", "短视频", "运营", "零经验"], ["转行", "短视频运营", "零经验"]],
    [["大专", "升本", "专升本"], ["大专", "升本"]],
    [["规划", "第一份工作", "适合什么", "职业选择"], ["规划", "第一份工作", "职业选择"]],
  ];

  const expanded = new Set();
  intentGroups.forEach(([triggers, tags]) => {
    if (triggers.some((trigger) => query.includes(trigger))) {
      tags.forEach((tag) => expanded.add(tag));
    }
  });

  const scored = resources.map((video, index) => {
    const searchable = `${video.title} ${(video.tags || []).join(" ")} ${video.highlight} ${video.creator || ""}`.toLowerCase();
    let score = 0;
    expanded.forEach((tag) => {
      if (searchable.includes(tag.toLowerCase())) score += 4;
    });
    query.split(/[^\u4e00-\u9fa5a-zA-Z0-9]+/).filter((word) => word.length >= 2).forEach((word) => {
      if (searchable.includes(word)) score += 1;
    });
    if (score === 0 && /工作|求职|就业|职业/.test(query) && index < 6) score = 1;
    return { video, score };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.video);
}

function normalizeAssistantReferences(message) {
  if (!message || message.role !== "assistant" || !message.content) return;
  const referenceStart = message.content.search(/参考链接[:：]/);
  if (referenceStart < 0) return;

  const mainText = message.content.slice(0, referenceStart).trim();
  const referenceText = message.content.slice(referenceStart);
  const extracted = [];
  const seen = new Set((message.references || []).map((reference) => reference.url));
  const urlPattern = /(https?:\/\/[^\s，。；、)）\]]+)/g;
  let match;

  while ((match = urlPattern.exec(referenceText)) && extracted.length < 3) {
    const url = match[1];
    if (seen.has(url)) continue;
    seen.add(url);
    const lineStart = referenceText.lastIndexOf("\n", match.index) + 1;
    const lineEnd = referenceText.indexOf("\n", match.index);
    const line = referenceText.slice(lineStart, lineEnd === -1 ? referenceText.length : lineEnd);
    const title = line
      .replace(url, "")
      .replace(/^\s*\d+[.、]\s*/, "")
      .trim()
      || new URL(url).hostname;
    extracted.push({ title, url });
  }

  if (extracted.length) {
    message.content = mainText;
    message.references = [...(message.references || []), ...extracted].slice(0, 3);
  }
}

function parseStreamBlock(block) {
  const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
  const event = lines.find((line) => line.startsWith("event:"))?.slice(6).trim() || "message";
  const dataText = lines
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim())
    .join("\n");
  if (!dataText) return null;
  try {
    return { event, data: JSON.parse(dataText) };
  } catch {
    return null;
  }
}

async function readCatStream(response, assistantMessage) {
  if (!response.body) {
    const data = await response.json().catch(() => ({}));
    assistantMessage.content = data.reply || data.fallback || assistantMessage.content;
    assistantMessage.references = data.references || [];
    normalizeAssistantReferences(assistantMessage);
    assistantMessage.streaming = false;
    renderChatMessages();
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let receivedText = false;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() || "";

    blocks.forEach((block) => {
      const parsed = parseStreamBlock(block);
      if (!parsed) return;
      if (parsed.event === "delta") {
        if (!receivedText) {
          assistantMessage.content = "";
          receivedText = true;
        }
        assistantMessage.content += parsed.data.text || "";
        renderChatMessages();
      }
      if (parsed.event === "done") {
        assistantMessage.references = parsed.data.references || [];
      }
    });
  }

  if (buffer.trim()) {
    const parsed = parseStreamBlock(buffer);
    if (parsed?.event === "done") assistantMessage.references = parsed.data.references || [];
  }
  assistantMessage.streaming = false;
  if (!assistantMessage.content) assistantMessage.content = "我在这里。我们先把问题拆小一点：你现在最想解决哪一步？";
  normalizeAssistantReferences(assistantMessage);
  renderChatMessages();
}

async function sendCatMessage(text) {
  chatMessages.push({ role: "user", content: text });
  const assistantMessage = {
    role: "assistant",
    content: "",
    streaming: true,
    videos: relatedDouyinVideos(text),
  };
  chatMessages.push(assistantMessage);
  renderChatMessages();

  try {
    const response = await fetch(chatApiEndpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: chatMessages.slice(0, -1), stream: true }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || data.error || "Chat API unavailable");
    }
    await readCatStream(response, assistantMessage);
  } catch (error) {
    const isLocalStatic = location.hostname === "localhost" || location.hostname === "127.0.0.1";
    assistantMessage.streaming = false;
    assistantMessage.content = isLocalStatic
      ? "我现在还没连上职业导师服务。先确认一下线上 API 或网络状态，我们马上就能继续聊。"
      : "我现在连不上职业导师服务。可能是模型服务还没开通，等配置好后我再认真回答你。";
  }

  renderChatMessages();
}

function updateQuickRepliesVisibility() {
  const quick = document.getElementById("catChatQuick");
  if (!quick) return;
  const hasUserMessage = chatMessages.some((message) => message.role === "user");
  quick.classList.toggle("is-hidden", hasUserMessage);
}

function setupCatChat() {
  const hint = document.getElementById("catChatHint");
  const form = document.getElementById("catChatForm");
  const input = document.getElementById("catChatInput");
  const close = document.getElementById("catChatClose");
  const quick = document.getElementById("catChatQuick");
  if (!hint || !form || !input) return;

  canvas.style.pointerEvents = "auto";
  close?.addEventListener("click", closeCatChat);
  hint.addEventListener("click", openCatChat);
  hint.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openCatChat();
  });
  quick?.querySelectorAll("[data-quick-ask]").forEach((button) => {
    button.addEventListener("click", () => {
      const text = button.dataset.quickAsk?.trim();
      if (!text) return;
      sendCatMessage(text);
      updateQuickRepliesVisibility();
    });
  });
  updateQuickRepliesVisibility();
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    sendCatMessage(text);
    updateQuickRepliesVisibility();
  });

  canvas.addEventListener("pointermove", (event) => {
    const point = canvasPointFromClient(event.clientX, event.clientY);
    canvas.style.cursor = isCatHit(point) || isTreeHit(point) ? "pointer" : "default";
  });

  canvas.addEventListener("click", (event) => {
    const point = canvasPointFromClient(event.clientX, event.clientY);
    if (isCatHit(point)) openCatChat();
    else if (isTreeHit(point)) toggleTreeActions();
    else closeTreeActions();
  });

  const placeHint = () => {
    const busy = document.getElementById("catChat")?.classList.contains("is-open")
      || document.getElementById("treeMail")?.classList.contains("is-open")
      || document.getElementById("treeActions")?.classList.contains("is-open");
    hint.classList.toggle("is-hidden", busy);
    if (!walker.initialized || busy) {
      requestAnimationFrame(placeHint);
      return;
    }
    const screen = screenPointFromCanvas(walker.x, walker.bottom - 118);
    hint.style.left = `${screen.x}px`;
    hint.style.top = `${screen.y}px`;
    hint.style.bottom = "auto";
    requestAnimationFrame(placeHint);
  };

  let hintIndex = 0;
  hint.textContent = CAT_HINTS[0];
  window.setInterval(() => {
    if (hint.classList.contains("is-hidden")) return;
    hintIndex = (hintIndex + 1) % CAT_HINTS.length;
    hint.textContent = CAT_HINTS[hintIndex];
  }, 4200);

  renderChatMessages();
  requestAnimationFrame(placeHint);
}

function navigateWithFade(url) {
  if (document.body.classList.contains("page-leaving")) return;
  document.body.style.animation = "none";
  document.body.classList.add("page-leaving");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.setTimeout(() => {
    window.location.href = url;
  }, reduced ? 0 : 440);
}

function setupPageTransitions() {
  document.querySelectorAll('a[href$=".html"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      if (link.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      navigateWithFade(link.getAttribute("href"));
    });
  });
}

function enableEggClick(getElapsed) {
  // Map a pointer position to canvas coordinates, accounting for object-fit: contain.
  function toCanvasPoint(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const drawScale = Math.min(rect.width / canvas.width, rect.height / canvas.height);
    const drawW = canvas.width * drawScale;
    const drawH = canvas.height * drawScale;
    const offsetX = (rect.width - drawW) / 2;
    const offsetY = (rect.height - drawH) / 2;
    return {
      x: (clientX - rect.left - offsetX) / drawScale,
      y: (clientY - rect.top - offsetY) / drawScale,
    };
  }

  function isOnEgg(clientX, clientY) {
    const p = toCanvasPoint(clientX, clientY);
    // Egg is centered at SCENE.width/2, resting near bottom 590, ~370x469.
    const cx = SCENE.width / 2;
    const cy = 590 - EGG.height * 0.5;
    const rx = EGG.width * 0.55;
    const ry = EGG.height * 0.58;
    return ((p.x - cx) / rx) ** 2 + ((p.y - cy) / ry) ** 2 <= 1;
  }

  canvas.style.pointerEvents = "auto";
  canvas.addEventListener("pointermove", (e) => {
    canvas.style.cursor = hatchRevealStartedAt === null && isOnEgg(e.clientX, e.clientY) ? "pointer" : "default";
  });
  canvas.addEventListener("click", (e) => {
    if (!isOnEgg(e.clientX, e.clientY) || hatchRevealStartedAt !== null) return;
    hatchRevealStartedAt = getElapsed();
    canvas.style.cursor = "default";
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(() => {
      navigateWithFade("./pet.html");
    }, reduced ? 900 : HATCH_TO_WORLD_DELAY_MS);
  });
}

async function start() {
  if (scene === "pet" || scene === "world") {
    SCENE.width = 1280;
    SCENE.height = 720;
    canvas.width = SCENE.width;
    canvas.height = SCENE.height;
  }

  setupPageTransitions();

  ctx.imageSmoothingEnabled = true;
  document.querySelector(".world-video-bg")?.play?.().catch(() => {});
  const needsEgg = scene === "hatch" || scene === "reveal";
  const needsCat = scene === "hatch" || scene === "reveal" || scene === "pet" || scene === "world";
  const [egg, cat] = await Promise.all([
    needsEgg ? loadImage(EGG_SRC) : Promise.resolve(null),
    needsCat ? loadImage(CAT_SRC) : Promise.resolve(null),
  ]);

  let startedAt = 0;
  const render = (now) => {
    if (startedAt === 0) startedAt = now;
    const elapsed = now - startedAt;
    if (scene === "hatch") drawHatchScene(egg, cat, elapsed);
    else if (scene === "reveal") drawRevealScene(egg, cat, elapsed);
    else drawPetScene(cat, elapsed);
    requestAnimationFrame(render);
  };
  if (scene === "hatch") enableEggClick(() => performance.now() - startedAt);
  if (scene === "pet" || scene === "world") {
    setupKeyboardInset();
    setupCatChat();
    setupTreeMail();
  }
  requestAnimationFrame(render);
}

start();
