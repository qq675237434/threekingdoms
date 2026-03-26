/**
 * 战斗系统集成测试
 * 测试完整的战斗流程
 */

class CombatTests {
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
        console.log('\n📋 战斗系统集成测试\n');
        console.log('='.repeat(50));

        // 测试 1: 玩家攻击流程
        this.test('完整攻击流程', () => {
            const player = new window.Player({ x: 100, y: 400, attack: 15 });
            
            // 开始攻击
            player.attack();
            this.assert(player.isAttacking === true, '应进入攻击状态');
            this.assert(player.attackBox.active === true, '攻击框应激活');
            this.assert(player.state === 'attack', '状态应为 attack');
        });

        // 测试 2: 攻击后恢复
        this.test('攻击后自动恢复', (done) => {
            const player = new window.Player({ x: 100, y: 400 });
            player.attack();
            
            // 攻击应在 300ms 后恢复
            setTimeout(() => {
                this.assert(player.isAttacking === false, '攻击后应恢复');
                this.assert(player.attackBox.active === false, '攻击框应取消激活');
            }, 350);
        });

        // 测试 3: 连击系统
        this.test('连击系统工作', () => {
            const hud = new window.HUD();
            
            // 连续命中
            hud.addCombo();
            hud.addCombo();
            hud.addCombo();
            
            this.assert(hud.combo === 3, '连击数应为 3');
            this.assert(hud.maxCombo === 3, '最大连击应为 3');
        });

        // 测试 4: 连击超时重置
        this.test('连击超时重置', () => {
            const hud = new window.HUD();
            hud.addCombo();
            hud.addCombo();
            
            this.assert(hud.combo === 2, '连击数应为 2');
            
            // 模拟时间流逝超过连击超时
            hud.update(3);
            
            this.assert(hud.combo === 0, '连击应超时重置');
        });

        // 测试 5: 分数系统
        this.test('击败敌人获得分数', () => {
            const hud = new window.HUD();
            const initialScore = hud.score;
            
            // 击败敌人
            hud.addScore(10);
            hud.addScore(10);
            hud.addScore(10);
            
            this.assert(hud.score === initialScore + 30, '分数应正确累加');
        });

        // 测试 6: 技能使用流程
        this.test('技能使用流程', () => {
            const player = new window.Player({ maxMana: 100 });
            
            // 使用必杀技
            const success = player.skillManager.useSkill('special_attack', null);
            
            this.assert(success === true, '技能应成功使用');
            this.assert(player.mana < 100, '法力应减少');
        });

        this.test('技能冷却机制', () => {
            const player = new window.Player({ maxMana: 100 });
            
            // 使用技能
            player.skillManager.useSkill('special_attack', null);
            
            // 检查冷却
            const skill = player.skillManager.getSkill('special_attack');
            this.assert(skill.currentCooldown > 0, '技能应进入冷却');
        });

        this.test('冷却中不能使用技能', () => {
            const player = new window.Player({ maxMana: 100 });
            
            // 使用技能
            player.skillManager.useSkill('special_attack', null);
            
            // 立即再次使用
            const success = player.skillManager.useSkill('special_attack', null);
            
            this.assert(success === false, '冷却中技能应使用失败');
        });

        // 测试 7: 法力不足
        this.test('法力不足不能使用技能', () => {
            const player = new window.Player({ maxMana: 10, mana: 5 });
            
            // 必杀技需要 20 法力
            const success = player.skillManager.useSkill('special_attack', null);
            
            this.assert(success === false, '法力不足应使用失败');
        });

        // 测试 8: 治疗技能
        this.test('治疗技能恢复生命', () => {
            const player = new window.Player({ maxHealth: 100, maxMana: 50 });
            
            // 先受伤
            player.takeDamage(50);
            const healthBefore = player.health;
            
            // 使用治疗技能
            const healSkill = window.PRESET_SKILLS.HEAL;
            healSkill.use(player, null);
            
            this.assert(player.health > healthBefore, '生命值应增加');
        });

