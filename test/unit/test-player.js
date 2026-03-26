/**
 * Player 模块单元测试
 * 测试玩家角色模块的功能
 */

class PlayerTests {
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
        console.log('\n📋 Player 模块单元测试\n');
        console.log('='.repeat(50));

        // 测试 1: Player 类存在
        this.test('Player 类已定义', () => {
            this.assert(typeof window.Player === 'function', 'Player 类未定义');
        });

        // 测试 2: Player 实例化
        this.test('Player 可实例化', () => {
            const player = new window.Player({ name: '测试', x: 100, y: 400 });
            this.assert(player !== null, 'Player 实例化为 null');
            this.assert(player.name === '测试', '名称未正确设置');
            this.assert(player.x === 100, 'x 坐标未正确设置');
            this.assert(player.y === 400, 'y 坐标未正确设置');
        });

        // 测试 3: 默认属性
        this.test('默认属性正确', () => {
            const player = new window.Player();
            this.assert(player.health > 0, '默认生命值应大于 0');
            this.assert(player.maxHealth > 0, '默认最大生命值应大于 0');
            this.assert(player.width > 0, '默认宽度应大于 0');
            this.assert(player.height > 0, '默认高度应大于 0');
        });

        // 测试 4: 战斗属性
        this.test('战斗属性设置', () => {
            const player = new window.Player({
                maxHealth: 150,
                maxMana: 80,
                attack: 20,
                defense: 10
            });
            this.assert(player.maxHealth === 150, '最大生命值未正确设置');
            this.assert(player.maxMana === 80, '最大法力未正确设置');
            this.assert(player.attack === 20, '攻击力未正确设置');
            this.assert(player.defense === 10, '防御力未正确设置');
        });

        // 测试 5: 状态属性
        this.test('状态属性初始值', () => {
            const player = new window.Player();
            this.assert(player.isGrounded === false, '初始不应在地面');
            this.assert(player.isAttacking === false, '初始不应在攻击');
            this.assert(player.isHit === false, '初始不应被击中');
            this.assert(player.isDead === false, '初始不应死亡');
        });

        // 测试 6: update 方法
        this.test('update 方法存在', () => {
            const player = new window.Player();
            this.assert(typeof player.update === 'function', 'update 不是函数');
            // 测试调用不报错
            player.update(0.016, { left: false, right: false, up: false, down: false, attack: false, skill: false, jump: false });
        });

        // 测试 7: takeDamage 方法
        this.test('takeDamage 方法存在', () => {
            const player = new window.Player({ maxHealth: 100 });
            this.assert(typeof player.takeDamage === 'function', 'takeDamage 不是函数');
            const initialHealth = player.health;
            player.takeDamage(10);
            this.assert(player.health < initialHealth, '受到伤害后生命值应减少');
        });

        this.test('takeDamage 考虑防御', () => {
            const player = new window.Player({ maxHealth: 100, defense: 5 });
            player.takeDamage(10);
            // 实际伤害应为 10 - 5 = 5
            this.assert(player.health === 95, '防御未正确计算');
        });

        this.test('最小伤害为 1', () => {
            const player = new window.Player({ maxHealth: 100, defense: 100 });
            player.takeDamage(10);
            this.assert(player.health === 99, '最小伤害应为 1');
        });

        // 测试 8: 死亡检测
        this.test('死亡检测', () => {
            const player = new window.Player({ maxHealth: 10 });
            player.takeDamage(100);
            this.assert(player.isDead === true, '生命值归零应死亡');
            this.assert(player.health === 0, '死亡后生命值应为 0');
        });

        // 测试 9: 治疗功能
        this.test('heal 方法存在', () => {
            const player = new window.Player({ maxHealth: 100 });
            this.assert(typeof player.heal === 'function', 'heal 不是函数');
            player.takeDamage(50);
            const healthBefore = player.health;
            player.heal(20);
            this.assert(player.health > healthBefore, '治疗后生命值应增加');
        });

        this.test('治疗不超过最大生命值', () => {
            const player = new window.Player({ maxHealth: 100 });
            player.takeDamage(30);
            player.heal(50);
            this.assert(player.health <= 100, '治疗不应超过最大生命值');
        });

        // 测试 10: 法力恢复
        this.test('restoreMana 方法存在', () => {
            const player = new window.Player({ maxMana: 50 });
            this.assert(typeof player.restoreMana === 'function', 'restoreMana 不是函数');
            player.mana = 20;
            player.restoreMana(10);
            this.assert(player.mana === 30, '法力未正确恢复');
        });

        // 测试 11: 攻击功能
        this.test('attack 方法触发攻击状态', () => {
            const player = new window.Player();
            this.assert(typeof player.attack === 'function', 'attack 不是函数');
            player.attack();
            this.assert(player.isAttacking === true, '攻击后应进入攻击状态');
            this.assert(player.attackBox.active === true, '攻击框应激活');
        });

        // 测试 12: 碰撞体
        this.test('getHitbox 方法存在', () => {
            const player = new window.Player();
            this.assert(typeof player.getHitbox === 'function', 'getHitbox 不是函数');
            const hitbox = player.getHitbox();
            this.assert(hitbox !== null, '碰撞体不应为 null');
            this.assert('x' in hitbox, '碰撞体应有 x 属性');
            this.assert('y' in hitbox, '碰撞体应有 y 属性');
        });

        this.test('getAttackBox 方法存在', () => {
            const player = new window.Player();
            this.assert(typeof player.getAttackBox === 'function', 'getAttackBox 不是函数');
            const attackBox = player.getAttackBox();
            this.assert(attackBox !== null, '攻击框不应为 null');
        });

        // 测试 13: 重置功能
        this.test('reset 方法存在', () => {
            const player = new window.Player({ maxHealth: 100 });
            this.assert(typeof player.reset === 'function', 'reset 不是函数');
            player.takeDamage(50);
            player.isDead = true;
            player.reset();
            this.assert(player.health === 100, '重置后生命值应恢复');
            this.assert(player.isDead === false, '重置后死亡状态应清除');
        });

        // 测试 14: 技能系统
        this.test('skillManager 已初始化', () => {
            const player = new window.Player();
            this.assert(player.skillManager !== null, 'skillManager 未初始化');
            this.assert(typeof player.skillManager.addSkill === 'function', 'addSkill 方法不存在');
            this.assert(typeof player.skillManager.useSkill === 'function', 'useSkill 方法不存在');
        });

        // 测试 15: 方向 facing
        this.test('facing 方向设置', () => {
            const player = new window.Player({ facing: 1 });
            this.assert(player.facing === 1, 'facing 未正确设置');
            const player2 = new window.Player({ facing: -1 });
            this.assert(player2.facing === -1, 'facing 可以设置为 -1');
        });

        console.log('='.repeat(50));
        console.log(`结果：${this.passed} 通过，${this.failed} 失败\n`);

        return { passed: this.passed, failed: this.failed, results: this.results };
    }
}

// 导出
window.PlayerTests = PlayerTests;
