/**
 * 碰撞检测集成测试
 * 测试玩家与敌人、攻击框之间的碰撞检测
 */

class CollisionTests {
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
        console.log('\n📋 碰撞检测集成测试\n');
        console.log('='.repeat(50));

        // 测试 1: 玩家与敌人碰撞体
        this.test('玩家和敌人有碰撞体', () => {
            const player = new window.Player({ x: 100, y: 400 });
            const enemy = new window.Enemy({ x: 600, y: 400 });
            
            const playerHitbox = player.getHitbox();
            const enemyHitbox = enemy.getHitbox();
            
            this.assert(playerHitbox !== null, '玩家碰撞体不存在');
            this.assert(enemyHitbox !== null, '敌人碰撞体不存在');
        });

        // 测试 2: 碰撞检测函数
        this.test('Game 有碰撞检测方法', () => {
            const game = new window.Game();
            this.assert(typeof game.checkCollision === 'function', 'checkCollision 方法不存在');
        });

        // 测试 3: AABB 碰撞检测 - 相交
        this.test('AABB 碰撞检测 - 相交情况', () => {
            const game = new window.Game();
            const box1 = { x: 0, y: 0, width: 50, height: 50 };
            const box2 = { x: 25, y: 25, width: 50, height: 50 };
            
            const result = game.checkCollision(box1, box2);
            this.assert(result === true, '相交的矩形应检测到碰撞');
        });

        // 测试 4: AABB 碰撞检测 - 不相交
        this.test('AABB 碰撞检测 - 不相交情况', () => {
            const game = new window.Game();
            const box1 = { x: 0, y: 0, width: 50, height: 50 };
            const box2 = { x: 100, y: 100, width: 50, height: 50 };
            
            const result = game.checkCollision(box1, box2);
            this.assert(result === false, '不相交的矩形不应检测到碰撞');
        });

        // 测试 5: 玩家攻击框激活
        this.test('玩家攻击时攻击框激活', () => {
            const player = new window.Player({ x: 100, y: 400 });
            this.assert(player.attackBox.active === false, '初始攻击框应未激活');
            
            player.attack();
            this.assert(player.attackBox.active === true, '攻击后攻击框应激活');
        });

        // 测试 6: 攻击框位置
        this.test('攻击框位置随方向变化', () => {
            const player = new window.Player({ x: 100, y: 400, facing: 1 });
            player.attack();
            const attackBoxRight = player.attackBox.x;
            
            const player2 = new window.Player({ x: 100, y: 400, facing: -1 });
            player2.attack();
            const attackBoxLeft = player2.attackBox.x;
            
            this.assert(attackBoxRight !== attackBoxLeft, '攻击框位置应随方向变化');
        });

        // 测试 7: 敌人攻击框
        this.test('敌人攻击时攻击框激活', () => {
            const enemy = new window.Enemy({ x: 600, y: 400 });
            this.assert(enemy.attackBox.active === false, '初始攻击框应未激活');
            
            enemy.attack();
            this.assert(enemy.attackBox.active === true, '攻击后攻击框应激活');
        });

        // 测试 8: 玩家与敌人距离
        this.test('玩家敌人距离计算', () => {
            const player = new window.Player({ x: 100, y: 400 });
            const enemy = new window.Enemy({ x: 600, y: 400 });
            
            const distance = Math.abs(player.x - enemy.x);
            this.assert(distance === 500, '距离计算错误');
        });

        // 测试 9: 攻击范围检测
        this.test('敌人在攻击范围内', () => {
            const player = new window.Player({ x: 100, y: 400 });
            const enemy = new window.Enemy({ x: 150, y: 400, attackRange: 60 });
            
            const distance = Math.abs(player.x - enemy.x);
            const inRange = distance <= enemy.attackRange;
            this.assert(inRange === true, '应检测到在攻击范围内');
        });

        this.test('敌人在攻击范围外', () => {
            const player = new window.Player({ x: 100, y: 400 });
            const enemy = new window.Enemy({ x: 600, y: 400, attackRange: 60 });
            
            const distance = Math.abs(player.x - enemy.x);
            const inRange = distance <= enemy.attackRange;
            this.assert(inRange === false, '应检测到在攻击范围外');
        });

        // 测试 10: 碰撞伤害
        this.test('玩家攻击对敌人造成伤害', () => {
            const player = new window.Player({ x: 100, y: 400, attack: 15 });
            const enemy = new window.Enemy({ x: 150, y: 400, maxHealth: 50 });
            
            const initialHealth = enemy.health;
            enemy.takeDamage(player.attack);
            
            this.assert(enemy.health < initialHealth, '敌人应受到伤害');
            this.assert(enemy.health === initialHealth - player.attack, '伤害值应正确');
        });

        this.test('敌人攻击对玩家造成伤害', () => {
            const player = new window.Player({ x: 100, y: 400, maxHealth: 100, defense: 5 });
            const enemy = new window.Enemy({ x: 150, y: 400, attack: 10 });
            
            const initialHealth = player.health;
            player.takeDamage(enemy.attack);
            
            // 实际伤害 = 10 - 5 = 5
            this.assert(player.health === initialHealth - 5, '伤害应考虑防御');
        });

        // 测试 11: 受击状态
        this.test('受伤后进入受击状态', () => {
            const player = new window.Player({ maxHealth: 100 });
            this.assert(player.isHit === false, '初始不应在受击状态');
            
            player.takeDamage(10);
            this.assert(player.isHit === true, '受伤后应进入受击状态');
        });

        // 测试 12: 死亡后不再受击
        this.test('死亡后不再接受伤害', () => {
            const player = new window.Player({ maxHealth: 10 });
            player.takeDamage(100);
            this.assert(player.isDead === true, '应死亡');
            
            const healthBefore = player.health;
            player.takeDamage(10);
            this.assert(player.health === healthBefore, '死亡后不应再扣血');
        });

        // 测试 13: 边界碰撞
        this.test('玩家不能走出左边界', () => {
            const player = new window.Player({ x: -100, y: 400 });
            player.update(0.016, { left: false, right: false, up: false, down: false, attack: false, skill: false, jump: false });
            this.assert(player.x >= 0, '玩家不应走出左边界');
        });

        this.test('玩家不能走出右边界', () => {
            const player = new window.Player({ x: 1000, y: 400 });
            player.update(0.016, { left: false, right: false, up: false, down: false, attack: false, skill: false, jump: false });
            this.assert(player.x <= 750, '玩家不应走出右边界 (800 - 50)');
        });

        // 测试 14: 地面检测
        this.test('玩家在地面上', () => {
            const player = new window.Player({ x: 100, y: 400 });
            player.update(0.016, { left: false, right: false, up: false, down: false, attack: false, skill: false, jump: false });
            this.assert(player.isGrounded === true, '玩家应在地面上');
            this.assert(player.y === 440, '玩家 y 坐标应在地面 (520 - 80)');
        });

        this.test('玩家在空中受重力', () => {
            const player = new window.Player({ x: 100, y: 200 });
            player.update(0.016, { left: false, right: false, up: false, down: false, attack: false, skill: false, jump: false });
            this.assert(player.velocityY > 0, '应有向下的速度 (重力)');
        });

        console.log('='.repeat(50));
        console.log(`结果：${this.passed} 通过，${this.failed} 失败\n`);

        return { passed: this.passed, failed: this.failed, results: this.results };
    }
}

// 导出
window.CollisionTests = CollisionTests;
