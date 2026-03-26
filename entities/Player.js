/**
 * Player.js - 玩家角色模块（美化版）
 * 支持关羽、张飞、赵云三个角色，每个角色有独特外观和武器
 * 实现状态机、动画帧、武器绘制
 */

// 角色配置（美化版）
const CharacterConfig = {
    GUANYU: {
        name: '关羽',
        weapon: '青龙偃月刀',
        robeColor: '#c41e3a',      // 红色战袍
        skinColor: '#f5d0b0',      // 肤色
        hairColor: '#1a1a1a',      // 黑色头发
        weaponColor: '#2d5016',    // 青龙刀颜色
        accentColor: '#ffd700',    // 金色装饰
        attackRange: 80,
        attackDamage: 25,
        moveSpeed: 200,
        maxHealth: 120,
        maxMana: 50
    },
    ZHANGFEI: {
        name: '张飞',
        weapon: '蛇矛',
        robeColor: '#1a1a2e',      // 黑色战袍
        skinColor: '#d4a574',      // 深色肤色
        hairColor: '#1a1a1a',
        weaponColor: '#4a4a6a',    // 蛇矛颜色
        accentColor: '#8b0000',    // 暗红装饰
        attackRange: 70,
        attackDamage: 30,
        moveSpeed: 180,
        maxHealth: 150,
        maxMana: 40
    },
    ZHAOYUN: {
        name: '赵云',
        weapon: '长枪',
        robeColor: '#f8f8ff',      // 白色战袍
        skinColor: '#f5e6d3',      // 白皙肤色
        hairColor: '#1a1a1a',
        weaponColor: '#c0c0c0',    // 银枪颜色
        accentColor: '#4169e1',    // 蓝色装饰
        attackRange: 75,
        attackDamage: 22,
        moveSpeed: 220,
        maxHealth: 100,
        maxMana: 60
    }
};

// 动画帧配置
const AnimationFrames = {
    idle: { frames: 4, speed: 0.15 },
    walk: { frames: 6, speed: 0.1 },
    attack: { frames: 4, speed: 0.08 },
    hit: { frames: 2, speed: 0.2 },
    jump: { frames: 1, speed: 0.1 }
};

class Player {
    constructor(config = {}) {
        // 角色选择
        this.characterType = config.characterType || 'GUANYU';
        const charConfig = CharacterConfig[this.characterType] || CharacterConfig.GUANYU;
        
        // 基本属性
        this.name = charConfig.name;
        this.weapon = charConfig.weapon;
        this.x = config.x || 100;
        this.y = config.y || 400;
        this.width = 50;
        this.height = 80;
        
        // 角色颜色配置
        this.robeColor = charConfig.robeColor;
        this.skinColor = charConfig.skinColor;
        this.hairColor = charConfig.hairColor;
        this.weaponColor = charConfig.weaponColor;
        this.accentColor = charConfig.accentColor;
        
        // 战斗属性
        this.maxHealth = charConfig.maxHealth;
        this.health = this.maxHealth;
        this.maxMana = charConfig.maxMana;
        this.mana = this.maxMana;
        this.attack = charConfig.attackDamage;
        this.defense = config.defense || 5;
        this.speed = charConfig.moveSpeed;
        
        // 状态
        this.velocityX = 0;
        this.velocityY = 0;
        this.isGrounded = false;
        this.isAttacking = false;
        this.isHit = false;
        this.isDead = false;
        this.facing = config.facing || 1;
        
        // 动画系统
        this.currentFrame = 0;
        this.animationTimer = 0;
        this.state = 'idle';
        this.animConfig = AnimationFrames.idle;
        
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
        
        // 武器动画
        this.weaponAngle = 0;
        this.weaponSwing = 0;
    }
    
    /**
     * 初始化技能
     */
    initSkills() {
        this.skillManager.addSkill(PRESET_SKILLS.BASIC_ATTACK);
        this.skillManager.addSkill(PRESET_SKILLS.SPECIAL_ATTACK);
        this.skillManager.addSkill(PRESET_SKILLS.PROJECTILE);
    }
    
    /**
     * 更新玩家状态
     */
    update(deltaTime, input) {
        if (this.isDead) return;
        
        this.skillManager.update(deltaTime);
        this.handleInput(input, deltaTime);
        this.applyPhysics(deltaTime);
        
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;
        
        this.updateHitbox();
        this.updateAttackBox();
        this.checkBounds();
        this.updateAnimation(deltaTime);
        this.updateWeaponAnimation();
    }
    
