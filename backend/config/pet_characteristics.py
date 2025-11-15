"""Статические определения характеристик питомцев и правил здоровья."""

PET_CHARACTERISTICS = {
    'egg': {
        'temperature': {
            'display_name': 'Температура',
            'unit': '°C',
            'range': {'min': 0, 'max': 100},
            'normal': {'min': 60, 'max': 85},
            'decay_per_interval': 2,
            'recovery': {'temperature_game': 30},
            'penalty': {'below': 55, 'value': 5},
        },
        'shell_defense': {
            'display_name': 'Защита скорлупы',
            'unit': '%',
            'range': {'min': 0, 'max': 100},
            'normal': {'min': 70, 'max': 100},
            'decay_per_interval': 1,
            'recovery': {'egg_defense_game': 25},
            'penalty': {'below': 60, 'value': 5},
        },
    },
    'baby': {
        'hunger': {
            'display_name': 'Сытость',
            'unit': '%',
            'range': {'min': 0, 'max': 100},
            'normal': {'min': 70, 'max': 100},
            'decay_per_interval': 4,
            'recovery': {'feed_action': 40},
            'penalty': {'below': 50, 'value': 5},
        },
        'cleanliness': {
            'display_name': 'Чистота',
            'unit': '%',
            'range': {'min': 0, 'max': 100},
            'normal': {'min': 65, 'max': 100},
            'decay_per_interval': 3,
            'recovery': {'clean_game': 50},
            'penalty': {'below': 45, 'value': 5},
        },
    },
    'adult': {
        'mood': {
            'display_name': 'Настроение',
            'unit': '%',
            'range': {'min': 0, 'max': 100},
            'normal': {'min': 60, 'max': 100},
            'decay_per_interval': 2,
            'recovery': {'play_action': 35},
            'penalty': {'below': 40, 'value': 4},
        },
        'energy': {
            'display_name': 'Энергия',
            'unit': '%',
            'range': {'min': 0, 'max': 100},
            'normal': {'min': 50, 'max': 100},
            'decay_per_interval': 3,
            'recovery': {'rest_action': 45},
            'penalty': {'below': 35, 'value': 4},
        },
    },
}

HEALTH_DEGRADATION_RULES = {
    'egg': {
        'interval_seconds': 600,
        'base_drop': 0,
        'regen_amount': 2,
        'penalties': {
            'temperature': 5,
            'shell_defense': 5,
        },
    },
    'baby': {
        'interval_seconds': 600,
        'base_drop': 0,
        'regen_amount': 3,
        'penalties': {
            'hunger': 5,
            'cleanliness': 5,
        },
    },
    'adult': {
        'interval_seconds': 900,
        'base_drop': 0,
        'regen_amount': 2,
        'penalties': {
            'mood': 4,
            'energy': 4,
        },
    },
}

CHARACTERISTIC_ACTIONS = {
    'temperature_game': {
        'stage': 'egg',
        'characteristic': 'temperature',
        'type': 'mini_game',
    },
    'egg_defense_game': {
        'stage': 'egg',
        'characteristic': 'shell_defense',
        'type': 'mini_game',
    },
    'clean_game': {
        'stage': 'baby',
        'characteristic': 'cleanliness',
        'type': 'mini_game',
    },
    'feed_action': {
        'stage': 'baby',
        'characteristic': 'hunger',
        'type': 'action',
    },
    'play_action': {
        'stage': 'adult',
        'characteristic': 'mood',
        'type': 'action',
    },
    'rest_action': {
        'stage': 'adult',
        'characteristic': 'energy',
        'type': 'action',
    },
}


