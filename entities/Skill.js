/**
 * Skill.js - 技能系统模块
 * 负责管理玩家和敌人的技能
 */
class Skill {
    constructor(config) {
        this.id = config.id || 'skill_' + Date.now();
        this.name = config.name || '未命名技能';
        this.damage = config.damage || 0;
        this.cooldown = config.cooldown || 0; // 冷却时间 (秒)
        this.duration = config.duration || 0; // 持续时间 (秒)
        this.range = config.range || 50; // 攻击范围
        this.manaCost = config.manaCost || 0; // 法力消耗
        this.type = config.type || 'melee'; // melee, range, buff, debuff
        this.icon = config.icon || null;
        
        this.currentCooldown = 0;
        this.isActive = false;
        this.level = config.level || 1;
    }
    
    /**
     * 使用技能
     * @param {object} caster - 施法者
     * @param {object} target - 目标
     * @returns {boolean} 是否成功使用
     */
    use(caster, target) {
        if (!this.canUse(caster)) {
            return false;
        }
        
        // 消耗法力
        if (caster.mana !== undefined) {
            caster.mana -= this.manaCost;
        }
        
        // 开始冷却
        this.currentCooldown = this.cooldown;
        this.isActive = true;
        
        // 触发技能效果
        this.onCast(caster, target);
        
        // 如果是持续技能，设置持续时间
        if (this.duration > 0) {
            setTimeout(() => {
                this.isActive = false;
                this.onEnd(caster, target);
            }, this.duration * 1000);
        } else {
            this.isActive = false;
        }
        
        return true;
    }
    
    /**
     * 检查是否可以使用
     * @param {object} caster - 施法者
     * @returns {boolean}
     */
    canUse(caster) {
        if (this.currentCooldown > 0) return false;
        if (caster.mana !== undefined && caster.mana < this.manaCost) return false;
        return true;
    }
    
    /**
     * 更新技能冷却
     * @param {number} deltaTime - 帧间隔时间 (秒)
     */
    update(deltaTime) {
        if (this.currentCooldown > 0) {
            this.currentCooldown -= deltaTime;
            if (this.currentCooldown < 0) {
                this.currentCooldown = 0;
            }
        }
    }
    
    /**
     * 技能施放时回调
     * @param {object} caster
     * @param {object} target
     */
    onCast(caster, target) {
        // 子类可重写
        console.log(`${this.name} 被施放`);
    }
    
    /**
     * 技能结束时回调
     * @param {object} caster
     * @param {object} target
     */
    onEnd(caster, target) {
        // 子类可重写
    }
    
    /**
     * 获取冷却剩余时间
     * @returns {number}
     */
    getCooldownRemaining() {
        return this.currentCooldown;
    }
    
    /**
     * 是否处于冷却中
     * @returns {boolean}
     */
    isOnCooldown() {
        return this.currentCooldown > 0;
    }
    
    /**
     * 重置技能
     */
    reset() {
        this.currentCooldown = 0;
        this.isActive = false;
    }
}

/**
 * 技能管理器
 */
class SkillManager {
    constructor(owner) {
        this.owner = owner;
        this.skills = new Map();
        this.activeSkills = [];
    }
    
    /**
     * 添加技能
     * @param {Skill} skill
     */
    addSkill(skill) {
        this.skills.set(skill.id, skill);
    }
    
    /**
     * 获取技能
     * @param {string} skillId
     * @returns {Skill}
     */
    getSkill(skillId) {
        return this.skills.get(skillId);
    }
    
    /**
     * 使用技能
     * @param {string} skillId
     * @param {object} target
     * @returns {boolean}
     */
    useSkill(skillId, target) {
        const skill = this.skills.get(skillId);
        if (!skill) return false;
        
        const success = skill.use(this.owner, target);
        if (success) {
            this.activeSkills.push(skill);
        }
        return success;
    }
    
