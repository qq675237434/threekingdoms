/**
 * GameLoop.js - 游戏主循环模块
 * 负责管理游戏的主循环、帧率控制和状态更新
 */
class GameLoop {
    constructor() {
        this.lastTime = 0;
        this.deltaTime = 0;
        this.fps = 0;
        this.frameCount = 0;
        this.fpsUpdateTime = 0;
        this.isRunning = false;
        this.isPaused = false;
        
        this.updateCallbacks = [];
        this.renderCallbacks = [];
        
        this.targetFPS = 60;
        this.frameInterval = 1000 / this.targetFPS;
    }
    
    /**
     * 启动游戏循环
     */
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.isPaused = false;
        this.lastTime = performance.now();
        this.fpsUpdateTime = this.lastTime;
        
        this.loop();
    }
    
    /**
     * 停止游戏循环
     */
    stop() {
        this.isRunning = false;
    }
    
    /**
     * 暂停游戏循环
     */
    pause() {
        this.isPaused = true;
    }
    
    /**
     * 恢复游戏循环
     */
    resume() {
        this.isPaused = false;
        this.lastTime = performance.now();
        this.loop();
    }
    
    /**
     * 主循环
     */
    loop() {
        if (!this.isRunning) return;
        
        requestAnimationFrame(() => this.loop());
        
        if (this.isPaused) return;
        
        const currentTime = performance.now();
        this.deltaTime = (currentTime - this.lastTime) / 1000; // 转换为秒
        this.lastTime = currentTime;
        
        // FPS 计算
        this.frameCount++;
        if (currentTime - this.fpsUpdateTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsUpdateTime = currentTime;
        }
        
        // 限制帧率
        const elapsed = currentTime - this.lastTime;
        if (elapsed < this.frameInterval) {
            return;
        }
        
        // 执行更新
        this.update();
        
        // 执行渲染
        this.render();
    }
    
    /**
     * 更新游戏状态
     */
    update() {
        this.updateCallbacks.forEach(callback => callback(this.deltaTime));
    }
    
    /**
     * 渲染游戏画面
     */
    render() {
        this.renderCallbacks.forEach(callback => callback());
    }
    
    /**
     * 注册更新回调
     * @param {function} callback - 回调函数，接收 deltaTime 参数
     */
    onUpdate(callback) {
        this.updateCallbacks.push(callback);
    }
    
    /**
     * 注册渲染回调
     * @param {function} callback - 回调函数
     */
    onRender(callback) {
        this.renderCallbacks.push(callback);
    }
    
    /**
     * 移除更新回调
     * @param {function} callback
     */
    removeUpdateCallback(callback) {
        const index = this.updateCallbacks.indexOf(callback);
        if (index > -1) {
            this.updateCallbacks.splice(index, 1);
        }
    }
    
    /**
     * 移除渲染回调
     * @param {function} callback
     */
    removeRenderCallback(callback) {
        const index = this.renderCallbacks.indexOf(callback);
        if (index > -1) {
            this.renderCallbacks.splice(index, 1);
        }
    }
    
    /**
     * 获取帧间隔时间 (秒)
     * @returns {number}
     */
    getDelta() {
        return this.deltaTime;
    }
    
    /**
     * 获取当前 FPS
     * @returns {number}
     */
    getFPS() {
        return this.fps;
    }
    
    /**
     * 设置目标 FPS
     * @param {number} fps
     */
    setTargetFPS(fps) {
        this.targetFPS = fps;
        this.frameInterval = 1000 / fps;
    }
}

// 导出
window.GameLoop = GameLoop;
