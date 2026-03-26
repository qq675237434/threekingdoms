/**
 * ComboSystem.js - 连击系统
 * 负责管理连击计数、评价和奖励
 */

class ComboSystem {
    constructor(hud) {
        this.hud = hud;
        this.combo = 0;
        this.maxCombo = 0;
        this.comboTimer = 0;
        this.comboTimeout = 2.0; // 连击超时时间 (秒)
        this.totalDamage = 0;
        this.hitCount = 0;
        
        // 连击评价配置
        this.ranks = {
            C: { min: 1, max: 4, multiplier: 1.0, color: '#95a5a6' },
            B: { min: 5, max: 9, multiplier: 1.2, color: '#3498db' },
            A: { min: 10, max: 19, multiplier: 1.5, color: '#2ecc71' },
            S: { min: 20, max: 49, multiplier: 2.0, color: '#f39c12' },
            SSS: { min: 50, max: Infinity, multiplier: 3.0, color: '#e74c3c' }
        };
        
        // 成就记录
        this.achievements = {
            first10Combo: false,
            first20Combo: false,
            first50Combo: false
        };
    }
    
    /**
     * 添加连击
     * @param {number} damage - 本次攻击伤害
     */
    addHit(damage = 0) {
        this.combo++;
        this.comboTimer = this.comboTimeout;
        this.totalDamage += damage;
        this.hitCount++;
        
        // 更新最大连击
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
            this.checkAchievements();
        }
        
        // 更新 HUD
        if (this.hud) {
            this.hud.combo = this.combo;
            this.hud.maxCombo = this.maxCombo;
            
            // 显示连击评价
            const rank = this.getCurrentRank();
            if (this.combo >= 5) {
                this.showComboMessage(rank);
            }
        }
        
        // 计算得分
        const score = this.calculateScore(damage);
        if (this.hud) {
            this.hud.addScore(score);
        }
    }
    
    /**
     * 重置连击
     */
    reset() {
        if (this.combo > 0) {
            console.log(`连击中断：${this.combo}连击`);
        }
        this.combo = 0;
        this.comboTimer = 0;
    }
    
    /**
     * 更新连击计时器
     * @param {number} deltaTime - 帧间隔时间 (秒)
     */
    update(deltaTime) {
        if (this.combo > 0) {
            this.comboTimer -= deltaTime;
            if (this.comboTimer <= 0) {
                this.reset();
            }
        }
    }
    
    /**
     * 获取当前连击评价
     * @returns {string}
     */
    getCurrentRank() {
        for (const [rank, config] of Object.entries(this.ranks)) {
            if (this.combo >= config.min && this.combo <= config.max) {
                return rank;
            }
        }
        return 'C';
    }
    
    /**
     * 获取评价配置
     * @param {string} rank
     * @returns {object}
     */
    getRankConfig(rank) {
        return this.ranks[rank] || this.ranks.C;
    }
    
    /**
     * 计算得分
     * @param {number} baseDamage - 基础伤害
     * @returns {number}
     */
    calculateScore(baseDamage) {
        const rank = this.getCurrentRank();
        const config = this.getRankConfig(rank);
        
        // 基础分 + 连击奖励
        const baseScore = baseDamage > 0 ? baseDamage : 10;
        const bonusScore = Math.floor(baseScore * (config.multiplier - 1) * (this.combo / 10));
        
        return Math.floor(baseScore + bonusScore);
    }
    
    /**
     * 显示连击消息
     * @param {string} rank
     */
    showComboMessage(rank) {
        if (!this.hud) return;
        
        const config = this.getRankConfig(rank);
        const messages = {
            C: '',
            B: '不错!',
            A: '精彩!',
            S: '完美!',
            SSS: '神乎其技!'
        };
        
        if (messages[rank]) {
            this.hud.showMessage(`${this.combo} COMBO ${rank} - ${messages[rank]}`, config.color);
        }
    }
    
    /**
     * 检查成就
     */
    checkAchievements() {
        if (!this.achievements.first10Combo && this.maxCombo >= 10) {
            this.achievements.first10Combo = true;
            this.unlockAchievement('10 连击达成!', '#2ecc71');
        }
        
        if (!this.achievements.first20Combo && this.maxCombo >= 20) {
            this.achievements.first20Combo = true;
            this.unlockAchievement('20 连击达成!', '#f39c12');
        }
        
        if (!this.achievements.first50Combo && this.maxCombo >= 50) {
            this.achievements.first50Combo = true;
            this.unlockAchievement('50 连击达成!', '#e74c3c');
        }
    }
    
    /**
     * 解锁成就
     * @param {string} name
     * @param {string} color
     */
    unlockAchievement(name, color) {
        console.log(`成就解锁：${name}`);
        if (this.hud) {
            this.hud.showMessage(`成就：${name}`, color);
        }
    }
    
    /**
     * 获取连击统计数据
     * @returns {object}
     */
    getStats() {
        return {
            currentCombo: this.combo,
            maxCombo: this.maxCombo,
            totalHits: this.hitCount,
            totalDamage: this.totalDamage,
            currentRank: this.getCurrentRank(),
            achievements: this.achievements
        };
    }
    
    /**
     * 重置系统
     */
    resetSystem() {
        this.combo = 0;
        this.maxCombo = 0;
        this.comboTimer = 0;
        this.totalDamage = 0;
        this.hitCount = 0;
        this.achievements = {
            first10Combo: false,
            first20Combo: false,
            first50Combo: false
        };
    }
}

/**
 * 连击特效渲染器
 */
class ComboEffectRenderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.effects = [];
    }
    
    /**
     * 添加连击特效
     * @param {number} x
     * @param {number} y
     * @param {string} rank
     */
    addComboEffect(x, y, rank) {
        this.effects.push({
            x: x,
            y: y,
            rank: rank,
            timer: 1.0, // 1 秒持续时间
            scale: 1.0
        });
    }
    
    /**
     * 更新特效
     * @param {number} deltaTime
     */
    update(deltaTime) {
        this.effects.forEach(effect => {
            effect.timer -= deltaTime;
            effect.y -= 20 * deltaTime; // 向上飘动
            effect.scale = 1.0 + (1.0 - effect.timer) * 0.5; // 逐渐放大
        });
        
        // 移除过期特效
        this.effects = this.effects.filter(effect => effect.timer > 0);
    }
    
    /**
     * 渲染特效
     */
    render() {
        this.effects.forEach(effect => {
            const config = this.getRankConfig(effect.rank);
            
            this.ctx.save();
            this.ctx.translate(effect.x, effect.y);
            this.ctx.scale(effect.scale, effect.scale);
            
            // 绘制评价文字
            this.ctx.fillStyle = config.color;
            this.ctx.font = 'bold 36px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = config.color;
            this.ctx.shadowBlur = 10;
            this.ctx.globalAlpha = effect.timer;
            this.ctx.fillText(effect.rank, 0, 0);
            
            this.ctx.restore();
        });
    }
    
    /**
     * 获取评价配置
     * @param {string} rank
     * @returns {object}
     */
    getRankConfig(rank) {
        const ranks = {
            C: { color: '#95a5a6' },
            B: { color: '#3498db' },
            A: { color: '#2ecc71' },
            S: { color: '#f39c12' },
            SSS: { color: '#e74c3c' }
        };
        return ranks[rank] || ranks.C;
    }
    
    /**
     * 清空所有特效
     */
    clear() {
        this.effects = [];
    }
}

// 导出
window.ComboSystem = ComboSystem;
window.ComboEffectRenderer = ComboEffectRenderer;
