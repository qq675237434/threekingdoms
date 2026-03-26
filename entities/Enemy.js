/**
 * Enemy.js - 敌人模块（性能优化版）
 * 优化项：
 * - 缓存敌人配置和渐变
 * - 优化 BOSS 渲染
 * - 减少路径创建调用
 */

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
        robeColors: ['#8b4513', '#556b2f', '#483d8b', '#8b0000'],
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
        robeColor: '#8b0000',
        skinColor: '#f5d0b0',
        hairColor: '#1a1a1a',
        weaponType: 'halberd',
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
        robeColor: '#1a1a4e',
        skinColor: '#f5e6d3',
        hairColor: '#1a1a1a',
        weaponType: 'sword',
        auraColor: '#4169e1',
        isBoss: true
    }
};

const BossEnterState = {
    NONE: 'none',
    ENTERING: 'entering',
    ROARING: 'roaring',
    READY: 'ready'
};

class Enemy {
    constructor(config = {}) {
        const typeConfig = EnemyTypeConfig[config.type.toUpperCase()] || EnemyTypeConfig.SOLDIER;
        
        this.id = config.id || 'enemy_' + Date.now() + '_' + Math.random();
        this.name = typeConfig.name;
        this.type = typeConfig.type;
        this.x = config.x || 600;
        this.y = config.y || 400;
        this.width = typeConfig.width;
        this.height = typeConfig.height;
        
        this.maxHealth = config.maxHealth || typeConfig.maxHealth;
        this.health = this.maxHealth;
        this.attack = config.attack || typeConfig.attack;
        this.defense = config.defense || typeConfig.defense;
        this.speed = config.speed || typeConfig.speed;
        this.exp = typeConfig.exp;
        
        const robeColors = typeConfig.robeColors;
        this.robeColor = config.robeColor || 
            (robeColors ? robeColors[Math.floor(Math.random() * robeColors.length)] : typeConfig.robeColor);
        this.skinColor = typeConfig.skinColor;
        this.hairColor = typeConfig.hairColor;
        this.weaponType = typeConfig.weaponType;
        this.auraColor = typeConfig.auraColor || null;
        this.isBoss = typeConfig.isBoss || false;
        
        this.velocityX = 0;
        this.velocityY = 0;
        this.isGrounded = false;
        this.isAttacking = false;
        this.isHit = false;
        this.isDead = false;
        this.facing = config.facing || -1;
        
        this.state = 'idle';
        this.detectionRange = config.detectionRange || (this.isBoss ? 400 : 300);
        this.attackRange = config.attackRange || (typeConfig.attackRange || 60);
        this.attackCooldown = 0;
        this.attackInterval = config.attackInterval || (this.isBoss ? 2 : 1.5);
        
        this.currentFrame = 0;
        this.animationTimer = 0;
        this.animationSpeed = this.isBoss ? 0.12 : 0.15;
        
        this.bossEnterState = this.isBoss ? BossEnterState.ENTERING : BossEnterState.NONE;
        this.bossEnterTimer = 0;
        this.bossScale = this.isBoss ? 0 : 1;
        this.bossAuraAngle = 0;
        
        this.hitbox = { x: this.x, y: this.y, width: this.width, height: this.height };
        this.attackBox = { x: 0, y: 0, width: 60, height: 40, active: false };
        
        this.projectileCooldown = 0;
        this.projectileInterval = 2;
        
        // 优化：缓存对象
        this._cachedGradients = {};
    }
    
    update(deltaTime, player) {
        if (this.isDead) return;
        
        if (this.bossEnterState === BossEnterState.ENTERING) {
            this.updateBossEnter(deltaTime);
            return;
        }
        
        if (this.attackCooldown > 0) this.attackCooldown -= deltaTime;
        if (this.projectileCooldown > 0) this.projectileCooldown -= deltaTime;
        
        this.basicAI(player, deltaTime);
        this.applyPhysics(deltaTime);
        
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;
        
        this.updateHitbox();
        this.updateAttackBox();
        this.checkBounds();
        this.updateAnimation(deltaTime);
        
        if (this.isBoss) {
            this.bossAuraAngle += deltaTime * 0.002;
        }
    }
    