    /**
     * 处理输入
     */
    handleInput(input, deltaTime) {
        this.velocityX = 0;
        
        if (input.left) {
            this.velocityX = -this.speed;
            this.facing = -1;
            this.changeState('walk');
        } else if (input.right) {
            this.velocityX = this.speed;
            this.facing = 1;
            this.changeState('walk');
        } else if (this.state === 'walk') {
            this.changeState('idle');
        }
        
        if (input.jump && this.isGrounded) {
            this.velocityY = -400;
            this.isGrounded = false;
            this.changeState('jump');
        }
        
        if (input.attack && !this.isAttacking) {
            this.attack();
        }
        
        if (input.skill) {
            this.useSkill();
        }
    }
    
    /**
     * 应用物理
     */
    applyPhysics(deltaTime) {
        const gravity = 800;
        this.velocityY += gravity * deltaTime;
        
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
     * 更新攻击框
     */
    updateAttackBox() {
        if (this.isAttacking) {
            this.attackBox.x = this.facing === 1 ? this.x + this.width : this.x - this.attackBox.width;
            this.attackBox.y = this.y + 20;
        }
    }
    
    /**
     * 边界检查
     */
    checkBounds() {
        const canvasWidth = 800;
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > canvasWidth) this.x = canvasWidth - this.width;
        if (this.y < 0) this.y = 0;
    }
    
    /**
     * 改变状态
     */
    changeState(newState) {
        if (this.state === newState) return;
        
        this.state = newState;
        this.animConfig = AnimationFrames[newState] || AnimationFrames.idle;
        this.currentFrame = 0;
        this.animationTimer = 0;
    }
    
    /**
     * 更新动画
     */
    updateAnimation(deltaTime) {
        this.animationTimer += deltaTime;
        if (this.animationTimer >= this.animConfig.speed) {
            this.animationTimer = 0;
            this.currentFrame = (this.currentFrame + 1) % this.animConfig.frames;
        }
    }
    
    /**
     * 更新武器动画
     */
    updateWeaponAnimation() {
        if (this.isAttacking) {
            this.weaponSwing += 0.3;
            this.weaponAngle = Math.sin(this.weaponSwing) * Math.PI / 2;
        } else {
            this.weaponAngle = 0;
            this.weaponSwing = 0;
        }
    }
    
    /**
     * 执行攻击
     */
    attack() {
        this.isAttacking = true;
        this.attackBox.active = true;
        this.changeState('attack');
        this.weaponSwing = 0;
        
        setTimeout(() => {
            this.isAttacking = false;
            this.attackBox.active = false;
            if (this.isGrounded) this.changeState('idle');
        }, 300);
    }
    
    /**
     * 使用技能
     */
    useSkill() {
        this.skillManager.useSkill('special_attack', null);
    }
    
    /**
     * 受到伤害
     */
    takeDamage(damage) {
        const actualDamage = Math.max(1, damage - this.defense);
        this.health -= actualDamage;
        this.isHit = true;
        this.changeState('hit');
        
        setTimeout(() => {
            this.isHit = false;
            if (this.isGrounded) this.changeState('idle');
        }, 500);
        
        if (this.health <= 0) {
            this.die();
        }
    }
    
    /**
     * 死亡
     */
    die() {
        this.isDead = true;
        this.health = 0;
        this.changeState('hit');
    }
    
