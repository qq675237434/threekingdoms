# 三国战记 - 测试文档

## 测试套件概览

本项目包含完整的测试套件，覆盖单元测试、集成测试、性能测试和 E2E 测试。

## 测试目录结构

```
test/
├── all-tests.html          # 完整测试套件（浏览器运行）
├── test.html               # 基础测试套件（遗留）
├── e2e.html                # E2E 端到端测试
├── unit/                   # 单元测试
│   ├── test-input.js       # Input 模块测试
│   ├── test-gameloop.js    # GameLoop 模块测试
│   ├── test-player.js      # Player 模块测试
│   ├── test-enemy.js       # Enemy 模块测试
│   ├── test-hud.js         # HUD 模块测试
│   └── test-skill.js       # Skill 模块测试
├── integration/            # 集成测试
│   ├── test-collision.js   # 碰撞检测测试
│   ├── test-combat.js      # 战斗系统测试
│   └── test-scene.js       # 场景管理测试
└── performance/            # 性能测试
    └── test-performance.js # 性能测试
```

## 运行测试

### 方式 1: 浏览器测试套件（推荐）

1. 启动本地服务器：
```bash
npm run serve
```

2. 打开浏览器访问：
```
http://localhost:8080/test/all-tests.html
```

3. 点击"运行全部测试"按钮

### 方式 2: Node.js 命令行测试

```bash
npm test
```

### 方式 3: E2E 测试

```bash
npm run test:e2e
```

然后访问 `http://localhost:8080/test/e2e.html`

## 测试覆盖

### 单元测试 (Unit Tests)

| 模块 | 测试项数 | 覆盖率 |
|------|---------|--------|
| Input | 10+ | 按键检测、多键检测、监听器、CONTROLS 常量、辅助函数 |
| GameLoop | 12+ | 启动/停止、暂停/恢复、回调、FPS 控制 |
| Player | 20+ | 属性、状态、移动、攻击、受伤、死亡、技能 |
| Enemy | 18+ | 属性、AI 状态、攻击、生成器 |
| HUD | 20+ | 血量、法力、分数、连击、消息、Boss 血条 |
| Skill | 18+ | 技能使用、冷却、管理、预设技能 |

### 集成测试 (Integration Tests)

| 测试类型 | 测试项数 | 说明 |
|---------|---------|------|
| 碰撞检测 | 15+ | AABB 碰撞、攻击框、边界检测 |
| 战斗系统 | 15+ | 攻击流程、连击、技能、AI 行为 |
| 场景管理 | 15+ | 场景切换、实体管理、生命周期 |

### 性能测试 (Performance Tests)

| 指标 | 目标 | 说明 |
|------|------|------|
| GameLoop 启动 | < 100ms | 游戏循环启动时间 |
| 实体创建 (100 个) | < 500ms | 批量创建玩家/敌人 |
| 实体更新 (50 个×100 帧) | < 1000ms | 批量更新性能 |
| 碰撞检测 (10000 次) | < 500ms | AABB 碰撞检测性能 |
| HUD 更新渲染 (100 帧) | < 1000ms | UI 更新性能 |

## 测试报告

测试完成后，点击"生成报告"按钮查看：

- 总体通过率
- 各模块测试结果
- 性能指标详情
- 失败测试列表
- 发布建议

### 发布标准

✅ **可以发布** 当满足以下条件：
- 所有测试通过（通过率 100%）
- 性能指标均在目标范围内
- 无阻塞性 Bug

⚠️ **暂不建议发布** 当存在：
- 任何失败的测试
- 性能指标超出目标 50% 以上
- 存在阻塞性 Bug

## 持续集成

### GitHub Actions 配置示例

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
    
    - name: Install dependencies
      run: npm install
    
    - name: Run tests
      run: npm test
    
    - name: Run E2E tests
      uses: cypress-io/github-action@v2
      with:
        start: npm run serve
        wait-on: 'http://localhost:8080'
```

## 调试技巧

### 显示碰撞框

在 `game.js` 的 `render()` 方法中添加：

```javascript
// 调试：显示碰撞框
if (this.player) {
    this.ctx.strokeStyle = '#f00';
    this.ctx.strokeRect(
        this.player.hitbox.x,
        this.player.hitbox.y,
        this.player.hitbox.width,
        this.player.hitbox.height
    );
}
```

### 性能监控

```javascript
// 在 game.js 中添加性能监控
setInterval(() => {
    console.log('FPS:', this.gameLoop.getFPS());
    console.log('实体数:', this.sceneManager.getCurrentScene().getEntities().length);
}, 5000);
```

### 日志级别

```javascript
// 控制台日志分级
const DEBUG = true;
if (DEBUG) {
    console.log('调试信息：玩家位置', player.x, player.y);
}
```

## Bug 报告模板

```markdown
### Bug 描述
[简要描述 Bug]

### 复现步骤
1. [步骤 1]
2. [步骤 2]
3. [步骤 3]

### 期望行为
[应该发生什么]

### 实际行为
[实际发生了什么]

### 环境信息
- 浏览器：[Chrome/Firefox/Safari/Edge]
- 版本：[xx.x.x]
- 操作系统：[Windows/macOS/Linux]

### 截图/录屏
[如有]

### 优先级
- [ ] 阻塞性（游戏无法进行）
- [ ] 高（主要功能受损）
- [ ] 中（次要功能问题）
- [ ] 低（视觉/体验问题）
```

## 测试清单

### 发布前检查

- [ ] 所有单元测试通过
- [ ] 所有集成测试通过
- [ ] 性能测试达标
- [ ] E2E 测试通过
- [ ] 无控制台错误
- [ ] FPS 稳定在 60 左右
- [ ] 内存无泄漏
- [ ] 主流浏览器测试通过

### 浏览器兼容性

- [ ] Chrome (最新)
- [ ] Firefox (最新)
- [ ] Safari (最新)
- [ ] Edge (最新)

### 性能检查

- [ ] 加载时间 < 2 秒
- [ ] 初始 FPS 稳定
- [ ] 长时间运行无卡顿
- [ ] 内存占用合理

## 联系

如有测试相关问题，请联系开发团队。

---

**版本**: 1.0.0  
**更新日期**: 2026-03-26
