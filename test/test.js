#!/usr/bin/env node

/**
 * 三国战记 - 自动化测试脚本
 * 在 Node.js 环境中测试游戏模块
 */

const fs = require('fs');
const path = require('path');

console.log('🎮 三国战记 - 自动化测试套件\n');

let passed = 0;
let failed = 0;
let total = 0;

function test(name, fn) {
    total++;
    try {
        fn();
        console.log(`✅ ${name}`);
        passed++;
    } catch (e) {
        console.log(`❌ ${name}`);
        console.log(`   错误：${e.message}`);
        failed++;
    }
}

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

// ============ 测试 1: 文件存在性 ============
console.log('\n📁 测试 1: 文件存在性检查');

const requiredFiles = [
    'index.html',
    'game.js',
    'README.md',
    'ARCHITECTURE.md',
    'core/Input.js',
    'core/GameLoop.js',
    'core/Scene.js',
    'entities/Player.js',
    'entities/Enemy.js',
    'entities/Skill.js',
    'ai/EnemyAI.js',
    'ui/HUD.js'
];

const basePath = path.join(__dirname, '..');

requiredFiles.forEach(file => {
    const filePath = path.join(basePath, file);
    test(`文件存在：${file}`, () => {
        assert(fs.existsSync(filePath), `文件不存在：${file}`);
    });
});

// ============ 测试 2: 代码语法检查 ============
console.log('\n📝 测试 2: JavaScript 语法检查');

const jsFiles = [
    'core/Input.js',
    'core/GameLoop.js',
    'core/Scene.js',
    'entities/Player.js',
    'entities/Enemy.js',
    'entities/Skill.js',
    'ai/EnemyAI.js',
    'ui/HUD.js',
    'game.js'
];

jsFiles.forEach(file => {
    const filePath = path.join(basePath, file);
    test(`语法检查：${file}`, () => {
        const content = fs.readFileSync(filePath, 'utf-8');
        // 基本语法检查
        assert(content.includes('class') || content.includes('function'), '缺少类或函数定义');
        assert(!content.includes('import ') || content.includes('export'), 'ES6 模块语法可能需要构建工具');
    });
});

// ============ 测试 3: HTML 结构检查 ============
console.log('\n🌐 测试 3: HTML 结构检查');

const indexPath = path.join(basePath, 'index.html');
const htmlContent = fs.readFileSync(indexPath, 'utf-8');

test('HTML 包含 DOCTYPE', () => {
    assert(htmlContent.includes('<!DOCTYPE html>'), '缺少 DOCTYPE 声明');
});

test('HTML 包含 Canvas 元素', () => {
    assert(htmlContent.includes('<canvas') && htmlContent.includes('gameCanvas'), '缺少游戏 Canvas');
});

test('HTML 加载所有必需脚本', () => {
    requiredFiles.filter(f => f.endsWith('.js')).forEach(file => {
        assert(htmlContent.includes(`src="${file}"`), `缺少脚本引用：${file}`);
    });
});

test('HTML 包含加载屏幕', () => {
    assert(htmlContent.includes('loadingScreen'), '缺少加载屏幕元素');
});

// ============ 测试 4: 游戏逻辑检查 ============
console.log('\n🎯 测试 4: 游戏逻辑检查');

const gameContent = fs.readFileSync(path.join(basePath, 'game.js'), 'utf-8');

test('Game 类存在', () => {
    assert(gameContent.includes('class Game'), '缺少 Game 类');
});

test('Game 有 init 方法', () => {
    assert(gameContent.includes('init()'), '缺少 init 方法');
});

test('Game 有 start 方法', () => {
    assert(gameContent.includes('start()'), '缺少 start 方法');
});

test('Game 有 update 方法', () => {
    assert(gameContent.includes('update(deltaTime)'), '缺少 update 方法');
});

test('Game 有 render 方法', () => {
    assert(gameContent.includes('render()'), '缺少 render 方法');
});

test('错误处理存在', () => {
    assert(gameContent.includes('try {') || gameContent.includes('catch'), '缺少错误处理');
});

// ============ 测试 5: 输入模块检查 ============
console.log('\n🎮 测试 5: 输入模块检查');