    updateBossEnter(deltaTime) {
        this.bossEnterTimer += deltaTime;
        
        if (this.bossEnterState === BossEnterState.ENTERING) {
            this.bossScale = Math.min(1, this.bossEnterTimer / 1000);
            if (this.bossEnterTimer >= 1000) {
                this.bossEnterState = BossEnterState.ROARING;
                this.bossEnterTimer = 0;
            }
        } else if (this.bossEnterState === BossEnterState.ROARING) {
            if (this.bossEnterTimer >= 1500) {
                this.bossEnterState = BossEnterState.READY;
            }
        }
    }
    
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
                if (distanceToPlayer <= this.attackRange && distanceToPlayer >= 150) {
                    this.state = 'attack';
                    if (this.attackCooldown <= 0) this.attack();
                } else if (distanceToPlayer < 150) {
                    this.velocityX = -this.facing * this.speed;
                    this.state = 'chase';
                } else {
                    this.velocityX = this.facing * this.speed * 0.5;
                    this.state = 'chase';
                }
            } else {
                if (distanceToPlayer <= this.attackRange) {
                    this.state = 'attack';
                    if (this.attackCooldown <= 0) this.attack();
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
    
    updateHitbox() {
        this.hitbox.x = this.x;
        this.hitbox.y = this.y;
    }
    
    updateAttackBox() {
        if (this.isAttacking) {
            this.attackBox.x = this.facing === 1 ? this.x + this.width : this.x - this.attackBox.width;
            this.attackBox.y = this.y + 20;
        }
    }
    
    checkBounds() {
        const canvasWidth = 800;
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > canvasWidth) this.x = canvasWidth - this.width;
    }
    
    updateAnimation(deltaTime) {
        this.animationTimer += deltaTime;
        if (this.animationTimer >= this.animationSpeed) {
            this.animationTimer = 0;
            this.currentFrame = (this.currentFrame + 1) % 4;
        }
    }
    
    attack() {
        this.isAttacking = true;
        this.attackBox.active = true;
        this.attackCooldown = this.attackInterval;
        
        setTimeout(() => {
            this.isAttacking = false;
            this.attackBox.active = false;
        }, 300);
    }
    
    rangedAttack() {
        if (this.type === 'archer' && this.projectileCooldown <= 0) {
            this.projectileCooldown = this.projectileInterval;
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
    
    takeDamage(damage, isCritical = false) {
        const actualDamage = isCritical ? damage * 2 : Math.max(1, damage - this.defense);
        this.health -= actualDamage;
        this.isHit = true;
        this.state = 'hit';
        
        if (this.health <= 0) {
            this.die();
            return this.exp;
        }
        
        setTimeout(() => {
            this.isHit = false;
        }, 500);
        
        return actualDamage;
    }
    
    die() {
        this.isDead = true;
        this.health = 0;
    }
    
    render(ctx) {
        ctx.save();
        
        if (this.bossEnterState !== BossEnterState.NONE) {
            ctx.globalAlpha = this.bossScale;
            const scaleOffset = (1 - this.bossScale) * this.height / 2;
            ctx.translate(this.x + this.width / 2, this.y + scaleOffset);
            ctx.scale(this.bossScale, this.bossScale);
            ctx.translate(-this.x - this.width / 2, -this.y - scaleOffset);
        }
        
        if (this.isHit) {
            ctx.globalAlpha *= 0.5 + Math.sin(Date.now() / 50) * 0.3;
        }
        
        if (this.isDead) {
            ctx.globalAlpha *= 0.6;
        }
        
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        
        ctx.translate(cx, cy);
        ctx.scale(this.facing, 1);
        ctx.translate(-cx, -cy);
        
        if (this.isBoss && this.bossEnterState === BossEnterState.READY) {
            this.renderBossAura(ctx, cx, cy);
        }
        
        if (this.type === 'archer') {
            this.renderArcher(ctx, cx, cy);
        } else if (this.isBoss) {
            this.renderBoss(ctx, cx, cy);
        } else {
            this.renderSoldier(ctx, cx, cy);
        }
        
        if (this.attackBox.active) {
            ctx.strokeStyle = 'rgba(243, 156, 18, 0.8)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 3]);
            ctx.strokeRect(this.attackBox.x, this.attackBox.y, this.attackBox.width, this.attackBox.height);
            ctx.setLineDash([]);
        }
        
        ctx.restore();
        
        this.renderHealthBar(ctx);
        this.renderName(ctx);
    }
    
    renderSoldier(ctx, cx, cy) {
        const walkBob = this.state === 'chase' ? Math.sin(this.currentFrame) * 3 : 0;
        
        ctx.fillStyle = this.robeColor;
        ctx.fillRect(cx - 15, cy - 25 + walkBob, 30, 45);
        
        ctx.fillStyle = this.skinColor;
        ctx.beginPath();
        ctx.arc(cx, cy - 35, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#4a4a4a';
        ctx.beginPath();
        ctx.arc(cx, cy - 38, 13, Math.PI, 0);
        ctx.fill();
        
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
    
    renderArcher(ctx, cx, cy) {
        const walkBob = this.state === 'chase' ? Math.sin(this.currentFrame) * 2 : 0;
        
        ctx.fillStyle = this.robeColor;
        ctx.fillRect(cx - 13, cy - 23 + walkBob, 26, 40);
        
        ctx.fillStyle = this.skinColor;
        ctx.beginPath();
        ctx.arc(cx, cy - 33, 11, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#8b4513';
        ctx.beginPath();
        ctx.arc(cx, cy - 36, 12, Math.PI, 0);
        ctx.fill();
        
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 3;
        if (this.isAttacking || this.state === 'attack') {
            ctx.beginPath();
            ctx.arc(cx + 20, cy - 15, 20, Math.PI / 2, Math.PI * 1.5);
            ctx.stroke();
            ctx.fillStyle = '#888';
            ctx.fillRect(cx + 15, cy - 17, 25, 3);
        } else {
            ctx.beginPath();
            ctx.arc(cx + 15, cy, 15, 0, Math.PI * 1.5);
            ctx.stroke();
        }
    }
    
    renderBoss(ctx, cx, cy) {
        const breatheBob = Math.sin(Date.now() / 500) * 3;
        
        ctx.fillStyle = this.robeColor;
        ctx.beginPath();
        ctx.moveTo(cx - 30, cy - 40);
        ctx.lineTo(cx + 30, cy - 40);
        ctx.lineTo(cx + 35, cy + 50 + breatheBob);
        ctx.lineTo(cx - 35, cy + 50 + breatheBob);
        ctx.closePath();
        ctx.fill();
        
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
        
        ctx.fillStyle = this.skinColor;
        ctx.beginPath();
        ctx.arc(cx, cy - 50, 20, 0, Math.PI * 2);
        ctx.fill();
        
        if (this.name === '吕布') {
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
            ctx.fillStyle = '#1a1a4e';
            ctx.fillRect(cx - 18, cy - 68, 36, 15);
            ctx.fillStyle = '#ffd700';
            for (let i = 0; i < 5; i++) {
                ctx.fillRect(cx - 15 + i * 7, cy - 72, 4, 8);
            }
        }
        
        ctx.fillStyle = this.isHit ? '#fff' : '#ff0';
        ctx.beginPath();
        ctx.arc(cx + 8, cy - 52, 4, 0, Math.PI * 2);
        ctx.arc(cx - 8, cy - 52, 4, 0, Math.PI * 2);
        ctx.fill();
        
        this.renderBossWeapon(ctx, cx, cy);
    }
    
    renderBossWeapon(ctx, cx, cy) {
        if (this.name === '吕布') {
            ctx.fillStyle = '#4a4a4a';
            ctx.fillRect(cx + 30, cy - 50, 8, 80);
            
            ctx.fillStyle = '#888';
            ctx.beginPath();
            ctx.moveTo(cx + 34, cy - 50);
            ctx.lineTo(cx + 55, cy - 70);
            ctx.lineTo(cx + 34, cy - 40);
            ctx.closePath();
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(cx + 34, cy - 45);
            ctx.quadraticCurveTo(cx + 60, cy - 35, cx + 34, cy - 25);
            ctx.fill();
        } else if (this.name === '曹操') {
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
    
    renderHealthBar(ctx) {
        const barWidth = this.isBoss ? 80 : 50;
        const barHeight = this.isBoss ? 8 : 5;
        const x = this.x + (this.width - barWidth) / 2;
        const y = this.y - (this.isBoss ? 20 : 12);
        
        const healthKey = `enemy_health_${this.isBoss ? 'boss' : 'normal'}`;
        if (!this._cachedGradients[healthKey]) {
            const gradient = ctx.createLinearGradient(x, y, x + barWidth, y);
            if (this.isBoss) {
                gradient.addColorStop(0, '#c0392b');
                gradient.addColorStop(0.5, '#e74c3c');
                gradient.addColorStop(1, '#e67e22');
            } else {
                this._cachedGradients[healthKey] = { isDynamic: true };
            }
        }
        
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(x, y, barWidth, barHeight);
        
        const healthPercent = Math.max(0, this.health / this.maxHealth);
        
        if (this.isBoss && this._cachedGradients[healthKey]) {
            ctx.fillStyle = this._cachedGradients[healthKey];
        } else {
            const gradient = ctx.createLinearGradient(x, y, x + barWidth, y);
            gradient.addColorStop(0, healthPercent > 0.5 ? '#2ecc71' : healthPercent > 0.25 ? '#f39c12' : '#e74c3c');
            ctx.fillStyle = gradient;
        }
        
        ctx.fillRect(x, y, barWidth * healthPercent, barHeight);
        
        ctx.strokeStyle = this.isBoss ? '#ffd700' : '#fff';
        ctx.lineWidth = this.isBoss ? 2 : 1;
        ctx.strokeRect(x, y, barWidth, barHeight);
    }
    
    renderName(ctx) {
        ctx.fillStyle = this.isBoss ? '#ffd700' : '#fff';
        ctx.font = this.isBoss ? 'bold 16px Arial' : '12px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 3;
        ctx.fillText(this.name, this.x + this.width / 2, this.y - (this.isBoss ? 25 : 15));
        ctx.shadowBlur = 0;
    }
    
    getHitbox() {
        return this.hitbox;
    }
    
    getAttackBox() {
        return this.attackBox;
    }
}

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
        this.maxEnemies = 1;
        return this.spawn({ type: type, isBoss: true });
    }
    
    update(deltaTime, player) {
        for (let i = 0, len = this.enemies.length; i < len; i++) {
            this.enemies[i].update(deltaTime, player);
        }
        
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            if (this.enemies[i].isDead) {
                this.scene.removeEntity(this.enemies[i]);
                this.enemies.splice(i, 1);
            }
        }
    }
    
    getAliveEnemies() {
        return this.enemies.filter(e => !e.isDead);
    }
    
    clearAll() {
        for (let i = 0, len = this.enemies.length; i < len; i++) {
            this.scene.removeEntity(this.enemies[i]);
        }
        this.enemies = [];
        this.maxEnemies = 5;
    }
}

window.Enemy = Enemy;
window.EnemySpawner = EnemySpawner;
window.EnemyTypeConfig = EnemyTypeConfig;
window.BossEnterState = BossEnterState;
