/**
 * Константы типов событий для Event-Driven Architecture
 * 
 * Используется для декомпозиции игровой логики и визуальных эффектов
 * через систему событий вместо прямых вызовов.
 */

export const EVENT_TYPES = {
    // События врагов
    ENEMY_SPAWN: 'enemy:spawn',
    ENEMY_DAMAGE: 'enemy:damage', 
    ENEMY_DEATH: 'enemy:death',
    ENEMY_ATTACK: 'enemy:attack',
    ENEMY_TARGET_CHANGED: 'enemy:targetChanged',

    // События яйца
    EGG_CREATE: 'egg:create',
    EGG_DAMAGE: 'egg:damage',
    EGG_HEAL: 'egg:heal',
    EGG_DESTROYED: 'egg:destroyed',

    // События предметов
    ITEM_SPAWN: 'item:spawn',
    ITEM_COLLECT: 'item:collect',
    ITEM_DESTROY: 'item:destroy',

    // События защиты
    DEFENSE_CREATE: 'defense:create',
    DEFENSE_ACTIVATE: 'defense:activate',
    DEFENSE_REPAIR: 'defense:repair',
    DEFENSE_DESTROY: 'defense:destroy',

    // События волн
    WAVE_START: 'wave:start',
    WAVE_END: 'wave:end',
    WAVE_MINUTE_CHANGED: 'wave:minuteChanged',

    // События игрового процесса
    GAME_START: 'game:start',
    GAME_END: 'game:end',
    GAME_PAUSE: 'game:pause',
    GAME_RESUME: 'game:resume',

    // События UI
    UI_BUTTON_CLICK: 'ui:buttonClick',
    UI_MENU_OPEN: 'ui:menuOpen',
    UI_MENU_CLOSE: 'ui:menuClose',

    // События жестов
    GESTURE_RECOGNIZED: 'gesture:recognized',
    GESTURE_COMPLETED: 'gesture:completed',

    // События системы эффектов
    EFFECT_APPLY: 'effect:apply',
    EFFECT_COMPLETE: 'effect:complete',

    // События камней
    STONE_CREATED: 'stone:created',
    STONE_MOVED: 'stone:moved',
    STONE_DESTROYED: 'stone:destroyed',
    
    // События препятствий
    OBSTACLE_AVOIDANCE: 'obstacle:avoidance',
    PATHFINDING_UPDATED: 'pathfinding:updated',
    
    // События drag & drop
    DRAG_START: 'drag:start',
    DRAG_END: 'drag:end'
};
