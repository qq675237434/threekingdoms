/**
 * StartScreen.js - 游戏开始界面
 * 负责显示游戏标题、菜单选项
 */

class StartScreen {
    constructor(game) {
        this.game = game;
        this.canvas = null;
        this.ctx = null;
        this.isVisible = true;
        
        // 菜单选项
        this.menuItems = [
            { id: 'start', text: '开始游戏', color: '#f39c12' },
            { id: 'character', text: '选择武将', color: '#3498db' },
            { id: 'settings', text: '游戏设置', color: '#2ecc71' },
            { id: 'credits', text: '制作人员', color: '#9b59b6' },
            { id: 'exit', text: '退出游戏', color: '#e74c3c' }
        ];
        
        this.selectedIndex = 0;
        this.blinkTimer = 0;
        this.blinkInterval = 0.5;
        
        // 背景动画
        this.particles = [];
        this.initParticles();
    }
    
    /**
     * 初始化开始界面
     * @param {HTMLCanvasElement} canvas
     */
    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // 设置输入事件
        this.setupInput();
    }
    
    /**
     * 设置输入事件
     */
    setupInput() {
        window.addEventListener('keydown', (e) => {
            if (!this.isVisible) return;
            
            if (e.code === 'ArrowUp' || e.code === 'KeyW') {
                this.selectedIndex = Math.max(0, this.selectedIndex - 1);
            } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
                this.selectedIndex = Math.min(this.menuItems.length - 1, this.selectedIndex + 1);
            } else if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyJ') {
                this.selectMenuItem();
            }
        });
        
        // 鼠标点击
        if (this.canvas) {
            this.canvas.addEventListener('click', (e) => {
                if (!this.isVisible) return;
                
                const rect = this.canvas.getBoundingClientRect();
                const mouseY = e.clientY - rect.top;
                
                // 检测点击了哪个菜单项
                const menuX = this.canvas.width / 2;
                const menuY = this.canvas.height / 2 + 50;
                const itemHeight = 50;
                
                this.menuItems.forEach((item, index) => {
                    const itemY = menuY + index * itemHeight;
                    if (mouseY >= itemY - 20 && mouseY <= itemY + 30) {
                        this.selectedIndex = index;
                        this.selectMenuItem();
                    }
                });
            });
        }
    }
    
    /**
     * 初始化背景粒子
     */
    initParticles() {
        this.particles = [];
        for (let i = 0; i < 50; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 3 + 1,
                speedY: Math.random() * 0.5 + 0.2,
                opacity: Math.random() * 0.5 + 0.2
            });
        }
    }
    
    /**
     * 更新界面
     * @param {number} deltaTime
     */
    update(deltaTime) {
        if (!this.isVisible) return;
        
        // 更新闪烁计时器
        this.blinkTimer += deltaTime;
        if (this.blinkTimer >= this.blinkInterval) {
            this.blinkTimer = 0;
        }
        
        // 更新粒子
        this.particles.forEach(p => {
            p.y -= p.speedY;
            if (p.y < -10) {
                p.y = this.canvas.height + 10;
                p.x = Math.random() * this.canvas.width;
            }
        });
    }
    
    /**
     * 渲染界面
     */
    render() {
        if (!this.isVisible || !this.ctx) return;
        
        // 渲染背景
        this.renderBackground();
        
        // 渲染标题
        this.renderTitle();
        
        // 渲染菜单
        this.renderMenu();
        
        // 渲染版权信息
        this.renderCopyright();
    }
    
    /**
     * 渲染背景
     */
    renderBackground() {
        // 渐变背景
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#1a0a0a');
        gradient.addColorStop(0.5, '#3d1f1f');
        gradient.addColorStop(1, '#1a0a0a');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 粒子效果
        this.particles.forEach(p => {
            this.ctx.fillStyle = `rgba(243, 156, 28, ${p.opacity})`;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // 装饰性图案（简单的三角形/战旗）
        this.renderDecorations();
    }
    
    /**
     * 渲染装饰图案
     */
    renderDecorations() {
        this.ctx.fillStyle = 'rgba(243, 156, 28, 0.1)';
        
        // 左侧三角形
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(150, 0);
        this.ctx.lineTo(0, 200);
        this.ctx.closePath();
        this.ctx.fill();
        
        // 右侧三角形
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width, 0);
        this.ctx.lineTo(this.canvas.width - 150, 0);
        this.ctx.lineTo(this.canvas.width, 200);
        this.ctx.closePath();
        this.ctx.fill();
        
        // 底部三角形
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.canvas.height);
        this.ctx.lineTo(200, this.canvas.height);
        this.ctx.lineTo(0, this.canvas.height - 250);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width, this.canvas.height);
        this.ctx.lineTo(this.canvas.width - 200, this.canvas.height);
        this.ctx.lineTo(this.canvas.width, this.canvas.height - 250);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    /**
     * 渲染标题
     */
    renderTitle() {
        const titleX = this.canvas.width / 2;
        const titleY = 120;
        
        // 标题阴影
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.font = 'bold 72px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('三国战记', titleX + 4, titleY + 4);
        
        // 标题主体
        const gradient = this.ctx.createLinearGradient(titleX - 150, titleY, titleX + 150, titleY);
        gradient.addColorStop(0, '#f39c12');
        gradient.addColorStop(0.5, '#f1c40f');
        gradient.addColorStop(1, '#e67e22');
        this.ctx.fillStyle = gradient;
        this.ctx.shadowColor = '#f39c12';
        this.ctx.shadowBlur = 20;
        this.ctx.fillText('三国战记', titleX, titleY);
        this.ctx.shadowBlur = 0;
        
        // 副标题
        this.ctx.fillStyle = '#ecf0f1';
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Three Kingdoms Battle', titleX, titleY + 50);
        
        // 版本信息
        const isBlinking = Math.floor(this.blinkTimer / this.blinkInterval) % 2 === 0;
        this.ctx.fillStyle = isBlinking ? '#95a5a6' : '#7f8c8d';
        this.ctx.font = '16px Arial';
        this.ctx.fillText('按任意键开始', titleX, titleY + 100);
    }
    
    /**
     * 渲染菜单
     */
    renderMenu() {
        const menuX = this.canvas.width / 2;
        const menuY = this.canvas.height / 2 + 50;
        const itemHeight = 50;
        
        this.menuItems.forEach((item, index) => {
            const y = menuY + index * itemHeight;
            const isSelected = index === this.selectedIndex;
            
            // 选中背景
            if (isSelected) {
                this.ctx.fillStyle = 'rgba(243, 156, 28, 0.2)';
                this.ctx.fillRect(menuX - 150, y - 30, 300, 40);
            }
            
            // 菜单文字
            this.ctx.fillStyle = isSelected ? item.color : '#bdc3c7';
            this.ctx.font = isSelected ? 'bold 32px Arial' : '28px Arial';
            this.ctx.textAlign = 'center';
            
            // 选中项添加阴影
            if (isSelected) {
                this.ctx.shadowColor = item.color;
                this.ctx.shadowBlur = 10;
            }
            
            this.ctx.fillText(item.text, menuX, y);
            this.ctx.shadowBlur = 0;
            
            // 选中指示器
            if (isSelected) {
                this.ctx.fillStyle = item.color;
                this.ctx.font = '24px Arial';
                this.ctx.textAlign = 'left';
                this.ctx.fillText('▶', menuX - 160, y + 8);
                this.ctx.textAlign = 'right';
                this.ctx.fillText('◀', menuX + 160, y + 8);
            }
        });
    }
    
    /**
     * 渲染版权信息
     */
    renderCopyright() {
        this.ctx.fillStyle = '#7f8c8d';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('© 2026 Three Kingdoms Game | Made with OpenClaw', 
            this.canvas.width / 2, this.canvas.height - 30);
    }
    
    /**
     * 选择菜单项
     */
    selectMenuItem() {
        const selectedItem = this.menuItems[this.selectedIndex];
        console.log(`选择菜单：${selectedItem.text}`);
        
        switch (selectedItem.id) {
            case 'start':
                this.startGame();
                break;
            case 'character':
                this.showCharacterSelect();
                break;
            case 'settings':
                this.showSettings();
                break;
            case 'credits':
                this.showCredits();
                break;
            case 'exit':
                this.exitGame();
                break;
        }
    }
    
    /**
     * 开始游戏
     */
    startGame() {
        console.log('开始游戏');
        this.isVisible = false;
        
        if (this.game) {
            // 默认选择关羽
            const defaultCharacter = {
                id: 'guanyu',
                name: '关羽',
                stats: { health: 120, attack: 18, defense: 8, speed: 180 }
            };
            this.game.createPlayerWithCharacter(defaultCharacter);
            this.game.onStartGame();
        }
    }
    
    /**
     * 显示角色选择
     */
    showCharacterSelect() {
        console.log('显示角色选择');
        this.isVisible = false;
        
        if (this.game && this.game.characterSelect) {
            this.game.characterSelect.show();
        }
    }
    
    /**
     * 显示设置（待实现）
     */
    showSettings() {
        console.log('显示设置');
        if (this.game && this.game.hud) {
            this.game.hud.showMessage('设置功能开发中...', '#95a5a6');
        }
    }
    
    /**
     * 显示制作人员
     */
    showCredits() {
        console.log('显示制作人员');
        if (this.game && this.game.hud) {
            this.game.hud.showMessage('制作人：老易 | 技术支持：OpenClaw', '#9b59b6');
        }
    }
    
    /**
     * 退出游戏
     */
    exitGame() {
        console.log('退出游戏');
        // 浏览器中无法真正退出，显示提示
        if (this.game && this.game.hud) {
            this.game.hud.showMessage('感谢游玩！可以关闭浏览器窗口', '#e74c3c');
        }
    }
    
    /**
     * 显示界面
     */
    show() {
        this.isVisible = true;
    }
    
    /**
     * 隐藏界面
     */
    hide() {
        this.isVisible = false;
    }
}

// 导出
window.StartScreen = StartScreen;