    /**
     * 更新所有技能
     * @param {number} deltaTime
     */
    update(deltaTime) {
        this.skills.forEach(skill => skill.update(deltaTime));
        
        // 清理已完成的主动技能
        this.activeSkills = this.activeSkills.filter(skill => skill.isActive);
    }
    
    /**
     * 获取所有技能
     * @returns {Skill[]}
     */
    getAllSkills() {
        return Array.from(this.skills.values());
    }
    
    /**
     * 获取可用技能
     * @returns {Skill[]}
     */
    getAvailableSkills() {
        return this.getAllSkills().filter(skill => !skill.isOnCooldown());
    }
}

// ============ 道具/物品系统 ============

/**
 * 物品基类
 */
class Item {
    constructor(config) {
        this.id = config.id || 'item_' + Date.now();
        this.name = config.name || '未命名物品';
        this.type = config.type || 'consumable'; // consumable, equipment, key
        this.icon = config.icon || null;
        this.description = config.description || '';
        this.maxStack = config.maxStack || 99;
        this.stackCount = config.stackCount || 1;
    }
    
    /**
     * 使用物品
     * @param {object} user - 使用者
     * @returns {boolean} 是否成功使用
     */
    use(user) {
        if (this.type !== 'consumable') {
            console.log(`${this.name} 不是消耗品`);
            return false;
        }
        return true;
    }
    
    /**
     * 获取物品效果描述
     * @returns {string}
     */
    getDescription() {
        return this.description;
    }
}

/**
 * 金创药 - 恢复血量
 */
class HealthPotion extends Item {
    constructor() {
        super({
            id: 'health_potion',
            name: '金创药',
            type: 'consumable',
            description: '恢复 50% 血量',
            maxStack: 5
        });
        this.healPercent = 0.5;
    }
    
    use(user) {
        if (!super.use(user)) return false;
        
        const healAmount = Math.floor(user.maxHealth * this.healPercent);
        user.heal(healAmount);
        console.log(`${user.name} 使用金创药，恢复${healAmount}点血量`);
        return true;
    }
}

/**
 * 魔力水 - 恢复法力
 */
class ManaPotion extends Item {
    constructor() {
        super({
            id: 'mana_potion',
            name: '魔力水',
            type: 'consumable',
            description: '恢复 50% 能量',
            maxStack: 5
        });
        this.restorePercent = 0.5;
    }
    
    use(user) {
        if (!super.use(user)) return false;
        
        const restoreAmount = Math.floor(user.maxMana * this.restorePercent);
        user.restoreMana(restoreAmount);
        console.log(`${user.name} 使用魔力水，恢复${restoreAmount}点法力`);
        return true;
    }
}

/**
 * 战神符 - 无敌状态
 */
class WarGodCharm extends Item {
    constructor() {
        super({
            id: 'war_god_charm',
            name: '战神符',
            type: 'consumable',
            description: '30 秒内无敌',
            maxStack: 3
        });
        this.duration = 30; // 秒
    }
    
    use(user) {
        if (!super.use(user)) return false;
        
        // 激活无敌状态
        user.isInvincible = true;
        user.invincibleTimer = this.duration;
        
        console.log(`${user.name} 激活战神符，获得${this.duration}秒无敌!`);
        
        // 设置计时器
        setTimeout(() => {
            if (user) {
                user.isInvincible = false;
                console.log('战神符效果消失');
            }
        }, this.duration * 1000);
        
        return true;
    }
}

/**
 * 天书 - 全屏攻击
 */
class HeavenBook extends Item {
    constructor() {
        super({
            id: 'heaven_book',
            name: '天书',
            type: 'consumable',
            description: '对全屏敌人造成 200 点伤害',
            maxStack: 2
        });
        this.damage = 200;
        this.bossDamage = 100; // 对 BOSS 伤害
    }
    
