/**
 * LevelManager.js - 关卡管理系统
 * 负责管理游戏关卡、敌人配置、BOSS 战和关卡进度
 */

class LevelManager {
    constructor(game) {
        this.game = game;
        this.currentLevel = 0;
        this.levels = [];
        this.isLevelActive = false;
        this.waveIndex = 0;
        this.isBossWave = false;
        this.levelData = null;
        
        this.initLevels();
    }
    
    /**
     * 初始化所有关卡数据
     */
    initLevels() {
        // 第 1 关：涿郡之战（教学关）
        this.levels.push({
            id: 1,
            name: '涿郡之战',
            subtitle: '讨伐黄巾军',
            background: {
                color1: '#8B4513',
                color2: '#A0522D',
                groundColor: '#654321'
            },
            waves: [
                {
                    enemies: [
                        { type: 'soldier', name: '黄巾士兵', count: 3, hp: 50, attack: 8 }
                    ],
                    delay: 2000
                },
                {
                    enemies: [
                        { type: 'soldier', name: '黄巾士兵', count: 2, hp: 50, attack: 8 },
                        { type: 'archer', name: '黄巾弓箭手', count: 1, hp: 40, attack: 12 }
                    ],
                    delay: 2000
                },
                {
                    enemies: [
                        { type: 'soldier', name: '黄巾士兵', count: 5, hp: 50, attack: 8 }
                    ],
                    delay: 2000
                }
            ],
            boss: {
                name: '张飞',
                type: 'boss_zhangfei',
                hp: 300,
                attack: 25,
                defense: 10,
                speed: 180,
                skills: ['charge', 'roar', 'spear_attack']
            },
            drops: [
                { item: 'health_potion', count: 2 },
                { item: 'mana_potion', count: 1 }
            ]
        });
        
        // 第 2 关：虎牢关（对战吕布）
        this.levels.push({
            id: 2,
            name: '虎牢关',
            subtitle: '三英战吕布',
            background: {
                color1: '#4A5D7F',
                color2: '#2C3E50',
                groundColor: '#34495E'
            },
            waves: [
                {
                    enemies: [
                        { type: 'soldier', name: '董卓士兵', count: 4, hp: 60, attack: 10 }
                    ],
                    delay: 2000
                },
                {
                    enemies: [
                        { type: 'soldier', name: '董卓士兵', count: 3, hp: 60, attack: 10 },
                        { type: 'elite', name: '精英护卫', count: 2, hp: 80, attack: 15 }
                    ],
                    delay: 2000
                },
                {
                    enemies: [
                        { type: 'elite', name: '精英护卫', count: 2, hp: 80, attack: 15 },
                        { type: 'archer', name: '弓箭手', count: 3, hp: 50, attack: 14 }
                    ],
                    delay: 2000
                }
            ],
            boss: {
                name: '吕布',
                type: 'boss_lvbu',
                hp: 500,
                attack: 40,
                defense: 15,
                speed: 160,
                skills: ['halberd_sweep', 'wushuang_rage', 'god_form']
            },
            drops: [
                { item: 'war_god_charm', count: 1 },
                { item: 'heaven_book', count: 1 }
            ]
        });
        
        // 第 3 关：赤壁之战（最终关）
        this.levels.push({
            id: 3,
            name: '赤壁之战',
            subtitle: '决战曹操',
            background: {
                color1: '#1a0a0a',
                color2: '#3d1f1f',
                groundColor: '#2d1b1b'
            },
            waves: [
                {
                    enemies: [
                        { type: 'soldier', name: '曹军士兵', count: 5, hp: 70, attack: 12 }
                    ],
                    delay: 2000
                },
                {
                    enemies: [
                        { type: 'soldier', name: '曹军士兵', count: 4, hp: 70, attack: 12 },
                        { type: 'archer', name: '弓箭手', count: 3, hp: 55, attack: 16 }
                    ],
                    delay: 2000
                },
                {
                    enemies: [
                        { type: 'elite', name: '精英护卫', count: 2, hp: 90, attack: 18 },
                        { type: 'archer', name: '弓箭手', count: 4, hp: 55, attack: 16 },
                        { type: 'fire', name: '火攻手', count: 2, hp: 45, attack: 20 }
                    ],
                    delay: 2000
                }
            ],
            boss: {
                name: '曹操',
                type: 'boss_caocao',
                hp: 600,
                attack: 35,
                defense: 12,
                speed: 140,
                skills: ['summon', 'qi_slice', 'tyrant_ultimate']
            },
            drops: [
                { item: 'taiping_art', count: 1 },
                { item: 'health_potion', count: 3 }
            ]
        });
    }
    
