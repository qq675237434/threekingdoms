/**
 * HUD.js - 抬头显示模块
 * 负责渲染游戏界面元素：血条、分数、时间等
 */
class HUD {
    constructor(config = {}) {
        this.canvas = config.canvas || null;
        this.ctx = config.ctx || null;
        
        // 玩家信息
        this.playerHealth = 100;
        this.playerMaxHealth = 100;
        this.playerMana = 50;
        this.playerMaxMana = 50;
        this.playerName = '玩家';
        
        // 游戏信息
        this.score = 0;
        this.time = 0;
        this.level = 1;
        this.lives = 3;
        
        // 连击系统
        this.combo = 0;
        this.comboTimer = 0;
        this.maxCombo = 0;
        this.comboTimeout = 2; // 连击超时时间 (秒)
        
        // 技能栏
        this.skills = [];
        
        // 消息队列
        this.messages = [];
        this.messageDuration = 2; // 消息显示时间 (秒)
        
        // Boss 血条
        this.bossInfo = null; // { name, health, maxHealth }
        
        // 暂停状态
        this.isPaused = false;
        
        // 游戏结束状态
        this.gameOver = false;
        this.gameOverReason = '';
    }
    
    /**
     * 初始化 HUD
     * @param {HTMLCanvasElement} canvas
     */
    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }
    
    /**
     * 更新 HUD
     * @param {number} deltaTime
     */
    update(deltaTime) {
        // 更新连击计时器
        if (this.combo > 0) {
            this.comboTimer -= deltaTime;
            if (this.comboTimer <= 0) {
                this.combo = 0;
            }
        }
        
        // 更新消息
        this.messages.forEach(msg => {
            msg.timer -= deltaTime;
        });
        this.messages = this.messages.filter(msg => msg.timer > 0);
    }
    
    /**
     * 渲染 HUD
     */
    render() {
        if (!this.ctx) return;
        
        // 渲染玩家信息
        this.renderPlayerInfo();
        
        // 渲染游戏信息
        this.renderGameInfo();
        
        // 渲染连击
        if (this.combo > 1) {
            this.renderCombo();
        }
        
        // 渲染技能栏
        this.renderSkills();
        
        // 渲染消息
        this.renderMessages();
        
        // 渲染 Boss 血条
        if (this.bossInfo) {
            this.renderBossBar();
        }
        
        // 渲染暂停
        if (this.isPaused) {
            this.renderPause();
        }
        
        // 渲染游戏结束
        if (this.gameOver) {
            this.renderGameOver();
        }
    }
    
    /**
     * 渲染玩家信息
     */
    renderPlayerInfo() {
        const x = 20;
        const y = 20;
        
        // 玩家名称
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(this.playerName, x, y);
        
        // 血条背景
        const barWidth = 200;
        const barHeight = 20;
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(x, y + 10, barWidth, barHeight);
        
        // 血量
        const healthPercent = this.playerHealth / this.playerMaxHealth;
        const healthColor = healthPercent > 0.5 ? '#2ecc71' : healthPercent > 0.25 ? '#f39c12' : '#e74c3c';
        this.ctx.fillStyle = healthColor;
        this.ctx.fillRect(x, y + 10, barWidth * healthPercent, barHeight);
        
        // 血条边框
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y + 10, barWidth, barHeight);
        
        // 血量文字
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${Math.floor(this.playerHealth)}/${this.playerMaxHealth}`, x + barWidth / 2, y + 25);
        
        // 法力条
        const manaY = y + 35;
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(x, manaY, barWidth, 15);
        
        const manaPercent = this.playerMana / this.playerMaxMana;
        this.ctx.fillStyle = '#3498db';
        this.ctx.fillRect(x, manaY, barWidth * manaPercent, 15);
        
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, manaY, barWidth, 15);
        
        // 生命数
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'right';
        for (let i = 0; i < this.lives; i++) {
            this.ctx.fillText('❤', x + barWidth - i * 25, y + 20);
        }
    }
    
    /**
     * 渲染游戏信息
     */
    renderGameInfo() {
        const x = this.canvas.width - 20;
        const y = 20;
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'right';
        
        // 分数
        this.ctx.fillText(`分数：${this.score}`, x, y);
        
        // 时间
        const minutes = Math.floor(this.time / 60);
        const seconds = Math.floor(this.time % 60);
        this.ctx.fillText(`时间：${minutes}:${seconds.toString().padStart(2, '0')}`, x, y + 30);
        
        // 关卡
        this.ctx.fillText(`关卡：${this.level}`, x, y + 60);
    }
    
    /**
     * 渲染连击
     */
    renderCombo() {
        const x = this.canvas.width / 2;
        const y = 100;
        
        // 连击数字
        this.ctx.fillStyle = '#f39c12';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = '#e74c3c';
        this.ctx.shadowBlur = 10;
        this.ctx.fillText(`${this.combo} COMBO`, x, y);
        this.ctx.shadowBlur = 0;
        
        // 最大连击
        if (this.combo >= this.maxCombo && this.combo > 5) {
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.font = '16px Arial';
            this.ctx.fillText('新纪录!', x, y + 30);
        }
    }
    
    /**
     * 渲染技能栏
     */
    renderSkills() {
        if (this.skills.length === 0) return;
        
        const x = 20;
        const y = this.canvas.height - 80;
        const slotSize = 50;
        const gap = 10;
        
        this.skills.forEach((skill, index) => {
            const slotX = x + index * (slotSize + gap);
            
            // 技能框背景
            this.ctx.fillStyle = '#333';
            this.ctx.fillRect(slotX, y, slotSize, slotSize);
            
            // 技能图标 (简化为文字)
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(skill.name.substring(0, 4), slotX + slotSize / 2, y + slotSize / 2 + 5);
            
            // 冷却遮罩
            if (skill.cooldown > 0) {
                const cooldownPercent = skill.cooldown / skill.maxCooldown;
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                this.ctx.fillRect(slotX, y + slotSize * (1 - cooldownPercent), slotSize, slotSize * cooldownPercent);
                
                // 冷却时间
                this.ctx.fillStyle = '#fff';
                this.ctx.font = 'bold 14px Arial';
                this.ctx.fillText(Math.ceil(skill.cooldown), slotX + slotSize / 2, y + slotSize / 2 + 20);
            }
            
            // 边框
            this.ctx.strokeStyle = skill.cooldown > 0 ? '#666' : '#f39c12';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(slotX, y, slotSize, slotSize);
        });
    }
    
    /**
     * 渲染消息
     */
    renderMessages() {
        const x = this.canvas.width / 2;
        let y = 200;
        
        this.messages.forEach(msg => {
            this.ctx.fillStyle = msg.color || '#fff';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = '#000';
            this.ctx.shadowBlur = 4;
            this.ctx.fillText(msg.text, x, y);
            this.ctx.shadowBlur = 0;
            y += 40;
        });
    }
    
    /**
     * 渲染 Boss 血条
     */
    renderBossBar() {
        if (!this.bossInfo) return;
        
        const barWidth = 400;
        const barHeight = 30;
        const x = (this.canvas.width - barWidth) / 2;
        const y = 80;
        
        // Boss 名称
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.bossInfo.name, this.canvas.width / 2, y);
        
        // 血条背景
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(x, y + 10, barWidth, barHeight);
        
        // 血量
        const healthPercent = this.bossInfo.health / this.bossInfo.maxHealth;
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.fillRect(x, y + 10, barWidth * healthPercent, barHeight);
        
        // 边框
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y + 10, barWidth, barHeight);
    }
    
    /**
     * 渲染暂停
     */
    renderPause() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('暂停', this.canvas.width / 2, this.canvas.height / 2);
        
        this.ctx.font = '20px Arial';
        this.ctx.fillText('按 P 继续游戏', this.canvas.width / 2, this.canvas.height / 2 + 50);
    }
    
    /**
     * 渲染游戏结束
     */
    renderGameOver() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = this.gameOverReason === 'victory' ? '#f39c12' : '#e74c3c';
        this.ctx.font = 'bold 60px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            this.gameOverReason === 'victory' ? '胜利!' : '游戏结束',
            this.canvas.width / 2,
            this.canvas.height / 2 - 30
        );
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`最终分数：${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 30);
        this.ctx.fillText(`最大连击：${this.maxCombo}`, this.canvas.width / 2, this.canvas.height / 2 + 70);
        this.ctx.fillText('按 R 重新开始', this.canvas.width / 2, this.canvas.height / 2 + 120);
    }
    
    // ============ 状态更新方法 ============
    
    /**
     * 更新玩家血量
     */
    setPlayerHealth(health, maxHealth) {
        this.playerHealth = health;
        this.playerMaxHealth = maxHealth;
    }
    
    /**
     * 更新玩家法力
     */
    setPlayerMana(mana, maxMana) {
        this.playerMana = mana;
        this.playerMaxMana = maxMana;
    }
    
    /**
     * 增加分数
     */
    addScore(points) {
        this.score += points;
    }
    
    /**
     * 增加连击
     */
    addCombo() {
        this.combo++;
        this.comboTimer = this.comboTimeout;
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
            this.showMessage('新连击纪录!', '#f39c12');
        }
    }
    
    /**
     * 重置连击
     */
    resetCombo() {
        this.combo = 0;
        this.comboTimer = 0;
    }
    
    /**
     * 设置 Boss 信息
     */
    setBossInfo(name, health, maxHealth) {
        this.bossInfo = { name, health, maxHealth };
    }
    
    /**
     * 清除 Boss 信息
     */
    clearBossInfo() {
        this.bossInfo = null;
    }
    
    /**
     * 显示消息
     */
    showMessage(text, color) {
        this.messages.push({
            text,
            color: color || '#fff',
            timer: this.messageDuration
        });
    }
    
    /**
     * 设置技能栏
     */
    setSkills(skills) {
        this.skills = skills.map(skill => ({
            name: skill.name,
            cooldown: skill.currentCooldown,
            maxCooldown: skill.cooldown
        }));
    }
    
    /**
     * 更新技能冷却
     */
    updateSkillCooldowns(skills) {
        this.skills = skills.map(skill => ({
            name: skill.name,
            cooldown: skill.currentCooldown,
            maxCooldown: skill.cooldown
        }));
    }
    
    /**
     * 设置暂停状态
     */
    setPaused(paused) {
        this.isPaused = paused;
    }
    
    /**
     * 设置游戏结束
     */
    setGameOver(victory) {
        this.gameOver = true;
        this.gameOverReason = victory ? 'victory' : 'defeat';
    }
    
    /**
     * 重置 HUD
     */
    reset() {
        this.score = 0;
        this.time = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.messages = [];
        this.bossInfo = null;
        this.gameOver = false;
        this.isPaused = false;
    }
}

// 导出
window.HUD = HUD;
