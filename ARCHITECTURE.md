# 三国战记 - 游戏架构文档

## 项目概述

**三国战记** 是一款基于 HTML5 Canvas 的横版街机风格动作游戏。项目采用纯 JavaScript (ES6) 开发，无外部依赖，可直接在浏览器中运行。

## 技术栈

- **渲染**: HTML5 Canvas 2D
- **语言**: JavaScript (ES6+)
- **依赖**: 无
- **目标平台**: 现代浏览器 (Chrome, Firefox, Edge, Safari)

---

## 项目结构

```
threekingdoms/
├── index.html          # 游戏入口 HTML 文件
├── game.js             # 游戏主入口和核心逻辑
├── ARCHITECTURE.md     # 架构文档
├── core/               # 核心模块
│   ├── GameLoop.js     # 游戏主循环
│   ├── Input.js        # 输入处理
│   └── Scene.js        # 场景管理
├── entities/           # 游戏实体
│   ├── Player.js       # 玩家角色
│   ├── Enemy.js        # 敌人角色
│   └── Skill.js        # 技能系统
├── ai/                 # AI 模块
│   └── EnemyAI.js      # 敌人 AI 行为
└── ui/                 # 用户界面
    └── HUD.js          # 抬头显示
```

---

## 核心模块设计

### 1. GameLoop (游戏主循环)

**职责**: 管理游戏的主循环、帧率控制和状态更新

**关键方法**:
- `start()` - 启动游戏循环
- `stop()` - 停止游戏循环
- `pause()` / `resume()` - 暂停/恢复
- `onUpdate(callback)` - 注册更新回调
- `onRender(callback)` - 注册渲染回调

**工作流程**:
```
requestAnimationFrame
    ↓
计算 deltaTime
    ↓
执行 update 回调
    ↓
执行 render 回调
    ↓
循环
```

---

### 2. Input (输入处理)

**职责**: 统一处理键盘、鼠标等输入设备

**控制映射**:
| 操作 | 按键 |
|------|------|
| 左移 | ← / A |
| 右移 | → / D |
| 跳跃 | ↑ / L |
| 攻击 | J / Space |
| 技能 | K |

**核心 API**:
```javascript
// 检查按键
input.isPressed('KeyA')

// 获取方向
const dir = getDirection() // { left, right, up, down }

// 检查攻击
if (isAttacking()) { ... }
```

---

### 3. Scene & SceneManager (场景管理)

**职责**: 管理游戏场景的切换、渲染和实体集合

**场景生命周期**:
```
init() → onEnter() → update() / render() → onExit()
```

**使用示例**:
```javascript
const scene = new Scene('main');
sceneManager.registerScene(scene);
sceneManager.switchScene('main');
```

---

## 实体模块设计

### 4. Player (玩家角色)

**属性**:
- 基础属性：`x`, `y`, `width`, `height`
- 战斗属性：`health`, `mana`, `attack`, `defense`, `speed`
- 状态：`isGrounded`, `isAttacking`, `isHit`, `isDead`, `facing`

**核心方法**:
```javascript
player.update(deltaTime, input)  // 更新状态
player.takeDamage(amount)        // 受到伤害
player.attack()                  // 执行攻击
player.heal(amount)              // 治疗
```

**物理系统**:
- 重力：800 像素/秒²
- 地面检测：y = 520
- 速度：200-220 像素/秒

---

### 5. Enemy (敌人)

**敌人类型**:
| 类型 | 特点 | 颜色 |
|------|------|------|
| soldier | 近战，平衡 | 红色 |
| archer | 远程，保持距离 | 紫色 |
| boss | 高血量，多阶段 | 深紫 |

**AI 状态机**:
```
idle → chase → attack
  ↑       ↓
  └── patrol
```

---

### 6. Skill (技能系统)

**技能类型**:
- `melee` - 近战攻击
- `range` - 远程攻击
- `buff` - 增益效果
- `debuff` - 减益效果

**预定义技能**:
```javascript
PRESET_SKILLS = {
    BASIC_ATTACK: { damage: 10, cooldown: 0.5s },
    SPECIAL_ATTACK: { damage: 50, cooldown: 3s, mana: 20 },
    PROJECTILE: { damage: 15, range: 200 },
    HEAL: { heal: 30, cooldown: 5s, mana: 30 }
}
```

**技能管理器**:
```javascript
player.skillManager.useSkill('special_attack', target)
```

---

## AI 模块设计