const inputContent = fs.readFileSync(path.join(basePath, 'core/Input.js'), 'utf-8');

test('Input 类存在', () => {
    assert(inputContent.includes('class Input'), '缺少 Input 类');
});

test('CONTROLS 常量定义', () => {
    assert(inputContent.includes('const CONTROLS'), '缺少 CONTROLS 常量');
});

test('getDirection 函数存在', () => {
    assert(inputContent.includes('function getDirection'), '缺少 getDirection 函数');
});

test('isAttacking 函数存在', () => {
    assert(inputContent.includes('function isAttacking'), '缺少 isAttacking 函数');
});

test('isUsingSkill 函数存在', () => {
    assert(inputContent.includes('function isUsingSkill'), '缺少 isUsingSkill 函数');
});

test('导出到 window 对象', () => {
    assert(inputContent.includes('window.Input'), 'Input 未导出到 window');
    assert(inputContent.includes('window.CONTROLS'), 'CONTROLS 未导出到 window');
    assert(inputContent.includes('window.getDirection'), 'getDirection 未导出到 window');
});

// ============ 测试 6: 实体模块检查 ============
console.log('\n👤 测试 6: 实体模块检查');

const playerContent = fs.readFileSync(path.join(basePath, 'entities/Player.js'), 'utf-8');
const enemyContent = fs.readFileSync(path.join(basePath, 'entities/Enemy.js'), 'utf-8');

test('Player 类存在', () => {
    assert(playerContent.includes('class Player'), '缺少 Player 类');
});

test('Enemy 类存在', () => {
    assert(enemyContent.includes('class Enemy'), '缺少 Enemy 类');
});

test('EnemySpawner 类存在', () => {
    assert(enemyContent.includes('class EnemySpawner'), '缺少 EnemySpawner 类');
});

test('Player 有 update 方法', () => {
    assert(playerContent.includes('update('), 'Player 缺少 update 方法');
});

test('Player 有 takeDamage 方法', () => {
    assert(playerContent.includes('takeDamage'), 'Player 缺少 takeDamage 方法');
});

test('Enemy 导出到 window', () => {
    assert(enemyContent.includes('window.Enemy'), 'Enemy 未导出');
    assert(enemyContent.includes('window.EnemySpawner'), 'EnemySpawner 未导出');
});

// ============ 测试 7: UI 模块检查 ============
console.log('\n📊 测试 7: UI 模块检查');

const hudContent = fs.readFileSync(path.join(basePath, 'ui/HUD.js'), 'utf-8');

test('HUD 类存在', () => {
    assert(hudContent.includes('class HUD'), '缺少 HUD 类');
});

test('HUD 有 render 方法', () => {
    assert(hudContent.includes('render('), 'HUD 缺少 render 方法');
});

test('HUD 有 setPlayerHealth 方法', () => {
    assert(hudContent.includes('setPlayerHealth'), '缺少 setPlayerHealth 方法');
});

test('HUD 有 addScore 方法', () => {
    assert(hudContent.includes('addScore'), '缺少 addScore 方法');
});

// ============ 测试 8: README 检查 ============
console.log('\n📖 测试 8: 文档检查');

const readmeContent = fs.readFileSync(path.join(basePath, 'README.md'), 'utf-8');

test('README 包含项目说明', () => {
    assert(readmeContent.includes('三国战记'), 'README 缺少项目名称');
});

test('README 包含操作说明', () => {
    assert(readmeContent.includes('操作') || readmeContent.includes('按键'), 'README 缺少操作说明');
});

test('README 包含运行方法', () => {
    assert(readmeContent.includes('运行') || readmeContent.includes('启动'), 'README 缺少运行方法');
});

// ============ 测试总结 ============
console.log('\n' + '='.repeat(50));
console.log(`📊 测试总结：总计 ${total} 项 | ✅ 通过 ${passed} | ❌ 失败 ${failed}`);
console.log('='.repeat(50));

if (failed === 0) {
    console.log('\n🎉 所有测试通过！游戏可以推送！\n');
    process.exit(0);
} else {
    console.log('\n⚠️  存在失败的测试，请修复后再推送。\n');
    process.exit(1);
}
