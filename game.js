/**
 * game.js - 游戏主入口（性能优化版）
 * 优化项：
 * - 使用 requestAnimationFrame 优化渲染
 * - 减少不必要的 Canvas 重绘
 * - 移除 console.log（保留关键错误日志）
 * - 优化对象创建和数组操作
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
        this.gameState = 'loading';
        
        // 性能优化：缓存常用对象
        this._cachedDirection = { left: false, right: false, up: false, down: false };
        this._cachedInput = { left: false, right: false, up: false, down: false, attack: false, skill: false, jump: false };
        this._lastRenderTime = 0;
        this._renderSkipCount = 0;
        this._targetFPS = 60;
        this._minFrameTime = 1000 / this._targetFPS;
    }
    
    /**
     * 初始化游戏
     */
    init() {
        try {
            this.canvas = document.getElementById('gameCanvas');
            if (!this.canvas) {
                throw new Error('Canvas not found!');
            }
            this.ctx = this.canvas.getContext('2d');
            
            // 优化：启用 Canvas 性能优化
            this.ctx.imageSmoothingEnabled = true;
            this.ctx.imageSmoothingQuality = 'medium';
            
            this.gameLoop = new GameLoop();
            this.sceneManager = new SceneManager();
            this.sceneManager.init(this.canvas);
            this.hud = new HUD();
            this.hud.init(this.canvas);
            this.comboSystem = new ComboSystem(this.hud);
            this.levelManager = new LevelManager(this);
            this.characterSelect = new CharacterSelect(this);
            this.characterSelect.init(this.canvas);
            this.startScreen = new StartScreen(this);
            this.startScreen.init(this.canvas);
            
            // 初始化新手引导
            this.tutorial = new Tutorial(this);
            this.tutorial.init(this.canvas);
            
            this.createScenes();
            this.gameLoop.onUpdate((deltaTime) => this.update(deltaTime));
            this.gameLoop.onRender(() => this.render());
            this.setupInput();
            this.hideLoadingScreen();
            
            this.gameState = 'start';
            this.startScreen.show();
            this.isInitialized = true;
            
            if (window.DebugTools) {
                new DebugTools(this);
            }
            
        } catch (e) {
            console.error('游戏初始化失败:', e);
            this.hideLoadingScreen();
            this.showError('游戏初始化失败：' + e.message);
            throw e;
        }
    }
    
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
    }
    
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
        errorDiv.innerHTML = `<h2>错误</h2><p>${message}</p><p style="font-size:14px;margin-top:10px;">按 F12 查看控制台详情</p>`;
        document.getElementById('gameContainer').appendChild(errorDiv);
    }
    
    createScenes() {
        const mainScene = new Scene('main');
        mainScene.onEnter = () => {
            if (this.player) {
                this.player.reset();
            }
        };
        
        this.sceneManager.registerScene(mainScene);
        this.sceneManager.switchScene('main');
    }
    
    createPlayerWithCharacter(character) {
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
    }
    
    addPlayerToScene() {
        if (this.player) {
            const currentScene = this.sceneManager.getCurrentScene();
            if (currentScene) {
                currentScene.addEntity(this.player);
            }
        }
    }
    
    setupInput() {
        window.addEventListener('keydown', (e) => {
            if (this.gameState === 'start') {
                if (e.code === 'Space' || e.code === 'Enter') {
                    this.startScreen.handleInput(e);
                }
                return;
            }
            
            if (this.gameState === 'select') {
                if (this.characterSelect) {
                    this.characterSelect.handleInput && this.characterSelect.handleInput(e);
                }
                return;
            }
            
            if (this.gameState === 'playing') {
                // 按键反馈
                if (this.hud && this.player) {
                    const playerX = this.player.x + this.player.width / 2;
                    const playerY = this.player.y;
                    
                    if (e.code === 'KeyJ') {
                        this.hud.showKeyFeedback('J', playerX - 50, playerY - 30);
                    } else if (e.code === 'KeyK') {
                        this.hud.showKeyFeedback('K', playerX + 50, playerY - 30);
                    }
                }
                
                if (e.code === 'KeyP') {
                    this.togglePause();
                }
                if (e.code === 'KeyR' && this.hud.gameOver) {
                    this.restart();
                }
            }
        });
    }
    
    update(deltaTime) {
        if (!this.isRunning || this.hud.isPaused || this.hud.gameOver) return;
        
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
    }
    
    updatePlaying(deltaTime) {
        this.hud.time += deltaTime;
        
        // 更新新手引导
        if (this.tutorial && this.tutorial.isActive) {
            this.tutorial.update(deltaTime);
        }
        
        // 优化：复用输入对象，减少 GC
        const direction = window.getDirection ? window.getDirection() : this._cachedDirection;
        this._cachedInput.left = direction.left;
        this._cachedInput.right = direction.right;
        this._cachedInput.up = direction.up;
        this._cachedInput.down = direction.down;
        this._cachedInput.attack = window.isAttacking ? window.isAttacking() : false;
        this._cachedInput.skill = window.isUsingSkill ? window.isUsingSkill() : false;
        this._cachedInput.jump = window.defaultInput && window.CONTROLS ? window.defaultInput.isAnyPressed(window.CONTROLS.JUMP) : false;
        
        if (this.player && !this.player.isDead) {
            this.player.update(deltaTime, this._cachedInput);
            this.hud.setPlayerHealth(this.player.health, this.player.maxHealth);
            this.hud.setPlayerMana(this.player.mana, this.player.maxMana);
            if (this.player.skillManager) {
                this.hud.updateSkillCooldowns(this.player.skillManager.getAllSkills());
            }
        }
        
        if (this.enemySpawner) {
            this.enemySpawner.update(deltaTime, this.player);
            
            // 第一个敌人出现时显示攻击提示
            if (this.tutorial && this.tutorial.isActive && !this.tutorial.hasShownAttackHint) {
                const enemies = this.enemySpawner.getAliveEnemies();
                if (enemies && enemies.length > 0) {
                    this.tutorial.showAttackHint();
                }
            }
        }
        
        if (this.levelManager) {
            this.levelManager.update(deltaTime);
        }
        
        this.checkCollisions();
        this.hud.update(deltaTime);
        if (this.comboSystem) {
            this.comboSystem.update(deltaTime);
        }
        
        this.checkGameOver();
    }
    
    render() {
        try {
            // 优化：跳帧渲染（性能不足时）
            const now = performance.now();
            if (now - this._lastRenderTime < this._minFrameTime) {
                this._renderSkipCount++;
                if (this._renderSkipCount < 3) return; // 最多跳过 2 帧
            }
            this._lastRenderTime = now;
            this._renderSkipCount = 0;
            
            // 优化：使用 clearRect 替代 fillRect 清空
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // 优化：批量绘制背景
            this._renderBackground();
            
            switch (this.gameState) {
                case 'start':
                    this.renderStartScreen();
                    break;
                case 'select':
                    this.sceneManager.render();
                    if (this.characterSelect) this.characterSelect.render();
                    if (this.hud) this.hud.render();
                    break;
                case 'playing':
                    this.renderGameScene();
                    // 渲染新手引导
                    if (this.tutorial && this.tutorial.isActive) {
                        this.tutorial.render();
                    }
                    break;
                case 'gameover':
                    this.renderGameScene();
                    this.renderGameOver();
                    break;
            }
            
            // 显示 FPS（优化：减少绘制调用）
            if (this.gameLoop) {
                this.ctx.fillStyle = '#fff';
                this.ctx.font = '12px Arial';
                this.ctx.textAlign = 'left';
                this.ctx.fillText(`FPS: ${this.gameLoop.getFPS()}`, 10, this.canvas.height - 10);
            }
        } catch (e) {
            console.error('渲染错误:', e);
        }
    }
    
    _renderBackground() {
        // 优化：使用预渲染的背景缓存
        if (!this._bgGradient) {
            this._bgGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
            this._bgGradient.addColorStop(0, '#1a1a3e');
            this._bgGradient.addColorStop(1, '#0f0f23');
        }
        this.ctx.fillStyle = this._bgGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制地面
        if (!this._groundColor) {
            this._groundColor = '#2c3e50';
        }
        this.ctx.fillStyle = this._groundColor;
        this.ctx.fillRect(0, 520, this.canvas.width, 80);
    }
    
    renderStartScreen() {
        if (this.startScreen) {
            this.startScreen.render();
        }
    }
    
    renderGameScene() {
        this.sceneManager.render();
        if (this.hud) {
            this.hud.render();
        }
    }
    
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
    
    checkCollisions() {
        if (!this.player || this.player.isDead) return;
        
        const enemies = this.enemySpawner ? this.enemySpawner.getAliveEnemies() : [];
        const len = enemies.length;
        
        // 优化：使用局部变量减少属性访问
        const playerAttackBox = this.player.attackBox;
        const playerHitbox = this.player.getHitbox();
        
        // 玩家攻击检测
        if (playerAttackBox && playerAttackBox.active) {
            for (let i = 0; i < len; i++) {
                const enemy = enemies[i];
                if (this._checkCollision(playerAttackBox, enemy.getHitbox())) {
                    enemy.takeDamage(this.player.attack);
                    this.hud.addScore(10);
                    if (this.comboSystem) {
                        this.comboSystem.addCombo();
                        // 显示连击弹出数字
                        const combo = this.comboSystem.combo;
                        if (combo > 1 && this.hud) {
                            const enemyX = enemy.x + enemy.width / 2;
                            const enemyY = enemy.y;
                            this.hud.showComboPopup(combo, enemyX, enemyY);
                        }
                    }
                }
            }
        }
        
        // 敌人攻击检测
        for (let i = 0; i < len; i++) {
            const enemy = enemies[i];
            if (enemy.attackBox && enemy.attackBox.active) {
                if (this._checkCollision(enemy.attackBox, playerHitbox)) {
                    this.player.takeDamage(enemy.attack);
                    if (this.comboSystem) this.comboSystem.resetCombo();
                    
                    // 受击屏幕震动
                    if (this.hud) {
                        this.hud.triggerShake(15, 0.4);
                    }
                    
                    if (this.player.isDead) {
                        this.hud.showMessage('你被击败了!', '#e74c3c');
                    }
                }
            }
        }
    }
    
    _checkCollision(box1, box2) {
        return box1.x < box2.x + box2.width &&
               box1.x + box1.width > box2.x &&
               box1.y < box2.y + box2.height &&
               box1.y + box1.height > box2.y;
    }
    
    checkGameOver() {
        if (this.player && this.player.isDead) {
            this.hud.setGameOver(true);
            this.gameState = 'gameover';
            this.isRunning = false;
        }
    }
    
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
    
    restart() {
        const currentScene = this.sceneManager.getCurrentScene();
        if (currentScene) {
            currentScene.clearEntities();
        }
        
        this.hud.reset();
        
        this.createPlayerWithCharacter({
            id: 'guanyu',
            name: '关羽',
            stats: { health: 120, attack: 18, defense: 8, speed: 180 }
        });
        this.addPlayerToScene();
        
        if (this.enemySpawner) {
            this.enemySpawner.clearAll();
        }
        
        if (this.levelManager) {
            this.levelManager.startLevel(0);
        }
        
        this.isRunning = true;
        this.gameState = 'playing';
        this.gameLoop.start();
    }
    
    startGameDirectly() {
        this.gameState = 'playing';
        
        this.createPlayerWithCharacter({
            id: 'guanyu',
            name: '关羽',
            stats: { health: 120, attack: 18, defense: 8, speed: 180 }
        });
        this.addPlayerToScene();
        
        this.startGameInternal();
    }
    
    startGameInternal() {
        this.executeStartGame();
    }
    
    onStartGame() {
        this.executeStartGame();
    }
    
    executeStartGame() {
        this.gameState = 'playing';
        
        if (this.player) {
            this.addPlayerToScene();
        }
        
        if (!this.enemySpawner) {
            this.enemySpawner = new EnemySpawner(this.sceneManager.getCurrentScene());
            this.enemySpawner.addSpawnPoint({ x: 650, y: 400 });
            this.enemySpawner.addSpawnPoint({ x: 750, y: 400 });
        }
        
        if (this.levelManager) {
            this.levelManager.startLevel(0);
        }
        
        this.isRunning = true;
        this.gameLoop.start();
        
        // 启动新手引导
        if (this.tutorial) {
            this.tutorial.start();
        }
    }
    
    start() {
        if (!this.isInitialized) {
            this.init();
        }
        
        this.isRunning = true;
        this.gameLoop.start();
    }
    
    stop() {
        this.isRunning = false;
        this.gameLoop.stop();
    }
}

// 优化：使用 DOMContentLoaded 一次绑定
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
    
    // 优化：减少延迟时间
    setTimeout(() => {
        window.game.init();
    }, 200);
});

window.Game = Game;