### 7. EnemyAI (敌人 AI)

**AI 类层次**:
```
EnemyAI (基类)
├── SoldierAI (士兵 AI)
├── ArcherAI (弓箭手 AI)
└── BossAI (Boss AI)
```

**SoldierAI 行为**:
- 巡逻：小范围随机移动
- 追击：发现玩家后追赶
- 攻击：进入范围后攻击

**ArcherAI 行为**:
- 保持距离：150-250 像素
- 远程攻击：达到理想距离后射击

**BossAI 行为**:
- 多阶段：50% 血量进入狂暴
- 特殊攻击：每 10 秒释放一次
- 高攻击性：80% 攻击概率

---

## UI 模块设计

### 8. HUD (抬头显示)

**显示元素**:
1. **玩家信息区** (左上)
   - 血条 (200px)
   - 法力条 (200px)
   - 生命数 (❤)

2. **游戏信息区** (右上)
   - 分数
   - 时间
   - 关卡

3. **连击系统** (中上)
   - 连击数
   - 最大连击纪录

4. **技能栏** (左下)
   - 技能图标
   - 冷却显示

5. **Boss 血条** (中上，Boss 战时)

**消息系统**:
```javascript
hud.showMessage('新连击纪录!', '#f39c12')
```

---

## 游戏流程

### 启动流程
```
1. DOM 加载完成
2. 创建 Game 实例
3. 初始化各模块
4. 创建场景和实体
5. 启动游戏循环
```

### 游戏循环
```
每帧:
1. 处理输入
2. 更新玩家状态
3. 更新敌人状态 (AI)
4. 碰撞检测
5. 更新 HUD
6. 渲染场景
7. 渲染 HUD
```

### 战斗流程
```
玩家攻击 → 检测攻击框碰撞 → 敌人扣血 → 更新分数/连击
敌人攻击 → 检测攻击框碰撞 → 玩家扣血 → 检查死亡
```

---

## 碰撞系统

**碰撞体类型**:
- `hitbox` - 实体碰撞体 (用于移动碰撞)
- `attackBox` - 攻击判定框 (用于伤害判定)

**碰撞检测算法**: AABB (轴对齐包围盒)
```javascript
checkCollision(box1, box2) {
    return box1.x < box2.x + box2.width &&
           box1.x + box1.width > box2.x &&
           box1.y < box2.y + box2.height &&
           box1.y + box1.height > box2.y;
}
```

---

## 扩展点

### 添加新敌人类型
1. 在 `Enemy.js` 中扩展 `Enemy` 类
2. 在 `EnemyAI.js` 中创建对应 AI
3. 在 `game.js` 的生成逻辑中添加

### 添加新技能
1. 在 `Skill.js` 中创建新 `Skill` 实例
2. 实现 `onCast()` 和 `onEnd()` 回调
3. 添加到 `PRESET_SKILLS`

### 添加新场景
1. 创建 `Scene` 子类
2. 实现 `init()`, `onEnter()`, `update()`, `render()`
3. 在 `game.js` 中注册和切换

### 添加新 UI 元素
1. 在 `HUD.js` 中添加渲染方法
2. 在 `render()` 中调用
3. 添加状态更新方法

---

## 性能优化建议

1. **对象池**: 对频繁创建销毁的对象 (如子弹、特效) 使用对象池
2. **脏矩形渲染**: 只重绘变化的区域
3. **空间分区**: 使用四叉树优化碰撞检测
4. **资源预加载**: 游戏开始前预加载所有资源
5. **帧率限制**: 根据设备性能动态调整目标 FPS

---

## 调试技巧

1. **显示碰撞框**: 在 `render()` 中绘制 `hitbox` 和 `attackBox`
2. **FPS 监控**: 使用 `gameLoop.getFPS()` 监控性能
3. **日志输出**: 在关键位置添加 `console.log`
4. **暂停调试**: 按 `P` 键暂停游戏查看状态

---

## 控制说明

| 按键 | 功能 |
|------|------|
| ← / A | 左移 |
| → / D | 右移 |
| ↑ / L | 跳跃 |
| J / Space | 攻击 |
| K | 技能 |
| P | 暂停 |
| R | 重新开始 (游戏结束时) |

---

## 版本信息

- **版本**: 1.0.0
- **创建日期**: 2026-03-26
- **架构师**: Codex

---

## 许可证

本项目为学习演示用途，无外部依赖，可自由修改和扩展。
