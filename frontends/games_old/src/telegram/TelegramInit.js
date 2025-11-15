import { settings } from '../../config/settings.js';
import WebApp from '@twa-dev/sdk';

// Глобальная переменная для хранения safe-area значений
window.telegramSafeArea = { top: 0, bottom: 0, left: 0, right: 0 };

/**
 * Инициализация Telegram WebApp SDK с поддержкой fullscreen
 * 
 * Best practices:
 * - Expand viewport перед fullscreen
 * - Обработка safe-area для iOS
 * - Back Button для выхода из игры
 * - События fullscreen_changed и fullscreen_failed
 */
export function initTelegram() {
    if (!settings.telegram.enabled) {
        console.log('⚠️ [Telegram] SDK disabled in settings');
        return;
    }
    
    try {
        console.log('🚀 [Telegram] Initializing SDK...');
        
        // Инициализация темы и размеров
        WebApp.ready();
        WebApp.expand();
        console.log('✅ [Telegram] SDK ready and expanded');
        
        // ==========================================
        // SAFE AREA HANDLING
        // ==========================================
        
        // Обработчик событий safe-area от Telegram WebApp
        WebApp.onEvent('safe_area_changed', (data) => {
            console.log('📱 [Telegram] Safe area changed:', data);
            if (data) {
                window.telegramSafeArea = {
                    top: data.top || 0,
                    bottom: data.bottom || 0,
                    left: data.left || 0,
                    right: data.right || 0
                };
                // Отправляем событие в игру
                window.dispatchEvent(new CustomEvent('safe-area-changed', { detail: window.telegramSafeArea }));
            }
        });
        
        // Обработчик событий content safe-area от Telegram WebApp
        WebApp.onEvent('content_safe_area_changed', (data) => {
            console.log('📱 [Telegram] Content safe area changed:', data);
            if (data) {
                window.telegramSafeArea = {
                    top: data.top || 0,
                    bottom: data.bottom || 0,
                    left: data.left || 0,
                    right: data.right || 0
                };
                // Отправляем событие в игру
                window.dispatchEvent(new CustomEvent('safe-area-changed', { detail: window.telegramSafeArea }));
            }
        });
        
        // ==========================================
        // FULLSCREEN HANDLING
        // ==========================================
        
        // Обработка успешного входа/выхода из fullscreen
        WebApp.onEvent('fullscreen_changed', (data) => {
            const isFullscreen = data?.is_fullscreen ?? false;
            console.log(`🖥️ [Telegram] Fullscreen ${isFullscreen ? 'enabled' : 'disabled'}`);
            
            // Уведомляем игру о смене fullscreen
            window.dispatchEvent(new CustomEvent('telegram-fullscreen-changed', { 
                detail: { isFullscreen } 
            }));
        });
        
        // Обработка ошибок fullscreen
        WebApp.onEvent('fullscreen_failed', (data) => {
            const error = data?.error || 'UNKNOWN_ERROR';
            console.error('❌ [Telegram] Fullscreen failed:', error);
            
            // Уведомляем игру об ошибке
            window.dispatchEvent(new CustomEvent('telegram-fullscreen-failed', { 
                detail: { error } 
            }));
        });
        
        // ==========================================
        // APPEARANCE SETTINGS
        // ==========================================
        
        // Проверяем поддержку методов для совместимости с версией 6.0
        if (WebApp.setHeaderColor && typeof WebApp.setHeaderColor === 'function') {
            try {
                WebApp.setHeaderColor('#0b1221'); // Темный цвет для игры
                console.log('🎨 [Telegram] Header color set');
            }
            catch (error) {
                console.warn('⚠️ [Telegram] Could not set header color:', error);
            }
        }
        
        if (WebApp.setBackgroundColor && typeof WebApp.setBackgroundColor === 'function') {
            try {
                WebApp.setBackgroundColor('#0b1221'); // Темный цвет для игры
                console.log('🎨 [Telegram] Background color set');
            }
            catch (error) {
                console.warn('⚠️ [Telegram] Could not set background color:', error);
            }
        }
        
        // ==========================================
        // BACK BUTTON HANDLING
        // ==========================================
        
        // Глобальный обработчик Back Button для игры
        // Показываем кнопку "Назад" для выхода из fullscreen/игры
        if (WebApp.BackButton && typeof WebApp.BackButton.onClick === 'function') {
            try {
                // Обработчик кнопки назад - отправляем событие в игру
                const handleBackButton = () => {
                    console.log('⬅️ [Telegram] Back Button pressed');
                    
                    // Отправляем событие в игру для обработки
                    window.dispatchEvent(new CustomEvent('telegram-back-button'));
                    
                    // Если игра не обработала событие - закрываем WebApp
                    setTimeout(() => {
                        if (!window.gameHandledBackButton) {
                            console.log('🚪 [Telegram] Closing WebApp (no game handler)');
                            WebApp.close();
                        }
                        // Сбрасываем флаг
                        window.gameHandledBackButton = false;
                    }, 100);
                };
                
                WebApp.BackButton.onClick(handleBackButton);
                
                // Показываем кнопку Back только если в игре
                // (в меню не нужна, там свои кнопки)
                if (typeof WebApp.BackButton.show === 'function') {
                    WebApp.BackButton.show();
                    console.log('⬅️ [Telegram] Back Button enabled');
                }
            }
            catch (error) {
                console.warn('⚠️ [Telegram] Could not setup Back Button:', error);
            }
        } else {
            console.log('ℹ️ [Telegram] Back Button not available');
        }
        
        // ==========================================
        // VIEWPORT EVENTS
        // ==========================================
        
        // Обработка изменения viewport
        WebApp.onEvent('viewport_changed', (data) => {
            console.log('📱 [Telegram] Viewport changed:', data);
            window.dispatchEvent(new CustomEvent('telegram-viewport-changed', { detail: data }));
        });
        
        console.log('✅ [Telegram] Full initialization complete');
        
    }
    catch (error) {
        console.error('❌ [Telegram] Initialization error:', error);
        // В небраузерной среде/без Telegram SDK — мягкая деградация
    }
}

/**
 * Утилита для сообщения Telegram что игра обработала Back Button
 * Вызывать из игровых сцен при обработке выхода
 */
export function notifyBackButtonHandled() {
    window.gameHandledBackButton = true;
    console.log('✅ [Telegram] Game handled Back Button');
}
