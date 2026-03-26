/**
 * Scene.js - 场景管理模块（美化版）
 * 添加中国古代建筑背景、云层、旗帜、灯笼装饰
 * 实现视差滚动、地面纹理（石板路）
 */

// 场景配置
const SceneConfig = {
    GROUND_Y: 520,
    GROUND_HEIGHT: 80,
    PARALLAX_LAYERS: 4
};

// 装饰元素类型
const DecorationType = {
    CLOUD: 'cloud',
    FLAG: 'flag',
    LANTERN: 'lantern',
    PILLAR: 'pillar',
    BUILDING: 'building',
    TREE: 'tree'
};

class Scene {
    constructor(name) {
        this.name = name;
        this.entities = [];
        this.decorations = [];
        this.isInitialized = false;
        
        // 视差滚动层
        this.parallaxLayers = [];
        this.scrollOffset = 0;
        
        // 场景装饰
        this.clouds = [];
        this.flags = [];
        this.lanterns = [];
        
        // 地面纹理
        this.groundTiles = [];
        this.groundScroll = 0;
    }
    
    /**
     * 初始化场景
     */
    init() {
        this.isInitialized = true;
        this.initParallaxLayers();
        this.initDecorations();
        this.initGroundTiles();
    }
    
    /**
     * 初始化视差层
     */
    initParallaxLayers() {
        // 层 0: 最远层（天空）- 移动速度 0.1
        // 层 1: 远景（远山/建筑）- 移动速度 0.3
        // 层 2: 中景（近处建筑）- 移动速度 0.6
        // 层 3: 前景（地面装饰）- 移动速度 1.0
        for (let i = 0; i < SceneConfig.PARALLAX_LAYERS; i++) {
            this.parallaxLayers.push({
                speed: 0.1 + i * 0.3,
                elements: []
            });
        }
    }
    
    /**
     * 初始化装饰元素
     */
    initDecorations() {
        // 添加云层
        for (let i = 0; i < 8; i++) {
            this.clouds.push({
                x: i * 150 + Math.random() * 100,
                y: 50 + Math.random() * 80,
                width: 80 + Math.random() * 60,
                height: 30 + Math.random() * 20,
                speed: 0.05 + Math.random() * 0.05,
                opacity: 0.3 + Math.random() * 0.4
            });
        }
        
        // 添加旗帜（场景两侧）
        for (let i = 0; i < 6; i++) {
            this.flags.push({
                x: 100 + i * 150,
                y: 180,
                poleHeight: 120,
                color: ['#c41e3a', '#1a1a4e', '#ffd700'][i % 3],
                waveOffset: Math.random() * Math.PI * 2
            });
        }
        
        // 添加灯笼
        for (let i = 0; i < 10; i++) {
            this.lanterns.push({
                x: 80 + i * 100,
                y: 100 + Math.random() * 50,
                color: i % 2 === 0 ? '#e74c3c' : '#f39c12',
                swingAngle: 0,
                swingSpeed: 0.002 + Math.random() * 0.002
            });
        }
    }
    
