/**
 * game.js - 游戏主入口
 * 负责初始化游戏、管理场景和协调各模块
 */

/**
 * 主游戏类
 */
class Game {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.gameLoop = null;
        this.sceneManager = null;
        this.hud = null;
        
        this.player = null;
        this.enemySpawner = null;
        
        this.isInitialized = false;
        this.isRunning = false;
    }
    
    /**
     * 初始化游戏
     */
    init() {
        // 获取 Canvas
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            console.error('Canvas not found!');
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        
        // 初始化游戏循环
        this.gameLoop = new GameLoop();
        
        // 初始化场景管理器
        this.sceneManager = new SceneManager();
        this.sceneManager.init(this.canvas);
        
        // 初始化 HUD
        this.hud = new HUD();
        this.hud.init(this.canvas);
        
        // 创建场景
        this.createScenes();
        
        // 创建玩家
        this.createPlayer();
        
        // 创建敌人生成器
        this.enemySpawner = new EnemySpawner(this.sceneManager.getCurrentScene());
        this.enemySpawner.addSpawnPoint({ x: 650, y: 400 });
        this.enemySpawner.addSpawnPoint({ x: 750, y: 400 });
        
        // 注册游戏循环回调
        this.gameLoop.onUpdate((deltaTime) => this.update(deltaTime));
        this.gameLoop.onRender(() => this.render());
        
        // 设置输入监听
        this.setupInput();
        
        // 隐藏加载屏幕
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
        
        this.isInitialized = true;
        console.log('游戏初始化完成!');
    }
    
    /**
     * 创建场景
     */
    createScenes() {
        // 主游戏场景
        const mainScene = new Scene('main');
        mainScene.init = () => {
            console.log('进入主游戏场景');
            // 生成初始敌人
            this.enemySpawner.spawnWave(3, { type: 'soldier', name: '士兵' });
        };
        mainScene.onEnter = () => {
            this.player.reset();
        };
        
        this.sceneManager.registerScene(mainScene);
        this.sceneManager.switchScene('main');
    }
    
    /**
     * 创建玩家
     */
    createPlayer() {
        this.player = new Player({
            name: '关羽',
            x: 100,
            y: 400,
            maxHealth: 100,
            maxMana: 50,
            attack: 15,
            speed: 220
        });
        
        // 将玩家添加到场景
        this.sceneManager.getCurrentScene().addEntity(this.player);
    }
    
    /**
     * 设置输入监听
     */
    setupInput() {
        // 暂停控制
        window.addEventListener('keydown', (e) => {
            if (e.code === 'KeyP') {
                this.togglePause();
            }
            
            // 重新开始
            if (e.code === 'KeyR' && this.hud.gameOver) {
                this.restart();
            }
        });
    }
    
    /**
     * 游戏更新
     * @param {number} deltaTime
     */
    update(deltaTime) {
        if (!this.isRunning || this.hud.isPaused || this.hud.gameOver) return;
        
        // 更新时间
        this.hud.time += deltaTime;
        
        // 获取输入
        const direction = getDirection();
        const input = {
            left: direction.left,
            right: direction.right,
            up: direction.up,
            down: direction.down,
            attack: isAttacking(),
            skill: isUsingSkill(),
            jump: defaultInput.isAnyPressed(CONTROLS.JUMP)
        };
        
        // 更新玩家
        if (this.player && !this.player.isDead) {
            this.player.update(deltaTime, input);
            
            // 更新 HUD
            this.hud.setPlayerHealth(this.player.health, this.player.maxHealth);
            this.hud.setPlayerMana(this.player.mana, this.player.maxMana);
            this.hud.updateSkillCooldowns(this.player.skillManager.getAllSkills());
        }
        
        // 更新敌人
        if (this.enemySpawner) {
            this.enemySpawner.update(deltaTime, this.player);
        }
        
        // 检测碰撞
        this.checkCollisions();
        
        // 更新 HUD
        this.hud.update(deltaTime);
        
        // 检查游戏结束条件
        this.checkGameOver();
    }
    
    /**
     * 渲染游戏
     */
    render() {
        // 清空画布
        this.ctx.fillStyle = '#0f0f23';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制背景 (简单渐变)
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#1a1a3e');
        gradient.addColorStop(1, '#0f0f23');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制地面
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, 520, this.canvas.width, 80);
        
        // 绘制地面装饰
        this.ctx.fillStyle = '#34495e';
        for (let i = 0; i < this.canvas.width; i += 50) {
            this.ctx.fillRect(i, 520, 40, 10);
        }
        
        // 渲染场景
        this.sceneManager.render();
        
        // 渲染 HUD
        this.hud.render();
        
        // 显示 FPS
        this.renderFPS();
    }
    
    /**
     * 渲染 FPS
     */
    renderFPS() {
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`FPS: ${this.gameLoop.getFPS()}`, 10, this.canvas.height - 10);
    }
    
    /**
     * 检测碰撞
     */
    checkCollisions() {
        if (!this.player || this.player.isDead) return;
        
        const enemies = this.enemySpawner ? this.enemySpawner.getAliveEnemies() : [];
        
        // 玩家攻击检测
        if (this.player.attackBox.active) {
            enemies.forEach(enemy => {
                if (this.checkCollision(this.player.attackBox, enemy.getHitbox())) {
                    enemy.takeDamage(this.player.attack);
                    this.hud.addScore(10);
                    this.hud.addCombo();
                }
            });
        }
        
        // 敌人攻击检测
        enemies.forEach(enemy => {
            if (enemy.attackBox.active) {
                if (this.checkCollision(enemy.attackBox, this.player.getHitbox())) {
                    this.player.takeDamage(enemy.attack);
                    this.hud.resetCombo();
                    
                    if (this.player.isDead) {
                        this.hud.showMessage('你被击败了!', '#e74c3c');
                    }
                }
            }
        });
    }
    
    /**
     * 碰撞检测 (AABB)
     */
    checkCollision(box1, box2) {
        return box1.x < box2.x + box2.width &&
               box1.x + box1.width > box2.x &&
               box1.y < box2.y + box2.height &&
               box1.y + box1.height > box2.y;
    }
    
    /**
     * 检查游戏结束
     */
    checkGameOver() {
        if (this.player && this.player.isDead) {
            this.hud.setGameOver(false);
            this.isRunning = false;
        }
        
        // 检查是否所有敌人都被击败
        const enemies = this.enemySpawner ? this.enemySpawner.getAliveEnemies() : [];
        if (enemies.length === 0 && this.player && !this.player.isDead) {
            // 生成新的敌人波次
            setTimeout(() => {
                if (this.isRunning) {
                    const wave = Math.floor(this.hud.time / 30) + 1;
                    this.enemySpawner.spawnWave(2 + wave, { 
                        type: wave % 3 === 0 ? 'archer' : 'soldier',
                        name: wave % 3 === 0 ? '弓箭手' : '士兵',
                        maxHealth: 50 + wave * 10,
                        attack: 8 + wave * 2
                    });
                    this.hud.showMessage(`第 ${wave + 1} 波敌人!`, '#f39c12');
                    this.hud.level = wave + 1;
                }
            }, 2000);
        }
    }
    
    /**
     * 切换暂停状态
     */
    togglePause() {
        if (!this.isInitialized || this.hud.gameOver) return;
        
        this.hud.setPaused(!this.hud.isPaused);
        
        if (this.hud.isPaused) {
            this.gameLoop.pause();
        } else {
            this.gameLoop.resume();
        }
    }
    
    /**
     * 重新开始游戏
     */
    restart() {
        // 清理场景
        const currentScene = this.sceneManager.getCurrentScene();
        currentScene.clearEntities();
        
        // 重置 HUD
        this.hud.reset();
        
        // 重新创建玩家
        this.createPlayer();
        
        // 重置敌人生成器
        this.enemySpawner.clearAll();
        this.enemySpawner.spawnWave(3, { type: 'soldier', name: '士兵' });
        
        // 重新开始
        this.isRunning = true;
        this.gameLoop.start();
        
        console.log('游戏重新开始!');
    }
    
    /**
     * 启动游戏
     */
    start() {
        if (!this.isInitialized) {
            this.init();
        }
        
        this.isRunning = true;
        this.gameLoop.start();
        console.log('游戏启动!');
    }
    
    /**
     * 停止游戏
     */
    stop() {
        this.isRunning = false;
        this.gameLoop.stop();
        console.log('游戏停止!');
    }
}

// ============ 游戏启动 ============

// 等待 DOM 加载完成
document.addEventListener('DOMContentLoaded', () => {
    // 创建游戏实例
    window.game = new Game();
    
    // 自动启动
    setTimeout(() => {
        window.game.start();
    }, 500);
});

// 导出
window.Game = Game;
