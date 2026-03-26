/**
 * HUD.js - 抬头显示模块（性能优化版）
 * 优化项：
 * - 缓存渐变对象和样式
 * - 减少路径创建调用
 * - 优化数组过滤操作
 * - 移除不必要的 console.log
 */

class HUD {
    constructor(config = {}) {
        this.canvas = config.canvas || null;
        this.ctx = config.ctx || null;
        
        this.playerHealth = 100;
        this.playerMaxHealth = 100;
        this.playerMana = 50;
        this.playerMaxMana = 50;
        this.playerName = '玩家';
        this.playerCharacter = 'GUANYU';
        
        this.score = 0;
        this.displayScore = 0;
        this.time = 0;
        this.level = 1;
        this.lives = 3;
        
        this.combo = 0;
        this.comboTimer = 0;
        this.maxCombo = 0;
        this.comboTimeout = 2;
        this.comboScale = 1;
        
        this.skills = [];
        this.messages = [];
        this.messageDuration = 2;
        
        this.bossInfo = null;
        this.isPaused = false;
        this.gameOver = false;
        this.gameOverReason = '';
        
        this.damageNumbers = [];
        
        // 屏幕震动效果
        this.shakeTime = 0;
        this.shakeIntensity = 0;
        
        // 按键反馈
        this.keyFeedbacks = [];
        
        // 连击弹出数字
        this.comboPopups = [];
        
        // 优化：缓存样式和渐变
        this._cachedGradients = {};
        this._arcadeStyle = {
            primaryColor: '#f39c12',
            secondaryColor: '#e74c3c',
            accentColor: '#ffd700',
            bgColor: 'rgba(0, 0, 0, 0.8)',
            borderColor: '#fff',
            glowColor: 'rgba(243, 156, 18, 0.5)'
        };
        
        // 优化：缓存角色颜色
        this._robeColors = {
            'GUANYU': '#c41e3a',
            'ZHANGFEI': '#1a1a2e',
            'ZHAOYUN': '#f8f8ff'
        };
    }
    
    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }
    
    update(deltaTime) {
        // 优化：使用位运算加速
        if (this.displayScore < this.score) {
            this.displayScore += ((this.score - this.displayScore) * 0.1) | 0;
            if (this.displayScore > this.score) this.displayScore = this.score;
        }
        
        if (this.combo > 0) {
            this.comboTimer -= deltaTime;
            if (this.comboTimer <= 0) {
                this.combo = 0;
                this.comboScale = 1;
            } else {
                this.comboScale = 1 + Math.sin(this.comboTimer * 10) * 0.1;
            }
        }
        
        // 优化：批量更新消息
        const now = Date.now();
        for (let i = this.messages.length - 1; i >= 0; i--) {
            const msg = this.messages[i];
            msg.timer -= deltaTime;
            msg.y -= 20 * deltaTime;
            if (msg.timer <= 0) {
                this.messages.splice(i, 1);
            }
        }
        
        // 优化：批量更新伤害数字
        for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
            const dn = this.damageNumbers[i];
            dn.y -= 50 * deltaTime;
            dn.alpha -= deltaTime * 2;
            dn.scale += deltaTime * 2;
            if (dn.alpha <= 0) {
                this.damageNumbers.splice(i, 1);
            }
        }
        
        // 更新屏幕震动
        if (this.shakeTime > 0) {
            this.shakeTime -= deltaTime;
            if (this.shakeTime <= 0) {
                this.shakeIntensity = 0;
            }
        }
        
        // 更新按键反馈
        for (let i = this.keyFeedbacks.length - 1; i >= 0; i--) {
            const kf = this.keyFeedbacks[i];
            kf.timer -= deltaTime;
            kf.scale -= deltaTime * 3;
            if (kf.timer <= 0 || kf.scale <= 0) {
                this.keyFeedbacks.splice(i, 1);
            }
        }
        
        // 更新连击弹出数字
        for (let i = this.comboPopups.length - 1; i >= 0; i--) {
            const cp = this.comboPopups[i];
            cp.y -= 80 * deltaTime;
            cp.alpha -= deltaTime * 1.5;
            cp.rotation += deltaTime * 5;
            if (cp.alpha <= 0) {
                this.comboPopups.splice(i, 1);
            }
        }
        
        // 优化：技能冷却
        for (let i = 0, len = this.skills.length; i < len; i++) {
            const skill = this.skills[i];
            if (skill.cooldown > 0) {
                skill.cooldown -= deltaTime;
            }
        }
    }
    
    render() {
        if (!this.ctx) return;
        
        // 应用屏幕震动
        if (this.shakeTime > 0 && this.shakeIntensity > 0) {
            this.ctx.save();
            const shakeX = (Math.random() - 0.5) * this.shakeIntensity;
            const shakeY = (Math.random() - 0.5) * this.shakeIntensity;
            this.ctx.translate(shakeX, shakeY);
        }
        
        this.renderPlayerInfo();
        this.renderGameInfo();
        
        if (this.combo > 1) {
            this.renderCombo();
        }
        
        // 渲染连击弹出数字
        this.renderComboPopups();
        
        // 渲染按键反馈
        this.renderKeyFeedbacks();
        
        if (this.skills.length > 0) {
            this.renderSkills();
        }
        
        if (this.messages.length > 0) {
            this.renderMessages();
        }
        
        if (this.bossInfo) {
            this.renderBossBar();
        }
        
        if (this.isPaused) {
            this.renderPause();
        }
        
        if (this.gameOver) {
            this.renderGameOver();
        }
        
        // 恢复屏幕震动
        if (this.shakeTime > 0 && this.shakeIntensity > 0) {
            this.ctx.restore();
        }
    }
    
    renderPlayerInfo() {
        const x = 15, y = 15;
        const barWidth = 220, barHeight = 25;
        
        this.renderArcadePanel(x, y, barWidth + 80, barHeight * 3 + 20);
        
        const ctx = this.ctx;
        ctx.fillStyle = this._arcadeStyle.accentColor;
        ctx.font = 'bold 18px "Press Start 2P", Arial';
        ctx.textAlign = 'left';
        ctx.shadowColor = this._arcadeStyle.primaryColor;
        ctx.shadowBlur = 8;
        ctx.fillText(this.playerName, x + 70, y + 25);
        ctx.shadowBlur = 0;
        
        // 头像框
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(x + 5, y + 5, 55, 55);
        ctx.strokeStyle = this._arcadeStyle.accentColor;
        ctx.lineWidth = 3;
        ctx.strokeRect(x + 5, y + 5, 55, 55);
        
        this.renderCharacterAvatar(x + 32, y + 32);
        
        // 优化：缓存血条渐变
        const healthX = x + 70, healthY = y + 35;
        const healthKey = `health_${barWidth}_${barHeight}`;
        if (!this._cachedGradients[healthKey]) {
            const grad = ctx.createLinearGradient(healthX, healthY, healthX + barWidth, healthY);
            grad.addColorStop(0, '#c0392b');
            grad.addColorStop(0.3, '#e74c3c');
            grad.addColorStop(0.6, '#e67e22');
            grad.addColorStop(1, '#f39c12');
            this._cachedGradients[healthKey] = grad;
        }
        
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(healthX, healthY, barWidth, barHeight);
        
        ctx.strokeStyle = this._arcadeStyle.borderColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(healthX, healthY, barWidth, barHeight);
        
        const healthPercent = Math.max(0, this.playerHealth / this.playerMaxHealth);
        ctx.fillStyle = this._cachedGradients[healthKey];
        ctx.fillRect(healthX + 2, healthY + 2, (barWidth - 4) * healthPercent, barHeight - 4);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(healthX + 2, healthY + 2, (barWidth - 4) * healthPercent, barHeight / 3);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 3;
        ctx.fillText(`${Math.floor(this.playerHealth)}/${this.playerMaxHealth}`, healthX + barWidth / 2, healthY + 18);
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = this._arcadeStyle.accentColor;
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('HP', healthX - 10, healthY + 18);
        
        // 法力条
        const manaY = healthY + barHeight + 8;
        const manaKey = `mana_${barWidth}`;
        if (!this._cachedGradients[manaKey]) {
            const grad = ctx.createLinearGradient(healthX, manaY, healthX + barWidth, manaY);
            grad.addColorStop(0, '#1abc9c');
            grad.addColorStop(0.5, '#3498db');
            grad.addColorStop(1, '#2980b9');
            this._cachedGradients[manaKey] = grad;
        }
        
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(healthX, manaY, barWidth, 18);
        ctx.strokeStyle = this._arcadeStyle.borderColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(healthX, manaY, barWidth, 18);
        
        const manaPercent = Math.max(0, this.playerMana / this.playerMaxMana);
        ctx.fillStyle = this._cachedGradients[manaKey];
        ctx.fillRect(healthX + 2, manaY + 2, (barWidth - 4) * manaPercent, 18 - 4);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.floor(this.playerMana)}/${this.playerMaxMana}`, healthX + barWidth / 2, manaY + 13);
        
        ctx.fillStyle = this._arcadeStyle.accentColor;
        ctx.textAlign = 'right';
        ctx.fillText('MP', healthX - 10, manaY + 13);
        
        this.renderLives(x + barWidth + 80, y + 40);
    }
    
    renderCharacterAvatar(cx, cy) {
        const ctx = this.ctx;
        const robeColor = this._robeColors[this.playerCharacter] || this._robeColors.GUANYU;
        
        ctx.fillStyle = '#f5d0b0';
        ctx.beginPath();
        ctx.arc(cx, cy - 5, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(cx, cy - 8, 13, Math.PI, 0);
        ctx.fill();
        
        ctx.fillStyle = robeColor;
        ctx.beginPath();
        ctx.moveTo(cx - 15, cy + 5);
        ctx.lineTo(cx + 15, cy + 5);
        ctx.lineTo(cx + 18, cy + 20);
        ctx.lineTo(cx - 18, cy + 20);
        ctx.closePath();
        ctx.fill();
    }
    
    renderLives(x, y) {
        const ctx = this.ctx;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        
        for (let i = 0; i < this.lives; i++) {
            const lifeX = x + i * 22;
            ctx.shadowColor = '#e74c3c';
            ctx.shadowBlur = 5;
            ctx.fillStyle = '#e74c3c';
            ctx.fillText('❤', lifeX, y);
        }
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = this._arcadeStyle.accentColor;
        ctx.font = '12px Arial';
        ctx.fillText('×', x - 15, y);
    }
    
    renderGameInfo() {
        const x = this.canvas.width - 20, y = 20;
        
        this.renderArcadePanel(x - 150, y, 165, 100);
        
        const ctx = this.ctx;
        ctx.textAlign = 'right';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 3;
        
        ctx.fillStyle = this._arcadeStyle.accentColor;
        ctx.font = 'bold 14px Arial';
        ctx.fillText('SCORE', x, y + 15);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px "Press Start 2P", Arial';
        ctx.fillText(this.displayScore.toLocaleString(), x, y + 45);
        
        const minutes = Math.floor(this.time / 60);
        const seconds = Math.floor(this.time % 60);
        const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        const timeColor = this.time < 10 ? '#e74c3c' : this._arcadeStyle.primaryColor;
        ctx.fillStyle = timeColor;
        ctx.font = 'bold 14px Arial';
        ctx.fillText('TIME', x, y + 70);
        
        ctx.fillStyle = this.time < 10 ? '#e74c3c' : '#2ecc71';
        ctx.font = 'bold 20px "Press Start 2P", Arial';
        
        if (this.time < 10) {
            ctx.globalAlpha = 0.7 + Math.sin(Date.now() / 200) * 0.3;
        }
        ctx.fillText(timeStr, x, y + 95);
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }
    
    renderArcadePanel(x, y, width, height) {
        const ctx = this.ctx;
        
        ctx.fillStyle = this._arcadeStyle.bgColor;
        ctx.fillRect(x, y, width, height);
        
        ctx.strokeStyle = this._arcadeStyle.borderColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 4, y + 4, width - 8, height - 8);
        
        const cornerSize = 8;
        ctx.fillStyle = this._arcadeStyle.accentColor;
        ctx.fillRect(x, y, cornerSize, 3);
        ctx.fillRect(x, y, 3, cornerSize);
        ctx.fillRect(x + width - cornerSize, y, cornerSize, 3);
        ctx.fillRect(x + width - 3, y, 3, cornerSize);
        ctx.fillRect(x, y + height - 3, cornerSize, 3);
        ctx.fillRect(x, y + height - cornerSize, 3, cornerSize);
        ctx.fillRect(x + width - cornerSize, y + height - 3, cornerSize, 3);
        ctx.fillRect(x + width - 3, y + height - cornerSize, 3, cornerSize);
    }
    
    renderCombo() {
        const x = this.canvas.width / 2, y = 150;
        
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.scale(this.comboScale, this.comboScale);
        
        const glowSize = 80 + this.combo * 2;
        const glowGradient = this.ctx.createRadialGradient(0, 0, 20, 0, 0, glowSize);
        glowGradient.addColorStop(0, `rgba(243, 156, 18, ${0.4 + this.combo * 0.01})`);
        glowGradient.addColorStop(0.5, `rgba(231, 76, 60, ${0.2 + this.combo * 0.005})`);
        glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        this.ctx.fillStyle = glowGradient;
        this.ctx.fillRect(-glowSize, -glowSize, glowSize * 2, glowSize * 2);
        
        this.ctx.shadowColor = '#e74c3c';
        this.ctx.shadowBlur = 15;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.fillText('COMBO', 0, -35);
        
        this.ctx.fillStyle = this._arcadeStyle.accentColor;
        this.ctx.font = 'bold 64px "Press Start 2P", Arial';
        this.ctx.fillText(this.combo, 0, 15);
        
        let rating = '', ratingColor = '#fff';
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
    
    renderSkills() {
        if (this.skills.length === 0) return;
        
        const x = 20, y = this.canvas.height - 90;
        const slotSize = 55, gap = 12;
        const ctx = this.ctx;
        
        this.renderArcadePanel(x - 10, y - 10, this.skills.length * (slotSize + gap) - gap + 20, slotSize + 20);
        
        const icons = ['⚔️', '🔥', '⚡', '🛡️', '💫'];
        
        for (let i = 0, len = this.skills.length; i < len; i++) {
            const skill = this.skills[i];
            const slotX = x + i * (slotSize + gap);
            
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(slotX, y, slotSize, slotSize);
            
            ctx.strokeStyle = skill.cooldown > 0 ? '#666' : this._arcadeStyle.accentColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(slotX, y, slotSize, slotSize);
            
            ctx.fillStyle = skill.cooldown > 0 ? '#666' : '#fff';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(icons[i % icons.length], slotX + slotSize / 2, y + slotSize / 2 - 5);
            
            ctx.font = '10px Arial';
            ctx.fillText(skill.name.substring(0, 6), slotX + slotSize / 2, y + slotSize - 8);
            
            if (skill.cooldown > 0) {
                const cooldownPercent = Math.min(1, skill.cooldown / skill.maxCooldown);
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(slotX, y + slotSize * (1 - cooldownPercent), slotSize, slotSize * cooldownPercent);
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 16px Arial';
                ctx.fillText(Math.ceil(skill.cooldown), slotX + slotSize / 2, y + slotSize / 2 + 20);
            }
        }
    }
    
    renderMessages() {
        const x = this.canvas.width / 2;
        let y = 250;
        const ctx = this.ctx;
        
        for (let i = 0, len = this.messages.length; i < len; i++) {
            const msg = this.messages[i];
            ctx.save();
            ctx.globalAlpha = Math.min(1, msg.timer / 0.5);
            ctx.fillStyle = msg.color || '#fff';
            ctx.font = 'bold 28px "Press Start 2P", Arial';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 6;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            ctx.fillText(msg.text, x, y);
            ctx.restore();
            y += 50;
        }
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }
    
    renderBossBar() {
        if (!this.bossInfo) return;
        
        const barWidth = 500, barHeight = 35;
        const x = (this.canvas.width - barWidth) / 2, y = 70;
        const ctx = this.ctx;
        
        ctx.fillStyle = '#e74c3c';
        ctx.font = 'bold 20px "Press Start 2P", Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#e74c3c';
        ctx.shadowBlur = 10;
        ctx.fillText(this.bossInfo.name, this.canvas.width / 2, y - 10);
        ctx.shadowBlur = 0;
        
        const bossKey = `boss_${barWidth}_${barHeight}`;
        if (!this._cachedGradients[bossKey]) {
            const grad = ctx.createLinearGradient(x, y, x + barWidth, y);
            grad.addColorStop(0, '#8b0000');
            grad.addColorStop(0.3, '#c0392b');
            grad.addColorStop(0.6, '#e74c3c');
            grad.addColorStop(1, '#ff6b6b');
            this._cachedGradients[bossKey] = grad;
        }
        
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(x, y, barWidth, barHeight);
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, barWidth, barHeight);
        
        const healthPercent = Math.max(0, this.bossInfo.health / this.bossInfo.maxHealth);
        ctx.fillStyle = this._cachedGradients[bossKey];
        ctx.fillRect(x + 3, y + 3, (barWidth - 6) * healthPercent, barHeight - 6);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(x + 3, y + 3, (barWidth - 6) * healthPercent, barHeight / 3);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`${Math.floor(this.bossInfo.health)}/${this.bossInfo.maxHealth}`, x + barWidth - 10, y + barHeight / 2 + 5);
    }
    
    renderPause() {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        ctx.fillStyle = this._arcadeStyle.accentColor;
        ctx.font = 'bold 60px "Press Start 2P", Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = this._arcadeStyle.accentColor;
        ctx.shadowBlur = 15;
        ctx.fillText('PAUSE', this.canvas.width / 2, this.canvas.height / 2 - 30);
        
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.shadowBlur = 0;
        ctx.fillText('按 P 继续游戏', this.canvas.width / 2, this.canvas.height / 2 + 40);
    }
    
    renderGameOver() {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        const isVictory = this.gameOverReason === 'victory';
        const titleColor = isVictory ? '#f39c12' : '#e74c3c';
        
        ctx.fillStyle = titleColor;
        ctx.font = 'bold 72px "Press Start 2P", Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = titleColor;
        ctx.shadowBlur = 20;
        ctx.fillText(isVictory ? 'VICTORY!' : 'GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 80);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 28px Arial';
        ctx.shadowBlur = 0;
        ctx.fillText(`最终分数：${this.score.toLocaleString()}`, this.canvas.width / 2, this.canvas.height / 2);
        
        ctx.fillStyle = this._arcadeStyle.accentColor;
        ctx.fillText(`最大连击：${this.maxCombo}`, this.canvas.width / 2, this.canvas.height / 2 + 50);
        
        ctx.fillStyle = '#2ecc71';
        ctx.font = 'bold 20px "Press Start 2P", Arial';
        ctx.fillText('按 R 重新开始', this.canvas.width / 2, this.canvas.height / 2 + 120);
    }
    
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
        this.messages.push({ text, color: color || '#fff', timer: this.messageDuration, y: 250 });
    }
    
    showDamage(x, y, damage, isCritical = false) {
        this.damageNumbers.push({ x, y, damage, isCritical, alpha: 1, scale: isCritical ? 1.5 : 1, vy: -50 });
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
        this.shakeTime = 0;
        this.shakeIntensity = 0;
        this.keyFeedbacks = [];
        this.comboPopups = [];
    }
    
    /**
     * 触发屏幕震动
     */
    triggerShake(intensity = 10, duration = 0.3) {
        this.shakeIntensity = intensity;
        this.shakeTime = duration;
    }
    
    /**
     * 显示按键反馈
     */
    showKeyFeedback(key, x, y) {
        this.keyFeedbacks.push({
            key: key,
            x: x,
            y: y,
            timer: 0.3,
            scale: 1,
            alpha: 1
        });
    }
    
    /**
     * 渲染按键反馈
     */
    renderKeyFeedbacks() {
        this.keyFeedbacks.forEach(kf => {
            this.ctx.save();
            this.ctx.translate(kf.x, kf.y);
            this.ctx.scale(kf.scale, kf.scale);
            this.ctx.globalAlpha = kf.alpha;
            
            // 绘制按键圆圈
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 20, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(243, 156, 18, 0.5)';
            this.ctx.fill();
            this.ctx.strokeStyle = '#f39c12';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // 绘制按键文字
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(kf.key, 0, 0);
            
            this.ctx.restore();
        });
    }
    
    /**
     * 显示连击弹出数字
     */
    showComboPopup(combo, x, y) {
        this.comboPopups.push({
            combo: combo,
            x: x,
            y: y,
            alpha: 1,
            scale: 1.5,
            rotation: 0
        });
    }
    
    /**
     * 渲染连击弹出数字
     */
    renderComboPopups() {
        this.comboPopups.forEach(cp => {
            this.ctx.save();
            this.ctx.translate(cp.x, cp.y);
            this.ctx.rotate(cp.rotation);
            this.ctx.scale(cp.scale, cp.scale);
            this.ctx.globalAlpha = cp.alpha;
            
            // 绘制连击数字
            this.ctx.fillStyle = '#f39c12';
            this.ctx.font = 'bold 36px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.shadowColor = '#e74c3c';
            this.ctx.shadowBlur = 10;
            this.ctx.fillText('+' + cp.combo + ' COMBO', 0, 0);
            
            this.ctx.restore();
        });
        this.ctx.shadowBlur = 0;
    }
}

window.HUD = HUD;
