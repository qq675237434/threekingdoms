# 三国战记 - Three Kingdoms Battle

🎮 基于 HTML5 Canvas 的经典街机风格横版动作游戏

## 🎯 项目简介

复刻经典街机游戏《三国战记》的核心玩法，使用纯原生 JavaScript 开发，无需任何外部依赖。

## 🚀 快速开始

### 运行游戏

直接在浏览器中打开 `index.html` 即可运行：

```bash
# 方式 1: 直接打开
open index.html  # macOS
xdg-open index.html  # Linux
start index.html  # Windows

# 方式 2: 使用本地服务器 (推荐)
npx http-server -p 8080
# 访问 http://localhost:8080
```

## 🎮 操作说明

| 按键 | 功能 |
|------|------|
| ↑↓←→ / WASD | 移动 |
| J | 攻击 |
| K | 跳跃 |
| L | 特殊技能 |
| Enter | 开始游戏 |
| Space | 选择角色 |

## 👥 可选角色

| 角色 | 武器 | 特点 |
|------|------|------|
| **关羽** | 青龙偃月刀 | 攻击范围大，伤害高 |
| **张飞** | 蛇矛 | 攻击力最强，速度慢 |
| **赵云** | 枪 | 速度快，连击流畅 |

## 🏗️ 项目结构

```
threekingdoms/
├── index.html          # 游戏入口
├── game.js             # 游戏主逻辑
├── ARCHITECTURE.md     # 架构设计文档
├── core/               # 核心引擎
│   ├── GameLoop.js     # 60FPS 游戏循环
│   ├── Input.js        # 输入处理
│   └── Scene.js        # 场景管理
├── entities/           # 游戏实体
│   ├── Player.js       # 玩家角色
│   ├── Enemy.js        # 敌人系统
│   └── Skill.js        # 技能系统
├── ai/                 # AI 系统
│   └── EnemyAI.js      # 敌人 AI 逻辑
└── ui/                 # 界面系统
    └── HUD.js          # 血条/分数/连击
```

## 🔧 技术栈

- **HTML5 Canvas** - 游戏渲染
- **ES6+** - 现代 JavaScript 语法
- **无依赖** - 纯原生实现
- **60FPS** - 流畅游戏循环

## 🎯 核心特性

- ✅ 横版卷轴动作玩法
- ✅ 三位可选角色 (关羽/张飞/赵云)
- ✅ 完整战斗系统 (攻击/受击/技能)
- ✅ 敌人 AI (巡逻/追击/攻击)
- ✅ Boss 战 (多阶段/愤怒值)
- ✅ 连击系统 (Combo 计数)
- ✅ 道具系统 (金创药/魔力水等)
- ✅ 街机风格 UI

## 📄 许可证

MIT License

---

**开发团队**: Codex Multi-Agent System 🤖
