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
    })
};

// 导出
window.Skill = Skill;
window.SkillManager = SkillManager;
window.PRESET_SKILLS = PRESET_SKILLS;
