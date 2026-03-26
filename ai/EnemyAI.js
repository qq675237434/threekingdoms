/**
 * EnemyAI.js - 敌人 AI 模块
 * 负责实现各种敌人 AI 行为模式
 */

/**
 * 基础 AI 状态机
 */
class EnemyAI {
    constructor(config = {}) {
        this.aggression = config.aggression || 0.5; // 攻击性 0-1
        this.reactionTime = config.reactionTime || 0.3; // 反应时间 (秒)
        this.accuracy = config.accuracy || 0.8; // 准确度 0-1
    }
    
    /**
     * 更新 AI 状态
     * @param {Enemy} enemy - 敌人对象
     * @param {Player} player - 玩家对象
     * @param {number} deltaTime - 帧间隔时间
     */
    update(enemy, player, deltaTime) {
        // 子类实现
    }
    
    /**
     * 计算与玩家的距离
     * @param {Enemy} enemy
     * @param {Player} player
     * @returns {number}
     */
    getDistance(enemy, player) {
        return Math.abs(player.x - enemy.x);
    }
    
    /**
     * 判断是否能看到玩家
     * @param {Enemy} enemy
     * @param {Player} player
     * @returns {boolean}
     */
    canSeePlayer(enemy, player) {
        const distance = this.getDistance(enemy, player);
        return distance <= enemy.detectionRange && !player.isDead;
    }
    
    /**
     * 判断是否在攻击范围内
     * @param {Enemy} enemy
     * @param {Player} player
     * @returns {boolean}
     */
    isInAttackRange(enemy, player) {
        const distance = this.getDistance(enemy, player);
        return distance <= enemy.attackRange;
    }
    
    /**
     * 面向玩家
     * @param {Enemy} enemy
     * @param {Player} player
     */
    facePlayer(enemy, player) {
        enemy.facing = player.x > enemy.x ? 1 : -1;
    }
}

/**
 * 士兵 AI - 简单的近战敌人
 */
class SoldierAI extends EnemyAI {
    constructor(config = {}) {
        super(config);
        this.state = 'patrol';
        this.patrolTimer = 0;
        this.patrolDuration = 2;
    }
    
    update(enemy, player, deltaTime) {
        const distance = this.getDistance(enemy, player);
        const canSee = this.canSeePlayer(enemy, player);
        
        // 状态机
        switch (enemy.state) {
            case 'patrol':
                this.patrolState(enemy, deltaTime);
                if (canSee) {
                    enemy.state = 'chase';
                }
                break;
                
            case 'chase':
                this.chaseState(enemy, player, deltaTime);
                if (!canSee) {
                    enemy.state = 'patrol';
                } else if (this.isInAttackRange(enemy, player)) {
                    enemy.state = 'attack';
                }
                break;
                
            case 'attack':
                this.attackState(enemy, player, deltaTime);
                if (!canSee) {
                    enemy.state = 'patrol';
                } else if (!this.isInAttackRange(enemy, player)) {
                    enemy.state = 'chase';
                }
                break;
                
            case 'hit':
                // 受击时保持位置
                break;
        }
    }
    
    /**
     * 巡逻状态
     */
    patrolState(enemy, deltaTime) {
        enemy.velocityX = 0;
        
        // 简单巡逻：小范围移动
        this.patrolTimer += deltaTime;
        if (this.patrolTimer >= this.patrolDuration) {
            this.patrolTimer = 0;
            // 随机选择一个方向
            enemy.facing = Math.random() > 0.5 ? 1 : -1;
            enemy.velocityX = enemy.facing * enemy.speed * 0.3;
        }
    }
    
    /**
     * 追击状态
     */
    chaseState(enemy, player, deltaTime) {
        this.facePlayer(enemy, player);
        enemy.velocityX = enemy.facing * enemy.speed;
    }
    
    /**
     * 攻击状态
     */
    attackState(enemy, player, deltaTime) {
        this.facePlayer(enemy, player);
        enemy.velocityX = 0;
        
        // 攻击时机判断
        if (enemy.attackCooldown <= 0) {
            // 添加一些随机性
            if (Math.random() < this.aggression) {
                enemy.attack();
            }
        }
    }
}

/**
 * 弓箭手 AI - 远程敌人，保持距离
 */
class ArcherAI extends EnemyAI {
    constructor(config = {}) {
        super(config);
        this.preferredRange = 250; // 偏好距离
        this.minRange = 150; // 最小距离
    }
    
    update(enemy, player, deltaTime) {
        const distance = this.getDistance(enemy, player);
        const canSee = this.canSeePlayer(enemy, player);
        
        if (!canSee) {
            enemy.state = 'idle';
            enemy.velocityX = 0;
            return;
        }
        
        this.facePlayer(enemy, player);
        
        // 保持距离
        if (distance < this.minRange) {
            // 太近了，后退
            enemy.velocityX = -enemy.facing * enemy.speed * 0.8;
        } else if (distance > this.preferredRange) {
            // 太远了，靠近
            enemy.velocityX = enemy.facing * enemy.speed * 0.5;
        } else {
            // 理想距离，准备攻击
            enemy.velocityX = 0;
            
            if (enemy.attackCooldown <= 0 && Math.random() < this.aggression) {
                enemy.attack();
            }
        }
    }
}

