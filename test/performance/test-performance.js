/**
 * 性能测试
 * 测试 FPS、内存和加载时间
 */

class PerformanceTests {
    constructor() {
        this.passed = 0;
        this.failed = 0;
        this.results = [];
        this.metrics = {};
    }

    test(name, fn) {
        try {
            fn();
            this.passed++;
            this.results.push({ name, status: 'pass' });
            console.log(`✅ ${name}`);
        } catch (e) {
            this.failed++;
            this.results.push({ name, status: 'fail', error: e.message });
            console.log(`❌ ${name}`);
            console.log(`   错误：${e.message}`);
        }
    }

    assert(condition, message) {
        if (!condition) throw new Error(message);
    }

    run() {
        console.log('\n📋 性能测试\n');
        console.log('='.repeat(50));

        // 测试 1: 游戏循环启动
        this.test('GameLoop 启动时间', () => {
            const loop = new window.GameLoop();
            const startTime = performance.now();
            loop.start();
            const endTime = performance.now();
            
            const startupTime = endTime - startTime;
            this.metrics.loopStartup = startupTime;
            
            this.assert(startupTime < 100, `启动时间应小于 100ms (实际：${startupTime.toFixed(2)}ms)`);
            
            loop.stop();
        });

        // 测试 2: 实体创建性能
        this.test('批量创建玩家性能', () => {
            const startTime = performance.now();
            const players = [];
            
            for (let i = 0; i < 100; i++) {
                players.push(new window.Player({ x: 100 + i, y: 400 }));
            }
            
            const endTime = performance.now();
            const createTime = endTime - startTime;
            this.metrics.playerCreation = createTime;
            
            // 100 个玩家创建应小于 500ms
            this.assert(createTime < 500, `创建 100 个玩家应小于 500ms (实际：${createTime.toFixed(2)}ms)`);
        });

        this.test('批量创建敌人性能', () => {
            const startTime = performance.now();
            const enemies = [];
            
            for (let i = 0; i < 100; i++) {
                enemies.push(new window.Enemy({ x: 600 + i, y: 400 }));
            }
            
            const endTime = performance.now();
            const createTime = endTime - startTime;
            this.metrics.enemyCreation = createTime;
            
            this.assert(createTime < 500, `创建 100 个敌人应小于 500ms (实际：${createTime.toFixed(2)}ms)`);
        });

        // 测试 3: 更新性能
        this.test('批量实体更新性能', () => {
            const entities = [];
            for (let i = 0; i < 50; i++) {
                entities.push(new window.Player({ x: 100 + i, y: 400 }));
            }
            
            const startTime = performance.now();
            
            for (let i = 0; i < 100; i++) {
                entities.forEach(entity => {
                    entity.update(0.016, { 
                        left: false, right: false, up: false, down: false, 
                        attack: false, skill: false, jump: false 
                    });
                });
            }
            
            const endTime = performance.now();
            const updateTime = endTime - startTime;
            this.metrics.updatePerformance = updateTime;
            
            // 50 个实体更新 100 帧应小于 1000ms
            this.assert(updateTime < 1000, `更新性能应小于 1000ms (实际：${updateTime.toFixed(2)}ms)`);
        });

        // 测试 4: 技能系统性能
        this.test('技能创建和更新性能', () => {
            const skills = [];
            for (let i = 0; i < 20; i++) {
                skills.push(new window.Skill({ 
                    id: `skill_${i}`, 
                    name: `技能${i}`,
                    cooldown: 5 
                }));
            }
            
            const startTime = performance.now();
            
            // 模拟 100 帧更新
            for (let i = 0; i < 100; i++) {
                skills.forEach(skill => skill.update(0.016));
            }
            
            const endTime = performance.now();
            const skillUpdateTime = endTime - startTime;
            this.metrics.skillUpdate = skillUpdateTime;
            
            this.assert(skillUpdateTime < 500, `技能更新应小于 500ms (实际：${skillUpdateTime.toFixed(2)}ms)`);
        });

        // 测试 5: HUD 渲染性能
        this.test('HUD 更新性能', () => {
            const hud = new window.HUD();
            const canvas = document.createElement('canvas');
            canvas.width = 800;
            canvas.height = 600;
            hud.init(canvas);
            
            const startTime = performance.now();
            
            // 模拟 100 帧更新和渲染
            for (let i = 0; i < 100; i++) {
                hud.update(0.016);
                hud.render();
            }
            
            const endTime = performance.now();
            const hudTime = endTime - startTime;
            this.metrics.hudUpdate = hudTime;
            
            this.assert(hudTime < 1000, `HUD 更新渲染应小于 1000ms (实际：${hudTime.toFixed(2)}ms)`);
        });

        // 测试 6: 碰撞检测性能
        this.test('碰撞检测性能', () => {
            const game = new window.Game();
            const box1 = { x: 100, y: 100, width: 50, height: 50 };
            const box2 = { x: 120, y: 120, width: 50, height: 50 };
            
            const startTime = performance.now();
            
            // 10000 次碰撞检测
            for (let i = 0; i < 10000; i++) {
                game.checkCollision(box1, box2);
            }
            
            const endTime = performance.now();
            const collisionTime = endTime - startTime;
            this.metrics.collisionDetection = collisionTime;
            
            this.assert(collisionTime < 500, `10000 次碰撞检测应小于 500ms (实际：${collisionTime.toFixed(2)}ms)`);
        });

        // 测试 7: 对象池模式测试（ EnemySpawner）
        this.test('EnemySpawner 生成性能', () => {
            const mockScene = { 
                entities: [],
                addEntity: function(e) { this.entities.push(e); },
                removeEntity: function(e) { 
                    const idx = this.entities.indexOf(e);
                    if (idx > -1) this.entities.splice(idx, 1);
                }
            };
            
            const spawner = new window.EnemySpawner(mockScene);
            spawner.maxEnemies = 100;
            
            const startTime = performance.now();
            
            // 生成 50 个敌人
            for (let i = 0; i < 50; i++) {
                spawner.spawn({ type: 'soldier' });
            }
            
            const endTime = performance.now();
            const spawnTime = endTime - startTime;
            this.metrics.enemySpawn = spawnTime;
            
            this.assert(spawnTime < 500, `生成 50 个敌人应小于 500ms (实际：${spawnTime.toFixed(2)}ms)`);
        });

        // 测试 8: 内存泄漏检测（简单版）
        this.test('对象清理 - 敌人移除', () => {
            const mockScene = { 
                entities: [],
                addEntity: function(e) { this.entities.push(e); },
                removeEntity: function(e) { 
                    const idx = this.entities.indexOf(e);
                    if (idx > -1) this.entities.splice(idx, 1);
                }
            };
            
            const spawner = new window.EnemySpawner(mockScene);
            spawner.maxEnemies = 100;
            
            // 生成并杀死敌人
            for (let i = 0; i < 20; i++) {
                const enemy = spawner.spawn({ type: 'soldier', maxHealth: 10 });
                enemy.takeDamage(100); // 杀死
            }
            
            // 更新清理
            const player = new window.Player();
            spawner.update(0.016, player);
            
            // 死亡的敌人应被清理
            this.assert(mockScene.entities.length === 0, '死亡敌人应从场景移除');
        });

        // 测试 9: FPS 目标
        this.test('GameLoop FPS 设置', () => {
            const loop = new window.GameLoop();
            
            this.assert(loop.targetFPS === 60, '默认目标 FPS 应为 60');
            
            loop.setTargetFPS(30);
            this.assert(loop.targetFPS === 30, '目标 FPS 应可设置');
            
            loop.setTargetFPS(120);
            this.assert(loop.targetFPS === 120, '目标 FPS 应可设置为 120');
        });

        // 测试 10: 加载时间模拟
        this.test('模块加载时间', () => {
            // 这个测试检查所有关键模块是否已加载
            const modules = [
                'Input', 'GameLoop', 'Scene', 'SceneManager',
                'Player', 'Enemy', 'EnemySpawner', 'Skill', 'SkillManager',
                'HUD', 'Game', 'EnemyAI', 'SoldierAI', 'ArcherAI', 'BossAI'
            ];
            
            const startTime = performance.now();
            
            modules.forEach(mod => {
                this.assert(window[mod] !== undefined, `${mod} 模块未加载`);
            });
            
            const endTime = performance.now();
            const loadTime = endTime - startTime;
            this.metrics.moduleCheck = loadTime;
            
            this.assert(loadTime < 100, `模块检查应小于 100ms (实际：${loadTime.toFixed(2)}ms)`);
        });

        // 输出性能指标
        console.log('\n📊 性能指标汇总:');
        console.log('-'.repeat(50));
        for (const [key, value] of Object.entries(this.metrics)) {
            console.log(`${key}: ${value.toFixed(2)}ms`);
        }
        console.log('-'.repeat(50));

        console.log('='.repeat(50));
        console.log(`结果：${this.passed} 通过，${this.failed} 失败\n`);

        return { 
            passed: this.passed, 
            failed: this.failed, 
            results: this.results,
            metrics: this.metrics 
        };
    }
}

// 导出
window.PerformanceTests = PerformanceTests;
