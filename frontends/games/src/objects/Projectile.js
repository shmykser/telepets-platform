import Phaser from 'phaser';
import { PHYSICS_CONSTANTS, DEPTH_CONSTANTS } from '../settings/GameSettings.js';

/**
 * Класс снаряда для врагов
 */
export class Projectile extends Phaser.GameObjects.Container {
    constructor(scene, x, y, config = {}) {
        super(scene, x, y);
        
        // Параметры снаряда
        this.speed = config.speed || 400;
        this.damage = config.damage || 1;
        this.direction = config.direction || { x: 1, y: 0 };
        this.target = config.target || null;
        this.source = config.source || null;
        this.color = config.color || 0xFF6600; // Рыжий по умолчанию
        this.lifetime = config.lifetime || 5000; // 5 секунд жизни
        
        // Создаем визуальное представление снаряда
        this.createVisual();
        
        // Настраиваем физику
        this.setupPhysics();
        
        // Устанавливаем скорость
        this.setVelocity();
        
        // Устанавливаем таймер уничтожения
        this.setupLifetime();
        
        // Добавляем в сцену
        scene.add.existing(this);
        
        console.log(`💥 [Projectile] Создан снаряд: скорость=${this.speed}, урон=${this.damage}, направление=(${this.direction.x.toFixed(2)}, ${this.direction.y.toFixed(2)})`);
    }
    
    /**
     * Создание визуального представления снаряда
     */
    createVisual() {
        // Создаем круг как снаряд
        this.graphics = this.scene.add.graphics();
        this.graphics.fillStyle(this.color);
        this.graphics.fillCircle(0, 0, 4); // Радиус 4 пикселя
        this.add(this.graphics);
        
        // Устанавливаем глубину
        this.setDepth(DEPTH_CONSTANTS.PROJECTILE);
    }
    
    /**
     * Настройка физики снаряда
     */
    setupPhysics() {
        // Создаем физическое тело
        this.scene.physics.add.existing(this);
        this.physicsBody = this.body;
        
        // Настраиваем физические свойства
        this.physicsBody.setSize(8, 8); // Размер коллизии
        this.physicsBody.setOffset(-4, -4); // Центрируем коллизию
        this.physicsBody.setBounce(0.1);
        this.physicsBody.setDrag(0);
        
        // Включаем коллизии с миром
        this.physicsBody.setCollideWorldBounds(true);
        this.physicsBody.onWorldBounds = true;
        
        // Обработчик столкновения с границами мира
        this.physicsBody.world.on('worldbounds', (event) => {
            if (event.gameObject === this) {
                this.destroy();
            }
        });
    }
    
    /**
     * Установка скорости снаряда
     */
    setVelocity() {
        if (this.physicsBody) {
            this.physicsBody.setVelocity(
                this.direction.x * this.speed,
                this.direction.y * this.speed
            );
        }
    }
    
    /**
     * Настройка времени жизни снаряда
     */
    setupLifetime() {
        this.scene.time.delayedCall(this.lifetime, () => {
            if (this && this.scene) {
                this.destroy();
            }
        });
    }
    
    /**
     * Обновление снаряда
     */
    update(time, delta) {
        super.update(time, delta);
        
        // Проверяем столкновение с целью
        if (this.target && this.target.isAlive) {
            const distance = this.scene.physics.world.distance(this, this.target);
            if (distance < 10) { // Если очень близко к цели
                this.hitTarget();
            }
        }
    }
    
    /**
     * Попадание в цель
     */
    hitTarget() {
        if (this.target && this.target.isAlive) {
            console.log(`💥 [Projectile] Попадание в цель! Урон: ${this.damage}`);
            
            // Наносим урон цели
            if (this.target.takeDamage) {
                this.target.takeDamage(this.damage, this.source);
            }
            
            // Отправляем событие попадания
            if (this.scene.events) {
                this.scene.events.emit('projectile_hit', {
                    projectile: this,
                    target: this.target,
                    damage: this.damage,
                    source: this.source
                });
            }
        }
        
        // Уничтожаем снаряд
        this.destroy();
    }
    
    /**
     * Уничтожение снаряда
     */
    destroy() {
        if (this.graphics) {
            this.graphics.destroy();
        }
        super.destroy();
    }
}
