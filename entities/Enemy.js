/**
 * Enemy.js - 敌人模块（美化版）
 * 支持多种敌人类型：士兵、弓箭手、BOSS（吕布/曹操）
 * 添加 BOSS 登场动画、特殊特效、不同颜色服装
 */

// 敌人类型配置（美化版）
const EnemyTypeConfig = {
    SOLDIER: {
        name: '士兵',
        type: 'soldier',
        width: 45,
        height: 75,
        maxHealth: 50,
        attack: 8,
        defense: 3,
        speed: 100,
        exp: 10,
        // 外观配置
        robeColors: ['#8b4513', '#556b2f', '#483d8b', '#8b0000'], // 不同颜色服装
        skinColor: '#d4a574',
        hairColor: '#1a1a1a',
        weaponType: 'sword'
    },
    ARCHER: {
        name: '弓箭手',
        type: 'archer',
        width: 40,
        height: 70,
        maxHealth: 40,
        attack: 12,
        defense: 2,
        speed: 120,
        exp: 15,
        robeColors: ['#2f4f4f', '#556b2f', '#8b4513'],
        skinColor: '#d4a574',
        hairColor: '#1a1a1a',
        weaponType: 'bow',
        attackRange: 250
    },
    LUBU: {
        name: '吕布',
        type: 'boss',
        width: 80,
        height: 120,
        maxHealth: 500,
        attack: 35,
        defense: 15,
        speed: 70,
        exp: 500,
        robeColor: '#8b0000',      // 深红色战袍
        skinColor: '#f5d0b0',
        hairColor: '#1a1a1a',
        weaponType: 'halberd',      // 方天画戟
        auraColor: '#ff0000',
        isBoss: true
    },
    CAOCAO: {
        name: '曹操',
        type: 'boss',
        width: 75,
        height: 110,
        maxHealth: 450,
        attack: 30,
        defense: 12,
        speed: 80,
        exp: 500,
        robeColor: '#1a1a4e',      // 深蓝色战袍
        skinColor: '#f5e6d3',
        hairColor: '#1a1a1a',
        weaponType: 'sword',
        auraColor: '#4169e1',
        isBoss: true
    }
};

// BOSS 登场动画状态
const BossEnterState = {
    NONE: 'none',
    ENTERING: 'entering',
    ROARING: 'roaring',
    READY: 'ready'
};

class Enemy {
    constructor(config = {}) {
        const typeConfig = EnemyTypeConfig[config.type.toUpperCase()] || EnemyTypeConfig.SOLDIER;
        
        // 基本属性
        this.id = config.id || 'enemy_' + Date.now() + '_' + Math.random();
        this.name = typeConfig.name;
        this.type = typeConfig.type;
        this.x = config.x || 600;
        this.y = config.y || 400;
        this.width = typeConfig.width;
        this.height = typeConfig.height;
        
        // 战斗属性
        this.maxHealth = config.maxHealth || typeConfig.maxHealth;
        this.health = this.maxHealth;
        this.attack = config.attack || typeConfig.attack;
        this.defense = config.defense || typeConfig.defense;
        this.speed = config.speed || typeConfig.speed;
        this.exp = typeConfig.exp;
        
        // 外观配置
        this.robeColor = config.robeColor || 
            (typeConfig.robeColors ? typeConfig.robeColors[Math.floor(Math.random() * typeConfig.robeColors.length)] : typeConfig.robeColor);
        this.skinColor = typeConfig.skinColor;
        this.hairColor = typeConfig.hairColor;
        this.weaponType = typeConfig.weaponType;
        this.auraColor = typeConfig.auraColor || null;
        this.isBoss = typeConfig.isBoss || false;
        
        // 状态
        this.velocityX = 0;
        this.velocityY = 0;
        this.isGrounded = false;
        this.isAttacking = false;
        this.isHit = false;
        this.isDead = false;
        this.facing = config.facing || -1;
        
        // AI
        this.state = 'idle';
        this.detectionRange = config.detectionRange || (this.isBoss ? 400 : 300);
        this.attackRange = config.attackRange || (typeConfig.attackRange || 60);
        this.attackCooldown = 0;
        this.attackInterval = config.attackInterval || (this.isBoss ? 2 : 1.5);
        
        // 动画
        this.currentFrame = 0;
        this.animationTimer = 0;
        this.animationSpeed = this.isBoss ? 0.12 : 0.15;
        
        // BOSS 特殊
        this.bossEnterState = this.isBoss ? BossEnterState.ENTERING : BossEnterState.NONE;
        this.bossEnterTimer = 0;
        this.bossScale = this.isBoss ? 0 : 1;
        this.bossAuraAngle = 0;
        
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
        
        // 弓箭手特殊
        this.projectileCooldown = 0;
        this.projectileInterval = 2;
    }
    
