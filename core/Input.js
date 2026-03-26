/**
 * Input.js - 输入处理模块
 * 负责处理键盘、鼠标等输入设备
 */
class Input {
    constructor() {
        this.keys = {};
        this.keyDownListeners = [];
        this.keyUpListeners = [];
        
        this.init();
    }
    
    /**
     * 初始化事件监听
     */
    init() {
        // 键盘按下
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            this.keyDownListeners.forEach(listener => listener(e));
        });
        
        // 键盘释放
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            this.keyUpListeners.forEach(listener => listener(e));
        });
    }
    
    /**
     * 检查按键是否按下
     * @param {string} keyCode - 按键代码 (如 'KeyA', 'ArrowLeft')
     * @returns {boolean}
     */
    isPressed(keyCode) {
        return !!this.keys[keyCode];
    }
    
    /**
     * 检查多个按键中是否有任意一个按下
     * @param {string[]} keyCodes - 按键代码数组
     * @returns {boolean}
     */
    isAnyPressed(keyCodes) {
        return keyCodes.some(code => this.isPressed(code));
    }
    
    /**
     * 注册按键按下监听器
     * @param {function} callback - 回调函数
     */
    onKeyDown(callback) {
        this.keyDownListeners.push(callback);
    }
    
    /**
     * 注册按键释放监听器
     * @param {function} callback - 回调函数
     */
    onKeyUp(callback) {
        this.keyUpListeners.push(callback);
    }
    
    /**
     * 获取当前所有按下的键
     * @returns {string[]}
     */
    getPressedKeys() {
        return Object.keys(this.keys).filter(key => this.keys[key]);
    }
    
    /**
     * 重置所有按键状态
     */
    reset() {
        this.keys = {};
    }
}

// 默认输入实例
const defaultInput = new Input();

// 游戏控制映射
const CONTROLS = {
    LEFT: ['ArrowLeft', 'KeyA'],
    RIGHT: ['ArrowRight', 'KeyD'],
    UP: ['ArrowUp', 'KeyW'],
    DOWN: ['ArrowDown', 'KeyS'],
    ATTACK: ['KeyJ', 'Space'],
    SKILL: ['KeyK'],
    JUMP: ['KeyL', 'ArrowUp']
};

/**
 * 检查方向输入
 * @returns {object} { left, right, up, down }
 */
function getDirection() {
    return {
        left: defaultInput.isAnyPressed(CONTROLS.LEFT),
        right: defaultInput.isAnyPressed(CONTROLS.RIGHT),
        up: defaultInput.isAnyPressed(CONTROLS.UP),
        down: defaultInput.isAnyPressed(CONTROLS.DOWN)
    };
}

/**
 * 检查攻击输入
 * @returns {boolean}
 */
function isAttacking() {
    return defaultInput.isAnyPressed(CONTROLS.ATTACK);
}

/**
 * 检查技能输入
 * @returns {boolean}
 */
function isUsingSkill() {
    return defaultInput.isAnyPressed(CONTROLS.SKILL);
}

// 导出
window.Input = Input;
window.defaultInput = defaultInput;
window.CONTROLS = CONTROLS;
window.getDirection = getDirection;
window.isAttacking = isAttacking;
window.isUsingSkill = isUsingSkill;
