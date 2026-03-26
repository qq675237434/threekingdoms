/**
 * HUD 模块单元测试
 * 测试抬头显示模块的功能
 */

class HUDTests {
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
        console.log('\n📋 HUD 模块单元测试\n');
        console.log('='.repeat(50));

        // 测试 1: HUD 类存在
        this.test('HUD 类已定义', () => {
            this.assert(typeof window.HUD === 'function', 'HUD 类未定义');
        });

        // 测试 2: HUD 实例化
        this.test('HUD 可实例化', () => {
            const hud = new window.HUD();
            this.assert(hud !== null, 'HUD 实例化为 null');
        });

        // 测试 3: 初始化方法
        this.test('init 方法存在', () => {
            const hud = new window.HUD();
            this.assert(typeof hud.init === 'function', 'init 不是函数');
            const canvas = document.createElement('canvas');
            canvas.width = 800;
            canvas.height = 600;
            hud.init(canvas);
            this.assert(hud.canvas !== null, 'canvas 未设置');
            this.assert(hud.ctx !== null, 'ctx 未设置');
        });

        // 测试 4: 更新方法
        this.test('update 方法存在', () => {
            const hud = new window.HUD();
            this.assert(typeof hud.update === 'function', 'update 不是函数');
            hud.update(0.016);
        });

        // 测试 5: 渲染方法
        this.test('render 方法存在', () => {
            const hud = new window.HUD();
            this.assert(typeof hud.render === 'function', 'render 不是函数');
            // 不设置 ctx 时不应报错
            hud.render();
        });

        // 测试 6: 玩家血量
        this.test('setPlayerHealth 方法存在', () => {
            const hud = new window.HUD();
            this.assert(typeof hud.setPlayerHealth === 'function', 'setPlayerHealth 不是函数');
            hud.setPlayerHealth(80, 100);
            this.assert(hud.playerHealth === 80, '当前血量未正确设置');
            this.assert(hud.playerMaxHealth === 100, '最大血量未正确设置');
        });

        // 测试 7: 玩家法力
        this.test('setPlayerMana 方法存在', () => {
            const hud = new window.HUD();
            this.assert(typeof hud.setPlayerMana === 'function', 'setPlayerMana 不是函数');
            hud.setPlayerMana(30, 50);
            this.assert(hud.playerMana === 30, '当前法力未正确设置');
            this.assert(hud.playerMaxMana === 50, '最大法力未正确设置');
        });

        // 测试 8: 分数系统
        this.test('addScore 方法存在', () => {
            const hud = new window.HUD();
            this.assert(typeof hud.addScore === 'function', 'addScore 不是函数');
            this.assert(hud.score === 0, '初始分数应为 0');
            hud.addScore(100);
            this.assert(hud.score === 100, '分数未正确增加');
            hud.addScore(50);
            this.assert(hud.score === 150, '分数累加错误');
        });

        // 测试 9: 连击系统
        this.test('addCombo 方法存在', () => {
            const hud = new window.HUD();
            this.assert(typeof hud.addCombo === 'function', 'addCombo 不是函数');
            this.assert(hud.combo === 0, '初始连击应为 0');
            hud.addCombo();
            this.assert(hud.combo === 1, '连击未正确增加');
        });

        this.test('连击计时器', () => {
            const hud = new window.HUD();
            hud.addCombo();
            this.assert(hud.comboTimer > 0, '连击计时器应启动');
            hud.update(3); // 超过连击超时时间
            this.assert(hud.combo === 0, '连击应超时重置');
        });

        this.test('resetCombo 方法存在', () => {
            const hud = new window.HUD();
            this.assert(typeof hud.resetCombo === 'function', 'resetCombo 不是函数');
            hud.addCombo();
            hud.addCombo();
            hud.resetCombo();
            this.assert(hud.combo === 0, '连击未正确重置');
        });

        this.test('最大连击纪录', () => {
            const hud = new window.HUD();
            for (let i = 0; i < 10; i++) {
                hud.addCombo();
            }
            this.assert(hud.maxCombo === 10, '最大连击纪录未正确更新');
        });

