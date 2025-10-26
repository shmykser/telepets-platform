import { ITEM_TYPES } from './itemTypes.js';

export const enemyTypes = {
    unknown: {
        name: 'Неизвестный',
        health: 10,
        canFly: false,
        size: 1,
        texture: '❓',
        spriteKey: 'ant',
        defaultSize: '64x64',
        detectionRange: 150,
        dropList: [ITEM_TYPES.HEART, ITEM_TYPES.PATCH], // Базовый список + мёд
        movement: {
            strategy: 'linear',
            speed: 70,
            rotationSpeed: 5.0
        },
        attack: {
            strategy: 'simple',
            damage: 5,
            range: 30,
            cooldown: 5000
        },
        collision: {
            enabled: true,
            layers: ['ENEMIES', 'OBSTACLES']
        },
        pathfinding: {
            algorithm: 'astar',
            allowDiagonal: true,
            ignoreGroundObstacles: false
        }
    },
    ant: {
        name: 'Муравей',
        health: 5,
        canFly: false,
        size: 1,
        texture: '🐜',
        spriteKey: 'ant',
        defaultSize: '32x32',
        detectionRange: 150,
        dropList: [], //ничего не дропается
        movement: {
            strategy: 'linear',
            speed: 60,
            rotationSpeed: 7.5,
        },
        attack: {
            strategy: 'simple',
            damage: 3,
            range: -5,
            cooldown: 5000
        },
        collision: {
            enabled: true,
            layers: ['ENEMIES', 'OBSTACLES']
        },
        pathfinding: {
            algorithm: 'astar',
            allowDiagonal: true,
            ignoreGroundObstacles: false
        }
    },
    fly: {
        name: 'Муха',
        health: 10,
        canFly: true,
        size: 1.5,
        texture: '🪰',
        spriteKey: 'fly',
        defaultSize: '64x64',
        detectionRange: 150,
        dropList: [], //ничего не дропается
        movement: {         
            strategy: 'jittery',
            speed: 80,                     // Базовая скорость движения
            rotationSpeed: 7.5,          // Скорость поворота спрайта
            jitterIntensity: 100,          // Максимальное отклонение в пикселях
            jitterFrequency: 0.2,         // Частота смены направления (0-1)
            jitterSmoothness: 0.08        // Плавность перехода (0=резкий, 1=плавный)
        },
        attack: {
            strategy: 'simple',
            damage: 1,
            range: -20,
            cooldown: 2000
        },
        collision: {
            enabled: true,
            layers: ['ENEMIES', 'OBSTACLES']
        },
        pathfinding: {
            algorithm: 'astar',
            allowDiagonal: true,
            ignoreGroundObstacles: true
        }
    },
    beetle: {
        name: 'Жук',
        health: 30,
        canFly: false,
        size: 2,
        texture: '🐞',
        spriteKey: 'ladybug',
        defaultSize: '64x64',
        detectionRange: 150,
        dropList: [], // Клевер, пластырь, двойной пластырь
        movement: {
            strategy: 'linear',
            speed: 30,
            rotationSpeed: 5.0
        },
        attack: {
            strategy: 'simple',
            damage: 10,
            range: 5,
            cooldown: 5000
        },
        collision: {
            enabled: true,
            layers: ['ENEMIES', 'OBSTACLES']
        },
        pathfinding: {
            algorithm: 'astar',
            allowDiagonal: true,
            ignoreGroundObstacles: false
        }
    },
    rhinoceros: {
        name: 'Жук-носорог',
        health: 60,
        canFly: false,
        size: 3,
        texture: '🐛',
        spriteKey: 'rhinoceros',
        defaultSize: '128x128',
        detectionRange: 150,
        dropList: [ITEM_TYPES.ALOE, ITEM_TYPES.DOUBLEPATCH], // Сердце, двойной пластырь, лопата
        movement: {
            strategy: 'inertia',
            speed: 5,              // стартовая скорость
            maxSpeed: 120,          // Максимальная скорость у цели
            minSpeed: 5,            // Минимальная скорость для разворота
            acceleration: 800,      // Скорость ускорения
            deceleration: 800,      // Скорость торможения (быстрее чем ускорение)
            rotationSpeed: 2.5,    // Скорость поворота спрайта
            mass: 3.5,              // Масса для инерции
            drag: 0.95,             // Сопротивление воздуха
            bounce: 0.3             // Отскок от границ
        },
        attack: {
            strategy: 'none',       // Отключаем обычную атаку, используем только inertia атаку
            damage: 50,             // Большой урон при прохождении через цель
            range: 60,              // Радиус атаки при прохождении
            cooldown: 5000          // Короткая задержка между атаками
        },
        collision: {
            enabled: true,
            layers: ['ENEMIES', 'OBSTACLES']
        },
        pathfinding: {
            algorithm: 'astar',
            allowDiagonal: true,
            ignoreGroundObstacles: false
        }
    },
    spider: {
        name: 'Паук',
        health: 100,
        canFly: false,
        size: 2,
        texture: '🕷️',
        spriteKey: 'spider',
        defaultSize: '64x64',
        detectionRange: 150,
        dropList: [ITEM_TYPES.PATCH], // Сердце, двойной пластырь, клевер
        movement: {
            strategy: 'linear',
            speed: 50,
            rotationSpeed: 5.0
        },
        attack: {
            strategy: 'simple',
            damage: 10,
            range: 5,
            cooldown: 5000
        },
        collision: {
            enabled: true,
            layers: ['ENEMIES', 'OBSTACLES']
        },
        pathfinding: {
            algorithm: 'astar',
            allowDiagonal: true,
            ignoreGroundObstacles: false
        }
    },
    bee: {
        name: 'Пчела',
        health: 15,
        canFly: true,
        size: 2,
        texture: '🐝',
        spriteKey: 'bee',
        defaultSize: '64x64',
        detectionRange: 150,
        dropList: [], // Сердце, клевер
        movement: {
            strategy: 'flying',
            speed: 60,
            rotationSpeed: 4.0,
            amplitude: 35,
            oscillationSpeed: 0.02,
            targetAttraction: 0.9
        },
        attack: {
            strategy: 'simple',
            damage: 4,
            range: 0,
            cooldown: 4000
        },
        collision: {
            enabled: true,
            layers: ['ENEMIES', 'OBSTACLES']
        },
        pathfinding: {
            algorithm: 'astar',
            allowDiagonal: true,
            ignoreGroundObstacles: true
        }
    },
    
    butterfly: {
        name: 'Бабочка',
        health: 8,
        canFly: true,
        size: 2,
        texture: '🦋',
        spriteKey: 'butterfly',
        defaultSize: '64x64',
        detectionRange: 150,
        dropList: [ITEM_TYPES.CLOVER], // Только клевер - очень редкий дроп
        movement: {
            strategy: 'butterfly',
            speed: 25,                    // Уменьшил скорость с 30 до 25 для более медленного движения
            // Параметры порхания
            flutterAmplitude: 20,        // Уменьшил амплитуду с 40 до 20 для более плавного порхания
            flutterFrequency: 0.1,      // Уменьшил частоту с 0.3 до 0.1 для более медленного порхания
            flutterSpeed: 0.05,         // Уменьшил скорость изменения с 0.1 до 0.05 для плавности
            // Параметры случайности
            randomness: 0.1,             // Уменьшил случайность с 0.3 до 0.1 для более предсказуемого движения
            directionChangeInterval: 4000, // Увеличил интервал с 2000 до 4000 мс для более плавных переходов
            directionChangeChance: 0.02,   // Уменьшил вероятность смены с 0.1 до 0.02 для стабильности
            
            // Параметры притяжения к цели
            targetAttraction: 0.8,        // Увеличил притяжение с 0.7 до 0.8 для более целенаправленного движения
            minDistanceToTarget: 40,      // Уменьшил минимальное расстояние с 50 до 40 для более точного подхода
            directionTransitionSpeed: 0.01 // Уменьшил скорость перехода с 0.02 до 0.01 для более плавных поворотов
        },
        attack: {
            strategy: 'simple',
            damage: 1,
            range: 20,
            cooldown: 6000
        },
        collision: {
            enabled: true,
            layers: ['ENEMIES', 'OBSTACLES']
        },
        pathfinding: {
            algorithm: 'astar',
            allowDiagonal: true,
            ignoreGroundObstacles: true
        }
    },
    dragonfly: {
        name: 'Стрекоза',
        health: 1,
        canFly: true,
        size: 2,
        texture: '🦇',
        spriteKey: 'dragonfly',
        defaultSize: '64x64',
        detectionRange: 250,
        dropList: [], // Клевер, пластырь
        movement: {
            strategy: 'linear',
            speed: 180,
            rotationSpeed: 10.0
        },
        attack: {
            strategy: 'singleUse',
            damage: 40,
            range: 30,
            explosionRadius: 100,
            explosionDamage: 25
        },
        collision: {
            enabled: true,
            layers: ['ENEMIES', 'OBSTACLES']
        },
        pathfinding: {
            algorithm: 'astar',
            allowDiagonal: true,
            ignoreGroundObstacles: true
        }
    },
    wasp: {
        name: 'Оса',
        health: 15,
        canFly: true,
        size: 2,
        texture: '🐝',
        spriteKey: 'bee',
        defaultSize: '64x64',
        detectionRange: 400,
        dropList: [ITEM_TYPES.PATCH], // Пластырь, двойной пластырь
        movement: {
            strategy: 'orbital',
            speed: 120,
            rotationSpeed: 7.5,
            orbitSpeed: 0.02,
            approachDistance: 250,
            minOrbitRadius: 50,
            maxOrbitRadius: 300
        },
        attack: {
            strategy: 'spawn',
            damage: 0,
            range: 100,
            spawnInterval: 3000,
            cooldown: 3000,
            minSpawnCount: 1,
            maxSpawnCount: 1,
            spawnRange: 10,
            spawnType: 'projectile',
            spawnDirection: 'target',
            spawnSpeed: 250,
            maxSpawned: 5
        },
        collision: {
            enabled: true,
            layers: ['ENEMIES', 'OBSTACLES']
        },
        pathfinding: {
            algorithm: 'astar',
            allowDiagonal: true,
            ignoreGroundObstacles: true
        }
    },  
    slug: {
        name: 'Слизень',
        health: 25,
        canFly: false,
        size: 3,
        texture: '🐌',
        spriteKey: 'snail',
        defaultSize: '64x64',
        detectionRange: 200,
        dropList: [], // ничего не дропается
        movement: {
            strategy: 'linear',
            speed: 30,
            rotationSpeed: 5.0
        },
        stealth: {
            strategy: 'stealth',
            stealthAlpha: 0.05,
            visibleAlpha: 1.0,
            visibilityDuration: 2000,
            slimeTrail: true
        },
        attack: {
            strategy: 'simple',
            damage: 4,
            range: 35,
            cooldown: 3000
        },
        collision: {
            enabled: true,
            layers: ['ENEMIES', 'OBSTACLES']
        },
        pathfinding: {
            algorithm: 'astar',
            allowDiagonal: true,
            ignoreGroundObstacles: false
        }
    },
    snail: {
        name: 'Улитка',
        health: 100,
        canFly: false,
        size: 3,
        texture: '🐌',
        spriteKey: 'snail',
        defaultSize: '64x64',
        detectionRange: 120,
        dropList: [ITEM_TYPES.HEART, ITEM_TYPES.ALOE], // Сердце, пластырь, двойной пластырь
        movement: {
            strategy: 'shell',
            speed: 20,
            rotationSpeed: 4.0,
            shellProtection: 0.5,
            shellDuration: 3000,
            shellCooldown: 5000
        },
        attack: {
            strategy: 'simple',
            damage: 6,
            range: 40,
            cooldown: 4000
        },
        recovery: {
            strategy: 'regeneration',
            regenerationRate: 0.2,       // 1 HP за кадр
            regenerationDelay: 1000,     // 1 сек задержка
            regenerationCap: 1.0,        // 100% эффективность
            regenerationDecay: 0,    // 0.1% затухание за кадр (затухнет за 1000 кадров)
            maxRecovery: 0              // Без ограничений
        },
        collision: {
            enabled: true,
            layers: ['ENEMIES', 'OBSTACLES']
        },
        pathfinding: {
            algorithm: 'astar',
            allowDiagonal: true,
            ignoreGroundObstacles: false
        }
    },
    spiderQueen: {
        name: 'Самка паука',
        health: 80,
        canFly: true,
        size: 3,
        texture: '🕷️👑',
        spriteKey: 'spider',
        defaultSize: '128x128',
        detectionRange: 200,
        dropList: [ITEM_TYPES.HEART, ITEM_TYPES.DOUBLEPATCH], // Сердце, двойной пластырь, клевер
        movement: {
            strategy: 'linear',
            speed: 15,
            rotationSpeed: 5.0
        },
        attack: {
            strategy: 'spawn',
            spawnInterval: 5000,
            minSpawnCount: 1,
            maxSpawnCount: 5,
            spawnRange: 100,
            spawnType: 'spider',
            maxSpawned: 20
        },
        collision: {
            enabled: true,
            layers: ['ENEMIES', 'OBSTACLES']
        },
        pathfinding: {
            algorithm: 'astar',
            allowDiagonal: true,
            ignoreGroundObstacles: false
        }
    },
    mole: {
        name: 'Крот',
        health: 35,
        canFly: false,
        size: 2,
        texture: '🐀',
        spriteKey: 'mole',
        defaultSize: '64x64',
        detectionRange: 180,
        dropList: [ITEM_TYPES.SHOVEL], // Только лопата - подземный житель
        movement: {
            strategy: 'randomPoint',
            speed: 40,
            rotationSpeed: 5.02,
            searchRadius: 600,
            minDistance: 50
        },
        stealth: {
            strategy: 'burrow',
            undergroundAlpha: 0.1,
            surfaceAlpha: 1.0,
            surfaceMinDuration: 2000,
            surfaceMaxDuration: 8000
        },
        attack: {
            strategy: 'spawn',
            spawnType: 'projectile',
            spawnDirection: 'target',
            spawnInterval: 3000,
            minSpawnCount: 1,
            maxSpawnCount: 1,
            spawnRange: 10,
            conditionalSpawn: true
        },
        collision: {
            enabled: true,
            layers: ['ENEMIES', 'OBSTACLES']
        },
        pathfinding: {
            algorithm: 'astar',
            allowDiagonal: true,
            ignoreGroundObstacles: false
        }
    },
    mosquito: {
        name: 'Комар',
        health: 8,
        canFly: true,
        size: 1.4,
        texture: '🦟',
        spriteKey: 'mosquito',
        defaultSize: '64x64',
        detectionRange: 120,
        dropList: [], 
        movement: {
            strategy: 'flying',
            speed: 40,
            rotationSpeed: 5.0,
            amplitude: 45,
            oscillationSpeed: 0.2,
            targetAttraction: 0.9
        },
        attack: {
            strategy: 'simple',
            damage: 2,
            range: 20,
            cooldown: 1500
        },
        collision: {
            enabled: true,
            layers: ['ENEMIES', 'OBSTACLES']
        },
        pathfinding: {
            algorithm: 'astar',
            allowDiagonal: true,
            ignoreGroundObstacles: true
        }
    },
    flea: {
        name: 'Блоха',
        health: 12,
        canFly: true,
        size: 1.5,
        texture: '🦗',
        spriteKey: 'flea',
        defaultSize: '32x32',
        detectionRange: 100,
        dropList: [],
        movement: {
            strategy: 'jumping',
            speed: 200,                   // Скорость прыжка
            rotationSpeed: 10.0,           // Скорость поворота спрайта
            jumpDuration: 1000,           // Длительность прыжка в миллисекундах
            restDuration: 500,            // Длительность отдыха между прыжками в миллисекундах
            jumpHeight: 30,               // Высота прыжка в пикселях
            jumpArc: 0.6,                 // Кривизна траектории прыжка (0-1)
            mass: 0.5,                    // Масса для физики
            bounce: 0.3,                  // Отскок от поверхностей
            drag: 0.1                     // Сопротивление воздуха
        },
        attack: {
            strategy: 'simple',
            damage: 3,
            range: 25,
            cooldown: 1000
        },
        collision: {
            enabled: true,
            layers: ['ENEMIES', 'OBSTACLES']
        },
        pathfinding: {
            algorithm: 'astar',
            allowDiagonal: true,
            ignoreGroundObstacles: false
        }
    },
    projectile: {
        name: 'Снаряд',
        health: 1,
        canFly: false,
        size: 1,
        texture: '💣',
        spriteKey: 'bomb',
        defaultSize: '32x32',
        detectionRange: 300,
        dropList: [], // Не дропает предметы
        movement: {
            strategy: 'linear',
            speed: 150,
            rotationSpeed: 10.0
        },
        attack: {
            strategy: 'singleUse',
            damage: 2,
            range: -10,
            explosionRadius: 80,
            explosionDamage: 0
        },
        collision: {
            enabled: true,
            layers: ['ENEMIES', 'OBSTACLES']
        },
        pathfinding: {
            algorithm: 'astar',
            allowDiagonal: true,
            ignoreGroundObstacles: false
        }
    },
    hive: {
        name: 'Улей',
        health: 50,
        canFly: false,
        size: 4,
        texture: '🏠',
        spriteKey: 'hive',
        defaultSize: '128x128',
        detectionRange: 300,
        dropList: [], // ITEM_TYPES.HONEY не используем, плохая реализация замедления
        movement: {
            strategy: 'static', // Неподвижный улей
            speed: 0,
            rotationSpeed: 0
        },
        attack: {
            strategy: 'spawn', // Регулярный спавн ос
            spawnInterval: 8000, // Каждые 10 секунд
            minSpawnCount: 1,
            maxSpawnCount: 2,
            spawnRange: 80,
            spawnType: 'wasp',
            spawnDirection: 'circle',
            maxSpawned: 20 // Максимум заспавненных ос за игру
        },
        damageSpawn: {
            strategy: 'damageSpawn', // Спавн ос при получении урона
            spawnType: 'bee',
            minSpawnCount: 0,
            maxSpawnCount: 1,
            spawnRange: 60,
            launchForce: 250, // Сила выталкивания ос
            launchAngleSpread: Math.PI / 2 // Разброс углов 90 градусов
        },
        collision: {
            enabled: true,
            layers: ['ENEMIES', 'OBSTACLES']
        },
        pathfinding: {
            algorithm: 'astar',
            allowDiagonal: true,
            ignoreGroundObstacles: false
        }
    },
    
    // Бабочка - порхающий полет с синусоидальными колебаниям
};
