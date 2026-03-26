/**
 * Enemy.js - 敌人模块
 * 负责管理敌人的状态、行为和渲染
 */
class Enemy {
    constructor(config = {}) {
        // 基本属性
        this.id = config.id || 'enemy_' + Date.now() + '_' + Math.random();
        this.name = config.name || '敌人';
        this.type = config.type || 'soldier'; // soldier, archer, boss
        this.x = config.x || 600;
        this.y = config.y || 400;
        this.width = config.width || 50;
        this.height = config.height || 80;
        
        // 战斗属性
        this.maxHealth = config.maxHealth || 50;
        this.health = this.maxHealth;
        this.attack = config.attack || 8;
        this.defense = config.defense || 3;
        this.speed = config.speed || 100;
        
        // 状态
        this.velocityX = 0;
        this.velocityY = 0;
        this.isGrounded = false;
        this.isAttacking = false;
        this.isHit = false;
        this.isDead = false;
        this.facing = config.facing || -1; // 1: 右，-1: 左
        
        // AI
        this.ai = config.ai || null;
        this.state = 'idle'; // idle, patrol, chase, attack, hit
        this.patrolPoints = config.patrolPoints || [];
        this.currentPatrolIndex = 0;
        this.detectionRange = config.detectionRange || 300;
        this.attackRange = config.attackRange || 60;
        this.attackCooldown = 0;
        this.attackInterval = config.attackInterval || 1.5;
        
        // 动画
        this.currentFrame = 0;
        this.animationTimer = 0;
        this.animationSpeed = 0.15;
        
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
        
        // 掉落物
        this.drops = config.drops || [];
    }
    
    /**
     * 更新敌人状态
     * @param {number} deltaTime - 帧间隔时间 (秒)
     * @param {object} player - 玩家对象
     */
    update(deltaTime, player) {
        if (this.isDead) return;
        
        // 更新攻击冷却
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }
        
        // AI 决策
        if (this.ai) {
            this.ai.update(this, player, deltaTime);
        } else {
            this.basicAI(player, deltaTime);
        }
        
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
     * 基础 AI 行为
     * @param {object} player
     * @param {number} deltaTime
     */
    basicAI(player, deltaTime) {
        const distanceToPlayer = Math.abs(player.x - this.x);
        
        // 检测玩家
        if (distanceToPlayer <= this.detectionRange && !player.isDead) {
            // 面向玩家
            this.facing = player.x > this.x ? 1 : -1;
            
            // 判断行为
            if (distanceToPlayer <= this.attackRange) {
                // 攻击范围内
                this.state = 'attack';
                if (this.attackCooldown <= 0) {
                    this.attack();
                }
            } else {
                // 追击玩家
                this.state = 'chase';
                this.velocityX = this.facing * this.speed;
            }
        } else {
            // 巡逻或待机
            this.state = 'idle';
            this.velocityX = 0;
        }
    }
    
    /**
     * 应用物理
     * @param {number} deltaTime
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
     * 边界检查
     */
    checkBounds() {
        const canvasWidth = 800;
        
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > canvasWidth) this.x = canvasWidth - this.width;
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
        this.attackCooldown = this.attackInterval;
        
        setTimeout(() => {
            this.isAttacking = false;
            this.attackBox.active = false;
        }, 300);
    }
    
    /**
     * 受到伤害
     * @param {number} damage
     */
    takeDamage(damage) {
        const actualDamage = Math.max(1, damage - this.defense);
        this.health -= actualDamage;
        this.isHit = true;
        this.state = 'hit';
        
        console.log(`${this.name} 受到 ${actualDamage} 点伤害，剩余生命：${this.health}`);
        
        if (this.health <= 0) {
            this.die();
        }
        
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
     * 渲染敌人
     * @param {CanvasRenderingContext2D} ctx
     */
    render(ctx) {
        ctx.save();
        
        if (this.isHit) {
            ctx.globalAlpha = 0.5;
        }
        
        // 根据类型设置颜色
        let color = '#e74c3c'; // 默认红色
        if (this.type === 'archer') color = '#9b59b6';
        if (this.type === 'boss') color = '#8e44ad';
        
        ctx.fillStyle = this.isDead ? '#666' : color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 绘制方向指示
        ctx.fillStyle = '#fff';
        const eyeX = this.facing === 1 ? this.x + 35 : this.x + 10;
        ctx.fillRect(eyeX, this.y + 15, 8, 8);
        
        // 绘制攻击框
        if (this.attackBox.active) {
            ctx.strokeStyle = '#f39c12';
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
        
        // 绘制名称
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, this.x + this.width / 2, this.y - 20);
        
        ctx.restore();
    }
    
    /**
     * 渲染血条
     * @param {CanvasRenderingContext2D} ctx
     */
    renderHealthBar(ctx) {
        const barWidth = 50;
        const barHeight = 5;
        const x = this.x + 5;
        const y = this.y - 12;
        
        ctx.fillStyle = '#333';
        ctx.fillRect(x, y, barWidth, barHeight);
        
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = healthPercent > 0.5 ? '#2ecc71' : healthPercent > 0.25 ? '#f39c12' : '#e74c3c';
        ctx.fillRect(x, y, barWidth * healthPercent, barHeight);
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barWidth, barHeight);
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
     * 设置巡逻点
     * @param {array} points - [{x, y}, ...]
     */
    setPatrolPoints(points) {
        this.patrolPoints = points;
        this.currentPatrolIndex = 0;
    }
}

/**
 * 敌人生成器
 */
class EnemySpawner {
    constructor(scene) {
        this.scene = scene;
        this.enemies = [];
        this.spawnPoints = [];
        this.maxEnemies = 5;
    }
    
    /**
     * 添加生成点
     * @param {object} point - {x, y}
     */
    addSpawnPoint(point) {
        this.spawnPoints.push(point);
    }
    
    /**
     * 生成敌人
     * @param {object} config - 敌人配置
     * @returns {Enemy}
     */
    spawn(config = {}) {
        if (this.enemies.length >= this.maxEnemies) {
            return null;
        }
        
        // 选择生成点
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
    
    /**
     * 生成一批敌人
     * @param {number} count
     * @param {object} config
     */
    spawnWave(count, config = {}) {
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                this.spawn(config);
            }, i * 500);
        }
    }
    
    /**
     * 更新所有敌人
     * @param {number} deltaTime
     * @param {object} player
     */
    update(deltaTime, player) {
        this.enemies.forEach(enemy => enemy.update(deltaTime, player));
        
        // 清理死亡敌人
        this.enemies = this.enemies.filter(enemy => {
            if (enemy.isDead) {
                this.scene.removeEntity(enemy);
                return false;
            }
            return true;
        });
    }
    
    /**
     * 获取所有存活的敌人
     * @returns {Enemy[]}
     */
    getAliveEnemies() {
        return this.enemies.filter(e => !e.isDead);
    }
    
    /**
     * 清空所有敌人
     */
    clearAll() {
        this.enemies.forEach(enemy => this.scene.removeEntity(enemy));
        this.enemies = [];
    }
}

// 导出
window.Enemy = Enemy;
window.EnemySpawner = EnemySpawner;
