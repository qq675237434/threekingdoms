/**
 * Tutorial.js - 新手引导系统
 * 在前 30 秒显示操作指引，帮助新玩家快速上手
 */

class Tutorial {
    constructor(game) {
        this.game = game;
        this.canvas = null;
        this.ctx = null;
        this.isActive = false;
        this.startTime = 0;
        this.duration = 30; // 30 秒教学时间
        this.currentStep = 0;
        this.steps = [];
        this.messageTimer = 0;
        this.messageInterval = 3; // 每条消息显示 3 秒
        this.hasShownAttackHint = false;
    }
    
    /**
     * 初始化新手引导
     */
    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // 定义教学步骤
        this.steps = [
            {
                text: '🎯 使用 A/D 或 ←/→ 移动',
                duration: 3,
                icon: '⬅️➡️'
            },
            {
                text: '⚔️ 按 J 键攻击敌人',
                duration: 3,
                icon: '🗡️'
            },
            {
                text: '🔥 按 K 键释放技能',
                duration: 3,
                icon: '💥'
            },
            {
                text: '🎯 击败所有敌人进入下一关',
                duration: 4,
                icon: '🏆'
            }
        ];
    }
    
    /**
     * 开始新手引导
     */
    start() {
        this.isActive = true;
        this.startTime = Date.now();
        this.currentStep = 0;
        this.messageTimer = 0;
        this.hasShownAttackHint = false;
        
        console.log('📚 新手引导开始');
        
        // 显示第一条消息
        if (this.game && this.game.hud) {
            this.showStep(0);
        }
    }
    
    /**
     * 显示教学步骤
     */
    showStep(index) {
        if (index >= 0 && index < this.steps.length) {
            const step = this.steps[index];
            if (this.game && this.game.hud) {
                this.game.hud.showMessage(`${step.icon} ${step.text}`, '#f39c12');
            }
        }
    }
    
    /**
     * 更新新手引导
     */
    update(deltaTime) {
        if (!this.isActive) return;
        
        // 检查是否超过总时间
        const elapsed = (Date.now() - this.startTime) / 1000;
        if (elapsed >= this.duration) {
            this.end();
            return;
        }
        
        // 更新消息计时器
        this.messageTimer += deltaTime;
        if (this.messageTimer >= this.messageInterval && this.currentStep < this.steps.length) {
            this.currentStep++;
            this.messageTimer = 0;
            if (this.currentStep < this.steps.length) {
                this.showStep(this.currentStep);
            }
        }
    }
    
    /**
     * 渲染新手引导
     */
    render() {
        if (!this.isActive || !this.ctx) return;
        
        // 在屏幕右下角显示操作提示卡
        const cardX = this.canvas.width - 220;
        const cardY = this.canvas.height - 180;
        const cardWidth = 200;
        const cardHeight = 160;
        
        // 半透明背景
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(cardX, cardY, cardWidth, cardHeight);
        
        // 边框
        this.ctx.strokeStyle = '#f39c12';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(cardX, cardY, cardWidth, cardHeight);
        
        // 标题
        this.ctx.fillStyle = '#f39c12';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('📖 操作指南', cardX + cardWidth / 2, cardY + 30);
        
        // 操作列表
        this.ctx.fillStyle = '#ecf0f1';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'left';
        
        const controls = [
            { key: 'A/D 或 ←/→', action: '移动', y: cardY + 60 },
            { key: 'J', action: '攻击', y: cardY + 85 },
            { key: 'K', action: '技能', y: cardY + 110 },
            { key: 'W/↑', action: '跳跃', y: cardY + 135 }
        ];
        
        controls.forEach(ctrl => {
            // 按键
            this.ctx.fillStyle = '#3498db';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.fillText(ctrl.key, cardX + 20, ctrl.y);
            
            // 动作
            this.ctx.fillStyle = '#bdc3c7';
            this.ctx.font = '12px Arial';
            this.ctx.fillText(ctrl.action, cardX + 100, ctrl.y);
        });
        
        // 倒计时
        const elapsed = (Date.now() - this.startTime) / 1000;
        const remaining = Math.max(0, this.duration - elapsed);
        
        this.ctx.fillStyle = '#95a5a6';
        this.ctx.font = '11px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`提示剩余：${Math.ceil(remaining)}秒`, cardX + cardWidth / 2, cardY + cardHeight - 15);
    }
    
    /**
     * 显示攻击提示（第一个敌人出现时）
     */
    showAttackHint() {
        if (!this.isActive || this.hasShownAttackHint) return;
        
        this.hasShownAttackHint = true;
        
        if (this.game && this.game.hud) {
            this.game.hud.showMessage('⚔️ 按 J 键攻击！', '#e74c3c');
        }
    }
    
    /**
     * 结束新手引导
     */
    end() {
        this.isActive = false;
        
        if (this.game && this.game.hud) {
            this.game.hud.showMessage('🎮 开始战斗吧！', '#2ecc71');
        }
        
        console.log('📚 新手引导结束');
    }
    
    /**
     * 跳过新手引导
     */
    skip() {
        this.end();
    }
}

// 导出
window.Tutorial = Tutorial;
