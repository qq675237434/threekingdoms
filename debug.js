/**
 * debug.js - 调试工具
 * 提供调试功能和快速测试命令
 */

class DebugTools {
    constructor(game) {
        this.game = game;
        this.enabled = true;
        this.logBuffer = [];
        
        // 暴露到全局
        window.debug = this;
        window.game = game;
        
        this.setupConsoleCommands();
    }
    
    /**
     * 设置控制台命令
     */
    setupConsoleCommands() {
        // 快速开始游戏
        window.startGame = () => {
            console.log('🎮 快速开始游戏...');
            if (this.game) {
                this.game.gameState = 'playing';
                if (!this.game.player) {
                    this.game.createPlayerWithCharacter({
                        id: 'guanyu',
                        name: '关羽',
                        stats: { health: 120, attack: 18, defense: 8, speed: 180 }
                    });
                }
                this.game.startGameInternal();
                console.log('✅ 游戏已开始！使用 WASD 移动，J 攻击');
            }
            return '游戏已启动';
        };
        
        // 显示角色选择
        window.showCharacterSelect = () => {
            console.log('🎭 显示角色选择...');
            if (this.game) {
                this.game.gameState = 'select';
                if (this.game.startScreen) {
                    this.game.startScreen.isVisible = false;
                }
                if (this.game.characterSelect) {
                    this.game.characterSelect.show();
                    console.log('✅ 角色选择界面已显示，使用 ←/→ 选择，J 确认');
                }
            }
            return '角色选择已显示';
        };
        
        // 显示主菜单
        window.showMainMenu = () => {
            console.log('📋 显示主菜单...');
            if (this.game) {
                this.game.gameState = 'start';
                if (this.game.startScreen) {
                    this.game.startScreen.isVisible = true;
                    this.game.startScreen.show();
                    console.log('✅ 主菜单已显示');
                }
            }
            return '主菜单已显示';
        };
        
        // 添加无敌模式
        window.godMode = (enabled = true) => {
            if (this.game && this.game.player) {
                this.game.player.isInvincible = enabled;
                console.log(`🛡️ 无敌模式：${enabled ? '开启' : '关闭'}`);
            }
            return enabled ? '无敌模式已开启' : '无敌模式已关闭';
        };
        
        // 添加生命
        window.addHealth = (amount = 50) => {
            if (this.game && this.game.player) {
                this.game.player.health += amount;
                console.log(`❤️ 生命 +${amount}, 当前：${this.game.player.health}`);
            }
            return `生命 +${amount}`;
        };
        
        // 跳过当前关卡
        window.nextLevel = () => {
            if (this.game && this.game.levelManager) {
                const currentLevel = this.game.levelManager.currentLevelIndex;
                this.game.levelManager.startLevel(currentLevel + 1);
                console.log(`⏭️ 跳到第 ${currentLevel + 2} 关`);
            }
            return '已跳到下一关';
        };
        
        // 显示游戏状态
        window.gameState = () => {
            if (!this.game) return '游戏未初始化';
            
            const state = {
                gameState: this.game.gameState,
                isInitialized: this.game.isInitialized,
                isRunning: this.game.isRunning,
                hasPlayer: !!this.game.player,
                hasLevelManager: !!this.game.levelManager,
                playerHealth: this.game.player?.health,
                fps: this.game.gameLoop?.getFPS()
            };
            console.log('📊 游戏状态:', state);
            return state;
        };
        
        // 打印帮助
        window.debugHelp = () => {
            console.log(`
🎮 三国战记 - 调试命令

startGame() - 快速开始游戏
showCharacterSelect() - 显示角色选择
showMainMenu() - 显示主菜单
godMode(true/false) - 无敌模式
addHealth(50) - 添加生命
nextLevel() - 跳过当前关卡
gameState() - 显示游戏状态
debugHelp() - 显示帮助

打开控制台按 F12
            `);
            return '帮助已显示';
        };
        
        console.log('🔧 调试工具已加载，输入 debugHelp() 查看命令');
    }
    
    /**
     * 日志输出
     */
    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logMessage = `[${timestamp}] ${message}`;
        this.logBuffer.push(logMessage);
        
        if (this.enabled) {
            switch (type) {
                case 'error': console.error(logMessage); break;
                case 'warn': console.warn(logMessage); break;
                default: console.log(logMessage);
            }
        }
    }
    
    /**
     * 获取日志历史
     */
    getLogs() {
        return this.logBuffer.slice(-50);
    }
    
    /**
     * 清除日志
     */
    clearLogs() {
        this.logBuffer = [];
    }
}

// 自动初始化
window.DebugTools = DebugTools;
