/**
 * Утилита для инициализации и настройки Telegram WebApp
 * 
 * Примечание: Кнопку "Закрыть" (X) в заголовке нельзя скрыть или переименовать,
 * так как это системная кнопка Telegram. Однако можно:
 * 1. Сделать её менее заметной, установив цвет заголовка, совпадающий с фоном
 * 2. Добавить подтверждение при закрытии через enableClosingConfirmation()
 */

interface TelegramWebApp {
  ready?: () => void;
  expand?: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  enableClosingConfirmation?: () => void;
  disableClosingConfirmation?: () => void;
  isVersionAtLeast?: (version: string) => boolean;
  disableVerticalSwipes?: () => void;
  enableVerticalSwipes?: () => void;
  contentSafeAreaInset?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  onEvent?: (event: string, callback: (...args: any[]) => void) => void;
  offEvent?: (event: string, callback: (...args: any[]) => void) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

/**
 * Инициализирует Telegram WebApp с настройками заголовка и подтверждения закрытия
 * 
 * @param options - Опции настройки
 * @param options.headerColor - Цвет заголовка (по умолчанию '#0a0a0a' - темный, совпадает с фоном)
 * @param options.backgroundColor - Цвет фона (по умолчанию '#0a0a0a')
 * @param options.enableClosingConfirmation - Включить подтверждение при закрытии (по умолчанию false)
 * @param options.hideHeader - Попытаться скрыть заголовок, установив его цвет в цвет фона (по умолчанию true)
 */
export function initTelegramWebApp(options: {
  headerColor?: string;
  backgroundColor?: string;
  enableClosingConfirmation?: boolean;
  hideHeader?: boolean;
} = {}) {
  const {
    headerColor = '#0a0a0a', // Темный цвет, совпадающий с фоном приложения
    backgroundColor = '#0a0a0a',
    enableClosingConfirmation = false,
    hideHeader = true,
  } = options;

  if (typeof window === 'undefined') {
    return;
  }

  const tgWebApp = window.Telegram?.WebApp;
  if (!tgWebApp) {
    console.log('🌐 [Telegram] WebApp не доступен, работаем в обычном браузере');
    return;
  }

  try {
    console.log('🚀 [Telegram] Инициализация WebApp...');

    // Инициализация и разворачивание viewport
    if (tgWebApp.ready) {
      tgWebApp.ready();
    }
    if (tgWebApp.expand) {
      tgWebApp.expand();
    }

    // Проверка версии API перед использованием методов
    const isVersionAtLeast = tgWebApp.isVersionAtLeast || (() => false);

    // Настройка цветов заголовка и фона
    // Если hideHeader = true, устанавливаем цвет заголовка в цвет фона,
    // чтобы кнопка "Закрыть" была менее заметной
    if (isVersionAtLeast('6.1') && tgWebApp.setHeaderColor) {
      const finalHeaderColor = hideHeader ? backgroundColor : headerColor;
      tgWebApp.setHeaderColor(finalHeaderColor);
      console.log(`✅ [Telegram] Цвет заголовка установлен: ${finalHeaderColor}`);
    }

    if (isVersionAtLeast('6.2') && tgWebApp.setBackgroundColor) {
      tgWebApp.setBackgroundColor(backgroundColor);
      console.log(`✅ [Telegram] Цвет фона установлен: ${backgroundColor}`);
    }

    // Настройка подтверждения при закрытии
    if (enableClosingConfirmation && tgWebApp.enableClosingConfirmation) {
      tgWebApp.enableClosingConfirmation();
      console.log('✅ [Telegram] Подтверждение при закрытии включено');
    } else if (!enableClosingConfirmation && tgWebApp.disableClosingConfirmation) {
      tgWebApp.disableClosingConfirmation();
      console.log('✅ [Telegram] Подтверждение при закрытии отключено');
    }

    // Блокировка вертикальных свайпов (опционально)
    if (tgWebApp.disableVerticalSwipes) {
      tgWebApp.disableVerticalSwipes();
      console.log('✅ [Telegram] Вертикальные свайпы отключены');
    }

    console.log('✅ [Telegram] WebApp успешно инициализирован');
  } catch (error) {
    console.error('❌ [Telegram] Ошибка при инициализации WebApp:', error);
  }
}

/**
 * Получает экземпляр Telegram WebApp
 */
export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.Telegram?.WebApp || null;
}

/**
 * Проверяет, запущено ли приложение в Telegram WebApp
 */
export function isTelegramWebApp(): boolean {
  return typeof window !== 'undefined' && !!window.Telegram?.WebApp;
}

