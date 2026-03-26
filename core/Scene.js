/**
 * Scene.js - 场景管理模块（性能优化版）
 * 优化项：
 * - 缓存渐变和样式对象
 * - 减少路径创建调用
 * - 优化实体渲染循环
 * - 使用对象池管理装饰元素
 */

const SceneConfig = {
    GROUND_Y: 520,
    GROUND_HEIGHT: 80,
    PARALLAX_LAYERS: 4
};

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
        
        this.parallaxLayers = [];
        this.scrollOffset = 0;
        
        this.clouds = [];
        this.flags = [];
        this.lanterns = [];
        
        this.groundTiles = [];
        this.groundScroll = 0;
        
        // 优化：缓存对象
        this._cachedGradients = {};
        this._buildingPositions = [100, 350, 600, 850, 1100];
        this._starPositions = [];
        
        // 预生成星星位置
        for (let i = 0; i < 50; i++) {
            this._starPositions.push({
                baseX: (i * 73) % 800,
                baseY: (i * 37) % (SceneConfig.GROUND_Y - 100),
                size: (i % 3) + 1,
                phase: i
            });
        }
    }
    
    init() {
        this.isInitialized = true;
        this.initParallaxLayers();
        this.initDecorations();
        this.initGroundTiles();
    }
    
    initParallaxLayers() {
        for (let i = 0; i < SceneConfig.PARALLAX_LAYERS; i++) {
            this.parallaxLayers.push({
                speed: 0.1 + i * 0.3,
                elements: []
            });
        }
    }
    
    initDecorations() {
        // 云层
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
        
        // 旗帜
        for (let i = 0; i < 6; i++) {
            this.flags.push({
                x: 100 + i * 150,
                y: 180,
                poleHeight: 120,
                color: ['#c41e3a', '#1a1a4e', '#ffd700'][i % 3],
                waveOffset: Math.random() * Math.PI * 2
            });
        }
        
        // 灯笼
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
    
    initGroundTiles() {
        const tileWidth = 60, tileHeight = 40;
        const totalTiles = Math.ceil(800 / tileWidth) + 2;
        
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < totalTiles; col++) {
                this.groundTiles.push({
                    x: col * tileWidth,
                    y: SceneConfig.GROUND_Y + row * tileHeight,
                    width: tileWidth,
                    height: tileHeight,
                    color: this._getStoneColor(row, col),
                    offset: Math.random() * 2
                });
            }
        }
    }
    
    _getStoneColor(row, col) {
        const baseGray = 60 + (row + col) % 20;
        const colors = [
            `rgb(${baseGray}, ${baseGray}, ${baseGray + 10})`,
            `rgb(${baseGray + 5}, ${baseGray}, ${baseGray})`,
            `rgb(${baseGray}, ${baseGray + 5}, ${baseGray})`
        ];
        return colors[(row + col) % 3];
    }
    
    update(deltaTime, cameraX = 0) {
        this.scrollOffset = cameraX;
        this.groundScroll = cameraX * 0.5;
        
        // 更新云层
        for (let i = 0, len = this.clouds.length; i < len; i++) {
            const cloud = this.clouds[i];
            cloud.x -= cloud.speed * deltaTime;
            if (cloud.x + cloud.width < 0) {
                cloud.x = 800 + Math.random() * 100;
            }
        }
        
        // 更新灯笼
        for (let i = 0, len = this.lanterns.length; i < len; i++) {
            this.lanterns[i].swingAngle += this.lanterns[i].swingSpeed * deltaTime;
        }
        
        // 更新实体
        for (let i = 0, len = this.entities.length; i < len; i++) {
            const entity = this.entities[i];
            if (entity.update) {
                entity.update(deltaTime);
            }
        }
    }
    
    render(ctx, cameraX = 0) {
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;
        
        this.renderSkyBackground(ctx, canvasWidth, canvasHeight);
        this.renderClouds(ctx, cameraX);
        this.renderDistantBuildings(ctx, cameraX);
        this.renderFlags(ctx, cameraX);
        this.renderLanterns(ctx, cameraX);
        this.renderGround(ctx, canvasWidth, cameraX);
        
        // 优化：实体渲染
        for (let i = 0, len = this.entities.length; i < len; i++) {
            const entity = this.entities[i];
            if (entity.render) {
                entity.render(ctx);
            }
        }
    }
    
    renderSkyBackground(ctx, width, height) {
        const skyKey = 'sky';
        if (!this._cachedGradients[skyKey]) {
            const gradient = ctx.createLinearGradient(0, 0, 0, SceneConfig.GROUND_Y);
            gradient.addColorStop(0, '#1a1a3e');
            gradient.addColorStop(0.5, '#2d2d5a');
            gradient.addColorStop(1, '#4a4a7a');
            this._cachedGradients[skyKey] = gradient;
        }
        
        ctx.fillStyle = this._cachedGradients[skyKey];
        ctx.fillRect(0, 0, width, SceneConfig.GROUND_Y);
        
        // 星星
        ctx.fillStyle = '#fff';
        const time = Date.now() / 1000;
        const scrollX = this.scrollOffset * 0.1;
        
        for (let i = 0, len = this._starPositions.length; i < len; i++) {
            const star = this._starPositions[i];
            const x = (star.baseX - scrollX % 800 + 800) % 800;
            const alpha = 0.5 + Math.sin(time + star.phase) * 0.3;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(x, star.baseY, star.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
    
    renderClouds(ctx, cameraX) {
        ctx.save();
        ctx.translate(-cameraX * 0.1, 0);
        
        for (let i = 0, len = this.clouds.length; i < len; i++) {
            const cloud = this.clouds[i];
            
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
            
            ctx.fillStyle = `rgba(255, 255, 255, ${cloud.opacity * 0.7})`;
            ctx.beginPath();
            ctx.arc(cloud.x + cloud.width * 0.3, cloud.y + cloud.height * 0.6, cloud.height * 0.4, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.width * 0.7, cloud.y + cloud.height * 0.5, cloud.height * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    renderDistantBuildings(ctx, cameraX) {
        ctx.save();
        ctx.translate(-cameraX * 0.3, 0);
        
        const scrollMod = (this.scrollOffset * 0.3) % 1200;
        
        for (let i = 0, len = this._buildingPositions.length; i < len; i++) {
            const baseX = this._buildingPositions[i];
            let x = baseX - scrollMod;
            if (x < -200) x += 1200;
            
            // 建筑主体
            ctx.fillStyle = '#2a2a4a';
            ctx.fillRect(x, 280, 120, 240);
            
            // 屋顶
            ctx.fillStyle = '#1a1a3a';
            ctx.beginPath();
            ctx.moveTo(x - 20, 280);
            ctx.lineTo(x + 60, 230);
            ctx.lineTo(x + 140, 280);
            ctx.closePath();
            ctx.fill();
            
            // 飞檐
            ctx.beginPath();
            ctx.moveTo(x - 20, 280);
            ctx.quadraticCurveTo(x - 30, 270, x - 25, 260);
            ctx.lineTo(x - 15, 280);
            ctx.closePath();
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(x + 140, 280);
            ctx.quadraticCurveTo(x + 150, 270, x + 145, 260);
            ctx.lineTo(x + 135, 280);
            ctx.closePath();
            ctx.fill();
            
            // 屋檐装饰
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x - 20, 280);
            ctx.lineTo(x + 140, 280);
            ctx.stroke();
            
            // 窗户
            ctx.fillStyle = '#3a3a5a';
            for (let row = 0; row < 3; row++) {
                for (let col = 0; col < 2; col++) {
                    const winX = x + 25 + col * 45;
                    const winY = 310 + row * 55;
                    ctx.fillRect(winX, winY, 30, 40);
                    ctx.strokeStyle = '#4a4a6a';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(winX, winY, 30, 40);
                }
            }
        }
        
        ctx.restore();
    }
    
    renderFlags(ctx, cameraX) {
        ctx.save();
        ctx.translate(-cameraX * 0.5, 0);
        
        const time = Date.now() / 1000;
        const scrollMod = (this.scrollOffset * 0.5) % 900;
        const chars = ['關', '張', '趙', '呂', '曹', '劉'];
        
        for (let i = 0, len = this.flags.length; i < len; i++) {
            const flag = this.flags[i];
            let x = flag.x - scrollMod;
            if (x < -50) x += 900;
            
            // 旗杆
            ctx.fillStyle = '#4a3728';
            ctx.fillRect(x, flag.y, 6, flag.poleHeight);
            
            // 顶端装饰
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(x + 3, flag.y, 8, 0, Math.PI * 2);
            ctx.fill();
            
            // 旗帜
            ctx.fillStyle = flag.color;
            ctx.beginPath();
            ctx.moveTo(x + 6, flag.y);
            
            const waveAmplitude = 8;
            const waveFrequency = 0.1;
            for (let j = 0; j <= 10; j++) {
                const waveX = j * 8;
                const waveY = Math.sin(time * 3 + flag.waveOffset + j * waveFrequency) * waveAmplitude;
                ctx.lineTo(x + 6 + waveX, flag.y + 15 + waveY);
            }
            
            ctx.lineTo(x + 6, flag.y + 30);
            ctx.closePath();
            ctx.fill();
            
            // 旗帜文字
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(chars[i % chars.length], x + 45, flag.y + 22);
        }
        
        ctx.restore();
    }
    
    renderLanterns(ctx, cameraX) {
        ctx.save();
        ctx.translate(-cameraX * 0.4, 0);
        
        const scrollMod = (this.scrollOffset * 0.4) % 1000;
        const time = Date.now();
        
        for (let i = 0, len = this.lanterns.length; i < len; i++) {
            const lantern = this.lanterns[i];
            let x = lantern.x - scrollMod;
            if (x < -50) x += 1000;
            
            const swing = Math.sin(time * lantern.swingSpeed + i) * 10;
            
            // 绳子
            ctx.strokeStyle = '#4a3728';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, lantern.y - 30);
            ctx.quadraticCurveTo(x + swing / 2, lantern.y - 15, x + swing, lantern.y);
            ctx.stroke();
            
            ctx.save();
            ctx.translate(x + swing, lantern.y);
            
            // 光晕
            const flicker = 0.8 + Math.sin(time / 100 + i) * 0.2;
            const glowGradient = ctx.createRadialGradient(0, 0, 10, 0, 0, 40);
            glowGradient.addColorStop(0, lantern.color.replace(')', `, 0.4)`).replace('rgb', 'rgba'));
            glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(0, 0, 40, 0, Math.PI * 2);
            ctx.fill();
            
            // 灯笼框架
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(-12, -15, 24, 30);
            
            // 发光部分
            ctx.fillStyle = lantern.color;
            ctx.globalAlpha = flicker;
            ctx.fillRect(-10, -13, 20, 26);
            ctx.globalAlpha = 1;
            
            // 装饰线条
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-10, -5);
            ctx.lineTo(10, -5);
            ctx.moveTo(-10, 5);
            ctx.lineTo(10, 5);
            ctx.stroke();
            
            // 流苏
            ctx.fillStyle = '#c41e3a';
            for (let j = 0; j < 3; j++) {
                ctx.fillRect(-8 + j * 8, 15, 4, 10 + Math.sin(time / 200 + j) * 3);
            }
            
            ctx.restore();
        }
        
        ctx.restore();
    }
    
    renderGround(ctx, canvasWidth, cameraX) {
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(0, SceneConfig.GROUND_Y, canvasWidth, SceneConfig.GROUND_HEIGHT);
        
        ctx.save();
        ctx.translate(-this.groundScroll % 60, 0);
        
        for (let i = 0, len = this.groundTiles.length; i < len; i++) {
            const tile = this.groundTiles[i];
            
            if (tile.x + tile.width > 0 && tile.x < canvasWidth + 60) {
                ctx.fillStyle = tile.color;
                ctx.fillRect(tile.x + tile.offset, tile.y, tile.width - 2, tile.height - 2);
                
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.lineWidth = 1;
                ctx.strokeRect(tile.x + tile.offset, tile.y, tile.width - 2, tile.height - 2);
                
                ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                ctx.fillRect(tile.x + tile.offset + 5, tile.y + 5, tile.width - 15, 3);
            }
        }
        
        ctx.restore();
        
        const gradient = ctx.createLinearGradient(0, SceneConfig.GROUND_Y, 0, SceneConfig.GROUND_Y + 10);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, SceneConfig.GROUND_Y, canvasWidth, 10);
    }
    
    addEntity(entity) {
        this.entities.push(entity);
    }
    
    removeEntity(entity) {
        const index = this.entities.indexOf(entity);
        if (index > -1) {
            this.entities.splice(index, 1);
        }
    }
    
    clearEntities() {
        this.entities = [];
    }
    
    getEntities() {
        return this.entities;
    }
    
    onEnter() {}
    onExit() {}
}

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
        if (!this.scenes.has(sceneName)) return;
        
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

window.Scene = Scene;
window.SceneManager = SceneManager;
window.SceneConfig = SceneConfig;
window.DecorationType = DecorationType;
