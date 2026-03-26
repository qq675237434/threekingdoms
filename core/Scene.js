/**
 * Scene.js - 场景管理模块
 * 负责管理游戏场景的切换、渲染和状态
 */
class Scene {
    constructor(name) {
        this.name = name;
        this.entities = [];
        this.isInitialized = false;
    }
    
    /**
     * 初始化场景
     */
    init() {
        this.isInitialized = true;
    }
    
    /**
     * 场景更新
     * @param {number} deltaTime - 帧间隔时间 (秒)
     */
    update(deltaTime) {
        this.entities.forEach(entity => {
            if (entity.update) {
                entity.update(deltaTime);
            }
        });
    }
    
    /**
     * 场景渲染
     * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
     */
    render(ctx) {
        this.entities.forEach(entity => {
            if (entity.render) {
                entity.render(ctx);
            }
        });
    }
    
    /**
     * 添加实体到场景
     * @param {object} entity - 游戏实体
     */
    addEntity(entity) {
        this.entities.push(entity);
    }
    
    /**
     * 从场景移除实体
     * @param {object} entity - 游戏实体
     */
    removeEntity(entity) {
        const index = this.entities.indexOf(entity);
        if (index > -1) {
            this.entities.splice(index, 1);
        }
    }
    
    /**
     * 移除所有实体
     */
    clearEntities() {
        this.entities = [];
    }
    
    /**
     * 获取所有实体
     * @returns {array}
     */
    getEntities() {
        return this.entities;
    }
    
    /**
     * 场景进入时调用
     */
    onEnter() {
        // 子类可重写
    }
    
    /**
     * 场景离开时调用
     */
    onExit() {
        // 子类可重写
    }
}

/**
 * 场景管理器 - 单例模式
 */
class SceneManager {
    constructor() {
        this.scenes = new Map();
        this.currentScene = null;
        this.canvas = null;
        this.ctx = null;
    }
    
    /**
     * 初始化场景管理器
     * @param {HTMLCanvasElement} canvas - Canvas 元素
     */
    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }
    
    /**
     * 注册场景
     * @param {Scene} scene - 场景实例
     */
    registerScene(scene) {
        this.scenes.set(scene.name, scene);
    }
    
    /**
     * 切换到指定场景
     * @param {string} sceneName - 场景名称
     */
    switchScene(sceneName) {
        if (!this.scenes.has(sceneName)) {
            console.error(`Scene not found: ${sceneName}`);
            return;
        }
        
        // 离开当前场景
        if (this.currentScene) {
            this.currentScene.onExit();
        }
        
        // 进入新场景
        const newScene = this.scenes.get(sceneName);
        if (!newScene.isInitialized) {
            newScene.init();
        }
        
        this.currentScene = newScene;
        this.currentScene.onEnter();
    }
    
    /**
     * 获取当前场景
     * @returns {Scene}
     */
    getCurrentScene() {
        return this.currentScene;
    }
    
    /**
     * 更新当前场景
     * @param {number} deltaTime
     */
    update(deltaTime) {
        if (this.currentScene) {
            this.currentScene.update(deltaTime);
        }
    }
    
    /**
     * 渲染当前场景
     */
    render() {
        if (!this.ctx || !this.currentScene) return;
        
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 渲染场景
        this.currentScene.render(this.ctx);
    }
    
    /**
     * 获取 Canvas 上下文
     * @returns {CanvasRenderingContext2D}
     */
    getContext() {
        return this.ctx;
    }
    
    /**
     * 获取 Canvas 尺寸
     * @returns {object} { width, height }
     */
    getCanvasSize() {
        return {
            width: this.canvas.width,
            height: this.canvas.height
        };
    }
}

// 导出
window.Scene = Scene;
window.SceneManager = SceneManager;
