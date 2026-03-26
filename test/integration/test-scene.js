/**
 * 场景管理集成测试
 * 测试场景切换和实体管理
 */

class SceneTests {
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
        console.log('\n📋 场景管理集成测试\n');
        console.log('='.repeat(50));

        // 测试 1: Scene 类
        this.test('Scene 类已定义', () => {
            this.assert(typeof window.Scene === 'function', 'Scene 类未定义');
        });

        this.test('Scene 可实例化', () => {
            const scene = new window.Scene('test');
            this.assert(scene !== null, 'Scene 实例化为 null');
            this.assert(scene.name === 'test', '场景名称未正确设置');
        });

        // 测试 2: 场景生命周期
        this.test('场景 init 方法', () => {
            const scene = new window.Scene('test');
            this.assert(scene.isInitialized === false, '初始应未初始化');
            scene.init();
            this.assert(scene.isInitialized === true, 'init 后应已初始化');
        });

        this.test('场景 onEnter/onExit 回调', () => {
            const scene = new window.Scene('test');
            let enterCalled = false;
            let exitCalled = false;
            
            scene.onEnter = () => { enterCalled = true; };
            scene.onExit = () => { exitCalled = true; };
            
            scene.onEnter();
            this.assert(enterCalled === true, 'onEnter 应被调用');
            
            scene.onExit();
            this.assert(exitCalled === true, 'onExit 应被调用');
        });

        // 测试 3: 实体管理
        this.test('添加实体到场景', () => {
            const scene = new window.Scene('test');
            const entity = { name: '测试实体' };
            
            this.assert(scene.entities.length === 0, '初始应无实体');
            scene.addEntity(entity);
            this.assert(scene.entities.length === 1, '实体应添加成功');
        });

        this.test('移除实体', () => {
            const scene = new window.Scene('test');
            const entity = { name: '测试实体' };
            
            scene.addEntity(entity);
            scene.removeEntity(entity);
            
            this.assert(scene.entities.length === 0, '实体应移除成功');
        });

        this.test('清空所有实体', () => {
            const scene = new window.Scene('test');
            scene.addEntity({ name: '实体 1' });
            scene.addEntity({ name: '实体 2' });
            scene.addEntity({ name: '实体 3' });
            
            scene.clearEntities();
            
            this.assert(scene.entities.length === 0, '所有实体应清空');
        });

        this.test('获取所有实体', () => {
            const scene = new window.Scene('test');
            scene.addEntity({ name: '实体 1' });
            scene.addEntity({ name: '实体 2' });
            
            const entities = scene.getEntities();
            
            this.assert(Array.isArray(entities), '应返回数组');
            this.assert(entities.length === 2, '应返回 2 个实体');
        });

        // 测试 4: 场景更新和渲染
        this.test('场景更新实体', () => {
            const scene = new window.Scene('test');
            let updateCalled = false;
            
            const entity = {
                update: (dt) => { updateCalled = true; }
            };
            
            scene.addEntity(entity);
            scene.update(0.016);
            
            this.assert(updateCalled === true, '实体 update 应被调用');
        });

        this.test('场景渲染实体', () => {
            const scene = new window.Scene('test');
            let renderCalled = false;
            const mockCtx = { fillRect: () => {} };
            
            const entity = {
                render: (ctx) => { renderCalled = true; }
            };
            
            scene.addEntity(entity);
            scene.render(mockCtx);
            
            this.assert(renderCalled === true, '实体 render 应被调用');
        });

        // 测试 5: SceneManager 类
        this.test('SceneManager 类已定义', () => {
            this.assert(typeof window.SceneManager === 'function', 'SceneManager 类未定义');
        });

        this.test('SceneManager 可实例化', () => {
            const manager = new window.SceneManager();
            this.assert(manager !== null, 'SceneManager 实例化为 null');
        });

        // 测试 6: 场景管理器初始化
        this.test('SceneManager 初始化', () => {
            const manager = new window.SceneManager();
            const canvas = document.createElement('canvas');
            canvas.width = 800;
            canvas.height = 600;
            
            manager.init(canvas);
            
            this.assert(manager.canvas === canvas, 'canvas 应设置');
            this.assert(manager.ctx !== null, 'ctx 应设置');
        });

