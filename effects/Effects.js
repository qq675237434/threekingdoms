/**
 * Effects.js - 特效系统
 * 负责渲染所有视觉特效：刀光、火花、光效、屏幕震动等
 * 使用 Canvas 原生绘制，不依赖外部图片
 */

// 特效类型枚举
const EffectType = {
    SLASH: 'slash',           // 刀光效果
    SPARK: 'spark',           // 火花/受击效果
    LEVEL_UP: 'levelup',      // 升级光效
    SCREEN_SHAKE: 'screenshake', // 屏幕震动
    HIT_NUMBER: 'hitnumber',  // 伤害数字
    AURA: 'aura',             // 角色光环
    PROJECTILE_TRAIL: 'projectiletrail', // 飞行道具拖尾
    EXPLOSION: 'explosion'    // 爆炸效果
};

/**
 * 特效基类
 */
class Effect {
    constructor(type, x, y, duration = 1000) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.duration = duration;
        this.elapsed = 0;
        this.isComplete = false;
        this.alpha = 1;
    }
    
    update(deltaTime) {
        this.elapsed += deltaTime;
        if (this.elapsed >= this.duration) {
            this.isComplete = true;
        }
        // 默认 alpha 衰减
        this.alpha = 1 - (this.elapsed / this.duration);
    }
    
    render(ctx) {
        // 子类实现
    }
}

/**
 * 刀光特效 - 攻击时的武器轨迹
 */
class SlashEffect extends Effect {
    constructor(x, y, width, height, facing, color = '#fff') {
        super(EffectType.SLASH, x, y, 300);
        this.width = width;
        this.height = height;
        this.facing = facing; // 1: 右，-1: 左
        this.color = color;
        this.rotation = 0;
        this.maxRotation = Math.PI / 4;
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        // 旋转动画
        const progress = this.elapsed / this.duration;
        if (progress < 0.5) {
            this.rotation = (progress * 2) * this.maxRotation * this.facing;
        } else {
            this.rotation = (1 - (progress - 0.5) * 2) * this.maxRotation * this.facing;
        }
    }
    
    render(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);
        
        // 刀光渐变
        const gradient = ctx.createLinearGradient(
            -this.width / 2 * this.facing, 0,
            this.width / 2 * this.facing, 0
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${this.alpha * 0.2})`);
        gradient.addColorStop(0.5, `rgba(255, 255, 255, ${this.alpha * 0.8})`);
        gradient.addColorStop(1, `rgba(255, 255, 255, ${this.alpha * 0.2})`);
        
        // 绘制刀光弧形
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width / 2, this.height / 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 刀光边缘高光
        ctx.strokeStyle = `rgba(255, 255, 255, ${this.alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2, -Math.PI / 4, Math.PI / 4);
        ctx.stroke();
        
        ctx.restore();
    }
}

/**
 * 火花特效 - 受击时的粒子效果
 */
