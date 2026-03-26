/**
 * Input 模块单元测试
 * 测试输入处理模块的功能
 */

class InputTests {
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
        console.log('\n📋 Input 模块单元测试\n');
        console.log('='.repeat(50));

        // 测试 1: Input 类存在
        this.test('Input 类已定义', () => {
            this.assert(typeof window.Input === 'function', 'Input 类未定义');
        });

        // 测试 2: Input 实例化
        this.test('Input 可实例化', () => {
            const input = new window.Input();
            this.assert(input !== null, 'Input 实例化为 null');
            this.assert(typeof input.isPressed === 'function', 'isPressed 方法不存在');
        });

        // 测试 3: 按键检测
        this.test('isPressed 方法存在', () => {
            const input = new window.Input();
            this.assert(typeof input.isPressed === 'function', 'isPressed 不是函数');
            // 默认应该返回 false
            this.assert(input.isPressed('KeyA') === false, '未按下时应返回 false');
        });

        // 测试 4: 多按键检测
        this.test('isAnyPressed 方法存在', () => {
            const input = new window.Input();
            this.assert(typeof input.isAnyPressed === 'function', 'isAnyPressed 不是函数');
            this.assert(input.isAnyPressed(['KeyA', 'KeyB']) === false, '未按下时应返回 false');
        });

        // 测试 5: 按键监听器
        this.test('onKeyDown 方法存在', () => {
            const input = new window.Input();
            this.assert(typeof input.onKeyDown === 'function', 'onKeyDown 不是函数');
            let called = false;
            input.onKeyDown(() => { called = true; });
            this.assert(input.keyDownListeners.length > 0, '监听器未注册');
        });

        this.test('onKeyUp 方法存在', () => {
            const input = new window.Input();
            this.assert(typeof input.onKeyUp === 'function', 'onKeyUp 不是函数');
        });

        // 测试 6: 获取按下的键
        this.test('getPressedKeys 方法存在', () => {
            const input = new window.Input();
            this.assert(typeof input.getPressedKeys === 'function', 'getPressedKeys 不是函数');
            const keys = input.getPressedKeys();
            this.assert(Array.isArray(keys), '应返回数组');
        });

        // 测试 7: 重置按键
        this.test('reset 方法存在', () => {
            const input = new window.Input();
            this.assert(typeof input.reset === 'function', 'reset 不是函数');
            input.reset();
            this.assert(Object.keys(input.keys).length === 0, '按键状态未清空');
        });

        // 测试 8: CONTROLS 常量
        this.test('CONTROLS 常量已定义', () => {
            this.assert(window.CONTROLS !== undefined, 'CONTROLS 未定义');
            this.assert(window.CONTROLS.LEFT, 'CONTROLS.LEFT 未定义');
            this.assert(window.CONTROLS.RIGHT, 'CONTROLS.RIGHT 未定义');
            this.assert(window.CONTROLS.UP, 'CONTROLS.UP 未定义');
            this.assert(window.CONTROLS.DOWN, 'CONTROLS.DOWN 未定义');
            this.assert(window.CONTROLS.ATTACK, 'CONTROLS.ATTACK 未定义');
            this.assert(window.CONTROLS.SKILL, 'CONTROLS.SKILL 未定义');
            this.assert(window.CONTROLS.JUMP, 'CONTROLS.JUMP 未定义');
        });

        // 测试 9: 辅助函数
        this.test('getDirection 函数已导出', () => {
            this.assert(typeof window.getDirection === 'function', 'getDirection 未导出');
            const dir = window.getDirection();
            this.assert(typeof dir === 'object', 'getDirection 应返回对象');
            this.assert('left' in dir, '返回对象应包含 left 属性');
            this.assert('right' in dir, '返回对象应包含 right 属性');
            this.assert('up' in dir, '返回对象应包含 up 属性');
            this.assert('down' in dir, '返回对象应包含 down 属性');
        });

        this.test('isAttacking 函数已导出', () => {
            this.assert(typeof window.isAttacking === 'function', 'isAttacking 未导出');
        });

        this.test('isUsingSkill 函数已导出', () => {
            this.assert(typeof window.isUsingSkill === 'function', 'isUsingSkill 未导出');
        });

        // 测试 10: 默认输入实例
        this.test('defaultInput 已导出', () => {
            this.assert(window.defaultInput !== undefined, 'defaultInput 未导出');
            this.assert(window.defaultInput instanceof window.Input, 'defaultInput 不是 Input 实例');
        });

        console.log('='.repeat(50));
        console.log(`结果：${this.passed} 通过，${this.failed} 失败\n`);

        return { passed: this.passed, failed: this.failed, results: this.results };
    }
}

// 导出
window.InputTests = InputTests;
