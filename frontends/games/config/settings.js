// Настройки проекта (не связанные с Phaser)
// В .env только пароли и токены
export const settings = {
    // Настройки Telegram интеграции
    telegram: {
        enabled: true
    },
    telegramSecrets: {
        botToken: import.meta.env.VITE_BOT_TOKEN,
        webAppUrl: import.meta.env.VITE_WEBAPP_URL
    },
    // Глобальные флаги ИИ/геймплея
    ai: {
        // Pathfinding для наземных врагов - обход камней
        // НЕ используется для: летающих врагов (canFly + ignoreGroundObstacles), 
        // static (улей), spawner, randomPoint (крот)
        pathfindingEnabled: true
    },

    // Настройки генерации открытого мира
    worldGeneration: {
        // ============================================================
        // ЛОКАЦИОННАЯ СИСТЕМА v2.0
        // ============================================================
        
        // Локации
        locations: {
            // Главные биомы (отдельные большие локации)
            biomes: {
                count: { min: 3, max: 5 }, // Количество главных биомов
                sizes: {
                    // Размеры биомов (можно настраивать!)
                    forest: { width: 1800, height: 1800 },
                    desert: { width: 1600, height: 1600 },
                    snow: { width: 1500, height: 2000 },
                    plains: { width: 2000, height: 1500 }
                }
            },
            
            // Коридоры (локации-переходы между биомами)
            corridors: {
                width: { min: 500, max: 700 },
                height: { min: 400, max: 600 }
            },
            
            // Переходы между локациями
            transitions: {
                triggerRadius: 50,              // Радиус активации перехода
                showPrompt: true,               // Показывать подсказку
                transitionType: 'mixed'         // 'corridor', 'door', 'mixed'
            },
            
            // Генерация
            generation: {
                preGenerateAdjacent: true,      // Генерировать соседние локации
                cacheLocations: true            // Кешировать сгенерированные
            }
        },
        
        // Мини-карта
        miniMap: {
            enabled: true,
            width: 160,
            height: 220,
            position: 'topRight',               // 'topRight', 'topLeft', 'bottomRight'
            offsetX: 20,
            offsetY: 20,
            scale: 0.15,                        // Масштаб отображения
            showAllLocations: true,             // Показывать все локации сразу
            backgroundColor: 0x000000,
            backgroundAlpha: 0.8
        },
        
        // Сохранение состояний
        persistence: {
            saveStates: true,
            saveToLocalStorage: true,
            autoSave: true,
            autoSaveInterval: 10000             // 10 секунд
        },

        // ============================================================
        // НАСТРОЙКИ СОДЕРЖИМОГО ЛОКАЦИЙ
        // ============================================================
        
        // Размер мира (для обратной совместимости, больше не используется)
        worldSize: {
            width: 6000,
            height: 6000
        },

        // Зоны и биомы (для обратной совместимости)
        zones: {
            count: { min: 4, max: 7 },
            minSize: 800,
            borderNoise: 0.3
        },

        // Биомы и их параметры
        biomes: {
            forest: {
                weight: 3, // Вес при выборе биома
                obstacles: {
                    density: 0.3,
                    types: ['tree', 'bush', 'stone']
                }
            },
            desert: {
                weight: 2,
                obstacles: {
                    density: 0.2,
                    types: ['cactus', 'stone', 'bones']
                }
            },
            snow: {
                weight: 2,
                obstacles: {
                    density: 0.25,
                    types: ['tree', 'stone', 'snowdrift']
                }
            },
            plains: {
                weight: 2,
                obstacles: {
                    density: 0.15,
                    types: ['bush', 'flower', 'stone']
                }
            }
        },

        // Генерация рельефа (Perlin Noise параметры)
        terrain: {
            heightMap: {
                octaves: 4, // Количество слоёв шума
                persistence: 0.5, // Влияние каждого слоя
                scale: 200 // Масштаб шума
            },
            moisture: {
                octaves: 3,
                persistence: 0.6,
                scale: 250
            },
            temperature: {
                octaves: 3,
                persistence: 0.5,
                scale: 300
            }
        },

        // Размещение объектов
        objects: {
            // Дома игроков
            houses: {
                count: { min: 5, max: 10 },
                minDistance: 400, // Минимальное расстояние между домами
                avoidEdges: 200 // Отступ от краёв карты
            },
            
            // Препятствия (деревья, камни, кусты)
            obstacles: {
                method: 'clustered', // 'poisson' | 'clustered' | 'random'
                minDistance: 80, // Для Poisson метода
                clusters: {
                    enabled: true,
                    size: { min: 3, max: 8 }, // Размер кластера
                    spacing: 300 // Расстояние между кластерами
                }
            },
            
            // Предметы (монеты, отмычки)
            items: {
                coins: {
                    count: { min: 30, max: 60 },
                    minDistance: 100
                },
                lockpicks: {
                    count: { min: 5, max: 10 },
                    minDistance: 200
                }
            }
        },

        // Пещеры (пока отключено)
        caves: {
            enabled: false,
            count: { min: 1, max: 3 },
            cellularAutomata: {
                fillProbability: 0.45,
                iterations: 5,
                birthLimit: 4,
                deathLimit: 3
            }
        },

        // Отладка и визуализация
        debug: {
            visualizeBiomes: false, // Показывать цвета биомов
            visualizeHeightMap: false, // Показывать высотную карту
            showZoneBorders: false, // Показывать границы зон
            logGeneration: true // Логировать процесс генерации
        }
    }
};
