/**
 * CharacterSelect.js - 角色选择界面
 * 负责显示角色选择界面和处理角色选择
 */

class CharacterSelect {
    constructor(game) {
        this.game = game;
        this.canvas = null;
        this.ctx = null;
        this.isVisible = false;
        this.selectedCharacter = null;
        this.hoveredCharacter = null;
        
        // 角色配置
        this.characters = [
            {
                id: 'guanyu',
                name: '关羽',
                title: '武圣',
                description: '青龙偃月刀，横扫千军',
                stats: {
                    health: 120,
                    attack: 18,
                    defense: 8,
                    speed: 180
                },
                color: '#2ecc71',
                weapon: '青龙偃月刀',
                skill: {
                    name: '青龙斩',
                    description: '向前方扇形区域攻击，伤害 80',
                    cooldown: 5
                },
                image: null // 可以后续添加角色图片
            },
            {
                id: 'zhangfei',
                name: '张飞',
                title: '万人敌',
                description: '蛇矛横扫，勇冠三军',
                stats: {
                    health: 150,
                    attack: 20,
                    defense: 6,
                    speed: 170
                },
                color: '#e74c3c',
                weapon: '丈八蛇矛',
                skill: {
                    name: '怒吼冲锋',
                    description: '向目标冲锋并眩晕 2 秒，伤害 60',
                    cooldown: 6
                },
                image: null
            },
            {
                id: 'zhaoyun',
                name: '赵云',
                title: '常胜将军',
                description: '龙胆亮银枪，七进七出',
                stats: {
                    health: 100,
                    attack: 16,
                    defense: 7,
                    speed: 200
                },
                color: '#3498db',
                weapon: '龙胆亮银枪',
                skill: {
                    name: '七进七出',
                    description: '短时间内无敌并连续攻击，伤害 100',
                    cooldown: 8
                },
                image: null
            }
        ];
        
        // 选择状态
        this.selectedIndex = 1; // 默认选中中间的关羽
        this.confirmTimer = 0;
        this.confirmDuration = 0.3; // 确认需要按住 0.3 秒（优化：从 0.5 秒缩短）
        this.isConfirming = false;
        this.hoverScale = 1; // 悬停缩放效果
    }
    
