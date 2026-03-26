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
        this.levelManager = null;
        this.comboSystem = null;
        this.characterSelect = null;
        this.startScreen = null;
        
        this.isInitialized = false;
        this.isRunning = false;
        this.gameState = 'start'; // start, select, playing, paused, gameover
    }
    
    /**
     * 初始化游戏
     */
    init() {
        try {
            // 获取 Canvas
            this.canvas = document.getElementById('gameCanvas');
            if (!this.canvas) {
                console.error('Canvas not found!');
                this.hideLoadingScreen();
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
            
            // 初始化连击系统
            this.comboSystem = new ComboSystem(this.hud);
            
            // 初始化关卡管理器
            this.levelManager = new LevelManager(this);
            
            // 初始化角色选择界面
            this.characterSelect = new CharacterSelect(this);
            this.characterSelect.init(this.canvas);
            
            // 初始化开始界面
            this.startScreen = new StartScreen(this);
            this.startScreen.init(this.canvas);
            
            // 创建场景
            this.createScenes();
            
            // 注册游戏循环回调
            this.gameLoop.onUpdate((deltaTime) => this.update(deltaTime));
            this.gameLoop.onRender(() => this.render());
            
            // 设置输入监听
            this.setupInput();
            
            // 隐藏加载屏幕
            this.hideLoadingScreen();
            
            this.isInitialized = true;
            this.gameState = 'start';
            console.log('游戏初始化完成!');
        } catch (e) {
            console.error('游戏初始化失败:', e);
            this.hideLoadingScreen();
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
        }
    }
    
    /**
     * 创建场景
     */
    createScenes() {
        // 主游戏场景
        const mainScene = new Scene('main');
        mainScene.init = () => {
            console.log('进入主游戏场景');
        };
        mainScene.onEnter = () => {
            if (this.player) {
                this.player.reset();
            }
        };
        
        this.sceneManager.registerScene(mainScene);
        this.sceneManager.switchScene('main');
    }
    
    /**
     * 根据选择的角色创建玩家
     * @param {object} character - 角色配置
     */
    createPlayerWithCharacter(character) {
        if (!character) {
            // 默认关羽
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
        
        // 设置角色专属技能
        this.setupCharacterSkills(character.id);
        
        // 初始化物品栏
        this.player.inventory = new Inventory(this.player);
        
        // 给予初始物品
        this.player.inventory.addItem('health_potion', 2);
        this.player.inventory.addItem('mana_potion', 1);
        
        console.log(`创建玩家：${character.name}`);
    }
    
    /**
     * 设置角色专属技能
     * @param {string} characterId
     */
    setupCharacterSkills(characterId) {
        if (!this.player || !this.player.skillManager) return;
        
        // 添加对应角色的专属技能
        switch (characterId) {
            case 'guanyu':
                this.player.skillManager.addSkill(PRESET_SKILLS.GREEN_DRAGON_SLASH);
                break;
            case 'zhangfei':
                this.player.skillManager.addSkill(PRESET_SKILLS.ROAR_CHARGE);
                break;
            case 'zhaoyun':
                this.player.skillManager.addSkill(PRESET_SKILLS.SEVEN_IN_SEVEN_OUT);
                break;
        }
    }
    
    /**
     * 将玩家添加到场景
     */
    addPlayerToScene() {
        if (this.player) {
            const currentScene = this.sceneManager.getCurrentScene();
            if (currentScene) {
                currentScene.addEntity(this.player);
            }
        }
    }
    
    /**
     * 设置输入监听
     */
    setupInput() {
        // 键盘控制
        window.addEventListener('keydown', (e) => {
            // 开始界面按任意键
            if (this.gameState === 'start') {
                this.startGame();
                return;
            }
            
            // 暂停控制
            if (e.code === 'KeyP') {
                this.togglePause();
                return;
            }
            
            // 重新开始
            if (e.code === 'KeyR' && this.hud.gameOver) {
                this.restart();
                return;
            }
            
            // 物品使用
            if (this.gameState === 'playing') {
                if (e.code === 'KeyH') {
                    this.useItem('health_potion');
                } else if (e.code === 'KeyM') {
                    this.useItem('mana_potion');
                } else if (e.code === 'KeyF') {
                    this.useItem('war_god_charm');
                } else if (e.code === 'KeyT') {
                    this.useItem('heaven_book');
                } else if (e.code === 'KeyU') {
                    this.useItem('taiping_art');
                }
            }
        });
    }
    
    /**
     * 使用物品
     * @param {string} itemId
     */
    useItem(itemId) {
        if (!this.player || !this.player.inventory) return;
        
        // 查找物品
        const hasItem = this.player.inventory.hasItem(itemId);
        if (!hasItem) {
            console.log(`没有物品：${itemId}`);
            return;
        }
        
        // 创建物品实例并使用
        let item;
        switch (itemId) {
            case 'health_potion':
                item = new HealthPotion();
                break;
            case 'mana_potion':
                item = new ManaPotion();
                break;
            case 'war_god_charm':
                item = new WarGodCharm();
                break;
            case 'heaven_book':
                item = new HeavenBook();
                break;
            case 'taiping_art':
                item = new TaipingArt();
                break;
        }
        
        if (item) {
            item.use(this.player, 
                this.sceneManager.getCurrentScene(),
                this.enemySpawner
            );
        }
    }
    
    /**
     * 开始游戏
     */
    startGame() {
        console.log('开始游戏');
        this.gameState = 'playing';
        
        // 创建默认玩家（如果没有选择角色）
        if (!this.player) {
            this.createPlayerWithCharacter({
                id: 'guanyu',
                name: '关羽',
                stats: { health: 120, attack: 18, defense: 8, speed: 180 }
            });
            this.addPlayerToScene();
        }
        
        // 创建敌人生成器
        if (!this.enemySpawner) {
            this.enemySpawner = new EnemySpawner(this.sceneManager.getCurrentScene());
            this.enemySpawner.addSpawnPoint({ x: 650, y: 400 });
            this.enemySpawner.addSpawnPoint({ x: 750, y: 400 });
        }
        
        // 开始第一关
        if (this.levelManager) {
            this.levelManager.startLevel(0);
        }
        
        // 启动游戏循环
        this.isRunning = true;
        this.gameLoop.start();
    }
    
    /**
     * 游戏更新
     * @param {number} deltaTime
     */
    update(deltaTime) {
        try {
            // 更新开始界面
            if (this.startScreen && this.gameState === 'start') {
                this.startScreen.update(deltaTime);
                return;
            }
            
            // 更新角色选择
            if (this.characterSelect && this.gameState === 'select') {
                this.characterSelect.update(deltaTime);
                return;
            }
            
            if (!this.isRunning || this.hud.isPaused || this.hud.gameOver) return;
            
            // 更新时间
            this.hud.time += deltaTime;
            
            // 更新连击系统
            if (this.comboSystem) {
                this.comboSystem.update(deltaTime);
            }
            
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
                
                // 检查波次完成
                if (this.levelManager) {
                    this.levelManager.checkWaveComplete();
                    
                    // 检查 BOSS 战
                    const boss = this.enemySpawner.enemies.find(e => e.isBoss);
                    if (boss) {
                        this.levelManager.updateBossPhase(boss);
                        this.levelManager.checkBossDefeated(boss);
                        
                        // 更新 HUD 的 BOSS 血条
                        this.hud.setBossInfo(boss.name, boss.health, boss.maxHealth);
                    }
                }
            }
            
            // 检测碰撞
            this.checkCollisions();
            
            // 更新 HUD
            this.hud.update(deltaTime);
            
            // 检查游戏结束条件
            this.checkGameOver();
        } catch (e) {
            console.error('游戏更新错误:', e);
        }
    }
    
    /**
     * 渲染游戏
     */
    render() {
        // 渲染开始界面
        if (this.startScreen && this.gameState === 'start') {
            this.startScreen.render();
            return;
        }
        
        // 渲染角色选择
        if (this.characterSelect && this.gameState === 'select') {
            this.characterSelect.render();
            return;
        }
        
        // 清空画布
        this.ctx.fillStyle = '#0f0f23';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制背景
        this.renderBackground();
        
        // 绘制地面
        this.renderGround();
        
        // 渲染场景
        this.sceneManager.render();
        
        // 渲染 HUD
        this.hud.render();
        
        // 显示 FPS
        this.renderFPS();
    }
    
    /**
     * 渲染背景
     */
    renderBackground() {
        // 根据当前关卡设置背景颜色
        let color1 = '#1a1a3e';
        let color2 = '#0f0f23';
        
        if (this.levelManager && this.levelManager.levelData) {
            const bg = this.levelManager.levelData.background;
            if (bg) {
                color1 = bg.color1;
                color2 = bg.color2;
            }
        }
        
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    /**
     * 渲染地面
     */
    renderGround() {
        let groundColor = '#2c3e50';
        let decorColor = '#34495e';
        
        if (this.levelManager && this.levelManager.levelData) {
            const bg = this.levelManager.levelData.background;
            if (bg) {
                groundColor = bg.groundColor || groundColor;
            }
        }
        
        this.ctx.fillStyle = groundColor;
        this.ctx.fillRect(0, 520, this.canvas.width, 80);
        
        // 地面装饰
        this.ctx.fillStyle = decorColor;
        for (let i = 0; i < this.canvas.width; i += 50) {
            this.ctx.fillRect(i, 520, 40, 10);
        }
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
                    // 检查是否无敌
                    if (!enemy.isInvincible) {
                        enemy.takeDamage(this.player.attack);
                        
                        // 添加连击
                        if (this.comboSystem) {
                            this.comboSystem.addHit(this.player.attack);
                        }
                    }
                }
            });
        }
        
        // 敌人攻击检测
        enemies.forEach(enemy => {
            if (enemy.attackBox.active) {
                if (this.checkCollision(enemy.attackBox, this.player.getHitbox())) {
                    // 检查玩家是否无敌
                    if (!this.player.isInvincible) {
                        this.player.takeDamage(enemy.attack);
                        
                        // 重置连击
                        if (this.comboSystem) {
                            this.comboSystem.reset();
                        }
                        
                        if (this.player.isDead) {
                            this.hud.showMessage('你被击败了!', '#e74c3c');
                        }
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
            this.gameState = 'gameover';
        }
    }
    
    /**
     * 切换暂停状态
     */
    togglePause() {
        if (!this.isInitialized || this.hud.gameOver || this.gameState !== 'playing') return;
        
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
        // 清理场景
        const currentScene = this.sceneManager.getCurrentScene();
        if (currentScene) {
            currentScene.clearEntities();
        }
        
        // 重置 HUD
        this.hud.reset();
        
        // 重置连击系统
        if (this.comboSystem) {
            this.comboSystem.resetSystem();
        }
        
        // 重新创建玩家
        if (this.player) {
            this.player.reset();
        }
        
        // 重置敌人生成器
        if (this.enemySpawner) {
            this.enemySpawner.clearAll();
        }
        
        // 重置关卡管理器
        if (this.levelManager) {
            this.levelManager.reset();
        }
        
        // 重新开始
        this.isRunning = true;
        this.gameState = 'playing';
        this.gameLoop.start();
        
        // 开始第一关
        if (this.levelManager) {
            this.levelManager.startLevel(0);
        }
        
        console.log('游戏重新开始!');
    }
    
    /**
     * 启动游戏
     */
    start() {
        if (!this.isInitialized) {
            this.init();
        }
        
        // 显示开始界面
        this.gameState = 'start';
        console.log('游戏启动，显示开始界面!');
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

// ============ 开始界面 ============

/**
 * 开始界面
 */
class StartScreen {
    constructor(game) {
        this.game = game;
        this.canvas = null;
        this.ctx = null;
        this.titleY = 0;
        this.titleTargetY = 150;
        this.blinkTimer = 0;
        this.showPressStart = true;
    }
    
    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }
    
    update(deltaTime) {
        // 标题下落动画
        if (this.titleY < this.titleTargetY) {
            this.titleY += (this.titleTargetY - this.titleY) * 0.05;
        }
        
        // 闪烁效果
        this.blinkTimer += deltaTime;
        if (this.blinkTimer > 500) {
            this.showPressStart = !this.showPressStart;
            this.blinkTimer = 0;
        }
    }
    
    render() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // 背景渐变
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#1a1a3e');
        gradient.addColorStop(0.5, '#2d2d5a');
        gradient.addColorStop(1, '#0f0f23');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // 绘制装饰性云纹
        this.renderCloudPatterns(ctx, width, height);
        
        // 游戏标题
        ctx.save();
        ctx.translate(0, this.titleY);
        
        // 标题阴影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.font = 'bold 72px "Press Start 2P", Arial';
        ctx.textAlign = 'center';
        ctx.fillText('三国战记', width / 2 + 4, 104);
        
        // 标题主体（金色渐变）
        const titleGradient = ctx.createLinearGradient(0, 60, 0, 140);
        titleGradient.addColorStop(0, '#ffd700');
        titleGradient.addColorStop(0.5, '#f39c12');
        titleGradient.addColorStop(1, '#e67e22');
        
        ctx.fillStyle = titleGradient;
        ctx.shadowColor = '#f39c12';
        ctx.shadowBlur = 20;
        ctx.fillText('三国战记', width / 2, 100);
        ctx.shadowBlur = 0;
        
        // 副标题
        ctx.fillStyle = '#fff';
        ctx.font = '24px Arial';
        ctx.fillText('KNIGHTS OF VALOR', width / 2, 150);
        
        ctx.restore();
        
        // 装饰边框
        this.renderBorder(ctx, width, height);
        
        // "按任意键开始" 闪烁
        if (this.showPressStart) {
            ctx.fillStyle = '#f39c12';
            ctx.font = 'bold 20px "Press Start 2P", Arial';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#f39c12';
            ctx.shadowBlur = 10;
            ctx.fillText('PRESS ANY KEY', width / 2, height - 100);
            ctx.shadowBlur = 0;
        }
        
        // 版权信息
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('© 2024 Three Kingdoms Game', width / 2, height - 40);
    }
    
    renderCloudPatterns(ctx, width, height) {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        
        // 绘制传统云纹
        for (let i = 0; i < 5; i++) {
            const x = (i * 200 + Date.now() / 50) % (width + 200) - 100;
            const y = 100 + i * 80;
            
            ctx.beginPath();
            ctx.arc(x, y, 60, 0, Math.PI * 2);
            ctx.arc(x + 50, y - 20, 50, 0, Math.PI * 2);
            ctx.arc(x + 100, y, 60, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    renderBorder(ctx, width, height) {
        ctx.strokeStyle = '#f39c12';
        ctx.lineWidth = 4;
        ctx.strokeRect(20, 20, width - 40, height - 40);
        
        // 角落装饰
        const cornerSize = 30;
        const corners = [
            [20, 20],
            [width - 20 - cornerSize, 20],
            [20, height - 20 - cornerSize],
            [width - 20 - cornerSize, height - 20 - cornerSize]
        ];
        
        ctx.fillStyle = '#f39c12';
        corners.forEach(([x, y]) => {
            ctx.fillRect(x, y, cornerSize, cornerSize);
        });
    }
}

// ============ 角色选择界面 ============

/**
 * 角色选择界面
 */
class CharacterSelect {
    constructor(game) {
        this.game = game;
        this.canvas = null;
        this.ctx = null;
        this.selectedIndex = 0;
        this.characters = [];
        this.animationTimer = 0;
        this.selectedCharacter = null;
    }
    
    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // 初始化角色列表
        this.characters = [
            {
                id: 'guanyu',
                name: '关羽',
                weapon: '青龙偃月刀',
                color: '#c41e3a',
                stats: { health: 120, attack: 18, defense: 8, speed: 180 },
                desc: '武圣关羽，攻击力高，血量大'
            },
            {
                id: 'zhangfei',
                name: '张飞',
                weapon: '蛇矛',
                color: '#1a1a2e',
                stats: { health: 150, attack: 20, defense: 10, speed: 160 },
                desc: '猛张飞，血量最高，防御力强'
            },
            {
                id: 'zhaoyun',
                name: '赵云',
                weapon: '长枪',
                color: '#f8f8ff',
                stats: { health: 100, attack: 16, defense: 6, speed: 220 },
                desc: '常胜赵云，速度最快，灵活多变'
            }
        ];
    }
    
    update(deltaTime) {
        this.animationTimer += deltaTime;
        
        // 键盘选择
        if (window.defaultInput) {
            if (window.defaultInput.isAnyPressed({ left: true })) {
                this.selectedIndex = (this.selectedIndex - 1 + this.characters.length) % this.characters.length;
                window.defaultInput.clearAll();
            }
            if (window.defaultInput.isAnyPressed({ right: true })) {
                this.selectedIndex = (this.selectedIndex + 1) % this.characters.length;
                window.defaultInput.clearAll();
            }
            if (window.defaultInput.isAnyPressed({ attack: true })) {
                this.selectCharacter();
                window.defaultInput.clearAll();
            }
        }
    }
    
    selectCharacter() {
        this.selectedCharacter = this.characters[this.selectedIndex];
        this.game.createPlayerWithCharacter(this.selectedCharacter);
        this.game.addPlayerToScene();
        this.game.startGame();
    }
    
    render() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // 背景
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#1a1a3e');
        gradient.addColorStop(1, '#0f0f23');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // 标题
        ctx.fillStyle = '#f39c12';
        ctx.font = 'bold 36px "Press Start 2P", Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#f39c12';
        ctx.shadowBlur = 10;
        ctx.fillText('SELECT YOUR HERO', width / 2, 60);
        ctx.shadowBlur = 0;
        
        // 角色卡片
        const cardWidth = 200;
        const cardHeight = 320;
        const cardY = 120;
        const gap = 40;
        const totalWidth = cardWidth * 3 + gap * 2;
        const startX = (width - totalWidth) / 2;
        
        this.characters.forEach((char, index) => {
            const x = startX + index * (cardWidth + gap);
            const isSelected = index === this.selectedIndex;
            this.renderCharacterCard(ctx, x, cardY, cardWidth, cardHeight, char, isSelected);
        });
        
        // 操作提示
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('← → 选择角色  |  攻击键 确认', width / 2, height - 80);
    }
    
    renderCharacterCard(ctx, x, y, width, height, char, isSelected) {
        // 卡片背景
        ctx.fillStyle = isSelected ? 'rgba(243, 156, 18, 0.2)' : 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(x, y, width, height);
        
        // 边框
        ctx.strokeStyle = isSelected ? '#f39c12' : '#666';
        ctx.lineWidth = isSelected ? 4 : 2;
        ctx.strokeRect(x, y, width, height);
        
        // 选择效果（脉冲）
        if (isSelected) {
            const pulseSize = Math.sin(this.animationTimer / 200) * 5;
            ctx.strokeStyle = `rgba(243, 156, 18, ${0.5 + Math.sin(this.animationTimer / 200) * 0.3})`;
            ctx.lineWidth = 2;
            ctx.strokeRect(x - 5 + pulseSize, y - 5 + pulseSize, width + 10 - pulseSize * 2, height + 10 - pulseSize * 2);
        }
        
        // 角色名称
        ctx.fillStyle = char.color;
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(char.name, x + width / 2, y + 30);
        
        // 角色预览（简化绘制）
        this.renderCharacterPreview(ctx, x + width / 2, y + 90, char);
        
        // 武器名称
        ctx.fillStyle = '#aaa';
        ctx.font = '14px Arial';
        ctx.fillText(char.weapon, x + width / 2, y + 160);
        
        // 属性
        const statsY = y + 190;
        ctx.font = '12px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.fillText(`HP: ${char.stats.health}`, x + 20, statsY);
        ctx.fillText(`ATK: ${char.stats.attack}`, x + 20, statsY + 20);
        ctx.fillText(`DEF: ${char.stats.defense}`, x + 20, statsY + 40);
        ctx.fillText(`SPD: ${char.stats.speed}`, x + 20, statsY + 60);
        
        // 描述
        ctx.fillStyle = '#888';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(char.desc, x + width / 2, y + height - 20);
    }
    
    renderCharacterPreview(ctx, cx, cy, char) {
        // 简化的角色预览图
        ctx.save();
        
        // 身体
        ctx.fillStyle = char.color;
        ctx.fillRect(cx - 20, cy - 30, 40, 50);
        
        // 头部
        ctx.fillStyle = '#f5d0b0';
        ctx.beginPath();
        ctx.arc(cx, cy - 40, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // 头发
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(cx, cy - 43, 16, Math.PI, 0);
        ctx.fill();
        
        // 武器
        ctx.fillStyle = '#888';
        if (char.id === 'guanyu') {
            // 青龙刀
            ctx.fillRect(cx + 15, cy - 40, 6, 50);
        } else if (char.id === 'zhangfei') {
            // 蛇矛
            ctx.fillRect(cx + 15, cy - 40, 4, 45);
        } else {
            // 长枪
            ctx.fillRect(cx + 15, cy - 50, 4, 60);
        }
        
        ctx.restore();
    }
}

// ============ 连击系统 ============

/**
 * 连击系统
 */
class ComboSystem {
    constructor(hud) {
        this.hud = hud;
        this.combo = 0;
        this.maxCombo = 0;
        this.timer = 0;
        this.timeout = 2; // 秒
        this.totalDamage = 0;
    }
    
    update(deltaTime) {
        if (this.combo > 0) {
            this.timer -= deltaTime;
            if (this.timer <= 0) {
                this.reset();
            }
        }
    }
    
    addHit(damage) {
        this.combo++;
        this.timer = this.timeout;
        this.totalDamage += damage;
        
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }
        
        // 更新 HUD
        if (this.hud) {
            this.hud.combo = this.combo;
            this.hud.maxCombo = this.maxCombo;
            this.hud.comboTimer = this.timer;
        }
    }
    
    reset() {
        this.combo = 0;
        this.timer = 0;
        this.totalDamage = 0;
        
        if (this.hud) {
            this.hud.combo = 0;
            this.hud.comboTimer = 0;
        }
    }
    
    resetSystem() {
        this.combo = 0;
        this.maxCombo = 0;
        this.timer = 0;
        this.totalDamage = 0;
    }
}

// ============ 关卡管理器 ============

/**
 * 关卡管理器
 */
class LevelManager {
    constructor(game) {
        this.game = game;
        this.currentLevel = 0;
        this.currentWave = 0;
        this.levelData = null;
        this.isBossFight = false;
    }
    
    reset() {
        this.currentLevel = 0;
        this.currentWave = 0;
        this.isBossFight = false;
    }
    
    startLevel(levelIndex) {
        this.currentLevel = levelIndex;
        this.currentWave = 0;
        this.levelData = this.getLevelData(levelIndex);
        
        if (this.game.hud) {
            this.game.hud.level = levelIndex + 1;
        }
        
        // 显示关卡信息
        if (this.game.hud) {
            this.game.hud.showMessage(`第 ${levelIndex + 1} 关`, '#f39c12');
        }
        
        // 开始第一波敌人
        this.startNextWave();
    }
    
    getLevelData(levelIndex) {
        const levels = [
            {
                name: '第一关 - 黄巾贼寇',
                background: {
                    color1: '#1a1a3e',
                    color2: '#0f0f23',
                    groundColor: '#2c3e50'
                },
                waves: [
                    { count: 3, type: 'SOLDIER', delay: 0 },
                    { count: 4, type: 'SOLDIER', delay: 2000 },
                    { count: 2, type: 'ARCHER', delay: 4000 }
                ],
                boss: null
            },
            {
                name: '第二关 - 吕布来袭',
                background: {
                    color1: '#2a1a1a',
                    color2: '#1a0f0f',
                    groundColor: '#3a2a2a'
                },
                waves: [
                    { count: 4, type: 'SOLDIER', delay: 0 },
                    { count: 3, type: 'ARCHER', delay: 3000 }
                ],
                boss: { type: 'LUBU', name: '吕布' }
            }
        ];
        
        return levels[levelIndex % levels.length];
    }
    
    startNextWave() {
        if (!this.levelData || !this.game.enemySpawner) return;
        
        if (this.currentWave >= this.levelData.waves.length) {
            // 所有波次完成，生成 BOSS
            if (this.levelData.boss) {
                this.startBossFight();
            } else {
                // 关卡完成
                this.completeLevel();
            }
            return;
        }
        
        const wave = this.levelData.waves[this.currentWave];
        
        setTimeout(() => {
            if (this.game.enemySpawner) {
                this.game.enemySpawner.spawnWave(wave.count, {
                    type: wave.type,
                    maxHealth: 50 + this.currentLevel * 10,
                    attack: 8 + this.currentLevel * 2
                });
            }
        }, wave.delay);
        
        this.currentWave++;
    }
    
    checkWaveComplete() {
        if (!this.game.enemySpawner) return;
        
        const aliveEnemies = this.game.enemySpawner.getAliveEnemies();
        const hasBoss = aliveEnemies.some(e => e.isBoss);
        
        if (aliveEnemies.length === 0 && !hasBoss) {
            setTimeout(() => {
                this.startNextWave();
            }, 2000);
        }
    }
    
    startBossFight() {
        this.isBossFight = true;
        
        if (this.game.hud) {
            this.game.hud.showMessage('BOSS 登场!', '#e74c3c');
        }
        
        setTimeout(() => {
            if (this.game.enemySpawner && this.levelData.boss) {
                this.game.enemySpawner.spawnBoss(this.levelData.boss.type);
            }
        }, 1500);
    }
    
    updateBossPhase(boss) {
        // 可以根据 BOSS 血量更新阶段
        const healthPercent = boss.health / boss.maxHealth;
        
        if (healthPercent < 0.3 && !boss.enraged) {
            boss.enraged = true;
            boss.attack *= 1.5;
            boss.speed *= 1.3;
            
            if (this.game.hud) {
                this.game.hud.showMessage('BOSS 狂暴了!', '#e74c3c');
            }
        }
    }
    
    checkBossDefeated(boss) {
        if (boss.isDead && this.isBossFight) {
            this.completeLevel();
        }
    }
    
    completeLevel() {
        if (this.game.hud) {
            this.game.hud.showMessage('关卡完成!', '#2ecc71');
            this.game.hud.setGameOver(true);
        }
        
        this.game.isRunning = false;
        this.game.gameState = 'gameover';
        
        // 下一关
        setTimeout(() => {
            this.startLevel(this.currentLevel + 1);
        }, 3000);
    }
}

// ============ 物品系统 ============

/**
 * 物品基类
 */
class Item {
    constructor(name, description) {
        this.name = name;
        this.description = description;
    }
    
    use(player, scene, spawner) {
        // 子类实现
    }
}

class HealthPotion extends Item {
    constructor() {
        super('血瓶', '恢复 50 点生命值');
    }
    
    use(player) {
        player.heal(50);
        console.log('使用血瓶，恢复 50 点生命');
    }
}

class ManaPotion extends Item {
    constructor() {
        super('魔瓶', '恢复 30 点法力值');
    }
    
    use(player) {
        player.restoreMana(30);
        console.log('使用魔瓶，恢复 30 点法力');
    }
}

class WarGodCharm extends Item {
    constructor() {
        super('战神符', '30 秒内攻击力翻倍');
    }
    
    use(player) {
        const originalAttack = player.attack;
        player.attack *= 2;
        console.log('使用战神符，攻击力翻倍!');
        
        setTimeout(() => {
            player.attack = originalAttack;
            console.log('战神符效果结束');
        }, 30000);
    }
}

class HeavenBook extends Item {
    constructor() {
        super('天书', '全屏攻击所有敌人');
    }
    
    use(player, scene, spawner) {
        if (spawner) {
            const enemies = spawner.getAliveEnemies();
            enemies.forEach(enemy => {
                enemy.takeDamage(100);
            });
            console.log('使用天书，全屏攻击!');
        }
    }
}

class TaipingArt extends Item {
    constructor() {
        super('太平要术', '召唤援军');
    }
    
    use(player, scene, spawner) {
        console.log('使用太平要术，召唤援军!');
        // 可以添加友军单位
    }
}

/**
 * 物品栏
 */
class Inventory {
    constructor(player) {
        this.player = player;
        this.items = new Map();
    }
    
    addItem(itemId, count = 1) {
        const current = this.items.get(itemId) || 0;
        this.items.set(itemId, current + count);
    }
    
    removeItem(itemId, count = 1) {
        if (this.items.has(itemId)) {
            const current = this.items.get(itemId);
            if (current <= count) {
                this.items.delete(itemId);
            } else {
                this.items.set(itemId, current - count);
            }
        }
    }
    
    hasItem(itemId) {
        return this.items.has(itemId) && this.items.get(itemId) > 0;
    }
    
    getCount(itemId) {
        return this.items.get(itemId) || 0;
    }
}

// 导出额外类
window.StartScreen = StartScreen;
window.CharacterSelect = CharacterSelect;
window.ComboSystem = ComboSystem;
window.LevelManager = LevelManager;
window.Item = Item;
window.HealthPotion = HealthPotion;
window.ManaPotion = ManaPotion;
window.WarGodCharm = WarGodCharm;
window.HeavenBook = HeavenBook;
window.TaipingArt = TaipingArt;
window.Inventory = Inventory;
