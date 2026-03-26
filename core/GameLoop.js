/**
 * GameLoop.js - 游戏主循环模块（性能优化版）
 * 优化项：
 * - 使用 requestAnimationFrame 优化渲染
 * - 减少回调数组遍历开销
 * - 优化 FPS 计算
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
        
        // 优化：使用固定大小数组预分配
        this.updateCallbacks = new Array(10);
        this.updateCallbackCount = 0;
        this.renderCallbacks = new Array(10);
        this.renderCallbackCount = 0;
        
        this.targetFPS = 60;
        this.frameInterval = 1000 / this.targetFPS;
        
        // 优化：缓存 RAF ID
        this._rafId = null;
        this._boundLoop = this.loop.bind(this);
    }
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.isPaused = false;
        this.lastTime = performance.now();
        this.fpsUpdateTime = this.lastTime;
        
        this._rafId = requestAnimationFrame(this._boundLoop);
    }
    
    stop() {
        this.isRunning = false;
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
    }
    
    pause() {
        this.isPaused = true;
    }
    
    resume() {
        this.isPaused = false;
        this.lastTime = performance.now();
        this._rafId = requestAnimationFrame(this._boundLoop);
    }
    
    loop() {
        if (!this.isRunning) return;
        
        this._rafId = requestAnimationFrame(this._boundLoop);
        
        if (this.isPaused) return;
        
        const currentTime = performance.now();
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // 优化：限制最大 deltaTime（避免切 tab 后跳帧）
        if (this.deltaTime > 0.1) {
            this.deltaTime = 0.1;
        }
        
        // FPS 计算（优化：减少除法运算）
        this.frameCount++;
        if (currentTime - this.fpsUpdateTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsUpdateTime = currentTime;
        }
        
        // 更新和渲染
        this.update();
        this.render();
    }
    
    update() {
        // 优化：直接遍历计数，避免 forEach 开销
        for (let i = 0; i < this.updateCallbackCount; i++) {
            const callback = this.updateCallbacks[i];
            if (callback) {
                callback(this.deltaTime);
            }
        }
    }
    
    render() {
        for (let i = 0; i < this.renderCallbackCount; i++) {
            const callback = this.renderCallbacks[i];
            if (callback) {
                callback();
            }
        }
    }
    
    onUpdate(callback) {
        if (this.updateCallbackCount < this.updateCallbacks.length) {
            this.updateCallbacks[this.updateCallbackCount++] = callback;
        } else {
            this.updateCallbacks.push(callback);
            this.updateCallbackCount++;
        }
    }
    
    onRender(callback) {
        if (this.renderCallbackCount < this.renderCallbacks.length) {
            this.renderCallbacks[this.renderCallbackCount++] = callback;
        } else {
            this.renderCallbacks.push(callback);
            this.renderCallbackCount++;
        }
    }
    
    removeUpdateCallback(callback) {
        for (let i = 0; i < this.updateCallbackCount; i++) {
            if (this.updateCallbacks[i] === callback) {
                this.updateCallbacks.splice(i, 1);
                this.updateCallbackCount--;
                break;
            }
        }
    }
    
    removeRenderCallback(callback) {
        for (let i = 0; i < this.renderCallbackCount; i++) {
            if (this.renderCallbacks[i] === callback) {
                this.renderCallbacks.splice(i, 1);
                this.renderCallbackCount--;
                break;
            }
        }
    }
    
    getDelta() {
        return this.deltaTime;
    }
    
    getFPS() {
        return this.fps;
    }
    
    setTargetFPS(fps) {
        this.targetFPS = fps;
        this.frameInterval = 1000 / fps;
    }
}

window.GameLoop = GameLoop;