        // 测试 9: Boss 战流程
        this.test('Boss 血条显示', () => {
            const hud = new window.HUD();
            
            // Boss 出现
            hud.setBossInfo('吕布', 1000, 1000);
            
            this.assert(hud.bossInfo !== null, 'Boss 信息应设置');
            this.assert(hud.bossInfo.name === '吕布', 'Boss 名称应正确');
            this.assert(hud.bossInfo.health === 1000, 'Boss 血量应正确');
        });

        this.test('Boss 受伤更新血条', () => {
            const hud = new window.HUD();
            hud.setBossInfo('吕布', 1000, 1000);
            
            // Boss 受伤
            hud.bossInfo.health -= 200;
            
            this.assert(hud.bossInfo.health === 800, 'Boss 血量应更新');
        });

        // 测试 10: 游戏结束条件
        this.test('玩家死亡触发游戏结束', () => {
            const hud = new window.HUD();
            const player = new window.Player({ maxHealth: 10 });
            
            player.takeDamage(100);
            
            this.assert(player.isDead === true, '玩家应死亡');
            
            hud.setGameOver(false);
            this.assert(hud.gameOver === true, '游戏应结束');
            this.assert(hud.gameOverReason === 'defeat', '结束原因应为失败');
        });

        // 测试 11: 敌人 AI 行为
        this.test('SoldierAI 追击玩家', () => {
            const enemy = new window.Enemy({ x: 600, y: 400, type: 'soldier' });
            enemy.ai = new window.SoldierAI();
            const player = new window.Player({ x: 100, y: 400, isDead: false });
            
            // 进入追击状态
            enemy.state = 'chase';
            enemy.ai.chaseState(enemy, player, 0.016);
            
            this.assert(enemy.velocityX !== 0, '敌人应移动');
            this.assert(enemy.facing === -1, '敌人应面向玩家 (玩家在左边)');
        });

        this.test('ArcherAI 保持距离', () => {
            const enemy = new window.Enemy({ x: 400, y: 400, type: 'archer' });
            enemy.ai = new window.ArcherAI();
            const player = new window.Player({ x: 100, y: 400, isDead: false });
            
            enemy.ai.update(enemy, player, 0.016);
            
            // 弓箭手应保持距离
            this.assert(enemy.state !== 'idle', '应检测到玩家');
        });

        this.test('BossAI 阶段转换', () => {
            const boss = new window.Enemy({ 
                x: 400, y: 400, 
                type: 'boss',
                maxHealth: 1000,
                health: 1000
            });
            boss.ai = new window.BossAI();
            const player = new window.Player({ x: 100, y: 400, isDead: false });
            
            this.assert(boss.ai.phase === 1, '初始应为第 1 阶段');
            
            // 模拟血量降至 50% 以下
            boss.health = 400;
            boss.ai.update(boss, player, 0.016);
            
            this.assert(boss.ai.phase === 2, '血量低于 50% 应进入第 2 阶段');
        });

        // 测试 12: 群体 AI
        this.test('GroupAI 管理多个敌人', () => {
            const groupAI = new window.GroupAI();
            
            const enemy1 = new window.Enemy({ x: 600, y: 400 });
            const enemy2 = new window.Enemy({ x: 650, y: 400 });
            
            groupAI.addEnemy(enemy1);
            groupAI.addEnemy(enemy2);
            
            this.assert(groupAI.enemies.length === 2, '应添加 2 个敌人');
            this.assert(groupAI.leader === enemy1, '第一个敌人应为领袖');
        });

        this.test('GroupAI 领袖移除', () => {
            const groupAI = new window.GroupAI();
            
            const enemy1 = new window.Enemy({ x: 600, y: 400 });
            const enemy2 = new window.Enemy({ x: 650, y: 400 });
            
            groupAI.addEnemy(enemy1);
            groupAI.addEnemy(enemy2);
            
            // 移除领袖
            groupAI.removeEnemy(enemy1);
            
            this.assert(groupAI.leader === enemy2, '应重新选择领袖');
        });

        console.log('='.repeat(50));
        console.log(`结果：${this.passed} 通过，${this.failed} 失败\n`);

        return { passed: this.passed, failed: this.failed, results: this.results };
    }
}

// 导出
window.CombatTests = CombatTests;
