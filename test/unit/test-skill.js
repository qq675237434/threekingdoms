/**
 * Skill 模块单元测试
 * 测试技能系统的功能
 */

class SkillTests {
    constructor() {
        this.passed = 0;
        this.failed = 0;
        this.results = [];
    }

    test(name, fn) {
        try {
            fn();
            this.passed++;
            this.results.push({ name, status: 'pass' });
            console.log(`✅ ${name}`);
        } catch (e) {
            this.failed++;
            this.results.push({ name, status: 'fail', error: e.message });
            console.log(`❌ ${name}`);
            console.log(`   错误：${e.message}`);
        }
    }

    assert(condition, message) {
        if (!condition) throw new Error(message);
    }

    run() {
        console.log('\n📋 Skill 模块单元测试\n');
        console.log('='.repeat(50));

        // 测试 1: Skill 类存在
        this.test('Skill 类已定义', () => {
            this.assert(typeof window.Skill === 'function', 'Skill 类未定义');
        });

        // 测试 2: Skill 实例化
        this.test('Skill 可实例化', () => {
            const skill = new window.Skill({ name: '测试技能', damage: 10 });
            this.assert(skill !== null, 'Skill 实例化为 null');
            this.assert(skill.name === '测试技能', '名称未正确设置');
        });

        // 测试 3: 技能属性
        this.test('技能属性设置', () => {
            const skill = new window.Skill({
                name: '火球术',
                damage: 50,
                cooldown: 3,
                manaCost: 20,
                range: 200,
                type: 'range'
            });
            this.assert(skill.damage === 50, '伤害未正确设置');
            this.assert(skill.cooldown === 3, '冷却时间未正确设置');
            this.assert(skill.manaCost === 20, '法力消耗未正确设置');
            this.assert(skill.range === 200, '范围未正确设置');
            this.assert(skill.type === 'range', '类型未正确设置');
        });

        // 测试 4: 技能使用
        this.test('use 方法存在', () => {
            const skill = new window.Skill({ cooldown: 0 });
            this.assert(typeof skill.use === 'function', 'use 不是函数');
            const caster = { mana: 100 };
            const result = skill.use(caster, null);
            this.assert(result === true, '技能应成功使用');
        });

        // 测试 5: 冷却检查
        this.test('canUse 方法 - 冷却中', () => {
            const skill = new window.Skill({ cooldown: 5 });
            this.assert(typeof skill.canUse === 'function', 'canUse 不是函数');
            skill.currentCooldown = 3;
            const caster = { mana: 100 };
            this.assert(skill.canUse(caster) === false, '冷却中应不能使用');
        });

        this.test('canUse 方法 - 法力不足', () => {
            const skill = new window.Skill({ cooldown: 0, manaCost: 50 });
            const caster = { mana: 30 };
            this.assert(skill.canUse(caster) === false, '法力不足应不能使用');
        });

        this.test('canUse 方法 - 可以使用', () => {
            const skill = new window.Skill({ cooldown: 0, manaCost: 20 });
            const caster = { mana: 50 };
            this.assert(skill.canUse(caster) === true, '应可以使用');
        });

        // 测试 6: 冷却更新
        this.test('update 方法减少冷却', () => {
            const skill = new window.Skill({ cooldown: 5 });
            this.assert(typeof skill.update === 'function', 'update 不是函数');
            skill.currentCooldown = 5;
            skill.update(2);
            this.assert(skill.currentCooldown === 3, '冷却未正确减少');
        });

        this.test('冷却不低于 0', () => {
            const skill = new window.Skill();
            skill.currentCooldown = 1;
            skill.update(5);
            this.assert(skill.currentCooldown === 0, '冷却不应低于 0');
        });

        // 测试 7: 冷却状态查询
        this.test('getCooldownRemaining 方法', () => {
            const skill = new window.Skill({ cooldown: 5 });
            this.assert(typeof skill.getCooldownRemaining === 'function', '不是函数');
            skill.currentCooldown = 3;
            this.assert(skill.getCooldownRemaining() === 3, '返回冷却时间错误');
        });

        this.test('isOnCooldown 方法', () => {
            const skill = new window.Skill();
            this.assert(typeof skill.isOnCooldown === 'function', '不是函数');
            skill.currentCooldown = 0;
            this.assert(skill.isOnCooldown() === false, '无冷却时应返回 false');
            skill.currentCooldown = 2;
            this.assert(skill.isOnCooldown() === true, '有冷却时应返回 true');
        });

        // 测试 8: 技能重置
        this.test('reset 方法', () => {
            const skill = new window.Skill();
            this.assert(typeof skill.reset === 'function', 'reset 不是函数');
            skill.currentCooldown = 5;
            skill.isActive = true;
            skill.reset();
            this.assert(skill.currentCooldown === 0, '冷却未重置');
            this.assert(skill.isActive === false, '活跃状态未重置');
        });

        // 测试 9: SkillManager 类
        this.test('SkillManager 类已定义', () => {
            this.assert(typeof window.SkillManager === 'function', 'SkillManager 类未定义');
        });

        this.test('SkillManager 可实例化', () => {
            const owner = { name: '玩家' };
            const manager = new window.SkillManager(owner);
            this.assert(manager !== null, 'SkillManager 实例化为 null');
            this.assert(manager.owner === owner, 'owner 未正确设置');
        });

        // 测试 10: 技能管理
        this.test('addSkill 方法', () => {
            const manager = new window.SkillManager({});
            this.assert(typeof manager.addSkill === 'function', 'addSkill 不是函数');
            const skill = new window.Skill({ id: 'test_skill' });
            manager.addSkill(skill);
            this.assert(manager.skills.size > 0, '技能未添加');
        });

        this.test('getSkill 方法', () => {
            const manager = new window.SkillManager({});
            const skill = new window.Skill({ id: 'test_skill', name: '测试' });
            manager.addSkill(skill);
            this.assert(typeof manager.getSkill === 'function', 'getSkill 不是函数');
            const retrieved = manager.getSkill('test_skill');
            this.assert(retrieved === skill, '获取的技能不匹配');
        });

        // 测试 11: 使用技能
        this.test('useSkill 方法', () => {
            const manager = new window.SkillManager({ mana: 100 });
            const skill = new window.Skill({ id: 'test', cooldown: 0 });
            manager.addSkill(skill);
            this.assert(typeof manager.useSkill === 'function', 'useSkill 不是函数');
            const result = manager.useSkill('test', null);
            this.assert(result === true, '技能应成功使用');
        });

        this.test('useSkill - 技能不存在', () => {
            const manager = new window.SkillManager({});
            const result = manager.useSkill('nonexistent', null);
            this.assert(result === false, '不存在的技能应返回 false');
        });

        // 测试 12: 更新所有技能
        this.test('update 方法更新所有技能', () => {
            const manager = new window.SkillManager({});
            const skill1 = new window.Skill({ id: 's1', cooldown: 5 });
            const skill2 = new window.Skill({ id: 's2', cooldown: 3 });
            skill1.currentCooldown = 5;
            skill2.currentCooldown = 3;
            manager.addSkill(skill1);
            manager.addSkill(skill2);
            manager.update(2);
            this.assert(skill1.currentCooldown === 3, '技能 1 冷却未正确更新');
            this.assert(skill2.currentCooldown === 1, '技能 2 冷却未正确更新');
        });

        // 测试 13: 获取技能列表
        this.test('getAllSkills 方法', () => {
            const manager = new window.SkillManager({});
            manager.addSkill(new window.Skill({ id: 's1' }));
            manager.addSkill(new window.Skill({ id: 's2' }));
            this.assert(typeof manager.getAllSkills === 'function', 'getAllSkills 不是函数');
            const skills = manager.getAllSkills();
            this.assert(Array.isArray(skills), '应返回数组');
            this.assert(skills.length === 2, '技能数量错误');
        });

        this.test('getAvailableSkills 方法', () => {
            const manager = new window.SkillManager({});
            const skill1 = new window.Skill({ id: 's1', cooldown: 0 });
            const skill2 = new window.Skill({ id: 's2', cooldown: 5 });
            skill2.currentCooldown = 3;
            manager.addSkill(skill1);
            manager.addSkill(skill2);
            this.assert(typeof manager.getAvailableSkills === 'function', '不是函数');
            const available = manager.getAvailableSkills();
            this.assert(available.length === 1, '应只返回可用技能');
            this.assert(available[0].id === 's1', '应返回无冷却的技能');
        });

        // 测试 14: 预设技能
        this.test('PRESET_SKILLS 已定义', () => {
            this.assert(window.PRESET_SKILLS !== undefined, 'PRESET_SKILLS 未定义');
        });

        this.test('PRESET_SKILLS 包含基本技能', () => {
            this.assert(window.PRESET_SKILLS.BASIC_ATTACK !== undefined, 'BASIC_ATTACK 未定义');
            this.assert(window.PRESET_SKILLS.SPECIAL_ATTACK !== undefined, 'SPECIAL_ATTACK 未定义');
            this.assert(window.PRESET_SKILLS.PROJECTILE !== undefined, 'PROJECTILE 未定义');
            this.assert(window.PRESET_SKILLS.HEAL !== undefined, 'HEAL 未定义');
        });

        this.test('PRESET_SKILLS 属性正确', () => {
            const basic = window.PRESET_SKILLS.BASIC_ATTACK;
            this.assert(basic.damage > 0, '普通攻击伤害应大于 0');
            this.assert(basic.cooldown > 0, '普通攻击应有冷却');
        });

        // 测试 15: 技能回调
        this.test('onCast 回调', () => {
            const skill = new window.Skill({ cooldown: 0 });
            let castCalled = false;
            skill.onCast = () => { castCalled = true; };
            skill.use({}, null);
            this.assert(castCalled === true, 'onCast 回调未调用');
        });

        console.log('='.repeat(50));
        console.log(`结果：${this.passed} 通过，${this.failed} 失败\n`);

        return { passed: this.passed, failed: this.failed, results: this.results };
    }
}

// 导出
window.SkillTests = SkillTests;