        // 测试 7: 场景注册
        this.test('注册场景', () => {
            const manager = new window.SceneManager();
            const scene = new window.Scene('main');
            
            manager.registerScene(scene);
            
            this.assert(manager.scenes.has('main'), '场景应注册成功');
        });

        // 测试 8: 场景切换
        this.test('切换场景', () => {
            const manager = new window.SceneManager();
            const canvas = document.createElement('canvas');
            manager.init(canvas);
            
            const scene1 = new window.Scene('scene1');
            const scene2 = new window.Scene('scene2');
            
            manager.registerScene(scene1);
            manager.registerScene(scene2);
            
            manager.switchScene('scene1');
            this.assert(manager.currentScene === scene1, '应切换到 scene1');
            
            manager.switchScene('scene2');
            this.assert(manager.currentScene === scene2, '应切换到 scene2');
        });

        this.test('切换不存在的场景', () => {
            const manager = new window.SceneManager();
            const canvas = document.createElement('canvas');
            manager.init(canvas);
            
            // 不应报错
            manager.switchScene('nonexistent');
        });

        // 测试 9: 场景生命周期调用
        this.test('切换场景调用 onExit/onEnter', () => {
            const manager = new window.SceneManager();
            const canvas = document.createElement('canvas');
            manager.init(canvas);
            
            let exitCalled = false;
            let enterCalled = false;
            
            const scene1 = new window.Scene('scene1');
            const scene2 = new window.Scene('scene2');
            
            scene1.onExit = () => { exitCalled = true; };
            scene2.onEnter = () => { enterCalled = true; };
            
            manager.registerScene(scene1);
            manager.registerScene(scene2);
            
            manager.switchScene('scene1');
            manager.switchScene('scene2');
            
            this.assert(exitCalled === true, '离开场景时应调用 onExit');
            this.assert(enterCalled === true, '进入场景时应调用 onEnter');
        });

        // 测试 10: 获取当前场景
        this.test('获取当前场景', () => {
            const manager = new window.SceneManager();
            const canvas = document.createElement('canvas');
            manager.init(canvas);
            
            const scene = new window.Scene('main');
            manager.registerScene(scene);
            manager.switchScene('main');
            
            const current = manager.getCurrentScene();
            this.assert(current === scene, '应返回当前场景');
        });

        // 测试 11: 场景管理器更新和渲染
        this.test('SceneManager 更新当前场景', () => {
            const manager = new window.SceneManager();
            const canvas = document.createElement('canvas');
            manager.init(canvas);
            
            let updateCalled = false;
            const scene = new window.Scene('main');
            scene.update = (dt) => { updateCalled = true; };
            
            manager.registerScene(scene);
            manager.switchScene('main');
            manager.update(0.016);
            
            this.assert(updateCalled === true, '当前场景应更新');
        });

        this.test('SceneManager 渲染当前场景', () => {
            const manager = new window.SceneManager();
            const canvas = document.createElement('canvas');
            canvas.width = 800;
            canvas.height = 600;
            manager.init(canvas);
            
            let renderCalled = false;
            const scene = new window.Scene('main');
            scene.render = (ctx) => { renderCalled = true; };
            
            manager.registerScene(scene);
            manager.switchScene('main');
            manager.render();
            
            this.assert(renderCalled === true, '当前场景应渲染');
        });

        // 测试 12: 获取 Canvas 信息
        this.test('获取 Canvas 上下文', () => {
            const manager = new window.SceneManager();
            const canvas = document.createElement('canvas');
            manager.init(canvas);
            
            const ctx = manager.getContext();
            this.assert(ctx !== null, '应返回上下文');
        });

        this.test('获取 Canvas 尺寸', () => {
            const manager = new window.SceneManager();
            const canvas = document.createElement('canvas');
            canvas.width = 800;
            canvas.height = 600;
            manager.init(canvas);
            
            const size = manager.getCanvasSize();
            this.assert(size.width === 800, '宽度应正确');
            this.assert(size.height === 600, '高度应正确');
        });

        console.log('='.repeat(50));
        console.log(`结果：${this.passed} 通过，${this.failed} 失败\n`);

        return { passed: this.passed, failed: this.failed, results: this.results };
    }
}

// 导出
window.SceneTests = SceneTests;
