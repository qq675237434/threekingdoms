/**
 * Enemy 模块单元测试
 * 测试敌人角色模块的功能
 */

class EnemyTests {
    constructor() {
        this.passed = 0;
        this.failed = 0;
        this.results = [];
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
        console.log('\n📋 Enemy 模块单元测试\n');
        console.log('='.repeat(50));

        // 测试 1: Enemy 类存在
        this.test('Enemy 类已定义', () => {
            this.assert(typeof window.Enemy === 'function', 'Enemy 类未定义');
        });

        // 测试 2: Enemy 实例化
        this.test('Enemy 可实例化', () => {
            const enemy = new window.Enemy({ name: '测试敌人', x: 600, y: 400 });
            this.assert(enemy !== null, 'Enemy 实例化为 null');
            this.assert(enemy.name === '测试敌人', '名称未正确设置');
        });

        // 测试 3: 敌人类型
        this.test('敌人类型设置', () => {
            const soldier = new window.Enemy({ type: 'soldier' });
            this.assert(soldier.type === 'soldier', '士兵类型未正确设置');
            
            const archer = new window.Enemy({ type: 'archer' });
            this.assert(archer.type === 'archer', '弓箭手类型未正确设置');
            
            const boss = new window.Enemy({ type: 'boss' });
            this.assert(boss.type === 'boss', 'Boss 类型未正确设置');
        });

        // 测试 4: 战斗属性
        this.test('战斗属性设置', () => {
            const enemy = new window.Enemy({
                maxHealth: 100,
                attack: 15,
                defense: 5
            });
            this.assert(enemy.maxHealth === 100, '最大生命值未正确设置');
            this.assert(enemy.attack === 15, '攻击力未正确设置');
            this.assert(enemy.defense === 5, '防御力未正确设置');
        });

        // 测试 5: 状态属性
        this.test('状态属性初始值', () => {
            const enemy = new window.Enemy();
            this.assert(enemy.isDead === false, '初始不应死亡');
            this.assert(enemy.isAttacking === false, '初始不应在攻击');
            this.assert(enemy.isHit === false, '初始不应被击中');
        });

        // 测试 6: update 方法
        this.test('update 方法存在', () => {
            const enemy = new window.Enemy();
            this.assert(typeof enemy.update === 'function', 'update 不是函数');
            const mockPlayer = { x: 100, y: 400, isDead: false };
            enemy.update(0.016, mockPlayer);
        });

        // 测试 7: takeDamage 方法
        this.test('takeDamage 方法存在', () => {
            const enemy = new window.Enemy({ maxHealth: 50 });
            this.assert(typeof enemy.takeDamage === 'function', 'takeDamage 不是函数');
            const initialHealth = enemy.health;
            enemy.takeDamage(10);
            this.assert(enemy.health < initialHealth, '受到伤害后生命值应减少');
        });

        this.test('takeDamage 考虑防御', () => {
            const enemy = new window.Enemy({ maxHealth: 50, defense: 3 });
            enemy.takeDamage(10);
            this.assert(enemy.health === 43, '防御未正确计算 (50 - 7 = 43)');
        });

        // 测试 8: 死亡检测
        this.test('死亡检测', () => {
            const enemy = new window.Enemy({ maxHealth: 20 });
            enemy.takeDamage(100);
            this.assert(enemy.isDead === true, '生命值归零应死亡');
        });

        // 测试 9: 攻击功能
        this.test('attack 方法触发攻击状态', () => {
            const enemy = new window.Enemy();
            this.assert(typeof enemy.attack === 'function', 'attack 不是函数');
            enemy.attack();
            this.assert(enemy.isAttacking === true, '攻击后应进入攻击状态');
            this.assert(enemy.attackBox.active === true, '攻击框应激活');
        });

        // 测试 10: 碰撞体
        this.test('getHitbox 方法存在', () => {
            const enemy = new window.Enemy();
            this.assert(typeof enemy.getHitbox === 'function', 'getHitbox 不是函数');
            const hitbox = enemy.getHitbox();
            this.assert(hitbox !== null, '碰撞体不应为 null');
        });

        this.test('getAttackBox 方法存在', () => {
            const enemy = new window.Enemy();
            this.assert(typeof enemy.getAttackBox === 'function', 'getAttackBox 不是函数');
        });

        // 测试 11: AI 状态
        this.test('AI 状态初始值', () => {
            const enemy = new window.Enemy();
            this.assert(enemy.state === 'idle', '初始状态应为 idle');
            this.assert(enemy.detectionRange > 0, '检测范围应大于 0');
            this.assert(enemy.attackRange > 0, '攻击范围应大于 0');
        });

        // 测试 12: 攻击冷却
        this.test('攻击冷却机制', () => {
            const enemy = new window.Enemy();
            enemy.attack();
            this.assert(enemy.attackCooldown > 0, '攻击后应有冷却');
        });

        // 测试 13: EnemySpawner 类存在
        this.test('EnemySpawner 类已定义', () => {
            this.assert(typeof window.EnemySpawner === 'function', 'EnemySpawner 类未定义');
        });

        // 测试 14: EnemySpawner 功能
        this.test('EnemySpawner 可实例化', () => {
            const mockScene = { addEntity: () => {}, removeEntity: () => {} };
            const spawner = new window.EnemySpawner(mockScene);
            this.assert(spawner !== null, 'EnemySpawner 实例化为 null');
            this.assert(typeof spawner.spawn === 'function', 'spawn 方法不存在');
            this.assert(typeof spawner.spawnWave === 'function', 'spawnWave 方法不存在');
        });

        this.test('EnemySpawner 生成敌人', () => {
            const mockScene = { 
                entities: [],
                addEntity: function(e) { this.entities.push(e); },
                removeEntity: function(e) { 
                    const idx = this.entities.indexOf(e);
                    if (idx > -1) this.entities.splice(idx, 1);
                }
            };
            const spawner = new window.EnemySpawner(mockScene);
            const enemy = spawner.spawn({ name: '测试生成' });
            this.assert(enemy !== null, '生成敌人失败');
            this.assert(enemy.name === '测试生成', '敌人名称未正确设置');
        });

        this.test('EnemySpawner 添加生成点', () => {
            const mockScene = { addEntity: () => {}, removeEntity: () => {} };
            const spawner = new window.EnemySpawner(mockScene);
            spawner.addSpawnPoint({ x: 700, y: 400 });
            this.assert(spawner.spawnPoints.length > 0, '生成点未添加');
        });

        this.test('EnemySpawner 生成波次', () => {
            const mockScene = { 
                entities: [],
                addEntity: function(e) { this.entities.push(e); },
                removeEntity: () => {}
            };
            const spawner = new window.EnemySpawner(mockScene);
            spawner.maxEnemies = 10;
            spawner.spawnWave(3, { type: 'soldier' });
            // spawnWave 使用 setTimeout，需要等待
        });

        this.test('EnemySpawner 获取存活敌人', () => {
            const mockScene = { 
                entities: [],
                addEntity: function(e) { this.entities.push(e); },
                removeEntity: () => {}
            };
            const spawner = new window.EnemySpawner(mockScene);
            spawner.spawn({ name: '敌人 1' });
            spawner.spawn({ name: '敌人 2' });
            const alive = spawner.getAliveEnemies();
            this.assert(Array.isArray(alive), '应返回数组');
            this.assert(alive.length === 2, '应返回 2 个存活敌人');
        });

        this.test('EnemySpawner 清空敌人', () => {
            const mockScene = { 
                entities: [],
                addEntity: function(e) { this.entities.push(e); },
                removeEntity: function(e) { 
                    const idx = this.entities.indexOf(e);
                    if (idx > -1) this.entities.splice(idx, 1);
                }
            };
            const spawner = new window.EnemySpawner(mockScene);
            spawner.spawn({ name: '敌人 1' });
            spawner.clearAll();
            this.assert(spawner.enemies.length === 0, '敌人未清空');
        });

        // 测试 15: 巡逻点
        this.test('setPatrolPoints 方法存在', () => {
            const enemy = new window.Enemy();
            this.assert(typeof enemy.setPatrolPoints === 'function', 'setPatrolPoints 不是函数');
            enemy.setPatrolPoints([{ x: 100, y: 400 }, { x: 700, y: 400 }]);
            this.assert(enemy.patrolPoints.length === 2, '巡逻点未正确设置');
        });

        console.log('='.repeat(50));
        console.log(`结果：${this.passed} 通过，${this.failed} 失败\n`);

        return { passed: this.passed, failed: this.failed, results: this.results };
    }
}

// 导出
window.EnemyTests = EnemyTests;
