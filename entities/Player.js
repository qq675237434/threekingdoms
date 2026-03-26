/**
 * Player.js - 玩家角色模块
 * 负责管理玩家角色的状态、行为和渲染
 */
class Player {
    constructor(config = {}) {
        // 基本属性
        this.name = config.name || '玩家';
        this.x = config.x || 100;
        this.y = config.y || 400;
        this.width = config.width || 50;
        this.height = config.height || 80;
        
        // 战斗属性
        this.maxHealth = config.maxHealth || 100;
        this.health = this.maxHealth;
        this.maxMana = config.maxMana || 50;
        this.mana = this.maxMana;
        this.attack = config.attack || 10;
        this.defense = config.defense || 5;
        this.speed = config.speed || 200; // 像素/秒
        
        // 状态
        this.velocityX = 0;
        this.velocityY = 0;
        this.isGrounded = false;
        this.isAttacking = false;
        this.isHit = false;
        this.isDead = false;
        this.facing = config.facing || 1; // 1: 右，-1: 左
        
        // 动画
        this.currentFrame = 0;
        this.animationTimer = 0;
        this.animationSpeed = 0.1; // 秒/帧
        this.state = 'idle'; // idle, walk, attack, hit, jump
        
        // 技能系统
        this.skillManager = new SkillManager(this);
        this.initSkills();
        
        // 碰撞体
        this.hitbox = {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
        
        // 攻击判定框
        this.attackBox = {
            x: 0,
            y: 0,
            width: 60,
            height: 40,
            active: false
        };
    }
    
    /**
     * 初始化技能
     */
    initSkills() {
        // 添加预设技能
        this.skillManager.addSkill(PRESET_SKILLS.BASIC_ATTACK);
        this.skillManager.addSkill(PRESET_SKILLS.SPECIAL_ATTACK);
        this.skillManager.addSkill(PRESET_SKILLS.PROJECTILE);
    }
    
    /**
     * 更新玩家状态
     * @param {number} deltaTime - 帧间隔时间 (秒)
     * @param {object} input - 输入状态
     */
    update(deltaTime, input) {
        if (this.isDead) return;
        
        // 更新技能冷却
        this.skillManager.update(deltaTime);
        
        // 处理输入
        this.handleInput(input, deltaTime);
        
        // 应用物理
        this.applyPhysics(deltaTime);
        
        // 更新位置
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;
        
        // 更新碰撞体
        this.updateHitbox();
        
        // 更新攻击框
        if (this.isAttacking) {
            this.attackBox.x = this.facing === 1 ? this.x + this.width : this.x - this.attackBox.width;
            this.attackBox.y = this.y + 20;
        }
        
        // 边界检查
        this.checkBounds();
        
        // 更新动画
        this.updateAnimation(deltaTime);
    }
    
    /**
     * 处理输入
     * @param {object} input
     * @param {number} deltaTime
     */
    handleInput(input, deltaTime) {
        // 水平移动
        this.velocityX = 0;
        if (input.left) {
            this.velocityX = -this.speed;
            this.facing = -1;
            this.state = 'walk';
        } else if (input.right) {
            this.velocityX = this.speed;
            this.facing = 1;
            this.state = 'walk';
        } else {
            this.state = 'idle';
        }
        
        // 跳跃
        if (input.jump && this.isGrounded) {
            this.velocityY = -400; // 跳跃力度
            this.isGrounded = false;
            this.state = 'jump';
        }
        
        // 攻击
        if (input.attack && !this.isAttacking) {
            this.attack();
        }
        
        // 使用技能
        if (input.skill) {
            this.useSkill();
        }
    }
    
    /**
     * 应用物理
     * @param {number} deltaTime
     */
    applyPhysics(deltaTime) {
        // 重力
        const gravity = 800; // 像素/秒²
        this.velocityY += gravity * deltaTime;
        
        // 地面检测 (简化版)
        const groundY = 520;
        if (this.y + this.height >= groundY) {
            this.y = groundY - this.height;
            this.velocityY = 0;
            this.isGrounded = true;
        }
    }
    
    /**
     * 更新碰撞体
     */
    updateHitbox() {
        this.hitbox.x = this.x;
        this.hitbox.y = this.y;
    }
    
    /**
     * 边界检查
     */
    checkBounds() {
        const canvasWidth = 800;
        const canvasHeight = 600;
        
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > canvasWidth) this.x = canvasWidth - this.width;
        if (this.y < 0) this.y = 0;
    }
    