        // 测试 10: Boss 血条
        this.test('setBossInfo 方法存在', () => {
            const hud = new window.HUD();
            this.assert(typeof hud.setBossInfo === 'function', 'setBossInfo 不是函数');
            hud.setBossInfo('吕布', 1000, 1000);
            this.assert(hud.bossInfo !== null, 'Boss 信息未设置');
            this.assert(hud.bossInfo.name === '吕布', 'Boss 名称未正确设置');
        });

        this.test('clearBossInfo 方法存在', () => {
            const hud = new window.HUD();
            this.assert(typeof hud.clearBossInfo === 'function', 'clearBossInfo 不是函数');
            hud.setBossInfo('吕布', 1000, 1000);
            hud.clearBossInfo();
            this.assert(hud.bossInfo === null, 'Boss 信息未清除');
        });

        // 测试 11: 消息系统
        this.test('showMessage 方法存在', () => {
            const hud = new window.HUD();
            this.assert(typeof hud.showMessage === 'function', 'showMessage 不是函数');
            hud.showMessage('测试消息', '#fff');
            this.assert(hud.messages.length > 0, '消息未添加到队列');
        });

        this.test('消息自动消失', () => {
            const hud = new window.HUD();
            hud.showMessage('测试消息');
            this.assert(hud.messages.length > 0, '消息应存在');
            hud.update(3); // 超过消息显示时间
            this.assert(hud.messages.length === 0, '消息应自动消失');
        });

        // 测试 12: 暂停状态
        this.test('setPaused 方法存在', () => {
            const hud = new window.HUD();
            this.assert(typeof hud.setPaused === 'function', 'setPaused 不是函数');
            this.assert(hud.isPaused === false, '初始应未暂停');
            hud.setPaused(true);
            this.assert(hud.isPaused === true, '暂停状态未正确设置');
        });

        // 测试 13: 游戏结束状态
        this.test('setGameOver 方法存在', () => {
            const hud = new window.HUD();
            this.assert(typeof hud.setGameOver === 'function', 'setGameOver 不是函数');
            this.assert(hud.gameOver === false, '初始应未结束');
            hud.setGameOver(false);
            this.assert(hud.gameOver === true, '游戏结束状态未正确设置');
            this.assert(hud.gameOverReason === 'defeat', '失败原因应为 defeat');
        });

        this.test('胜利状态', () => {
            const hud = new window.HUD();
            hud.setGameOver(true);
            this.assert(hud.gameOverReason === 'victory', '胜利原因应为 victory');
        });

        // 测试 14: 重置功能
        this.test('reset 方法存在', () => {
            const hud = new window.HUD();
            this.assert(typeof hud.reset === 'function', 'reset 不是函数');
            hud.addScore(100);
            hud.addCombo();
            hud.showMessage('测试');
            hud.reset();
            this.assert(hud.score === 0, '分数未重置');
            this.assert(hud.combo === 0, '连击未重置');
            this.assert(hud.messages.length === 0, '消息未重置');
        });

        // 测试 15: 技能冷却更新
        this.test('updateSkillCooldowns 方法存在', () => {
            const hud = new window.HUD();
            this.assert(typeof hud.updateSkillCooldowns === 'function', 'updateSkillCooldowns 不是函数');
            const mockSkills = [
                { name: '普通攻击', currentCooldown: 0, cooldown: 0.5 },
                { name: '必杀技', currentCooldown: 2, cooldown: 3 }
            ];
            hud.updateSkillCooldowns(mockSkills);
            this.assert(hud.skills.length === 2, '技能未正确更新');
        });

        // 测试 16: 关卡和时间
        this.test('关卡和时间属性', () => {
            const hud = new window.HUD();
            this.assert(hud.level === 1, '初始关卡应为 1');
            this.assert(hud.time === 0, '初始时间应为 0');
            hud.level = 2;
            this.assert(hud.level === 2, '关卡未正确设置');
        });

        // 测试 17: 生命数
        this.test('生命数属性', () => {
            const hud = new window.HUD();
            this.assert(hud.lives === 3, '初始生命数应为 3');
            hud.lives = 5;
            this.assert(hud.lives === 5, '生命数未正确设置');
        });

        console.log('='.repeat(50));
        console.log(`结果：${this.passed} 通过，${this.failed} 失败\n`);

        return { passed: this.passed, failed: this.failed, results: this.results };
    }
}

// 导出
window.HUDTests = HUDTests;