    /**
     * 治疗
     */
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }
    
    /**
     * 恢复法力
     */
    restoreMana(amount) {
        this.mana = Math.min(this.maxMana, this.mana + amount);
    }
    
    /**
     * 渲染玩家（美化版）
     */
    render(ctx) {
        ctx.save();
        
        // 受击闪白
        if (this.isHit) {
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 50) * 0.3;
        }
        
        // 死亡效果
        if (this.isDead) {
            ctx.globalAlpha = 0.6;
        }
        
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        
        // 应用面向
        ctx.translate(cx, cy);
        ctx.scale(this.facing, 1);
        ctx.translate(-cx, -cy);
        
        // 绘制角色（从后到前）
        this.renderHair(ctx, cx, cy);
        this.renderHead(ctx, cx, cy);
        this.renderRobe(ctx, cx, cy);
        this.renderArms(ctx, cx, cy);
        this.renderWeapon(ctx, cx, cy);
        this.renderBelt(ctx, cx, cy);
        
        // 绘制攻击框（调试用）
        if (this.attackBox.active) {
            ctx.strokeStyle = 'rgba(231, 76, 60, 0.8)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 3]);
            ctx.strokeRect(
                this.attackBox.x,
                this.attackBox.y,
                this.attackBox.width,
                this.attackBox.height
            );
            ctx.setLineDash([]);
        }
        
        ctx.restore();
        
        // 血条和法力条（不受面向影响）
        this.renderHealthBar(ctx);
        this.renderManaBar(ctx);
    }
    
    /**
     * 绘制头发
     */
    renderHair(ctx, cx, cy) {
        const walkOffset = this.state === 'walk' ? Math.sin(this.currentFrame) * 3 : 0;
        
        ctx.fillStyle = this.hairColor;
        ctx.beginPath();
        // 头发主体
        ctx.ellipse(cx, cy - 35 + walkOffset, 18, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 发髻（古代发型）
        ctx.beginPath();
        ctx.arc(cx, cy - 50 + walkOffset, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // 关羽特殊：长须
        if (this.characterType === 'GUANYU') {
            ctx.fillStyle = this.hairColor;
            ctx.beginPath();
            ctx.moveTo(cx - 5, cy - 20);
            ctx.quadraticCurveTo(cx, cy + 10, cx - 8, cy + 25);
            ctx.quadraticCurveTo(cx + 5, cy + 15, cx + 5, cy - 20);
            ctx.fill();
        }
        
        // 张飞特殊：络腮胡
        if (this.characterType === 'ZHANGFEI') {
            ctx.fillStyle = this.hairColor;
            ctx.beginPath();
            ctx.ellipse(cx, cy - 15, 15, 12, 0, 0, Math.PI);
            ctx.fill();
        }
    }
    
    /**
     * 绘制头部
     */
    renderHead(ctx, cx, cy) {
        ctx.fillStyle = this.skinColor;
        ctx.beginPath();
        ctx.arc(cx, cy - 30, 16, 0, Math.PI * 2);
        ctx.fill();
        
        // 眼睛
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.ellipse(cx + 5, cy - 32, 3, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 眉毛
        ctx.strokeStyle = this.hairColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx + 2, cy - 38);
        ctx.lineTo(cx + 10, cy - 36);
        ctx.stroke();
        
        // 赵云特殊：英眉
        if (this.characterType === 'ZHAOYUN') {
            ctx.beginPath();
            ctx.moveTo(cx + 2, cy - 37);
            ctx.lineTo(cx + 12, cy - 34);
            ctx.stroke();
        }
    }
    
    /**
     * 绘制战袍
     */
    renderRobe(ctx, cx, cy) {
        const walkBob = this.state === 'walk' ? Math.sin(this.currentFrame * 2) * 2 : 0;
        
        // 战袍主体
        ctx.fillStyle = this.robeColor;
        ctx.beginPath();
        ctx.moveTo(cx - 18, cy - 15);
        ctx.lineTo(cx + 18, cy - 15);
        ctx.lineTo(cx + 20, cy + 35 + walkBob);
        ctx.lineTo(cx - 20, cy + 35 + walkBob);
        ctx.closePath();
        ctx.fill();
        
        // 战袍边缘装饰
        ctx.strokeStyle = this.accentColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx - 18, cy - 15);
        ctx.lineTo(cx - 20, cy + 35 + walkBob);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(cx + 18, cy - 15);
        ctx.lineTo(cx + 20, cy + 35 + walkBob);
        ctx.stroke();
        
        // 肩部装饰
        ctx.fillStyle = this.accentColor;
        ctx.beginPath();
        ctx.arc(cx - 18, cy - 12, 6, 0, Math.PI * 2);
        ctx.arc(cx + 18, cy - 12, 6, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * 绘制手臂
     */
    renderArms(ctx, cx, cy) {
        const attackAngle = this.isAttacking ? this.weaponAngle : 0;
        const walkSwing = this.state === 'walk' ? Math.sin(this.currentFrame) * 0.3 : 0;
        
        ctx.fillStyle = this.skinColor;
        
        // 后臂
        ctx.save();
        ctx.translate(cx - 15, cy - 10);
        ctx.rotate(walkSwing - attackAngle);
        ctx.fillRect(-5, 0, 10, 25);
        ctx.restore();
        
        // 前臂（攻击时抬起）
        ctx.save();
        ctx.translate(cx + 15, cy - 10);
        ctx.rotate(-walkSwing + attackAngle);
        ctx.fillRect(-5, 0, 10, 25);
        ctx.restore();
    }
    
    /**
     * 绘制武器
     */
    renderWeapon(ctx, cx, cy) {
        const attackAngle = this.isAttacking ? this.weaponAngle : 0;
        const walkSwing = this.state === 'walk' ? Math.sin(this.currentFrame) * 0.2 : 0;
        
        ctx.save();
        ctx.translate(cx + 20, cy);
        ctx.rotate(-Math.PI / 4 + attackAngle + walkSwing);
        
        if (this.characterType === 'GUANYU') {
            // 青龙偃月刀
            this.renderGuanDao(ctx);
        } else if (this.characterType === 'ZHANGFEI') {
            // 蛇矛
            this.renderSnakeSpear(ctx);
        } else if (this.characterType === 'ZHAOYUN') {
            // 长枪
            this.renderLongSpear(ctx);
        }
        
        ctx.restore();
    }
    
    /**
     * 绘制青龙偃月刀（关羽）
     */
    renderGuanDao(ctx) {
        // 刀柄
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(-5, 0, 10, 60);
        
        // 刀身
        ctx.fillStyle = this.weaponColor;
        ctx.beginPath();
        ctx.moveTo(-8, 0);
        ctx.quadraticCurveTo(-15, 20, -20, 40);
        ctx.quadraticCurveTo(-10, 45, -5, 40);
        ctx.lineTo(-5, 0);
        ctx.closePath();
        ctx.fill();
        
        // 刀刃高光
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-12, 15);
        ctx.quadraticCurveTo(-16, 25, -18, 35);
        ctx.stroke();
        
        // 刀缨（红色装饰）
        ctx.fillStyle = '#c41e3a';
        ctx.beginPath();
        ctx.arc(0, 5, 8, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * 绘制蛇矛（张飞）
     */
    renderSnakeSpear(ctx) {
        // 矛柄
        ctx.fillStyle = '#4a3728';
        ctx.fillRect(-4, 0, 8, 70);
        
        // 蛇矛头（弯曲形状）
        ctx.fillStyle = this.weaponColor;
        ctx.beginPath();
        ctx.moveTo(-6, 0);
        ctx.quadraticCurveTo(-15, 15, -20, 30);
        ctx.quadraticCurveTo(-10, 25, -5, 15);
        ctx.lineTo(-5, 0);
        ctx.closePath();
        ctx.fill();
        
        // 另一侧矛刃
        ctx.beginPath();
        ctx.moveTo(6, 0);
        ctx.quadraticCurveTo(15, 15, 20, 30);
        ctx.quadraticCurveTo(10, 25, 5, 15);
        ctx.lineTo(5, 0);
        ctx.closePath();
        ctx.fill();
        
        // 金属光泽
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-12, 20);
        ctx.lineTo(-8, 25);
        ctx.stroke();
    }
    
    /**
     * 绘制长枪（赵云）
     */
    renderLongSpear(ctx) {
        // 枪杆
        ctx.fillStyle = '#6b4423';
        ctx.fillRect(-3, 0, 6, 80);
        
        // 枪头
        ctx.fillStyle = this.weaponColor;
        ctx.beginPath();
        ctx.moveTo(-5, 0);
        ctx.lineTo(0, -35);
        ctx.lineTo(5, 0);
        ctx.closePath();
        ctx.fill();
        
        // 枪缨（红色）
        ctx.fillStyle = '#c41e3a';
        ctx.beginPath();
        ctx.moveTo(-8, 5);
        ctx.quadraticCurveTo(0, -10, 8, 5);
        ctx.quadraticCurveTo(0, 15, -8, 5);
        ctx.fill();
        
        // 枪尖高光
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -30);
        ctx.lineTo(0, -10);
        ctx.stroke();
    }
    
    /**
     * 绘制腰带
     */
    renderBelt(ctx, cx, cy) {
        ctx.fillStyle = this.accentColor;
        ctx.fillRect(cx - 18, cy + 10, 36, 8);
        
        // 腰带扣
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(cx - 5, cy + 8, 10, 12);
    }
    
    /**
     * 渲染血条
     */
    renderHealthBar(ctx) {
        const barWidth = 60;
        const barHeight = 6;
        const x = this.x;
        const y = this.y - 15;
        
        // 背景
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // 血量渐变
        const healthPercent = this.health / this.maxHealth;
        const gradient = ctx.createLinearGradient(x, y, x + barWidth, y);
        gradient.addColorStop(0, '#e74c3c');
        gradient.addColorStop(0.5, '#e67e22');
        gradient.addColorStop(1, '#f39c12');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth * healthPercent, barHeight);
        
        // 边框
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barWidth, barHeight);
    }
    
    /**
     * 渲染法力条
     */
    renderManaBar(ctx) {
        const barWidth = 60;
        const barHeight = 4;
        const x = this.x;
        const y = this.y - 8;
        
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(x, y, barWidth, barHeight);
        
        const manaPercent = this.mana / this.maxMana;
        const gradient = ctx.createLinearGradient(x, y, x + barWidth, y);
        gradient.addColorStop(0, '#3498db');
        gradient.addColorStop(0.5, '#2980b9');
        gradient.addColorStop(1, '#1abc9c');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth * manaPercent, barHeight);
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barWidth, barHeight);
    }
    
    /**
     * 获取碰撞体
     */
    getHitbox() {
        return this.hitbox;
    }
    
    /**
     * 获取攻击框
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
        this.changeState('idle');
    }
}

// 导出
window.Player = Player;
window.CharacterConfig = CharacterConfig;
window.AnimationFrames = AnimationFrames;