    /**
     * 更新敌人状态
     */
    update(deltaTime, player) {
        if (this.isDead) return;
        
        // BOSS 登场动画
        if (this.bossEnterState === BossEnterState.ENTERING) {
            this.updateBossEnter(deltaTime);
            return;
        }
        
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }
        
        if (this.projectileCooldown > 0) {
            this.projectileCooldown -= deltaTime;
        }
        
        // AI 决策
        this.basicAI(player, deltaTime);
        this.applyPhysics(deltaTime);
        
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;
        
        this.updateHitbox();
        this.updateAttackBox();
        this.checkBounds();
        this.updateAnimation(deltaTime);
        
        // BOSS 光环动画
        if (this.isBoss) {
            this.bossAuraAngle += deltaTime * 0.002;
        }
    }
    
    /**
     * BOSS 登场动画
     */
    updateBossEnter(deltaTime) {
        this.bossEnterTimer += deltaTime;
        
        if (this.bossEnterState === BossEnterState.ENTERING) {
            // 缩放出现
            this.bossScale = Math.min(1, this.bossEnterTimer / 1000);
            
            if (this.bossEnterTimer >= 1000) {
                this.bossEnterState = BossEnterState.ROARING;
                this.bossEnterTimer = 0;
            }
        } else if (this.bossEnterState === BossEnterState.ROARING) {
            // 咆哮展示
            if (this.bossEnterTimer >= 1500) {
                this.bossEnterState = BossEnterState.READY;
            }
        }
    }
    
    /**
     * 基础 AI
     */
    basicAI(player, deltaTime) {
        if (!player || player.isDead) {
            this.state = 'idle';
            this.velocityX = 0;
            return;
        }
        
        const distanceToPlayer = Math.abs(player.x - this.x);
        this.facing = player.x > this.x ? 1 : -1;
        
        if (distanceToPlayer <= this.detectionRange) {
            if (this.type === 'archer') {
                // 弓箭手：保持距离射击
                if (distanceToPlayer <= this.attackRange && distanceToPlayer >= 150) {
                    this.state = 'attack';
                    if (this.attackCooldown <= 0) {
                        this.attack();
                    }
                } else if (distanceToPlayer < 150) {
                    // 太近了，后退
                    this.velocityX = -this.facing * this.speed;
                    this.state = 'chase';
                } else {
                    this.velocityX = this.facing * this.speed * 0.5;
                    this.state = 'chase';
                }
            } else {
                // 近战敌人
                if (distanceToPlayer <= this.attackRange) {
                    this.state = 'attack';
                    if (this.attackCooldown <= 0) {
                        this.attack();
                    }
                } else {
                    this.velocityX = this.facing * this.speed;
                    this.state = 'chase';
                }
            }
        } else {
            this.state = 'idle';
            this.velocityX = 0;
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
    }
    
    /**
     * 更新动画
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
        this.attackCooldown = this.attackInterval;
        
        // BOSS 攻击特效
        if (this.isBoss) {
            // 可以在这里触发屏幕震动等特效
        }
        
        setTimeout(() => {
            this.isAttacking = false;
            this.attackBox.active = false;
        }, 300);
    }
    
    /**
     * 远程攻击（弓箭手）
     */
    rangedAttack() {
        if (this.type === 'archer' && this.projectileCooldown <= 0) {
            this.projectileCooldown = this.projectileInterval;
            // 返回一个投射物配置
            return {
                x: this.x + this.width / 2,
                y: this.y + 30,
                vx: this.facing * 300,
                vy: 0,
                damage: this.attack
            };
        }
        return null;
    }
    
    /**
     * 受到伤害
     */
    takeDamage(damage, isCritical = false) {
        const actualDamage = isCritical ? damage * 2 : Math.max(1, damage - this.defense);
        this.health -= actualDamage;
        this.isHit = true;
        this.state = 'hit';
        
        if (this.isBoss) {
            // BOSS 受击特殊效果
        }
        
        if (this.health <= 0) {
            this.die();
            return this.exp;
        }
        
        setTimeout(() => {
            this.isHit = false;
        }, 500);
        
        return actualDamage;
    }
    
    /**
     * 死亡
     */
    die() {
        this.isDead = true;
        this.health = 0;
    }
    
    /**
     * 渲染敌人（美化版）
     */
    render(ctx) {
        ctx.save();
        
        // BOSS 登场动画
        if (this.bossEnterState !== BossEnterState.NONE) {
            ctx.globalAlpha = this.bossScale;
            const scaleOffset = (1 - this.bossScale) * this.height / 2;
            ctx.translate(this.x + this.width / 2, this.y + scaleOffset);
            ctx.scale(this.bossScale, this.bossScale);
            ctx.translate(-this.x - this.width / 2, -this.y - scaleOffset);
        }
        
        // 受击闪白
        if (this.isHit) {
            ctx.globalAlpha *= 0.5 + Math.sin(Date.now() / 50) * 0.3;
        }
        
        // 死亡效果
        if (this.isDead) {
            ctx.globalAlpha *= 0.6;
        }
        
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        
        // 应用面向
        ctx.translate(cx, cy);
        ctx.scale(this.facing, 1);
        ctx.translate(-cx, -cy);
        
        // BOSS 光环
        if (this.isBoss && this.bossEnterState === BossEnterState.READY) {
            this.renderBossAura(ctx, cx, cy);
        }
        
        // 绘制敌人
        if (this.type === 'archer') {
            this.renderArcher(ctx, cx, cy);
        } else if (this.isBoss) {
            this.renderBoss(ctx, cx, cy);
        } else {
            this.renderSoldier(ctx, cx, cy);
        }
        
        // 攻击框
        if (this.attackBox.active) {
            ctx.strokeStyle = 'rgba(243, 156, 18, 0.8)';
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
        
        // 血条和名称
        this.renderHealthBar(ctx);
        this.renderName(ctx);
    }
    
    /**
     * 绘制小兵
     */
    renderSoldier(ctx, cx, cy) {
        const walkBob = this.state === 'chase' ? Math.sin(this.currentFrame) * 3 : 0;
        
        // 身体/战袍
        ctx.fillStyle = this.robeColor;
        ctx.fillRect(cx - 15, cy - 25 + walkBob, 30, 45);
        
        // 头部
        ctx.fillStyle = this.skinColor;
        ctx.beginPath();
        ctx.arc(cx, cy - 35, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // 头盔
        ctx.fillStyle = '#4a4a4a';
        ctx.beginPath();
        ctx.arc(cx, cy - 38, 13, Math.PI, 0);
        ctx.fill();
        
        // 武器（剑）
        ctx.fillStyle = '#888';
        if (this.isAttacking) {
            ctx.save();
            ctx.translate(cx + 15, cy - 15);
            ctx.rotate(-Math.PI / 4);
            ctx.fillRect(0, -3, 25, 6);
            ctx.restore();
        } else {
            ctx.fillRect(cx + 12, cy - 25, 6, 30);
        }
        
        // 腿部动画
        ctx.fillStyle = '#2c2c2c';
        if (this.state === 'chase') {
            const legOffset = Math.sin(this.currentFrame) * 8;
            ctx.fillRect(cx - 10 + legOffset, cy + 20, 8, 15);
            ctx.fillRect(cx + 2 - legOffset, cy + 20, 8, 15);
        } else {
            ctx.fillRect(cx - 10, cy + 20, 8, 15);
            ctx.fillRect(cx + 2, cy + 20, 8, 15);
        }
    }
    
    /**
     * 绘制弓箭手
     */
    renderArcher(ctx, cx, cy) {
        const walkBob = this.state === 'chase' ? Math.sin(this.currentFrame) * 2 : 0;
        
        // 身体
        ctx.fillStyle = this.robeColor;
        ctx.fillRect(cx - 13, cy - 23 + walkBob, 26, 40);
        
        // 头部
        ctx.fillStyle = this.skinColor;
        ctx.beginPath();
        ctx.arc(cx, cy - 33, 11, 0, Math.PI * 2);
        ctx.fill();
        
        // 头巾
        ctx.fillStyle = '#8b4513';
        ctx.beginPath();
        ctx.arc(cx, cy - 36, 12, Math.PI, 0);
        ctx.fill();
        
        // 弓
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 3;
        if (this.isAttacking || this.state === 'attack') {
            ctx.beginPath();
            ctx.arc(cx + 20, cy - 15, 20, Math.PI / 2, Math.PI * 1.5);
            ctx.stroke();
            // 箭
            ctx.fillStyle = '#888';
            ctx.fillRect(cx + 15, cy - 17, 25, 3);
        } else {
            ctx.beginPath();
            ctx.arc(cx + 15, cy, 15, 0, Math.PI * 1.5);
            ctx.stroke();
        }
    }
    
    /**
     * 绘制 BOSS
     */
    renderBoss(ctx, cx, cy) {
        const breatheBob = Math.sin(Date.now() / 500) * 3;
        
        // 战袍主体（更华丽）
        ctx.fillStyle = this.robeColor;
        ctx.beginPath();
        ctx.moveTo(cx - 30, cy - 40);
        ctx.lineTo(cx + 30, cy - 40);
        ctx.lineTo(cx + 35, cy + 50 + breatheBob);
        ctx.lineTo(cx - 35, cy + 50 + breatheBob);
        ctx.closePath();
        ctx.fill();
        
        // 战袍金边
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cx - 30, cy - 40);
        ctx.lineTo(cx - 35, cy + 50 + breatheBob);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + 30, cy - 40);
        ctx.lineTo(cx + 35, cy + 50 + breatheBob);
        ctx.stroke();
        
        // 头部
        ctx.fillStyle = this.skinColor;
        ctx.beginPath();
        ctx.arc(cx, cy - 50, 20, 0, Math.PI * 2);
        ctx.fill();
        
        // BOSS 头盔/冠冕
        if (this.name === '吕布') {
            // 吕布的雉鸡翎
            ctx.fillStyle = '#8b0000';
            ctx.beginPath();
            ctx.moveTo(cx - 15, cy - 60);
            ctx.quadraticCurveTo(cx - 25, cy - 90, cx - 30, cy - 70);
            ctx.quadraticCurveTo(cx - 20, cy - 65, cx - 15, cy - 60);
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(cx + 15, cy - 60);
            ctx.quadraticCurveTo(cx + 25, cy - 90, cx + 30, cy - 70);
            ctx.quadraticCurveTo(cx + 20, cy - 65, cx + 15, cy - 60);
            ctx.fill();
        } else if (this.name === '曹操') {
            // 曹操的丞相冠冕
            ctx.fillStyle = '#1a1a4e';
            ctx.fillRect(cx - 18, cy - 68, 36, 15);
            ctx.fillStyle = '#ffd700';
            for (let i = 0; i < 5; i++) {
                ctx.fillRect(cx - 15 + i * 7, cy - 72, 4, 8);
            }
        }
        
        // 眼睛（发光）
        ctx.fillStyle = this.isHit ? '#fff' : '#ff0';
        ctx.beginPath();
        ctx.arc(cx + 8, cy - 52, 4, 0, Math.PI * 2);
        ctx.arc(cx - 8, cy - 52, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // 武器
        this.renderBossWeapon(ctx, cx, cy);
    }
    
    /**
     * 绘制 BOSS 武器
     */
    renderBossWeapon(ctx, cx, cy) {
        if (this.name === '吕布') {
            // 方天画戟
            ctx.fillStyle = '#4a4a4a';
            ctx.fillRect(cx + 30, cy - 50, 8, 80);
            
            // 戟刃
            ctx.fillStyle = '#888';
            ctx.beginPath();
            ctx.moveTo(cx + 34, cy - 50);
            ctx.lineTo(cx + 55, cy - 70);
            ctx.lineTo(cx + 34, cy - 40);
            ctx.closePath();
            ctx.fill();
            
            // 月牙刃
            ctx.beginPath();
            ctx.moveTo(cx + 34, cy - 45);
            ctx.quadraticCurveTo(cx + 60, cy - 35, cx + 34, cy - 25);
            ctx.fill();
        } else if (this.name === '曹操') {
            // 曹操宝剑
            ctx.fillStyle = '#c0c0c0';
            if (this.isAttacking) {
                ctx.save();
                ctx.translate(cx + 35, cy - 30);
                ctx.rotate(-Math.PI / 3);
                ctx.fillRect(0, -4, 40, 8);
                ctx.restore();
            } else {
                ctx.fillRect(cx + 30, cy - 40, 6, 50);
            }
        }
    }
    
    /**
     * 绘制 BOSS 光环
     */
    renderBossAura(ctx, cx, cy) {
        const auraRadius = 70 + Math.sin(this.bossAuraAngle) * 10;
        const alpha = 0.3 + Math.sin(this.bossAuraAngle) * 0.1;
        
        const gradient = ctx.createRadialGradient(cx, cy, 40, cx, cy, auraRadius);
        gradient.addColorStop(0, `${this.auraColor}00`);
        gradient.addColorStop(0.5, `${this.auraColor}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(1, `${this.auraColor}00`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cx, cy, auraRadius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * 渲染血条
     */
    renderHealthBar(ctx) {
        const barWidth = this.isBoss ? 80 : 50;
        const barHeight = this.isBoss ? 8 : 5;
        const x = this.x + (this.width - barWidth) / 2;
        const y = this.y - (this.isBoss ? 20 : 12);
        
        // 背景
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // 血量
        const healthPercent = Math.max(0, this.health / this.maxHealth);
        const gradient = ctx.createLinearGradient(x, y, x + barWidth, y);
        
        if (this.isBoss) {
            gradient.addColorStop(0, '#c0392b');
            gradient.addColorStop(0.5, '#e74c3c');
            gradient.addColorStop(1, '#e67e22');
        } else {
            gradient.addColorStop(0, healthPercent > 0.5 ? '#2ecc71' : healthPercent > 0.25 ? '#f39c12' : '#e74c3c');
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth * healthPercent, barHeight);
        
        // 边框
        ctx.strokeStyle = this.isBoss ? '#ffd700' : '#fff';
        ctx.lineWidth = this.isBoss ? 2 : 1;
        ctx.strokeRect(x, y, barWidth, barHeight);
    }
    
    /**
     * 渲染名称
     */
    renderName(ctx) {
        ctx.fillStyle = this.isBoss ? '#ffd700' : '#fff';
        ctx.font = this.isBoss ? 'bold 16px Arial' : '12px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 3;
        ctx.fillText(
            this.name,
            this.x + this.width / 2,
            this.y - (this.isBoss ? 25 : 15)
        );
        ctx.shadowBlur = 0;
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
}

/**
 * 敌人生成器（美化版）
 */
class EnemySpawner {
    constructor(scene) {
        this.scene = scene;
        this.enemies = [];
        this.spawnPoints = [];
        this.maxEnemies = 5;
    }
    
    addSpawnPoint(point) {
        this.spawnPoints.push(point);
    }
    
    spawn(config = {}) {
        if (this.enemies.length >= this.maxEnemies && !config.isBoss) {
            return null;
        }
        
        let x, y;
        if (this.spawnPoints.length > 0) {
            const point = this.spawnPoints[Math.floor(Math.random() * this.spawnPoints.length)];
            x = point.x;
            y = point.y;
        } else {
            x = 600 + Math.random() * 150;
            y = 400;
        }
        
        const enemy = new Enemy({ ...config, x, y });
        this.enemies.push(enemy);
        this.scene.addEntity(enemy);
        
        return enemy;
    }
    
    spawnWave(count, config = {}) {
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                this.spawn(config);
            }, i * 500);
        }
    }
    
    spawnBoss(type = 'LUBU') {
        this.maxEnemies = 1; // BOSS 战时只生成一个敌人
        return this.spawn({ type: type, isBoss: true });
    }
    
    update(deltaTime, player) {
        this.enemies.forEach(enemy => enemy.update(deltaTime, player));
        
        this.enemies = this.enemies.filter(enemy => {
            if (enemy.isDead) {
                this.scene.removeEntity(enemy);
                return false;
            }
            return true;
        });
    }
    
    getAliveEnemies() {
        return this.enemies.filter(e => !e.isDead);
    }
    
    clearAll() {
        this.enemies.forEach(enemy => this.scene.removeEntity(enemy));
        this.enemies = [];
        this.maxEnemies = 5;
    }
}

// 导出
window.Enemy = Enemy;
window.EnemySpawner = EnemySpawner;
window.EnemyTypeConfig = EnemyTypeConfig;
window.BossEnterState = BossEnterState;