    use(user, scene) {
        if (!super.use(user)) return false;
        
        console.log(`${user.name} 使用天书，释放全屏攻击!`);
        
        // 对场景中所有敌人造成伤害
        if (scene && scene.entities) {
            scene.entities.forEach(entity => {
                if (entity !== user && entity.takeDamage) {
                    const damage = entity.isBoss ? this.bossDamage : this.damage;
                    entity.takeDamage(damage);
                }
            });
        }
        
        // 视觉效果
        if (window.game && window.game.hud) {
            window.game.hud.showMessage('天书之力!', '#9b59b6');
        }
        
        return true;
    }
}

/**
 * 太平要术 - 召唤援军
 */
class TaipingArt extends Item {
    constructor() {
        super({
            id: 'taiping_art',
            name: '太平要术',
            type: 'consumable',
            description: '召唤 3 名援军助战 60 秒',
            maxStack: 1
        });
        this.duration = 60; // 秒
        this.allyCount = 3;
    }
    
    use(user, scene, enemySpawner) {
        if (!super.use(user)) return false;
        
        console.log(`${user.name} 使用太平要术，召唤援军!`);
        
        // 召唤援军
        const allies = [];
        const allyNames = ['关羽援军', '张飞援军', '赵云援军'];
        
        for (let i = 0; i < this.allyCount; i++) {
            const ally = enemySpawner.spawn({
                type: 'ally',
                name: allyNames[i],
                maxHealth: 100,
                attack: 20,
                defense: 5,
                speed: 150,
                isAlly: true
            });
            
            if (ally) {
                allies.push(ally);
            }
        }
        
        // 设置援军消失时间
        setTimeout(() => {
            allies.forEach(ally => {
                if (ally && !ally.isDead) {
                    ally.isDead = true;
                    if (scene) {
                        scene.removeEntity(ally);
                    }
                }
            });
            console.log('援军消失');
        }, this.duration * 1000);
        
        if (window.game && window.game.hud) {
            window.game.hud.showMessage('援军降临!', '#3498db');
        }
        
        return true;
    }
}

/**
 * 物品栏/背包系统
 */
class Inventory {
    constructor(owner, maxSlots = 8) {
        this.owner = owner;
        this.maxSlots = maxSlots;
        this.slots = new Array(maxSlots).fill(null);
        this.selectedSlot = 0;
    }
    
    /**
     * 添加物品
     * @param {string} itemId - 物品 ID
     * @param {number} count - 数量
     * @returns {boolean}
     */
    addItem(itemId, count = 1) {
        // 尝试堆叠
        for (let slot of this.slots) {
            if (slot && slot.item.id === itemId && slot.count < slot.item.maxStack) {
                const canAdd = Math.min(count, slot.item.maxStack - slot.count);
                slot.count += canAdd;
                count -= canAdd;
                if (count <= 0) return true;
            }
        }
        
        // 找空位
        if (count > 0) {
            for (let i = 0; i < this.slots.length; i++) {
                if (!this.slots[i]) {
                    const item = this.createItem(itemId);
                    if (item) {
                        this.slots[i] = {
                            item: item,
                            count: Math.min(count, item.maxStack)
                        };
                        count -= this.slots[i].count;
                        if (count <= 0) return true;
                    }
                }
            }
        }
        
        // 背包已满
        if (count > 0) {
            console.log('背包已满!');
            return false;
        }
        
        return true;
    }
    
    /**
     * 创建物品实例
     * @param {string} itemId
     * @returns {Item}
     */
    createItem(itemId) {
        switch (itemId) {
            case 'health_potion':
                return new HealthPotion();
            case 'mana_potion':
                return new ManaPotion();
            case 'war_god_charm':
                return new WarGodCharm();
            case 'heaven_book':
                return new HeavenBook();
            case 'taiping_art':
                return new TaipingArt();
            default:
                return null;
        }
    }
    
    /**
     * 使用选中物品
     * @returns {boolean}
     */
    useSelectedItem() {
        const slot = this.slots[this.selectedSlot];
        if (!slot || slot.count <= 0) {
            console.log('没有物品或数量不足');
            return false;
        }
        
        const success = slot.item.use(this.owner, 
            window.game ? window.game.sceneManager.getCurrentScene() : null,
            window.game ? window.game.enemySpawner : null
        );
        
        if (success) {
            slot.count--;
            if (slot.count <= 0) {
                this.slots[this.selectedSlot] = null;
            }
        }
        
        return success;
    }
    