    /**
     * 初始化角色选择界面
     * @param {HTMLCanvasElement} canvas
     */
    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // 设置鼠标/触摸事件
        this.setupInput();
    }
    
    /**
     * 设置输入事件
     */
    setupInput() {
        if (!this.canvas) return;
        
        // 鼠标移动
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isVisible) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            
            // 检测鼠标悬停在哪个角色上
            const cardWidth = 200;
            const gap = 40;
            const totalWidth = cardWidth * 3 + gap * 2;
            const startX = (this.canvas.width - totalWidth) / 2;
            
            for (let i = 0; i < this.characters.length; i++) {
                const cardX = startX + i * (cardWidth + gap);
                if (mouseX >= cardX && mouseX <= cardX + cardWidth) {
                    if (this.hoveredCharacter !== i) {
                        this.hoveredCharacter = i;
                        this.hoverScale = 1.05; // 悬停时放大
                    }
                    break;
                }
            }
        });
        
        // 鼠标点击
        this.canvas.addEventListener('click', (e) => {
            if (!this.isVisible) return;
            
            if (this.hoveredCharacter !== null) {
                this.selectedIndex = this.hoveredCharacter;
                this.confirmSelection();
            }
        });
        
        // 键盘控制
        window.addEventListener('keydown', (e) => {
            if (!this.isVisible) return;
            
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
                this.selectedIndex = Math.max(0, this.selectedIndex - 1);
                this.playSound('select');
            } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
                this.selectedIndex = Math.min(this.characters.length - 1, this.selectedIndex + 1);
                this.playSound('select');
            } else if (e.code === 'KeyJ' || e.code === 'Enter' || e.code === 'Space') {
                this.confirmSelection();
            }
        });
    }
    
    /**
     * 处理键盘输入
     */
    handleInput(e) {
        if (!this.isVisible) return;
        
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
            this.selectedIndex = Math.max(0, this.selectedIndex - 1);
            console.log('选择角色:', this.selectedIndex);
        } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
            this.selectedIndex = Math.min(this.characters.length - 1, this.selectedIndex + 1);
            console.log('选择角色:', this.selectedIndex);
        } else if (e.code === 'KeyJ' || e.code === 'Enter' || e.code === 'Space') {
            this.confirmSelection();
        }
    }
    
    /**
     * 显示角色选择界面
     */
    show() {
        this.isVisible = true;
        this.selectedIndex = 1;
        this.hoveredCharacter = null;
        console.log('显示角色选择界面');
    }
    
    /**
     * 隐藏角色选择界面
     */
    hide() {
        this.isVisible = false;
    }
    
    /**
     * 确认选择
     */
    confirmSelection() {
        this.isConfirming = true;
        this.confirmTimer = this.confirmDuration;
        
        setTimeout(() => {
            if (this.isConfirming) {
                this.selectCharacter();
            }
        }, this.confirmDuration * 1000);
    }
    
    /**
     * 选择角色
     */
    selectCharacter() {
        const character = this.characters[this.selectedIndex];
        this.selectedCharacter = character;
        
        console.log(`选择角色：${character.name}`);
        
        // 创建玩家
        if (this.game) {
            this.game.createPlayerWithCharacter(character);
            // 设置游戏状态为 playing
            this.game.gameState = 'playing';
        }
        
        // 隐藏选择界面
        this.hide();
        
        // 显示消息
        if (this.game && this.game.hud) {
            this.game.hud.showMessage(`选择${character.name}`, character.color);
        }
        
        // 开始游戏
        if (this.game) {
            console.log('角色已选择，开始游戏...');
            // 添加玩家到场景
            if (this.game.player) {
                this.game.addPlayerToScene();
            }
            // 开始第一关
            if (this.game.levelManager) {
                this.game.levelManager.startLevel(0);
            }
        }
    }
    
    /**
     * 更新界面
     * @param {number} deltaTime
     */
    update(deltaTime) {
        if (!this.isVisible) return;
        
        // 悬停缩放动画
        if (this.hoveredCharacter !== null && this.hoverScale < 1.05) {
            this.hoverScale += deltaTime * 2;
            if (this.hoverScale > 1.05) this.hoverScale = 1.05;
        } else if (this.hoveredCharacter === null && this.hoverScale > 1) {
            this.hoverScale -= deltaTime * 2;
            if (this.hoverScale < 1) this.hoverScale = 1;
        }
        
        if (this.isConfirming) {
            this.confirmTimer -= deltaTime;
            if (this.confirmTimer <= 0) {
                this.isConfirming = false;
                this.selectCharacter();
            }
        }
    }
    
    /**
     * 渲染界面
     */
    render() {
        if (!this.isVisible || !this.ctx) return;
        
        // 半透明背景
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 标题
        this.ctx.fillStyle = '#f39c12';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = '#f39c12';
        this.ctx.shadowBlur = 10;
        this.ctx.fillText('选择武将', this.canvas.width / 2, 80);
        this.ctx.shadowBlur = 0;
        
        // 副标题
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px Arial';
        this.ctx.fillText('使用 ← → 或 A/D 选择，按 J 或点击确认', this.canvas.width / 2, 120);
        
        // 渲染角色卡片
        this.renderCharacterCards();
        
        // 渲染选中角色详情
        this.renderCharacterDetail();
        
        // 确认进度条
        if (this.isConfirming) {
            this.renderConfirmProgress();
        }
    }
    
    /**
     * 渲染角色卡片
     */
    renderCharacterCards() {
        const cardWidth = 200;
        const cardHeight = 280;
        const gap = 40;
        const totalWidth = cardWidth * 3 + gap * 2;
        const startX = (this.canvas.width - totalWidth) / 2;
        const cardY = 180;
        
        this.characters.forEach((char, index) => {
            const x = startX + index * (cardWidth + gap);
            const isSelected = index === this.selectedIndex;
            const isHovered = index === this.hoveredCharacter;
            
            // 悬停效果：缩放卡片
            if (isHovered || isSelected) {
                const scale = isHovered ? this.hoverScale : 1;
                const offsetX = (cardWidth - cardWidth * scale) / 2;
                const offsetY = (cardHeight - cardHeight * scale) / 2;
                
                this.ctx.save();
                this.ctx.translate(x + cardWidth / 2, cardY + cardHeight / 2);
                this.ctx.scale(scale, scale);
                this.ctx.translate(-x - cardWidth / 2, -cardY - cardHeight / 2);
            }
            
            // 卡片背景（悬停时更亮）
            this.ctx.fillStyle = isSelected ? '#34495e' : isHovered ? '#34495e' : '#1a252f';
            this.ctx.fillRect(x, cardY, cardWidth, cardHeight);
            
            // 边框（悬停和选中时高亮）
            this.ctx.strokeStyle = isSelected ? char.color : isHovered ? char.color : '#555';
            this.ctx.lineWidth = isSelected ? 4 : isHovered ? 3 : 2;
            this.ctx.strokeRect(x, cardY, cardWidth, cardHeight);
            
            // 悬停光晕效果
            if (isHovered && !isSelected) {
                this.ctx.shadowColor = char.color;
                this.ctx.shadowBlur = 15;
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                this.ctx.strokeRect(x, cardY, cardWidth, cardHeight);
                this.ctx.shadowBlur = 0;
            }
            
            // 角色名称
            this.ctx.fillStyle = char.color;
            this.ctx.font = 'bold 28px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(char.name, x + cardWidth / 2, cardY + 50);
            
            // 称号
            this.ctx.fillStyle = '#95a5a6';
            this.ctx.font = '16px Arial';
            this.ctx.fillText(char.title, x + cardWidth / 2, cardY + 75);
            
            // 武器
            this.ctx.fillStyle = '#bdc3c7';
            this.ctx.font = '14px Arial';
            this.ctx.fillText(char.weapon, x + cardWidth / 2, cardY + 100);
            
            // 属性图标 + 数值
            this.renderStats(x, cardY + 130, char.stats);
            
            // 选择提示
            if (isSelected) {
                this.ctx.fillStyle = '#f39c12';
                this.ctx.font = 'bold 16px Arial';
                this.ctx.fillText('按 J 确认', x + cardWidth / 2, cardY + cardHeight - 30);
            }
            
            // 恢复悬停缩放
            if (isHovered || isSelected) {
                this.ctx.restore();
            }
        });
    }
    
    /**
     * 渲染属性
     */
    renderStats(x, y, stats) {
        const statNames = ['血量', '攻击', '防御', '速度'];
        const statKeys = ['health', 'attack', 'defense', 'speed'];
        const colors = ['#e74c3c', '#f39c12', '#3498db', '#2ecc71'];
        
        statKeys.forEach((key, index) => {
            const statName = statNames[index];
            const value = stats[key];
            const statY = y + index * 25;
            
            // 属性名
            this.ctx.fillStyle = '#7f8c8d';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(statName, x + 20, statY);
            
            // 属性值
            this.ctx.fillStyle = colors[index];
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(value.toString(), x + cardWidth - 20, statY);
        });
    }
    
    /**
     * 渲染角色详情
     */
    renderCharacterDetail() {
        const char = this.characters[this.selectedIndex];
        const detailX = 50;
        const detailY = this.canvas.height - 200;
        const detailWidth = this.canvas.width - 100;
        
        // 背景
        this.ctx.fillStyle = 'rgba(52, 73, 94, 0.9)';
        this.ctx.fillRect(detailX, detailY, detailWidth, 150);
        
        // 边框
        this.ctx.strokeStyle = char.color;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(detailX, detailY, detailWidth, 150);
        
        // 描述
        this.ctx.fillStyle = '#ecf0f1';
        this.ctx.font = '18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(char.description, this.canvas.width / 2, detailY + 40);
        
        // 技能名称
        this.ctx.fillStyle = '#f39c12';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.fillText(`专属技能：${char.skill.name}`, this.canvas.width / 2, detailY + 80);
        
        // 技能描述
        this.ctx.fillStyle = '#bdc3c7';
        this.ctx.font = '14px Arial';
        this.ctx.fillText(char.skill.description, this.canvas.width / 2, detailY + 110);
        
        // 冷却时间
        this.ctx.fillStyle = '#95a5a6';
        this.ctx.fillText(`冷却时间：${char.skill.cooldown}秒`, this.canvas.width / 2, detailY + 135);
    }
    
    /**
     * 渲染确认进度条
     */
    renderConfirmProgress() {
        const char = this.characters[this.selectedIndex];
        const cardWidth = 200;
        const gap = 40;
        const totalWidth = cardWidth * 3 + gap * 2;
        const startX = (this.canvas.width - totalWidth) / 2;
        const cardY = 180;
        
        const x = startX + this.selectedIndex * (cardWidth + gap);
        const barWidth = cardWidth - 20;
        const barHeight = 8;
        const barX = x + 10;
        const barY = cardY + cardHeight - 20;
        
        // 背景
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // 进度
        const progress = 1.0 - (this.confirmTimer / this.confirmDuration);
        this.ctx.fillStyle = char.color;
        this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);
    }
    
    /**
     * 播放音效（待实现）
     * @param {string} type
     */
    playSound(type) {
        // 后续可以添加音效系统
        // console.log(`播放音效：${type}`);
    }
    
    /**
     * 获取选中的角色
     * @returns {object|null}
     */
    getSelectedCharacter() {
        return this.selectedCharacter;
    }
}

// 导出
window.CharacterSelect = CharacterSelect;