    /**
     * 开始指定关卡
     * @param {number} levelIndex - 关卡索引 (0-based)
     */
    startLevel(levelIndex) {
        if (levelIndex < 0 || levelIndex >= this.levels.length) {
            console.error('无效的关卡索引');
            return false;
        }
        
        this.currentLevel = levelIndex;
        this.levelData = this.levels[levelIndex];
        this.waveIndex = 0;
        this.isLevelActive = true;
        this.isBossWave = false;
        
        // 设置关卡背景
        this.setLevelBackground();
        
        // 显示关卡信息
        if (this.game.hud) {
            this.game.hud.level = levelIndex + 1;
            this.game.hud.showMessage(`第${levelIndex + 1}关：${this.levelData.name}`, '#f39c12');
        }
        
        // 开始第一波敌人
        this.startWave();
        
        console.log(`开始关卡：${this.levelData.name}`);
        return true;
    }
    
    /**
     * 设置关卡背景
     */
    setLevelBackground() {
        if (!this.levelData || !this.levelData.background) return;
        
        const bg = this.levelData.background;
        // 这里可以扩展为实际的背景渲染
        this.backgroundConfig = bg;
    }
    
    /**
     * 开始当前波次
     */
    startWave() {
        if (!this.levelData || this.waveIndex >= this.levelData.waves.length) {
            // 所有波次完成，开始 BOSS 战
            this.startBossWave();
            return;
        }
        
        const wave = this.levelData.waves[this.waveIndex];
        this.isBossWave = false;
        
        // 生成敌人
        wave.enemies.forEach(enemyConfig => {
            for (let i = 0; i < enemyConfig.count; i++) {
                setTimeout(() => {
                    this.spawnEnemy(enemyConfig);
                }, i * 500);
            }
        });
        
        console.log(`开始第${this.waveIndex + 1}波敌人`);
    }
    
    /**
     * 生成单个敌人
     * @param {object} config - 敌人配置
     */
    spawnEnemy(config) {
        if (!this.game.enemySpawner) return;
        
        const enemy = this.game.enemySpawner.spawn({
            type: config.type,
            name: config.name,
            maxHealth: config.hp,
            attack: config.attack,
            defense: config.type === 'elite' ? 8 : 3,
            speed: config.type === 'archer' ? 120 : 100
        });
        
        if (enemy) {
            // 为弓箭手设置远程攻击
            if (config.type === 'archer') {
                enemy.attackRange = 250;
                enemy.isRanged = true;
            }
        }
    }
    
    /**
     * 开始 BOSS 波次
     */
    startBossWave() {
        if (!this.levelData || !this.levelData.boss) {
            console.error('关卡没有 BOSS 配置');
            return;
        }
        
        this.isBossWave = true;
        const bossConfig = this.levelData.boss;
        
        // 生成 BOSS
        const boss = this.game.enemySpawner.spawn({
            type: bossConfig.type,
            name: bossConfig.name,
            maxHealth: bossConfig.hp,
            attack: bossConfig.attack,
            defense: bossConfig.defense,
            speed: bossConfig.speed,
            isBoss: true
        });
        
        if (boss) {
            // 设置 BOSS 技能
            boss.skills = bossConfig.skills;
            boss.bossPhase = 1;
            boss.maxPhase = 3;
            
            // 显示 BOSS 血条
            if (this.game.hud) {
                this.game.hud.setBossInfo(boss.name, boss.health, boss.maxHealth);
                this.game.hud.showMessage(`${bossConfig.name} 出现了!`, '#e74c3c');
            }
        }
        
        console.log(`BOSS 战开始：${bossConfig.name}`);
    }
    
    /**
     * 检查波次完成
     */
    checkWaveComplete() {
        if (!this.game.enemySpawner) return false;
        
        const aliveEnemies = this.game.enemySpawner.getAliveEnemies();
        
        // 过滤掉 BOSS
        const nonBossEnemies = aliveEnemies.filter(e => !e.isBoss);
        
        if (nonBossEnemies.length === 0 && !this.isBossWave) {
            // 当前波次完成
            this.waveIndex++;
            
            if (this.waveIndex < this.levelData.waves.length) {
                // 延迟后开始下一波
                setTimeout(() => {
                    this.startWave();
                }, this.levelData.waves[this.waveIndex].delay);
            } else {
                // 开始 BOSS 战
                setTimeout(() => {
                    this.startBossWave();
                }, 2000);
            }
            
            return true;
        }
        
        return false;
    }
    
    /**
     * 检查 BOSS 战完成
     * @param {Enemy} boss - BOSS 对象
     */
    checkBossDefeated(boss) {
        if (!boss || !boss.isBoss || !boss.isDead) return false;
        
        // BOSS 被击败
        console.log(`${boss.name} 被击败了!`);
        
        // 掉落物品
        this.dropItems();
        
        // 显示胜利信息
        if (this.game.hud) {
            this.game.hud.clearBossInfo();
            this.game.hud.showMessage('关卡完成!', '#2ecc71');
        }
        
        // 延迟后进入下一关或游戏胜利
        setTimeout(() => {
            this.completeLevel();
        }, 3000);
        
        return true;
    }
    