    /**
     * 初始化地面纹理（石板路）
     */
    initGroundTiles() {
        const tileWidth = 60;
        const tileHeight = 40;
        const canvasWidth = 800;
        const totalTiles = Math.ceil(canvasWidth / tileWidth) + 2;
        
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < totalTiles; col++) {
                this.groundTiles.push({
                    x: col * tileWidth,
                    y: SceneConfig.GROUND_Y + row * tileHeight,
                    width: tileWidth,
                    height: tileHeight,
                    color: this.getStoneColor(row, col),
                    offset: Math.random() * 2
                });
            }
        }
    }
    
    /**
     * 获取石板颜色（变化）
     */
    getStoneColor(row, col) {
        const baseGray = 60 + (row + col) % 20;
        const colors = [
            `rgb(${baseGray}, ${baseGray}, ${baseGray + 10})`,
            `rgb(${baseGray + 5}, ${baseGray}, ${baseGray})`,
            `rgb(${baseGray}, ${baseGray + 5}, ${baseGray})`
        ];
        return colors[(row + col) % 3];
    }
    
    /**
     * 场景更新
     */
    update(deltaTime, cameraX = 0) {
        this.scrollOffset = cameraX;
        this.groundScroll = cameraX * 0.5;
        
        // 更新云层（缓慢移动）
        this.clouds.forEach(cloud => {
            cloud.x -= cloud.speed * deltaTime;
            if (cloud.x + cloud.width < 0) {
                cloud.x = 800 + Math.random() * 100;
            }
        });
        
        // 更新灯笼摆动
        this.lanterns.forEach(lantern => {
            lantern.swingAngle += lantern.swingSpeed * deltaTime;
        });
        
        // 更新实体
        this.entities.forEach(entity => {
            if (entity.update) {
                entity.update(deltaTime);
            }
        });
    }
    
    /**
     * 场景渲染
     */
    render(ctx, cameraX = 0) {
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;
        
        // 1. 渲染天空背景（渐变）
        this.renderSkyBackground(ctx, canvasWidth, canvasHeight);
        
        // 2. 渲染云层（最远层）
        this.renderClouds(ctx, cameraX);
        
        // 3. 渲染远景建筑
        this.renderDistantBuildings(ctx, cameraX);
        
        // 4. 渲染旗帜
        this.renderFlags(ctx, cameraX);
        
        // 5. 渲染灯笼
        this.renderLanterns(ctx, cameraX);
        
        // 6. 渲染地面
        this.renderGround(ctx, canvasWidth, cameraX);
        
        // 7. 渲染实体
        this.entities.forEach(entity => {
            if (entity.render) {
                entity.render(ctx);
            }
        });
    }
    
    /**
     * 渲染天空背景
     */
    renderSkyBackground(ctx, width, height) {
        // 天空渐变（从深蓝到浅蓝）
        const gradient = ctx.createLinearGradient(0, 0, 0, SceneConfig.GROUND_Y);
        gradient.addColorStop(0, '#1a1a3e');
        gradient.addColorStop(0.5, '#2d2d5a');
        gradient.addColorStop(1, '#4a4a7a');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, SceneConfig.GROUND_Y);
        
        // 添加一些星星（如果是夜晚场景）
        ctx.fillStyle = '#fff';
        for (let i = 0; i < 50; i++) {
            const x = (i * 73 + this.scrollOffset * 0.1) % width;
            const y = (i * 37) % (SceneConfig.GROUND_Y - 100);
            const size = (i % 3) + 1;
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 1000 + i) * 0.3;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
    
    /**
     * 渲染云层
     */
    renderClouds(ctx, cameraX) {
        ctx.save();
        ctx.translate(-cameraX * 0.1, 0);
        
        this.clouds.forEach(cloud => {
            // 云层渐变
            const gradient = ctx.createRadialGradient(
                cloud.x + cloud.width / 2,
                cloud.y + cloud.height / 2,
                0,
                cloud.x + cloud.width / 2,
                cloud.y + cloud.height / 2,
                cloud.width / 2
            );
            gradient.addColorStop(0, `rgba(255, 255, 255, ${cloud.opacity})`);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.ellipse(
                cloud.x + cloud.width / 2,
                cloud.y + cloud.height / 2,
                cloud.width / 2,
                cloud.height / 2,
                0, 0, Math.PI * 2
            );
            ctx.fill();
            
            // 云的细节
            ctx.fillStyle = `rgba(255, 255, 255, ${cloud.opacity * 0.7})`;
            ctx.beginPath();
            ctx.arc(cloud.x + cloud.width * 0.3, cloud.y + cloud.height * 0.6, cloud.height * 0.4, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.width * 0.7, cloud.y + cloud.height * 0.5, cloud.height * 0.5, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.restore();
    }
    
    /**
     * 渲染远景建筑（中国古代建筑）
     */
    renderDistantBuildings(ctx, cameraX) {
        ctx.save();
        ctx.translate(-cameraX * 0.3, 0);
        
        // 绘制远处的城楼/宫殿剪影
        const buildingPositions = [100, 350, 600, 850, 1100];
        
        buildingPositions.forEach((baseX, index) => {
            const x = baseX - (this.scrollOffset * 0.3) % 1200;
            const adjustedX = x < -200 ? x + 1200 : x;
            
            // 建筑主体
            ctx.fillStyle = '#2a2a4a';
            ctx.fillRect(adjustedX, 280, 120, 240);
            
            // 屋顶（中式飞檐）
            ctx.fillStyle = '#1a1a3a';
            ctx.beginPath();
            ctx.moveTo(adjustedX - 20, 280);
            ctx.lineTo(adjustedX + 60, 230);  // 屋脊
            ctx.lineTo(adjustedX + 140, 280);
            ctx.closePath();
            ctx.fill();
            
            // 飞檐翘角
            ctx.fillStyle = '#1a1a3a';
            ctx.beginPath();
            ctx.moveTo(adjustedX - 20, 280);
            ctx.quadraticCurveTo(adjustedX - 30, 270, adjustedX - 25, 260);
            ctx.lineTo(adjustedX - 15, 280);
            ctx.closePath();
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(adjustedX + 140, 280);
            ctx.quadraticCurveTo(adjustedX + 150, 270, adjustedX + 145, 260);
            ctx.lineTo(adjustedX + 135, 280);
            ctx.closePath();
            ctx.fill();
            
            // 屋檐装饰
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(adjustedX - 20, 280);
            ctx.lineTo(adjustedX + 140, 280);
            ctx.stroke();
            
            // 窗户
            ctx.fillStyle = '#3a3a5a';
            for (let row = 0; row < 3; row++) {
                for (let col = 0; col < 2; col++) {
                    ctx.fillRect(
                        adjustedX + 25 + col * 45,
                        310 + row * 55,
                        30,
                        40
                    );
                    
                    // 窗格
                    ctx.strokeStyle = '#4a4a6a';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(
                        adjustedX + 25 + col * 45,
                        310 + row * 55,
                        30,
                        40
                    );
                }
            }
        });
        
        ctx.restore();
    }
    
    /**
     * 渲染旗帜
     */
    renderFlags(ctx, cameraX) {
        ctx.save();
        ctx.translate(-cameraX * 0.5, 0);
        
        const time = Date.now() / 1000;
        
        this.flags.forEach((flag, index) => {
            const x = flag.x - (this.scrollOffset * 0.5) % 900;
            const adjustedX = x < -50 ? x + 900 : x;
            
            // 旗杆
            ctx.fillStyle = '#4a3728';
            ctx.fillRect(adjustedX, flag.y, 6, flag.poleHeight);
            
            // 旗杆顶端装饰
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(adjustedX + 3, flag.y, 8, 0, Math.PI * 2);
            ctx.fill();
            
            // 旗帜（飘动效果）
            ctx.fillStyle = flag.color;
            ctx.beginPath();
            ctx.moveTo(adjustedX + 6, flag.y);
            
            // 旗帜波浪
            const waveAmplitude = 8;
            const waveFrequency = 0.1;
            for (let i = 0; i <= 10; i++) {
                const waveX = i * 8;
                const waveY = Math.sin(time * 3 + flag.waveOffset + i * waveFrequency) * waveAmplitude;
                ctx.lineTo(adjustedX + 6 + waveX, flag.y + 15 + waveY);
            }
            
            ctx.lineTo(adjustedX + 6, flag.y + 30);
            ctx.closePath();
            ctx.fill();
            
            // 旗帜文字/图案
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            const chars = ['關', '張', '趙', '呂', '曹', '劉'];
            ctx.fillText(chars[index % chars.length], adjustedX + 45, flag.y + 22);
        });
        
        ctx.restore();
    }
    
    /**
     * 渲染灯笼
     */
    renderLanterns(ctx, cameraX) {
        ctx.save();
        ctx.translate(-cameraX * 0.4, 0);
        
        this.lanterns.forEach((lantern, index) => {
            const x = lantern.x - (this.scrollOffset * 0.4) % 1000;
            const adjustedX = x < -50 ? x + 1000 : x;
            
            const swing = Math.sin(Date.now() * lantern.swingSpeed + index) * 10;
            
            // 绳子
            ctx.strokeStyle = '#4a3728';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(adjustedX, lantern.y - 30);
            ctx.quadraticCurveTo(adjustedX + swing / 2, lantern.y - 15, adjustedX + swing, lantern.y);
            ctx.stroke();
            
            // 灯笼主体
            ctx.save();
            ctx.translate(adjustedX + swing, lantern.y);
            
            // 灯笼光晕
            const glowGradient = ctx.createRadialGradient(0, 0, 10, 0, 0, 40);
            glowGradient.addColorStop(0, lantern.color.replace(')', ', 0.4)').replace('rgb', 'rgba'));
            glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(0, 0, 40, 0, Math.PI * 2);
            ctx.fill();
            
            // 灯笼框架
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(-12, -15, 24, 30);
            
            // 灯笼发光部分
            const flicker = 0.8 + Math.sin(Date.now() / 100 + index) * 0.2;
            ctx.fillStyle = lantern.color;
            ctx.globalAlpha = flicker;
            ctx.fillRect(-10, -13, 20, 26);
            ctx.globalAlpha = 1;
            
            // 灯笼装饰线条
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-10, -5);
            ctx.lineTo(10, -5);
            ctx.moveTo(-10, 5);
            ctx.lineTo(10, 5);
            ctx.stroke();
            
            // 灯笼底部流苏
            ctx.fillStyle = '#c41e3a';
            for (let i = 0; i < 3; i++) {
                ctx.fillRect(-8 + i * 8, 15, 4, 10 + Math.sin(Date.now() / 200 + i) * 3);
            }
            
            ctx.restore();
        });
        
        ctx.restore();
    }
    
    /**
     * 渲染地面（石板路）
     */
    renderGround(ctx, canvasWidth, cameraX) {
        // 地面背景
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(0, SceneConfig.GROUND_Y, canvasWidth, SceneConfig.GROUND_HEIGHT);
        
        // 石板纹理
        ctx.save();
        ctx.translate(-this.groundScroll % 60, 0);
        
        this.groundTiles.forEach(tile => {
            // 只渲染可见区域
            if (tile.x + tile.width > 0 && tile.x < canvasWidth + 60) {
                // 石板主体
                ctx.fillStyle = tile.color;
                ctx.fillRect(
                    tile.x + tile.offset,
                    tile.y,
                    tile.width - 2,
                    tile.height - 2
                );
                
                // 石板边缘（高光）
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.lineWidth = 1;
                ctx.strokeRect(
                    tile.x + tile.offset,
                    tile.y,
                    tile.width - 2,
                    tile.height - 2
                );
                
                // 石板纹理细节
                ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                ctx.fillRect(
                    tile.x + tile.offset + 5,
                    tile.y + 5,
                    tile.width - 15,
                    3
                );
            }
        });
        
        ctx.restore();
        
        // 地面顶部装饰线
        const gradient = ctx.createLinearGradient(0, SceneConfig.GROUND_Y, 0, SceneConfig.GROUND_Y + 10);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, SceneConfig.GROUND_Y, canvasWidth, 10);
    }
    
    /**
     * 添加实体到场景
     */
    addEntity(entity) {
        this.entities.push(entity);
    }
    
    /**
     * 从场景移除实体
     */
    removeEntity(entity) {
        const index = this.entities.indexOf(entity);
        if (index > -1) {
            this.entities.splice(index, 1);
        }
    }
    
    /**
     * 清空实体
     */
    clearEntities() {
        this.entities = [];
    }
    
    /**
     * 获取实体
     */
    getEntities() {
        return this.entities;
    }
    
    /**
     * 场景进入
     */
    onEnter() {
        console.log(`进入场景：${this.name}`);
    }
    
    /**
     * 场景离开
     */
    onExit() {
        console.log(`离开场景：${this.name}`);
    }
}

/**
 * 场景管理器（保持不变）
 */
class SceneManager {
    constructor() {
        this.scenes = new Map();
        this.currentScene = null;
        this.canvas = null;
        this.ctx = null;
    }
    
    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }
    
    registerScene(scene) {
        this.scenes.set(scene.name, scene);
    }
    
    switchScene(sceneName) {
        if (!this.scenes.has(sceneName)) {
            console.error(`Scene not found: ${sceneName}`);
            return;
        }
        
        if (this.currentScene) {
            this.currentScene.onExit();
        }
        
        const newScene = this.scenes.get(sceneName);
        if (!newScene.isInitialized) {
            newScene.init();
        }
        
        this.currentScene = newScene;
        this.currentScene.onEnter();
    }
    
    getCurrentScene() {
        return this.currentScene;
    }
    
    update(deltaTime, cameraX = 0) {
        if (this.currentScene) {
            this.currentScene.update(deltaTime, cameraX);
        }
    }
    
    render(cameraX = 0) {
        if (!this.ctx || !this.currentScene) return;
        this.currentScene.render(this.ctx, cameraX);
    }
    
    getContext() {
        return this.ctx;
    }
    
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
window.SceneConfig = SceneConfig;
window.DecorationType = DecorationType;
