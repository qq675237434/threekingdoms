/**
 * game.js - 游戏主入口（简化修复版）
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
        this.levelManager = null;
        this.comboSystem = null;
        this.characterSelect = null;
        this.startScreen = null;
        
        this.isInitialized = false;
        this.isRunning = false;
        this.gameState = 'loading'; // loading, start, select, playing, paused, gameover
        
        console.log('🎮 三国战记 - 游戏实例创建');
    }
    
    /**
     * 初始化游戏
     */
    init() {
        console.log('🚀 开始初始化游戏...');
        
        try {
            // 获取 Canvas
            this.canvas = document.getElementById('gameCanvas');
            if (!this.canvas) {
                throw new Error('Canvas not found!');
            }
            this.ctx = this.canvas.getContext('2d');
            console.log('✅ Canvas 初始化完成');
            
            // 初始化游戏循环
            this.gameLoop = new GameLoop();
            console.log('✅ 游戏循环初始化完成');
            
            // 初始化场景管理器
            this.sceneManager = new SceneManager();
            this.sceneManager.init(this.canvas);
            console.log('✅ 场景管理器初始化完成');
            
            // 初始化 HUD
            this.hud = new HUD();
            this.hud.init(this.canvas);
            console.log('✅ HUD 初始化完成');
            
            // 初始化连击系统
            this.comboSystem = new ComboSystem(this.hud);
            console.log('✅ 连击系统初始化完成');
            
            // 初始化关卡管理器
            this.levelManager = new LevelManager(this);
            console.log('✅ 关卡管理器初始化完成');
            
            // 初始化角色选择界面
            this.characterSelect = new CharacterSelect(this);
            this.characterSelect.init(this.canvas);
            console.log('✅ 角色选择界面初始化完成');
            
            // 初始化开始界面
            this.startScreen = new StartScreen(this);
            this.startScreen.init(this.canvas);
            console.log('✅ 开始界面初始化完成');
            
            // 创建场景
            this.createScenes();
            console.log('✅ 场景创建完成');
            
            // 注册游戏循环回调
            this.gameLoop.onUpdate((deltaTime) => this.update(deltaTime));
            this.gameLoop.onRender(() => this.render());
            console.log('✅ 游戏循环回调注册完成');
            
            // 设置输入监听
            this.setupInput();
            console.log('✅ 输入监听设置完成');
            
            // 隐藏加载屏幕
            this.hideLoadingScreen();
            console.log('✅ 加载屏幕已隐藏');
            
            // 显示开始界面
            this.gameState = 'start';
            this.startScreen.show();
            console.log('✅ 开始界面已显示');
            
            this.isInitialized = true;
            console.log('🎉 游戏初始化完成！等待玩家操作...');
            
            // 初始化调试工具
            if (window.DebugTools) {
                new DebugTools(this);
            }
            
        } catch (e) {
            console.error('❌ 游戏初始化失败:', e);
            this.hideLoadingScreen();
            this.showError('游戏初始化失败：' + e.message);
            throw e;
        }
    }
    
    /**
     * 隐藏加载屏幕
     */
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            console.log('📺 加载屏幕已隐藏');
        }
    }
    
    /**
     * 显示错误信息
     */
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(231, 76, 60, 0.9);
            color: white;
            padding: 20px 40px;
            border-radius: 8px;
            font-size: 18px;
            text-align: center;
            z-index: 1000;
        `;
        errorDiv.innerHTML = `
            <h2>❌ 错误</h2>
            <p>${message}</p>
            <p style="font-size: 14px; margin-top: 10px;">按 F12 查看控制台详情</p>
        `;
        document.getElementById('gameContainer').appendChild(errorDiv);
    }
    
    /**
     * 创建场景
     */
    createScenes() {
        console.log('🏞️ 创建游戏场景...');
        
        const mainScene = new Scene('main');
        mainScene.onEnter = () => {
            console.log('📍 进入主场景');
            if (this.player) {
                this.player.reset();
                console.log('📍 玩家已重置');
            }
        };
        
        this.sceneManager.registerScene(mainScene);
        this.sceneManager.switchScene('main');
        console.log('✅ 主场景已创建并切换');
    }
    
    /**
     * 根据选择的角色创建玩家
     */
    createPlayerWithCharacter(character) {
        console.log('👤 创建玩家角色:', character.name);
        
        if (!character) {
            character = {
                id: 'guanyu',
                name: '关羽',
                stats: { health: 120, attack: 18, defense: 8, speed: 180 }
            };
        }
        
        this.player = new Player({
            name: character.name,
            x: 100,
            y: 400,
            maxHealth: character.stats.health,
            maxMana: 50,
            attack: character.stats.attack,
            defense: character.stats.defense,
            speed: character.stats.speed
        });
        
        console.log(`✅ 玩家创建成功：${character.name}, 生命：${this.player.health}`);
    }
    
    /**
     * 将玩家添加到场景
     */
    addPlayerToScene() {
        if (this.player) {
            const currentScene = this.sceneManager.getCurrentScene();
            if (currentScene) {
                currentScene.addEntity(this.player);
                console.log('✅ 玩家已添加到场景');
            } else {
                console.warn('⚠️ 当前场景为空，无法添加玩家');
            }
        }
    }
    
    /**
     * 设置输入监听
     */
    setupInput() {
        console.log('🎮 设置输入监听...');
        
        window.addEventListener('keydown', (e) => {
            // 开始界面 - 按空格或回车开始
            if (this.gameState === 'start') {
                if (e.code === 'Space' || e.code === 'Enter') {
                    console.log('🎮 玩家按下开始键');
                    this.startScreen.handleInput(e);
                }
                return;
            }
            
            // 角色选择界面
            if (this.gameState === 'select') {
                if (this.characterSelect) {
                    this.characterSelect.handleInput && this.characterSelect.handleInput(e);
                }
                return;
            }
            
            // 游戏进行中
            if (this.gameState === 'playing') {
                // P 键暂停
                if (e.code === 'KeyP') {
                    this.togglePause();
                }
                // R 键重开
                if (e.code === 'KeyR' && this.hud.gameOver) {
                    this.restart();
                }
            }
        });
        
        console.log('✅ 输入监听设置完成');
    }
    
    /**
     * 游戏更新
     */
    update(deltaTime) {
        try {
            if (!this.isRunning || this.hud.isPaused || this.hud.gameOver) return;
            
            // 根据游戏状态更新不同模块
            switch (this.gameState) {
                case 'start':
                    if (this.startScreen) this.startScreen.update(deltaTime);
                    break;
                    
                case 'select':
                    if (this.characterSelect) this.characterSelect.update(deltaTime);
                    break;
                    
                case 'playing':
                    this.updatePlaying(deltaTime);
                    break;
            }
        } catch (e) {
            console.error('❌ 游戏更新错误:', e);
        }
    }
    
    /**
     * 游戏进行中更新
     */
    updatePlaying(deltaTime) {
        // 更新时间
        this.hud.time += deltaTime;
        
        // 获取输入
        const direction = window.getDirection ? window.getDirection() : { left: false, right: false, up: false, down: false };
        const input = {
            left: direction.left,
            right: direction.right,
            up: direction.up,
            down: direction.down,
            attack: window.isAttacking ? window.isAttacking() : false,
            skill: window.isUsingSkill ? window.isUsingSkill() : false,
            jump: window.defaultInput && window.CONTROLS ? window.defaultInput.isAnyPressed(window.CONTROLS.JUMP) : false
        };
        
        // 更新玩家
        if (this.player && !this.player.isDead) {
            this.player.update(deltaTime, input);
            
            // 更新 HUD
            this.hud.setPlayerHealth(this.player.health, this.player.maxHealth);
            this.hud.setPlayerMana(this.player.mana, this.player.maxMana);
            if (this.player.skillManager) {
                this.hud.updateSkillCooldowns(this.player.skillManager.getAllSkills());
            }
        }
        
        // 更新敌人
        if (this.enemySpawner) {
            this.enemySpawner.update(deltaTime, this.player);
        }
        
        // 更新关卡
        if (this.levelManager) {
            this.levelManager.update(deltaTime);
        }
        
        // 检测碰撞
        this.checkCollisions();
        
        // 更新 HUD 和连击
        this.hud.update(deltaTime);
        if (this.comboSystem) {
            this.comboSystem.update(deltaTime);
        }
        
        // 检查游戏结束
        this.checkGameOver();
    }
    
    /**
     * 渲染游戏
     */
    render() {
        try {
            // 清空画布
            this.ctx.fillStyle = '#0f0f23';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // 根据游戏状态渲染
            switch (this.gameState) {
                case 'start':
                    this.renderStartScreen();
                    break;
                    
                case 'select':
                    this.renderGameScene();
                    if (this.characterSelect) this.characterSelect.render();
                    break;
                    
                case 'playing':
                    this.renderGameScene();
                    break;
                    
                case 'gameover':
                    this.renderGameScene();
                    this.renderGameOver();
                    break;
            }
        } catch (e) {
            console.error('❌ 渲染错误:', e);
        }
    }
    
    /**
     * 渲染开始界面
     */
    renderStartScreen() {
        // 绘制背景
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#1a1a3e');
        gradient.addColorStop(1, '#0f0f23');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 渲染开始界面
        if (this.startScreen) {
            this.startScreen.render();
        }
    }
    
    /**
     * 渲染游戏场景
     */
    renderGameScene() {
        // 绘制背景
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#1a1a3e');
        gradient.addColorStop(1, '#0f0f23');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制地面
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, 520, this.canvas.width, 80);
        
        // 渲染场景
        this.sceneManager.render();
        
        // 渲染 HUD
        if (this.hud) {
            this.hud.render();
        }
        
        // 显示 FPS
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`FPS: ${this.gameLoop.getFPS()}`, 10, this.canvas.height - 10);
    }
    
    /**
     * 渲染游戏结束
     */
    renderGameOver() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('游戏结束', this.canvas.width / 2, this.canvas.height / 2 - 30);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '24px Arial';
        this.ctx.fillText('按 R 重新开始', this.canvas.width / 2, this.canvas.height / 2 + 30);
    }
    
    /**
     * 检测碰撞
     */
    checkCollisions() {
        if (!this.player || this.player.isDead) return;
        
        const enemies = this.enemySpawner ? this.enemySpawner.getAliveEnemies() : [];
        
        // 玩家攻击检测
        if (this.player.attackBox && this.player.attackBox.active) {
            enemies.forEach(enemy => {
                if (this.checkCollision(this.player.attackBox, enemy.getHitbox())) {
                    enemy.takeDamage(this.player.attack);
                    this.hud.addScore(10);
                    if (this.comboSystem) this.comboSystem.addCombo();
                }
            });
        }
        
        // 敌人攻击检测
        enemies.forEach(enemy => {
            if (enemy.attackBox && enemy.attackBox.active) {
                if (this.checkCollision(enemy.attackBox, this.player.getHitbox())) {
                    this.player.takeDamage(enemy.attack);
                    if (this.comboSystem) this.comboSystem.resetCombo();
                    
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
            this.hud.setGameOver(true);
            this.gameState = 'gameover';
            this.isRunning = false;
            console.log('💀 游戏结束');
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
            this.gameState = 'paused';
        } else {
            this.gameLoop.resume();
            this.gameState = 'playing';
        }
    }
    
    /**
     * 重新开始游戏
     */
    restart() {
        console.log('🔄 重新开始游戏...');
        
        // 清理场景
        const currentScene = this.sceneManager.getCurrentScene();
        if (currentScene) {
            currentScene.clearEntities();
        }
        
        // 重置 HUD
        this.hud.reset();
        
        // 重新创建玩家
        this.createPlayerWithCharacter({
            id: 'guanyu',
            name: '关羽',
            stats: { health: 120, attack: 18, defense: 8, speed: 180 }
        });
        this.addPlayerToScene();
        
        // 重置敌人生成器
        if (this.enemySpawner) {
            this.enemySpawner.clearAll();
        }
        
        // 重置关卡
        if (this.levelManager) {
            this.levelManager.startLevel(0);
        }
        
        // 重新开始
        this.isRunning = true;
        this.gameState = 'playing';
        this.gameLoop.start();
        
        console.log('✅ 游戏已重新开始');
    }
    
    /**
     * 快速开始游戏（调试用）
     */
    startGameDirectly() {
        console.log('🚀 快速启动游戏...');
        this.gameState = 'playing';
        
        // 创建玩家
        this.createPlayerWithCharacter({
            id: 'guanyu',
            name: '关羽',
            stats: { health: 120, attack: 18, defense: 8, speed: 180 }
        });
        this.addPlayerToScene();
        
        // 启动游戏
        this.startGameInternal();
        
        console.log('✅ 游戏已启动！使用 WASD 移动，J 攻击');
    }
    
    /**
     * 开始游戏内部实现
     */
    startGameInternal() {
        console.log('🎮 开始游戏内部流程...');
        this.executeStartGame();
    }
    
    /**
     * 角色选择后开始游戏（StartScreen 调用）
     */
    onStartGame() {
        console.log('🎮 开始游戏 (onStartGame)');
        this.executeStartGame();
    }
    
    /**
     * 执行游戏启动流程
     */
    executeStartGame() {
        // 设置游戏状态
        this.gameState = 'playing';
        
        // 添加玩家到场景
        if (this.player) {
            this.addPlayerToScene();
        }
        
        // 创建敌人生成器
        if (!this.enemySpawner) {
            this.enemySpawner = new EnemySpawner(this.sceneManager.getCurrentScene());
            this.enemySpawner.addSpawnPoint({ x: 650, y: 400 });
            this.enemySpawner.addSpawnPoint({ x: 750, y: 400 });
            console.log('✅ 敌人生成器已创建');
        }
        
        // 开始第一关
        if (this.levelManager) {
            this.levelManager.startLevel(0);
            console.log('✅ 第 1 关已开始');
        }
        
        // 启动游戏循环
        this.isRunning = true;
        this.gameLoop.start();
        
        console.log('🎉 游戏已开始！');
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
        console.log('🎮 游戏循环已启动');
    }
    
    /**
     * 停止游戏
     */
    stop() {
        this.isRunning = false;
        this.gameLoop.stop();
        console.log('⏹️ 游戏已停止');
    }
}

// 等待 DOM 加载完成
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM 加载完成，创建游戏实例...');
    
    // 创建游戏实例
    window.game = new Game();
    
    // 延迟初始化
    setTimeout(() => {
        console.log('⏰ 开始初始化游戏...');
        window.game.init();
    }, 500);
});

// 导出
window.Game = Game;