    /**
     * 掉落物品
     */
    dropItems() {
        if (!this.levelData || !this.levelData.drops) return;
        
        this.levelData.drops.forEach(drop => {
            // 这里可以扩展为实际的物品生成
            console.log(`掉落物品：${drop.item} ×${drop.count}`);
            
            // 添加到玩家物品栏
            if (this.game.player && this.game.player.inventory) {
                for (let i = 0; i < drop.count; i++) {
                    this.game.player.inventory.addItem(drop.item);
                }
            }
        });
    }
    
    /**
     * 完成当前关卡
     */
    completeLevel() {
        const nextLevel = this.currentLevel + 1;
        
        if (nextLevel >= this.levels.length) {
            // 游戏通关
            this.gameComplete();
        } else {
            // 进入下一关
            this.game.hud.showMessage('进入下一关...', '#f39c12');
            setTimeout(() => {
                this.startLevel(nextLevel);
            }, 2000);
        }
    }
    
    /**
     * 游戏通关
     */
    gameComplete() {
        this.isLevelActive = false;
        
        if (this.game.hud) {
            this.game.hud.setGameOver(true);
            this.game.hud.showMessage('恭喜通关!', '#f39c12');
        }
        
        if (this.game) {
            this.game.isRunning = false;
        }
        
        console.log('游戏通关!');
    }
    
    /**
     * 更新 BOSS 状态（阶段变化）
     * @param {Enemy} boss - BOSS 对象
     */
    updateBossPhase(boss) {
        if (!boss || !boss.isBoss) return;
        
        const healthPercent = boss.health / boss.maxHealth;
        let newPhase = 1;
        
        if (healthPercent <= 0.3) {
            newPhase = 3;
        } else if (healthPercent <= 0.7) {
            newPhase = 2;
        }
        
        if (newPhase !== boss.bossPhase) {
            boss.bossPhase = newPhase;
            this.onBossPhaseChange(boss, newPhase);
        }
    }
    
    /**
     * BOSS 阶段变化回调
     * @param {Enemy} boss
     * @param {number} phase
     */
    onBossPhaseChange(boss, phase) {
        const messages = [
            '',
            `${boss.name} 进入第二阶段!`,
            '',
            `${boss.name} 使出全力了!`
        ];
        
        if (this.game.hud && messages[phase]) {
            this.game.hud.showMessage(messages[phase], '#e74c3c');
        }
        
        // 根据阶段调整 BOSS 属性
        if (phase === 2) {
            boss.attack = Math.floor(boss.attack * 1.2);
            boss.speed = Math.floor(boss.speed * 1.1);
        } else if (phase === 3) {
            boss.attack = Math.floor(boss.attack * 1.3);
            boss.speed = Math.floor(boss.speed * 1.2);
        }
        
        console.log(`${boss.name} 进入阶段 ${phase}`);
    }
    
    /**
     * 获取当前关卡信息
     * @returns {object}
     */
    getCurrentLevelInfo() {
        return {
            id: this.currentLevel + 1,
            name: this.levelData ? this.levelData.name : '未知',
            wave: this.waveIndex + 1,
            totalWaves: this.levelData ? this.levelData.waves.length : 0,
            isBossWave: this.isBossWave
        };
    }
    
    /**
     * 重置关卡管理器
     */
    reset() {
        this.currentLevel = 0;
        this.waveIndex = 0;
        this.isLevelActive = false;
        this.isBossWave = false;
        this.levelData = null;
    }
}

/**
 * BOSS 技能管理器
 */
class BossSkillManager {
    constructor(boss) {
        this.boss = boss;
        this.skillCooldowns = new Map();
        this.initSkills();
    }
    
    /**
     * 初始化技能
     */
    initSkills() {
        // 张飞技能
        this.skillCooldowns.set('charge', 0);
        this.skillCooldowns.set('roar', 0);
        this.skillCooldowns.set('spear_attack', 0);
        
        // 吕布技能
        this.skillCooldowns.set('halberd_sweep', 0);
        this.skillCooldowns.set('wushuang_rage', 0);
        this.skillCooldowns.set('god_form', 0);
        
        // 曹操技能
        this.skillCooldowns.set('summon', 0);
        this.skillCooldowns.set('qi_slice', 0);
        this.skillCooldowns.set('tyrant_ultimate', 0);
    }
    
    /**
     * 更新技能冷却
     * @param {number} deltaTime
     */
    update(deltaTime) {
        this.skillCooldowns.forEach((cooldown, skillId) => {
            if (cooldown > 0) {
                this.skillCooldowns.set(skillId, cooldown - deltaTime);
            }
        });
    }
    
    /**
     * 检查技能是否可用
     * @param {string} skillId
     * @returns {boolean}
     */
    canUseSkill(skillId) {
        const cooldown = this.skillCooldowns.get(skillId);
        return cooldown !== undefined && cooldown <= 0;
    }
    
    /**
     * 使用技能
     * @param {string} skillId
     * @param {number} cooldown
     */
    useSkill(skillId, cooldown) {
        this.skillCooldowns.set(skillId, cooldown);
    }
}

// 导出
window.LevelManager = LevelManager;
window.BossSkillManager = BossSkillManager;
