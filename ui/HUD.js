/**
 * HUD.js - 抬头显示模块（美化版）
 * 街机风格血条（渐变 + 边框）、连击数字弹出效果
 * 技能图标、分数滚动效果
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
        this.playerCharacter = 'GUANYU';
        
        // 游戏信息
        this.score = 0;
        this.displayScore = 0;  // 用于滚动效果
        this.time = 0;
        this.level = 1;
        this.lives = 3;
        
        // 连击系统
        this.combo = 0;
        this.comboTimer = 0;
        this.maxCombo = 0;
        this.comboTimeout = 2;
        this.comboScale = 1;
        this.comboRotation = 0;
        
        // 技能栏
        this.skills = [];
        
        // 消息队列
        this.messages = [];
        this.messageDuration = 2;
        
        // Boss 血条
        this.bossInfo = null;
        
        // 暂停/游戏结束
        this.isPaused = false;
        this.gameOver = false;
        this.gameOverReason = '';
        
        // 伤害数字
        this.damageNumbers = [];
        
        // 街机风格配置
        this.arcadeStyle = {
            primaryColor: '#f39c12',
            secondaryColor: '#e74c3c',
            accentColor: '#ffd700',
            bgColor: 'rgba(0, 0, 0, 0.8)',
            borderColor: '#fff',
            glowColor: 'rgba(243, 156, 18, 0.5)'
        };
    }
    
    /**
     * 初始化 HUD
     */
    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }
    
    /**
     * 更新 HUD
     */
    update(deltaTime) {
        // 分数滚动效果
        if (this.displayScore < this.score) {
            this.displayScore += Math.ceil((this.score - this.displayScore) * 0.1);
            if (this.displayScore > this.score) this.displayScore = this.score;
        }
        
        // 连击计时器
        if (this.combo > 0) {
            this.comboTimer -= deltaTime;
            if (this.comboTimer <= 0) {
                this.combo = 0;
                this.comboScale = 1;
            } else {
                // 连击脉冲效果
                this.comboScale = 1 + Math.sin(this.comboTimer * 10) * 0.1;
            }
        }
        
        // 更新消息
        this.messages.forEach(msg => {
            msg.timer -= deltaTime;
            msg.y -= 20 * deltaTime; // 消息上浮
        });
        this.messages = this.messages.filter(msg => msg.timer > 0);
        
        // 更新伤害数字
        this.damageNumbers.forEach(dn => {
            dn.y -= 50 * deltaTime;
            dn.alpha -= deltaTime * 2;
            dn.scale += deltaTime * 2;
        });
        this.damageNumbers = this.damageNumbers.filter(dn => dn.alpha > 0);
        
        // 更新技能冷却
        this.skills.forEach(skill => {
            if (skill.cooldown > 0) {
                skill.cooldown -= deltaTime;
            }
        });
    }
    
    /**
     * 渲染 HUD
     */
    render() {
        if (!this.ctx) return;
        
        // 渲染玩家信息（左上角）
        this.renderPlayerInfo();
        
        // 渲染游戏信息（右上角）
        this.renderGameInfo();
        
        // 渲染连击（屏幕中央）
        if (this.combo > 1) {
            this.renderCombo();
        }
        
        // 渲染技能栏（左下角）
        this.renderSkills();
        
        // 渲染消息（屏幕中央偏上）
        this.renderMessages();
        
        // 渲染 Boss 血条（顶部中央）
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
     * 渲染玩家信息（街机风格）
     */
    renderPlayerInfo() {
        const x = 15;
        const y = 15;
        const barWidth = 220;
        const barHeight = 25;
        
        // 背景面板
        this.renderArcadePanel(x, y, barWidth + 80, barHeight * 3 + 20);
        
        // 玩家名称
        this.ctx.fillStyle = this.arcadeStyle.accentColor;
        this.ctx.font = 'bold 18px "Press Start 2P", Arial';
        this.ctx.textAlign = 'left';
        this.ctx.shadowColor = this.arcadeStyle.primaryColor;
        this.ctx.shadowBlur = 8;
        this.ctx.fillText(this.playerName, x + 70, y + 25);
        this.ctx.shadowBlur = 0;
        
        // 角色头像框
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(x + 5, y + 5, 55, 55);
        this.ctx.strokeStyle = this.arcadeStyle.accentColor;
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(x + 5, y + 5, 55, 55);
        
        // 绘制角色头像（简化）
        this.renderCharacterAvatar(x + 32, y + 32);
        
        // 血条背景
        const healthX = x + 70;
        const healthY = y + 35;
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(healthX, healthY, barWidth, barHeight);
        
        // 血条边框（街机风格）
        this.ctx.strokeStyle = this.arcadeStyle.borderColor;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(healthX, healthY, barWidth, barHeight);
        
        // 血量渐变
        const healthPercent = Math.max(0, this.playerHealth / this.playerMaxHealth);
        const healthGradient = this.ctx.createLinearGradient(healthX, healthY, healthX + barWidth, healthY);
        healthGradient.addColorStop(0, '#c0392b');
        healthGradient.addColorStop(0.3, '#e74c3c');
        healthGradient.addColorStop(0.6, '#e67e22');
        healthGradient.addColorStop(1, '#f39c12');
        
        // 血条填充
        this.ctx.fillStyle = healthGradient;
        this.ctx.fillRect(healthX + 2, healthY + 2, (barWidth - 4) * healthPercent, barHeight - 4);
        
        // 血条高光
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(healthX + 2, healthY + 2, (barWidth - 4) * healthPercent, barHeight / 3);
        
        // 血量文字
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = '#000';
        this.ctx.shadowBlur = 3;
        this.ctx.fillText(`${Math.floor(this.playerHealth)}/${this.playerMaxHealth}`, healthX + barWidth / 2, healthY + 18);
        this.ctx.shadowBlur = 0;
        
        // 血条标签
        this.ctx.fillStyle = this.arcadeStyle.accentColor;
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.fillText('HP', healthX - 10, healthY + 18);
        
        // 法力条
        const manaY = healthY + barHeight + 8;
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(healthX, manaY, barWidth, 18);
        
        this.ctx.strokeStyle = this.arcadeStyle.borderColor;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(healthX, manaY, barWidth, 18);
        
        const manaPercent = Math.max(0, this.playerMana / this.playerMaxMana);
        const manaGradient = this.ctx.createLinearGradient(healthX, manaY, healthX + barWidth, manaY);
        manaGradient.addColorStop(0, '#1abc9c');
        manaGradient.addColorStop(0.5, '#3498db');
        manaGradient.addColorStop(1, '#2980b9');
        
        this.ctx.fillStyle = manaGradient;
        this.ctx.fillRect(healthX + 2, manaY + 2, (barWidth - 4) * manaPercent, 18 - 4);
        
        // 法力文字
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${Math.floor(this.playerMana)}/${this.playerMaxMana}`, healthX + barWidth / 2, manaY + 13);
        
        this.ctx.fillStyle = this.arcadeStyle.accentColor;
        this.ctx.textAlign = 'right';
        this.ctx.fillText('MP', healthX - 10, manaY + 13);
        
        // 生命数
        this.renderLives(x + barWidth + 80, y + 40);
    }
    
    /**
     * 渲染角色头像
     */
    renderCharacterAvatar(cx, cy) {
        const ctx = this.ctx;
        
        // 根据角色类型绘制不同头像
        let robeColor = '#c41e3a';
        if (this.playerCharacter === 'ZHANGFEI') robeColor = '#1a1a2e';
        if (this.playerCharacter === 'ZHAOYUN') robeColor = '#f8f8ff';
        
        // 头部
        ctx.fillStyle = '#f5d0b0';
        ctx.beginPath();
        ctx.arc(cx, cy - 5, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // 头发
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(cx, cy - 8, 13, Math.PI, 0);
        ctx.fill();
        
        // 战袍
        ctx.fillStyle = robeColor;
        ctx.beginPath();
        ctx.moveTo(cx - 15, cy + 5);
        ctx.lineTo(cx + 15, cy + 5);
        ctx.lineTo(cx + 18, cy + 20);
        ctx.lineTo(cx - 18, cy + 20);
        ctx.closePath();
        ctx.fill();
    }
    
    /**
     * 渲染生命数
     */
    renderLives(x, y) {
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'left';
        
        for (let i = 0; i < this.lives; i++) {
            const lifeX = x + i * 22;
            
            // 心形光晕
            this.ctx.shadowColor = '#e74c3c';
            this.ctx.shadowBlur = 5;
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.fillText('❤', lifeX, y);
            this.ctx.shadowBlur = 0;
        }
        
        // 标签
        this.ctx.fillStyle = this.arcadeStyle.accentColor;
        this.ctx.font = '12px Arial';
        this.ctx.fillText('×', x - 15, y);
    }
    
    /**
     * 渲染游戏信息
     */
    renderGameInfo() {
        const x = this.canvas.width - 20;
        const y = 20;
        
        // 背景面板
        this.renderArcadePanel(x - 150, y, 165, 100);
        
        this.ctx.textAlign = 'right';
        this.ctx.shadowColor = '#000';
        this.ctx.shadowBlur = 3;
        
        // 分数（滚动效果）
        this.ctx.fillStyle = this.arcadeStyle.accentColor;
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillText('SCORE', x, y + 15);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 24px "Press Start 2P", Arial';
        this.ctx.fillText(this.displayScore.toLocaleString(), x, y + 45);
        
        // 时间
        const minutes = Math.floor(this.time / 60);
        const seconds = Math.floor(this.time % 60);
        const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        this.ctx.fillStyle = this.time < 10 ? '#e74c3c' : this.arcadeStyle.primaryColor;
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillText('TIME', x, y + 70);
        
        this.ctx.fillStyle = this.time < 10 ? '#e74c3c' : '#2ecc71';
        this.ctx.font = 'bold 20px "Press Start 2P", Arial';
        
        // 时间警告闪烁
        if (this.time < 10) {
            this.ctx.globalAlpha = 0.7 + Math.sin(Date.now() / 200) * 0.3;
        }
        this.ctx.fillText(timeStr, x, y + 95);
        this.ctx.globalAlpha = 1;
        this.ctx.shadowBlur = 0;
    }
    
    /**
     * 渲染街机风格面板
     */
    renderArcadePanel(x, y, width, height) {
        const ctx = this.ctx;
        
        // 背景
        ctx.fillStyle = this.arcadeStyle.bgColor;
        ctx.fillRect(x, y, width, height);
        
        // 边框
        ctx.strokeStyle = this.arcadeStyle.borderColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        
        // 内边框（双线效果）
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 4, y + 4, width - 8, height - 8);
        
        // 角装饰
        const cornerSize = 8;
        ctx.fillStyle = this.arcadeStyle.accentColor;
        // 左上
        ctx.fillRect(x, y, cornerSize, 3);
        ctx.fillRect(x, y, 3, cornerSize);
        // 右上
        ctx.fillRect(x + width - cornerSize, y, cornerSize, 3);
        ctx.fillRect(x + width - 3, y, 3, cornerSize);
        // 左下
        ctx.fillRect(x, y + height - 3, cornerSize, 3);
        ctx.fillRect(x, y + height - cornerSize, 3, cornerSize);
        // 右下
        ctx.fillRect(x + width - cornerSize, y + height - 3, cornerSize, 3);
        ctx.fillRect(x + width - 3, y + height - cornerSize, 3, cornerSize);
    }
    
    /**
     * 渲染连击（街机风格弹出效果）
     */
    renderCombo() {
        const x = this.canvas.width / 2;
        const y = 150;
        
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.scale(this.comboScale, this.comboScale);
        
        // 连击背景光晕
        const glowSize = 80 + this.combo * 2;
        const glowGradient = this.ctx.createRadialGradient(0, 0, 20, 0, 0, glowSize);
        glowGradient.addColorStop(0, `rgba(243, 156, 18, ${0.4 + this.combo * 0.01})`);
        glowGradient.addColorStop(0.5, `rgba(231, 76, 60, ${0.2 + this.combo * 0.005})`);
        glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        this.ctx.fillStyle = glowGradient;
        this.ctx.fillRect(-glowSize, -glowSize, glowSize * 2, glowSize * 2);
        
        // 连击数字
        this.ctx.shadowColor = '#e74c3c';
        this.ctx.shadowBlur = 15;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // "COMBO" 文字
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.fillText('COMBO', 0, -35);
        
        // 连击数
        this.ctx.fillStyle = this.arcadeStyle.accentColor;
        this.ctx.font = 'bold 64px "Press Start 2P", Arial';
        this.ctx.fillText(this.combo, 0, 15);
        
        // 连击评价
        let rating = '';
        let ratingColor = '#fff';
        if (this.combo >= 50) { rating = 'GODLIKE!'; ratingColor = '#ffd700'; }
        else if (this.combo >= 30) { rating = 'PERFECT!'; ratingColor = '#e74c3c'; }
        else if (this.combo >= 20) { rating = 'EXCELLENT!'; ratingColor = '#f39c12'; }
        else if (this.combo >= 10) { rating = 'GREAT!'; ratingColor = '#2ecc71'; }
        else if (this.combo >= 5) { rating = 'GOOD!'; ratingColor = '#3498db'; }
        
        if (rating) {
            this.ctx.fillStyle = ratingColor;
            this.ctx.font = 'bold 18px Arial';
            this.ctx.shadowColor = ratingColor;
            this.ctx.shadowBlur = 10;
            this.ctx.fillText(rating, 0, 60);
        }
        
        this.ctx.restore();
        this.ctx.shadowBlur = 0;
    }
    
    /**
     * 渲染技能栏
     */
    renderSkills() {
        if (this.skills.length === 0) return;
        
        const x = 20;
        const y = this.canvas.height - 90;
        const slotSize = 55;
        const gap = 12;
        
        // 背景面板
        this.renderArcadePanel(x - 10, y - 10, this.skills.length * (slotSize + gap) - gap + 20, slotSize + 20);
        
        this.skills.forEach((skill, index) => {
            const slotX = x + index * (slotSize + gap);
            
            // 技能框背景
            this.ctx.fillStyle = '#1a1a1a';
            this.ctx.fillRect(slotX, y, slotSize, slotSize);
            
            // 技能框边框
            this.ctx.strokeStyle = skill.cooldown > 0 ? '#666' : this.arcadeStyle.accentColor;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(slotX, y, slotSize, slotSize);
            
            // 技能图标（用文字/符号表示）
            this.ctx.fillStyle = skill.cooldown > 0 ? '#666' : '#fff';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            const icons = ['⚔️', '🔥', '⚡', '🛡️', '💫'];
            this.ctx.fillText(icons[index % icons.length], slotX + slotSize / 2, y + slotSize / 2 - 5);
            
            // 技能名称
            this.ctx.font = '10px Arial';
            this.ctx.fillText(skill.name.substring(0, 6), slotX + slotSize / 2, y + slotSize - 8);
            
            // 冷却遮罩
            if (skill.cooldown > 0) {
                const cooldownPercent = Math.min(1, skill.cooldown / skill.maxCooldown);
                
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                this.ctx.fillRect(slotX, y + slotSize * (1 - cooldownPercent), slotSize, slotSize * cooldownPercent);
                
                // 冷却时间数字
                this.ctx.fillStyle = '#fff';
                this.ctx.font = 'bold 16px Arial';
                this.ctx.fillText(Math.ceil(skill.cooldown), slotX + slotSize / 2, y + slotSize / 2 + 20);
            }
        });
    }
    
    /**
     * 渲染消息
     */
    renderMessages() {
        const x = this.canvas.width / 2;
        let y = 250;
        
        this.messages.forEach(msg => {
            this.ctx.save();
            this.ctx.globalAlpha = Math.min(1, msg.timer / 0.5);
            
            this.ctx.fillStyle = msg.color || '#fff';
            this.ctx.font = 'bold 28px "Press Start 2P", Arial';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = '#000';
            this.ctx.shadowBlur = 6;
            this.ctx.shadowOffsetX = 2;
            this.ctx.shadowOffsetY = 2;
            this.ctx.fillText(msg.text, x, y);
            
            this.ctx.restore();
            y += 50;
        });
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
    }
    
    /**
     * 渲染 Boss 血条
     */
    renderBossBar() {
        if (!this.bossInfo) return;
        
        const barWidth = 500;
        const barHeight = 35;
        const x = (this.canvas.width - barWidth) / 2;
        const y = 70;
        
        // Boss 名称
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.font = 'bold 20px "Press Start 2P", Arial';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = '#e74c3c';
        this.ctx.shadowBlur = 10;
        this.ctx.fillText(this.bossInfo.name, this.canvas.width / 2, y - 10);
        this.ctx.shadowBlur = 0;
        
        // 血条背景
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(x, y, barWidth, barHeight);
        
        // 血条边框（金色）
        this.ctx.strokeStyle = '#ffd700';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(x, y, barWidth, barHeight);
        
        // Boss 血量渐变
        const healthPercent = Math.max(0, this.bossInfo.health / this.bossInfo.maxHealth);
        const bossGradient = this.ctx.createLinearGradient(x, y, x + barWidth, y);
        bossGradient.addColorStop(0, '#8b0000');
        bossGradient.addColorStop(0.3, '#c0392b');
        bossGradient.addColorStop(0.6, '#e74c3c');
        bossGradient.addColorStop(1, '#ff6b6b');
        
        this.ctx.fillStyle = bossGradient;
        this.ctx.fillRect(x + 3, y + 3, (barWidth - 6) * healthPercent, barHeight - 6);
        
        // 血条高光
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(x + 3, y + 3, (barWidth - 6) * healthPercent, barHeight / 3);
        
        // 血量数值
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(
            `${Math.floor(this.bossInfo.health)}/${this.bossInfo.maxHealth}`,
            x + barWidth - 10,
            y + barHeight / 2 + 5
        );
    }
    
    /**
     * 渲染暂停
     */
    renderPause() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = this.arcadeStyle.accentColor;
        this.ctx.font = 'bold 60px "Press Start 2P", Arial';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = this.arcadeStyle.accentColor;
        this.ctx.shadowBlur = 15;
        this.ctx.fillText('PAUSE', this.canvas.width / 2, this.canvas.height / 2 - 30);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px Arial';
        this.ctx.shadowBlur = 0;
        this.ctx.fillText('按 P 继续游戏', this.canvas.width / 2, this.canvas.height / 2 + 40);
    }
    
    /**
     * 渲染游戏结束
     */
    renderGameOver() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        const isVictory = this.gameOverReason === 'victory';
        
        // 标题
        this.ctx.fillStyle = isVictory ? '#f39c12' : '#e74c3c';
        this.ctx.font = 'bold 72px "Press Start 2P", Arial';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = isVictory ? '#f39c12' : '#e74c3c';
        this.ctx.shadowBlur = 20;
        this.ctx.fillText(
            isVictory ? 'VICTORY!' : 'GAME OVER',
            this.canvas.width / 2,
            this.canvas.height / 2 - 80
        );
        
        // 最终分数
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 28px Arial';
        this.ctx.shadowBlur = 0;
        this.ctx.fillText(`最终分数：${this.score.toLocaleString()}`, this.canvas.width / 2, this.canvas.height / 2);
        
        // 最大连击
        this.ctx.fillStyle = this.arcadeStyle.accentColor;
        this.ctx.fillText(`最大连击：${this.maxCombo}`, this.canvas.width / 2, this.canvas.height / 2 + 50);
        
        // 重新开始提示
        this.ctx.fillStyle = '#2ecc71';
        this.ctx.font = 'bold 20px "Press Start 2P", Arial';
        this.ctx.fillText('按 R 重新开始', this.canvas.width / 2, this.canvas.height / 2 + 120);
    }
    
    // ============ 状态更新方法 ============
    
    setPlayerHealth(health, maxHealth) {
        this.playerHealth = health;
        this.playerMaxHealth = maxHealth;
    }
    
    setPlayerMana(mana, maxMana) {
        this.playerMana = mana;
        this.playerMaxMana = maxMana;
    }
    
    setPlayerCharacter(character) {
        this.playerCharacter = character;
    }
    
    addScore(points) {
        this.score += points;
    }
    
    addCombo() {
        this.combo++;
        this.comboTimer = this.comboTimeout;
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
            this.showMessage('NEW COMBO RECORD!', '#f39c12');
        }
    }
    
    resetCombo() {
        this.combo = 0;
        this.comboTimer = 0;
    }
    
    setBossInfo(name, health, maxHealth) {
        this.bossInfo = { name, health, maxHealth };
    }
    
    clearBossInfo() {
        this.bossInfo = null;
    }
    
    showMessage(text, color) {
        this.messages.push({
            text,
            color: color || '#fff',
            timer: this.messageDuration,
            y: 250
        });
    }
    
    showDamage(x, y, damage, isCritical = false) {
        this.damageNumbers.push({
            x, y, damage, isCritical,
            alpha: 1,
            scale: isCritical ? 1.5 : 1,
            vy: -50
        });
    }
    
    setSkills(skills) {
        this.skills = skills.map(skill => ({
            name: skill.name,
            cooldown: skill.currentCooldown || 0,
            maxCooldown: skill.cooldown
        }));
    }
    
    updateSkillCooldowns(skills) {
        this.skills = skills.map(skill => ({
            name: skill.name,
            cooldown: skill.currentCooldown || 0,
            maxCooldown: skill.cooldown
        }));
    }
    
    setPaused(paused) {
        this.isPaused = paused;
    }
    
    setGameOver(victory) {
        this.gameOver = true;
        this.gameOverReason = victory ? 'victory' : 'defeat';
    }
    
    reset() {
        this.score = 0;
        this.displayScore = 0;
        this.time = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.messages = [];
        this.damageNumbers = [];
        this.bossInfo = null;
        this.gameOver = false;
        this.isPaused = false;
    }
}

// 导出
window.HUD = HUD;