    /**
     * 选择物品槽
     * @param {number} slotIndex
     */
    selectSlot(slotIndex) {
        if (slotIndex >= 0 && slotIndex < this.maxSlots) {
            this.selectedSlot = slotIndex;
        }
    }
    
    /**
     * 获取物品信息
     * @param {number} slotIndex
     * @returns {object|null}
     */
    getSlotInfo(slotIndex) {
        const slot = this.slots[slotIndex];
        if (!slot) return null;
        
        return {
            name: slot.item.name,
            count: slot.count,
            description: slot.item.description,
            isSelected: slotIndex === this.selectedSlot
        };
    }
    
    /**
     * 获取所有物品
     * @returns {array}
     */
    getAllItems() {
        return this.slots.map((slot, index) => {
            if (!slot) return null;
            return {
                slot: index,
                name: slot.item.name,
                count: slot.count,
                maxStack: slot.item.maxStack
            };
        }).filter(s => s !== null);
    }
    
    /**
     * 是否有指定物品
     * @param {string} itemId
     * @returns {boolean}
     */
    hasItem(itemId) {
        return this.slots.some(slot => slot && slot.item.id === itemId && slot.count > 0);
    }
    
    /**
     * 清空背包
     */
    clear() {
        this.slots.fill(null);
        this.selectedSlot = 0;
    }
}

// 预定义技能
const PRESET_SKILLS = {
    // 普通攻击
    BASIC_ATTACK: new Skill({
        id: 'basic_attack',
        name: '普通攻击',
        damage: 10,
        cooldown: 0.5,
        range: 60,
        type: 'melee'
    }),
    
    // 必杀技
    SPECIAL_ATTACK: new Skill({
        id: 'special_attack',
        name: '必杀技',
        damage: 50,
        cooldown: 3,
        range: 80,
        manaCost: 20,
        type: 'melee'
    }),
    
    // 远程攻击
    PROJECTILE: new Skill({
        id: 'projectile',
        name: '远程攻击',
        damage: 15,
        cooldown: 1,
        range: 200,
        type: 'range'
    }),
    
    // 治疗技能
    HEAL: new Skill({
        id: 'heal',
        name: '治疗术',
        damage: -30, // 负伤害表示治疗
        cooldown: 5,
        range: 100,
        manaCost: 30,
        type: 'buff'
    }),
    
    // 关羽专属技能
    GREEN_DRAGON_SLASH: new Skill({
        id: 'green_dragon_slash',
        name: '青龙斩',
        damage: 80,
        cooldown: 5,
        range: 100,
        manaCost: 30,
        type: 'melee',
        description: '向前方扇形区域攻击'
    }),
    
    // 张飞专属技能
    ROAR_CHARGE: new Skill({
        id: 'roar_charge',
        name: '怒吼冲锋',
        damage: 60,
        cooldown: 6,
        range: 200,
        manaCost: 35,
        type: 'charge',
        description: '向目标冲锋并眩晕 2 秒'
    }),
    
    // 赵云专属技能
    SEVEN_IN_SEVEN_OUT: new Skill({
        id: 'seven_in_seven_out',
        name: '七进七出',
        damage: 100,
        cooldown: 8,
        range: 80,
        manaCost: 40,
        type: 'buff',
        description: '短时间内无敌并连续攻击'
    })
};

// 导出
window.Skill = Skill;
window.SkillManager = SkillManager;
window.PRESET_SKILLS = PRESET_SKILLS;
window.Item = Item;
window.HealthPotion = HealthPotion;
window.ManaPotion = ManaPotion;
window.WarGodCharm = WarGodCharm;
window.HeavenBook = HeavenBook;
window.TaipingArt = TaipingArt;
window.Inventory = Inventory;
