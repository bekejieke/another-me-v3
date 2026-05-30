# Another Me

一个纯静态的像素风「情绪陪伴」小网页：孵化一颗蛋，破壳后得到一只小猫，小猫在视频草地世界里自由走动。零依赖、零构建，克隆即可运行。

## 页面流程

1. `index.html` — 孵化页。点击中间的蛋即可进入破壳。
2. `reveal.html` — 破壳页。蛋壳裂开，小猫从金光中出现。
3. `pet.html` — 小猫世界。横屏视频草地背景，小猫随机漫步。

页面切换：孵化 →（点蛋，硬切）→ 破壳 →（淡入淡出）→ 小猫。

## 本地运行

因为用到视频和图片资源，需要通过本地服务器打开（直接双击 `index.html` 可能无法加载视频）。

```bash
# 克隆
git clone https://github.com/gaowei90098-creator/another-me.git
cd another-me

# 任选一种本地服务器
python3 -m http.server 8000
# 或： npx serve .
```

然后浏览器打开 `http://localhost:8000`。

## 目录结构

```
index.html              孵化页
reveal.html             破壳页
pet.html                小猫世界页
styles.css              全部样式
script.js               Canvas 动画 + 交互 + 页面过渡
another-me-logo.png     像素 logo 标题
eggs/                   蛋的图片素材
pets/                   小猫精灵图（spritesheet）
world/                  横屏视频背景
```

## 技术

- 原生 HTML / CSS / JavaScript，无框架、无构建步骤
- 蛋、破壳、小猫动画均由 `<canvas>` 实时绘制（精灵图逐帧）
- 小猫世界背景为 16:9 视频，画布与视频同分辨率对齐，小猫贴地漫步
- 页面过渡用 CSS 动画 + 轻量 JS，尊重 `prefers-reduced-motion`