/**
 * Boss AI - 复杂的 Boss 行为
 */
class BossAI extends EnemyAI {
    constructor(config = {}) {
        super({ ...config, aggression: 0.8 });
        this.phase = 1; // 阶段
        this.phaseHealthThreshold = 0.5; // 阶段转换血量
        this.specialAttackCooldown = 0;
        this.specialAttackInterval = 10; // 特殊攻击间隔
    }
    
    update(enemy, player, deltaTime) {
        const distance = this.getDistance(enemy, player);
        const canSee = this.canSeePlayer(enemy, player);
        
        if (!canSee) {
            enemy.state = 'idle';
            enemy.velocityX = 0;
            return;
        }
        
        // 检查阶段转换
        const healthPercent = enemy.health / enemy.maxHealth;
        if (healthPercent <= this.phaseHealthThreshold && this.phase === 1) {
            this.phase = 2;
            this.onPhaseChange(enemy, 2);
        }
        
        this.facePlayer(enemy, player);
        
        // 特殊攻击
        this.specialAttackCooldown -= deltaTime;
        if (this.specialAttackCooldown <= 0) {
            this.specialAttackCooldown = this.specialAttackInterval;
            this.performSpecialAttack(enemy, player);
        }
        
        // 普通行为
        if (distance < enemy.attackRange * 1.5) {
            // 近战范围
            if (enemy.attackCooldown <= 0 && Math.random() < this.aggression) {
                enemy.attack();
            }
            enemy.velocityX = 0;
        } else {
            // 追击
            enemy.velocityX = enemy.facing * enemy.speed * 0.7;
        }
    }
    
    /**
     * 阶段转换
     */
    onPhaseChange(enemy, newPhase) {
        console.log(`${enemy.name} 进入第 ${newPhase} 阶段!`);
        // 可以在此处改变 Boss 属性
        if (newPhase === 2) {
            enemy.speed *= 1.3;
            enemy.attack *= 1.2;
        }
    }
    
    /**
     * 特殊攻击
     */
    performSpecialAttack(enemy, player) {
        console.log(`${enemy.name} 释放特殊攻击!`);
        // 特殊攻击逻辑可以在这里实现
        // 例如：范围攻击、召唤小兵等
    }
}

/**
 * 群体 AI 管理器 - 管理多个敌人的协同行为
 */
class GroupAI {
    constructor() {
        this.enemies = [];
        this.leader = null;
    }
    
    /**
     * 添加敌人到群体
     * @param {Enemy} enemy
     */
    addEnemy(enemy) {
        this.enemies.push(enemy);
        if (!this.leader) {
            this.leader = enemy;
        }
    }
    
    /**
     * 移除敌人
     * @param {Enemy} enemy
     */
    removeEnemy(enemy) {
        const index = this.enemies.indexOf(enemy);
        if (index > -1) {
            this.enemies.splice(index, 1);
        }
        
        // 重新选择领袖
        if (this.leader === enemy || !this.enemies.includes(this.leader)) {
            this.leader = this.enemies[0] || null;
        }
    }
    
    /**
     * 更新群体 AI
     * @param {Player} player
     * @param {number} deltaTime
     */
    update(player, deltaTime) {
        if (!this.leader) return;
        
        // 领袖决定行为，其他敌人跟随
        this.enemies.forEach((enemy, index) => {
            if (enemy === this.leader) {
                // 领袖正常更新
                if (enemy.ai) enemy.ai.update(enemy, player, deltaTime);
            } else {
                // 跟随者保持队形
                this.followLeader(enemy, this.leader, deltaTime);
            }
        });
    }
    
    /**
     * 跟随领袖
     */
    followLeader(follower, leader, deltaTime) {
        const targetX = leader.x - (follower === this.enemies[1] ? 60 : -60);
        const distance = Math.abs(targetX - follower.x);
        
        if (distance > 10) {
            follower.facing = targetX > follower.x ? 1 : -1;
            follower.velocityX = follower.facing * follower.speed * 0.5;
        } else {
            follower.velocityX = 0;
        }
        
        // 同步攻击
        if (leader.isAttacking && !follower.isAttacking) {
            if (Math.random() < 0.3) { // 30% 概率同步攻击
                follower.attack();
            }
        }
    }
}

// 导出
window.EnemyAI = EnemyAI;
window.SoldierAI = SoldierAI;
window.ArcherAI = ArcherAI;
window.BossAI = BossAI;
window.GroupAI = GroupAI;
