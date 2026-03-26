/**
 * GameLoop 模块单元测试
 * 测试游戏主循环模块的功能
 */

class GameLoopTests {
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
        console.log('\n📋 GameLoop 模块单元测试\n');
        console.log('='.repeat(50));

        // 测试 1: GameLoop 类存在
        this.test('GameLoop 类已定义', () => {
            this.assert(typeof window.GameLoop === 'function', 'GameLoop 类未定义');
        });

        // 测试 2: GameLoop 实例化
        this.test('GameLoop 可实例化', () => {
            const loop = new window.GameLoop();
            this.assert(loop !== null, 'GameLoop 实例化为 null');
            this.assert(loop.isRunning === false, '初始状态应为未运行');
        });

        // 测试 3: 启动方法
        this.test('start 方法存在', () => {
            const loop = new window.GameLoop();
            this.assert(typeof loop.start === 'function', 'start 不是函数');
        });

        // 测试 4: 停止方法
        this.test('stop 方法存在', () => {
            const loop = new window.GameLoop();
            this.assert(typeof loop.stop === 'function', 'stop 不是函数');
        });

        // 测试 5: 暂停方法
        this.test('pause 方法存在', () => {
            const loop = new window.GameLoop();
            this.assert(typeof loop.pause === 'function', 'pause 不是函数');
        });

        // 测试 6: 恢复方法
        this.test('resume 方法存在', () => {
            const loop = new window.GameLoop();
            this.assert(typeof loop.resume === 'function', 'resume 不是函数');
        });

        // 测试 7: 回调注册
        this.test('onUpdate 方法存在', () => {
            const loop = new window.GameLoop();
            this.assert(typeof loop.onUpdate === 'function', 'onUpdate 不是函数');
            let called = false;
            loop.onUpdate(() => { called = true; });
            this.assert(loop.updateCallbacks.length > 0, '回调未注册');
        });

        this.test('onRender 方法存在', () => {
            const loop = new window.GameLoop();
            this.assert(typeof loop.onRender === 'function', 'onRender 不是函数');
        });

        // 测试 8: 回调移除
        this.test('removeUpdateCallback 方法存在', () => {
            const loop = new window.GameLoop();
            this.assert(typeof loop.removeUpdateCallback === 'function', '不是函数');
            const callback = () => {};
            loop.onUpdate(callback);
            const before = loop.updateCallbacks.length;
            loop.removeUpdateCallback(callback);
            this.assert(loop.updateCallbacks.length < before, '回调未移除');
        });

        this.test('removeRenderCallback 方法存在', () => {
            const loop = new window.GameLoop();
            this.assert(typeof loop.removeRenderCallback === 'function', '不是函数');
        });

        // 测试 9: FPS 相关方法
        this.test('getFPS 方法存在', () => {
            const loop = new window.GameLoop();
            this.assert(typeof loop.getFPS === 'function', 'getFPS 不是函数');
            const fps = loop.getFPS();
            this.assert(typeof fps === 'number', 'getFPS 应返回数字');
        });

        this.test('getDelta 方法存在', () => {
            const loop = new window.GameLoop();
            this.assert(typeof loop.getDelta === 'function', 'getDelta 不是函数');
            const delta = loop.getDelta();
            this.assert(typeof delta === 'number', 'getDelta 应返回数字');
        });

        this.test('setTargetFPS 方法存在', () => {
            const loop = new window.GameLoop();
            this.assert(typeof loop.setTargetFPS === 'function', 'setTargetFPS 不是函数');
            loop.setTargetFPS(30);
            this.assert(loop.targetFPS === 30, '目标 FPS 未设置');
        });

        // 测试 10: 状态属性
        this.test('初始状态正确', () => {
            const loop = new window.GameLoop();
            this.assert(loop.isRunning === false, '初始应未运行');
            this.assert(loop.isPaused === false, '初始应未暂停');
            this.assert(loop.targetFPS === 60, '默认目标 FPS 应为 60');
        });

        // 测试 11: 暂停恢复逻辑
        this.test('暂停恢复逻辑', () => {
            const loop = new window.GameLoop();
            loop.pause();
            this.assert(loop.isPaused === true, '暂停后应为 true');
            loop.resume();
            // resume 后会重置 isPaused
        });

        console.log('='.repeat(50));
        console.log(`结果：${this.passed} 通过，${this.failed} 失败\n`);

        return { passed: this.passed, failed: this.failed, results: this.results };
    }
}

// 导出
window.GameLoopTests = GameLoopTests;