    /**
     * 更新动画
     * @param {number} deltaTime
     */
    updateAnimation(deltaTime) {
        this.animationTimer += deltaTime;
        if (this.animationTimer >= this.animationSpeed) {
            this.animationTimer = 0;
            this.currentFrame = (this.currentFrame + 1) % 4;
        }
    }
    
    /**
     * 执行攻击
     */
    attack() {
        this.isAttacking = true;
        this.attackBox.active = true;
        this.state = 'attack';
        
        // 攻击持续短暂时间
        setTimeout(() => {
            this.isAttacking = false;
            this.attackBox.active = false;
        }, 300);
    }
    
    /**
     * 使用技能
     */
    useSkill() {
        // 简单实现：使用必杀技
        this.skillManager.useSkill('special_attack', null);
    }
    
    /**
     * 受到伤害
     * @param {number} damage - 伤害值
     */
    takeDamage(damage) {
        const actualDamage = Math.max(1, damage - this.defense);
        this.health -= actualDamage;
        this.isHit = true;
        
        console.log(`${this.name} 受到 ${actualDamage} 点伤害，剩余生命：${this.health}`);
        
        if (this.health <= 0) {
            this.die();
        }
        
        // 重置受击状态
        setTimeout(() => {
            this.isHit = false;
        }, 500);
    }
    
    /**
     * 死亡
     */
    die() {
        this.isDead = true;
        this.health = 0;
        console.log(`${this.name} 被击败了!`);
    }
    
    /**
     * 治疗
     * @param {number} amount - 治疗量
     */
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }
    
    /**
     * 恢复法力
     * @param {number} amount - 恢复量
     */
    restoreMana(amount) {
        this.mana = Math.min(this.maxMana, this.mana + amount);
    }
    
    /**
     * 渲染玩家
     * @param {CanvasRenderingContext2D} ctx
     */
    render(ctx) {
        ctx.save();
        
        // 受击闪白效果
        if (this.isHit) {
            ctx.globalAlpha = 0.5;
        }
        
        // 绘制角色 (简化为矩形，实际可替换为精灵图)
        ctx.fillStyle = this.isDead ? '#666' : '#3498db';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 绘制方向指示
        ctx.fillStyle = '#fff';
        const eyeX = this.facing === 1 ? this.x + 35 : this.x + 10;
        ctx.fillRect(eyeX, this.y + 15, 8, 8);
        
        // 绘制攻击框 (调试用)
        if (this.attackBox.active) {
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 2;
            ctx.strokeRect(
                this.attackBox.x,
                this.attackBox.y,
                this.attackBox.width,
                this.attackBox.height
            );
        }
        
        // 绘制血条
        this.renderHealthBar(ctx);
        
        // 绘制法力条
        this.renderManaBar(ctx);
        
        ctx.restore();
    }
    
    /**
     * 渲染血条
     * @param {CanvasRenderingContext2D} ctx
     */
    renderHealthBar(ctx) {
        const barWidth = 60;
        const barHeight = 6;
        const x = this.x;
        const y = this.y - 15;
        
        // 背景
        ctx.fillStyle = '#333';
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // 血量
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = healthPercent > 0.5 ? '#2ecc71' : healthPercent > 0.25 ? '#f39c12' : '#e74c3c';
        ctx.fillRect(x, y, barWidth * healthPercent, barHeight);
        
        // 边框
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barWidth, barHeight);
    }
    
    /**
     * 渲染法力条
     * @param {CanvasRenderingContext2D} ctx
     */
    renderManaBar(ctx) {
        const barWidth = 60;
        const barHeight = 4;
        const x = this.x;
        const y = this.y - 8;
        
        // 背景
        ctx.fillStyle = '#333';
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // 法力
        const manaPercent = this.mana / this.maxMana;
        ctx.fillStyle = '#3498db';
        ctx.fillRect(x, y, barWidth * manaPercent, barHeight);
    }
    
    /**
     * 获取碰撞体
     * @returns {object}
     */
    getHitbox() {
        return this.hitbox;
    }
    
    /**
     * 获取攻击框
     * @returns {object}
     */
    getAttackBox() {
        return this.attackBox;
    }
    
    /**
     * 重置玩家状态
     */
    reset() {
        this.health = this.maxHealth;
        this.mana = this.maxMana;
        this.isDead = false;
        this.isHit = false;
        this.isAttacking = false;
        this.x = 100;
        this.y = 400;
        this.velocityX = 0;
        this.velocityY = 0;
    }
}

// 导出
window.Player = Player;