class SparkEffect extends Effect {
    constructor(x, y, count = 10, color = '#f39c12') {
        super(EffectType.SPARK, x, y, 500);
        this.particles = [];
        this.color = color;
        
        // 创建粒子
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
            const speed = 50 + Math.random() * 100;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 4,
                alpha: 1
            });
        }
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        const dt = deltaTime / 1000;
        
        this.particles.forEach(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 200 * dt; // 重力
            p.alpha = this.alpha * (1 - Math.random() * 0.3);
        });
    }
    
    render(ctx) {
        this.particles.forEach(p => {
            ctx.fillStyle = this.color;
            ctx.globalAlpha = p.alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }
}

/**
 * 升级光效 - 角色升级时的光环
 */
class LevelUpEffect extends Effect {
    constructor(x, y, radius = 100) {
        super(EffectType.LEVEL_UP, x, y, 1500);
        this.radius = radius;
        this.currentRadius = 0;
        this.rings = 3;
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        const progress = this.elapsed / this.duration;
        this.currentRadius = this.radius * Math.sin(progress * Math.PI);
    }
    
    render(ctx) {
        for (let i = 0; i < this.rings; i++) {
            const offset = i * 20;
            const ringRadius = this.currentRadius + offset;
            const alpha = this.alpha * (1 - i / this.rings);
            
            // 金色光环
            const gradient = ctx.createRadialGradient(
                this.x, this.y, ringRadius * 0.5,
                this.x, this.y, ringRadius
            );
            gradient.addColorStop(0, `rgba(255, 215, 0, ${alpha * 0.5})`);
            gradient.addColorStop(0.5, `rgba(255, 215, 0, ${alpha * 0.8})`);
            gradient.addColorStop(1, `rgba(255, 215, 0, 0)`);
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, ringRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // 光环边缘
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, ringRadius * 0.8, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}

/**
 * 屏幕震动效果
 */
class ScreenShakeEffect extends Effect {
    constructor(duration = 500, intensity = 10) {
        super(EffectType.SCREEN_SHAKE, 0, 0, duration);
        this.intensity = intensity;
        this.offsetX = 0;
        this.offsetY = 0;
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        const progress = this.elapsed / this.duration;
        const currentIntensity = this.intensity * (1 - progress);
        
        // 随机震动
        this.offsetX = (Math.random() - 0.5) * 2 * currentIntensity;
        this.offsetY = (Math.random() - 0.5) * 2 * currentIntensity;
    }
    
    apply(ctx, canvasWidth, canvasHeight) {
        if (!this.isComplete) {
            ctx.save();
            ctx.translate(this.offsetX, this.offsetY);
        }
    }
    
    restore(ctx) {
        ctx.restore();
    }
    
    render(ctx) {
        // 屏幕震动不直接渲染，通过 apply/restore 应用
    }
}

/**
 * 伤害数字特效
 */
class HitNumberEffect extends Effect {
    constructor(x, y, damage, isCritical = false) {
        super(EffectType.HIT_NUMBER, x, y, 1000);
        this.damage = damage;
        this.isCritical = isCritical;
        this.yOffset = 0;
        this.scale = isCritical ? 1.5 : 1;
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        // 数字上浮
        const progress = this.elapsed / this.duration;
        this.yOffset = -50 * Math.sin(progress * Math.PI);
        this.scale = this.isCritical ? 1.5 - progress * 0.5 : 1 - progress * 0.3;
    }
    
    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y + this.yOffset);
        ctx.scale(this.scale, this.scale);
        
        // 颜色根据伤害类型
        let color = '#e74c3c';
        if (this.isCritical) {
            color = '#f39c12';
        } else if (this.damage > 50) {
            color = '#e67e22';
        }
        
        // 阴影
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        // 数字文字
        ctx.fillStyle = color;
        ctx.font = `bold ${this.isCritical ? 32 : 24}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.damage, 0, 0);
        
        // 暴击文字
        if (this.isCritical) {
            ctx.font = 'bold 16px Arial';
            ctx.fillStyle = '#fff';
            ctx.fillText('CRITICAL!', 0, -25);
        }
        
        ctx.restore();
    }
}

/**
 * 角色光环特效 - 用于 BOSS 或强化状态
 */
class AuraEffect extends Effect {
    constructor(x, y, radius = 60, color = '#e74c3c', duration = -1) {
        super(EffectType.AURA, x, y, duration);
        this.radius = radius;
        this.color = color;
        this.pulse = 0;
        this.isInfinite = duration < 0;
    }
    
    update(deltaTime) {
        if (!this.isInfinite) {
            super.update(deltaTime);
        }
        // 脉冲动画
        this.pulse += deltaTime * 0.005;
    }
    
    render(ctx) {
        const pulseRadius = this.radius + Math.sin(this.pulse) * 10;
        const alpha = this.isInfinite ? 0.5 : this.alpha * 0.5;
        
        // 外光环
        const gradient = ctx.createRadialGradient(
            this.x, this.y, this.radius * 0.5,
            this.x, this.y, pulseRadius
        );
        gradient.addColorStop(0, this.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba'));
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, pulseRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // 内光环
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }
}

/**
 * 爆炸特效
 */
class ExplosionEffect extends Effect {
    constructor(x, y, radius = 80) {
        super(EffectType.EXPLOSION, x, y, 600);
        this.radius = radius;
        this.currentRadius = 0;
        this.particles = [];
        
        // 创建爆炸碎片
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 200;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 5,
                color: ['#e74c3c', '#f39c12', '#fff'][Math.floor(Math.random() * 3)],
                alpha: 1
            });
        }
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        const progress = this.elapsed / this.duration;
        this.currentRadius = this.radius * Math.sin(progress * Math.PI);
        
        const dt = deltaTime / 1000;
        this.particles.forEach(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 300 * dt;
            p.alpha = this.alpha * (1 - progress);
        });
    }
    
    render(ctx) {
        // 爆炸中心
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.currentRadius
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${this.alpha})`);
        gradient.addColorStop(0.3, `rgba(255, 200, 50, ${this.alpha * 0.8})`);
        gradient.addColorStop(0.6, `rgba(255, 100, 0, ${this.alpha * 0.5})`);
        gradient.addColorStop(1, `rgba(255, 0, 0, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.currentRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // 爆炸碎片
        this.particles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }
}

/**
 * 特效管理器
 */
class EffectManager {
    constructor() {
        this.effects = [];
        this.screenShake = null;
    }
    
    /**
     * 添加特效
     * @param {Effect} effect
     */
    addEffect(effect) {
        this.effects.push(effect);
    }
    
    /**
     * 创建刀光特效
     */
    createSlash(x, y, width, height, facing, color) {
        this.addEffect(new SlashEffect(x, y, width, height, facing, color));
    }
    
    /**
     * 创建火花特效
     */
    createSpark(x, y, count, color) {
        this.addEffect(new SparkEffect(x, y, count, color));
    }
    
    /**
     * 创建升级光效
     */
    createLevelUp(x, y, radius) {
        this.addEffect(new LevelUpEffect(x, y, radius));
    }
    
    /**
     * 创建屏幕震动
     */
    createScreenShake(duration, intensity) {
        this.screenShake = new ScreenShakeEffect(duration, intensity);
        this.addEffect(this.screenShake);
    }
    
    /**
     * 创建伤害数字
     */
    createHitNumber(x, y, damage, isCritical) {
        this.addEffect(new HitNumberEffect(x, y, damage, isCritical));
    }
    
    /**
     * 创建光环特效
     */
    createAura(x, y, radius, color, duration) {
        this.addEffect(new AuraEffect(x, y, radius, color, duration));
    }
    
    /**
     * 创建爆炸特效
     */
    createExplosion(x, y, radius) {
        this.addEffect(new ExplosionEffect(x, y, radius));
    }
    
    /**
     * 更新所有特效
     */
    update(deltaTime) {
        this.effects.forEach(effect => effect.update(deltaTime));
        this.effects = this.effects.filter(effect => !effect.isComplete);
        
        if (this.screenShake && this.screenShake.isComplete) {
            this.screenShake = null;
        }
    }
    
    /**
     * 渲染所有特效
     */
    render(ctx) {
        // 应用屏幕震动
        if (this.screenShake && !this.screenShake.isComplete) {
            ctx.save();
            ctx.translate(this.screenShake.offsetX, this.screenShake.offsetY);
        }
        
        this.effects.forEach(effect => {
            if (effect.type !== EffectType.SCREEN_SHAKE) {
                effect.render(ctx);
            }
        });
        
        // 恢复屏幕震动
        if (this.screenShake && !this.screenShake.isComplete) {
            ctx.restore();
        }
    }
    
    /**
     * 清空所有特效
     */
    clear() {
        this.effects = [];
        this.screenShake = null;
    }
}

// 导出
window.EffectType = EffectType;
window.Effect = Effect;
window.SlashEffect = SlashEffect;
window.SparkEffect = SparkEffect;
window.LevelUpEffect = LevelUpEffect;
window.ScreenShakeEffect = ScreenShakeEffect;
window.HitNumberEffect = HitNumberEffect;
window.AuraEffect = AuraEffect;
window.ExplosionEffect = ExplosionEffect;
window.EffectManager = EffectManager;
