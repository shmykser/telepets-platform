import type { Pet } from '@/types';
import { buildUrl } from '@/config/endpoints';

/**
 * Генерирует URL изображения для стадии питомца
 * Всегда использует backend endpoint, который генерирует presigned URLs на лету
 * Это решает проблему истечения URL и соответствует best practices
 */
export function getStageImageUrl(pet: Pet, stage: 'egg' | 'baby' | 'adult', transparent: boolean = true): string | null {
  if (!pet.user_id || !pet.name) return null;
  
  // Всегда используем backend endpoint - он генерирует presigned URL на лету
  // Передаем параметр stage для запроса конкретной стадии
  const baseUrl = buildUrl.petImage(pet.user_id, pet.name);
  const params = new URLSearchParams();
  
  // Добавляем параметр stage
  params.append('stage', stage);
  
  // Добавляем параметр transparent если нужно прозрачное изображение
  if (transparent) {
    params.append('transparent', 'true');
  }
  
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Получает все доступные стадии питомца на основе текущей стадии
 * Возвращает массив стадий в порядке: egg, baby, adult (только те, которые уже достигнуты)
 * @param pet - объект питомца
 * @param transparent - использовать ли прозрачные изображения (по умолчанию false для stack)
 */
export function getAvailableStages(pet: Pet, transparent: boolean = false): Array<{ stage: 'egg' | 'baby' | 'adult'; imageUrl: string }> {
  const stages: Array<{ stage: 'egg' | 'baby' | 'adult'; imageUrl: string }> = [];
  
  if (!pet.user_id || !pet.name) return stages;
  
  // Всегда есть egg - getStageImageUrl всегда возвращает URL через fallback если есть user_id и name
  const eggUrl = getStageImageUrl(pet, 'egg', transparent);
  if (eggUrl) {
    stages.push({ stage: 'egg', imageUrl: eggUrl });
  }
  
  // Если текущая стадия baby или adult, добавляем baby
  if (pet.state === 'baby' || pet.state === 'adult') {
    const babyUrl = getStageImageUrl(pet, 'baby', transparent);
    if (babyUrl) {
      stages.push({ stage: 'baby', imageUrl: babyUrl });
    }
  }
  
  // Если текущая стадия adult, добавляем adult
  if (pet.state === 'adult') {
    const adultUrl = getStageImageUrl(pet, 'adult', transparent);
    if (adultUrl) {
      stages.push({ stage: 'adult', imageUrl: adultUrl });
    }
  }
  
  return stages;
}

/**
 * Форматирует creature_json для отображения в текстовом окне
 */
export function formatCreatureJson(creatureJson: any): string[] {
  if (!creatureJson) return ['Информация о питомце отсутствует'];
  
  const lines: string[] = [];
  
  // Если это строка, пытаемся распарсить
  let data = creatureJson;
  if (typeof creatureJson === 'string') {
    try {
      data = JSON.parse(creatureJson);
    } catch {
      return [creatureJson];
    }
  }
  
  // Если это объект, форматируем его
  if (typeof data === 'object' && data !== null) {
    // Добавляем все поля объекта в читаемом формате
    for (const [key, value] of Object.entries(data)) {
      if (value !== null && value !== undefined) {
        if (typeof value === 'object' && !Array.isArray(value)) {
          lines.push(`${key}: ${JSON.stringify(value, null, 2)}`);
        } else if (Array.isArray(value)) {
          lines.push(`${key}: ${value.join(', ')}`);
        } else {
          lines.push(`${key}: ${value}`);
        }
      }
    }
    
    // Если ничего не найдено, выводим JSON
    if (lines.length === 0) {
      lines.push(JSON.stringify(data, null, 2));
    }
  } else {
    lines.push(String(data));
  }
  
  return lines.length > 0 ? lines : ['Информация о питомце отсутствует'];
}

