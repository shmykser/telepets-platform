/*
  Утилиты для безопасной инициализации шрифтов на клиенте.
  - Проверяем доступность системных/локальных шрифтов
  - Применяем устойчивые fallback'и, чтобы не блокировать рендер
*/

const SYSTEM_FALLBACK = (
  'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, ' +
  'Helvetica, Arial, "Noto Sans", Ubuntu, Cantarell, sans-serif'
);

const PREFERRED_FONTS = [
  'Inter',
  'Poppins',
  'Segoe UI',
  'Roboto',
  'Helvetica',
  'Arial',
];

function isFontAvailableCSS(fontFamily: string): boolean {
  // CSS Font Loading API
  try {
    // document.fonts.check возвращает true, если шрифт доступен
    // Проверяем обычный вес 400 и курсив false
    // В некоторых окружениях может вернуть true даже при fallback'е — тогда есть второй способ ниже
    // Здесь главное быстро не блокировать рендер
    // @ts-ignore
    if (typeof document !== 'undefined' && (document as any).fonts?.check) {
      // Нужны кавычки вокруг семейства, если есть пробел
      const quoted = fontFamily.includes(' ') ? `"${fontFamily}"` : fontFamily;
      return (document as any).fonts.check(`12px ${quoted}`) === true;
    }
  } catch (_) {
    // ignore
  }
  return false;
}

function isFontAvailableCanvas(fontFamily: string): boolean {
  try {
    if (typeof document === 'undefined') return false;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return false;
    const text = 'abcdefghiABCDEFGHI_0123456789';
    context.font = '16px monospace';
    const baseline = context.measureText(text).width;
    const quoted = fontFamily.includes(' ') ? `"${fontFamily}"` : fontFamily;
    context.font = `16px ${quoted}, monospace`;
    const width = context.measureText(text).width;
    return width !== baseline;
  } catch (_) {
    return false;
  }
}

export function isFontAvailable(fontFamily: string): boolean {
  return isFontAvailableCSS(fontFamily) || isFontAvailableCanvas(fontFamily);
}

export function getAvailableFont(): string {
  for (const f of PREFERRED_FONTS) {
    if (isFontAvailable(f)) {
      return f;
    }
  }
  return SYSTEM_FALLBACK;
}

export function applyFontFallbacks(fontFamily: string): void {
  try {
    if (typeof document === 'undefined') return;
    const family = fontFamily || SYSTEM_FALLBACK;
    document.documentElement.style.setProperty('--app-font', family);
    document.body && (document.body.style.fontFamily = 'var(--app-font)');
  } catch (_) {
    // ignore
  }
}

export async function initializeFonts(): Promise<void> {
  try {
    const chosen = getAvailableFont();
    applyFontFallbacks(chosen);
  } catch (_) {
    applyFontFallbacks(SYSTEM_FALLBACK);
  }
}

/**
 * Утилиты для безопасной загрузки шрифтов
 */

// Системные шрифты как fallback
const SYSTEM_FONTS = {
  sans: [
    'Segoe UI',
    'Roboto', 
    'Helvetica Neue',
    'Arial',
    'sans-serif'
  ],
  display: [
    'Segoe UI',
    'Roboto',
    'Helvetica Neue', 
    'Arial',
    'sans-serif'
  ]
};

// Проверяем доступность шрифта
export function isFontAvailable(fontName: string): boolean {
  try {
    // Создаем тестовый элемент
    const testElement = document.createElement('span');
    testElement.style.fontFamily = fontName;
    testElement.style.fontSize = '72px';
    testElement.textContent = 'mmmmmmmmmmlli';
    
    // Добавляем в DOM для измерения
    document.body.appendChild(testElement);
    const originalWidth = testElement.offsetWidth;
    
    // Меняем на fallback шрифт
    testElement.style.fontFamily = 'monospace';
    const fallbackWidth = testElement.offsetWidth;
    
    // Убираем тестовый элемент
    document.body.removeChild(testElement);
    
    // Если ширина изменилась, значит шрифт доступен
    return originalWidth !== fallbackWidth;
  } catch (error) {
    console.warn('Ошибка проверки доступности шрифта:', error);
    return false;
  }
}

// Получаем доступный шрифт
export function getAvailableFont(fontFamily: 'sans' | 'display'): string {
  const fonts = fontFamily === 'sans' ? SYSTEM_FONTS.sans : SYSTEM_FONTS.display;
  
  for (const font of fonts) {
    if (isFontAvailable(font)) {
      return font;
    }
  }
  
  // Возвращаем последний fallback
  return fonts[fonts.length - 1];
}

// Применяем fallback шрифты
export function applyFontFallbacks(): void {
  try {
    // Проверяем доступность основных шрифтов
    const interAvailable = isFontAvailable('Inter');
    const poppinsAvailable = isFontAvailable('Poppins');
    
    if (!interAvailable || !poppinsAvailable) {
      console.log('Применяем fallback шрифты');
      
      // Применяем CSS переменные для fallback
      const root = document.documentElement;
      
      if (!interAvailable) {
        root.style.setProperty('--font-sans', getAvailableFont('sans'));
      }
      
      if (!poppinsAvailable) {
        root.style.setProperty('--font-display', getAvailableFont('display'));
      }
    }
  } catch (error) {
    console.warn('Ошибка применения fallback шрифтов:', error);
  }
}

// Инициализация шрифтов при загрузке страницы
export function initializeFonts(): void {
  // Применяем fallback сразу
  applyFontFallbacks();
  
  // Проверяем еще раз после полной загрузки страницы
  window.addEventListener('load', () => {
    setTimeout(applyFontFallbacks, 1000);
  });
  
  // Проверяем при изменении видимости страницы
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      applyFontFallbacks();
    }
  });
}

// CSS для fallback шрифтов
export const FONT_FALLBACK_CSS = `
  :root {
    --font-sans: ${SYSTEM_FONTS.sans.join(', ')};
    --font-display: ${SYSTEM_FONTS.display.join(', ')};
  }
  
  .font-sans {
    font-family: var(--font-sans);
  }
  
  .font-display {
    font-family: var(--font-display);
  }
`;
