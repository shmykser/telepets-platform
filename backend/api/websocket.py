"""
WebSocket endpoints для реального времени обновлений данных питомцев.

Предоставляет WebSocket подключения для получения мгновенных обновлений
при изменении данных питомцев, кошелька и других сущностей.
"""
from fastapi import WebSocket, WebSocketDisconnect, Depends, HTTPException
from typing import Dict, Set
import json
import logging
import asyncio
from datetime import datetime

from db import get_db
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

# Менеджер подключений WebSocket
class ConnectionManager:
    """Управляет WebSocket подключениями для каждого пользователя."""
    
    def __init__(self):
        # Храним активные подключения по user_id
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # Счетчик подключений для мониторинга
        self.connection_count = 0
    
    async def connect(self, websocket: WebSocket, user_id: str):
        """Принимает новое WebSocket подключение."""
        await websocket.accept()
        
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        
        self.active_connections[user_id].add(websocket)
        self.connection_count += 1
        
        logger.info(f"WebSocket подключен: user_id={user_id}, всего подключений: {self.connection_count}")
    
    async def disconnect(self, websocket: WebSocket, user_id: str):
        """Отключает WebSocket подключение."""
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            
            # Удаляем пустой set для экономии памяти
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
            
            self.connection_count = max(0, self.connection_count - 1)
            
            logger.info(f"WebSocket отключен: user_id={user_id}, всего подключений: {self.connection_count}")
    
    async def send_personal_message(self, message: dict, user_id: str):
        """
        Отправляет сообщение всем подключениям конкретного пользователя.
        
        Args:
            message: Словарь с данными для отправки (будет сериализован в JSON)
            user_id: ID пользователя
        """
        if user_id not in self.active_connections:
            return
        
        disconnected = set()
        
        for connection in self.active_connections[user_id].copy():
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.warning(f"Ошибка отправки сообщения пользователю {user_id}: {e}")
                disconnected.add(connection)
        
        # Удаляем отключенные соединения
        for conn in disconnected:
            await self.disconnect(conn, user_id)
    
    async def broadcast_to_user(self, user_id: str, message_type: str, data: dict):
        """
        Удобный метод для отправки типизированных сообщений.
        
        Args:
            user_id: ID пользователя
            message_type: Тип сообщения (pets_update, pet_updated, wallet_updated и т.д.)
            data: Данные для отправки
        """
        message = {
            "type": message_type,
            "data": data,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }
        await self.send_personal_message(message, user_id)
    
    def get_connection_count(self, user_id: str = None) -> int:
        """Возвращает количество активных подключений."""
        if user_id:
            return len(self.active_connections.get(user_id, set()))
        return self.connection_count

# Глобальный экземпляр менеджера
manager = ConnectionManager()


async def broadcast_pet_update(user_id: str, update_type: str, data: dict):
    """
    Отправляет обновление питомцев через WebSocket.
    
    Args:
        user_id: ID пользователя
        update_type: Тип обновления (pets_update, pet_updated, stage_changed, health_changed)
        data: Данные обновления
    """
    try:
        await manager.broadcast_to_user(user_id, update_type, data)
        logger.debug(f"Broadcast отправлен: user_id={user_id}, type={update_type}")
    except Exception as e:
        logger.error(f"Ошибка broadcast для пользователя {user_id}: {e}")


async def broadcast_wallet_update(user_id: str, wallet_data: dict):
    """Отправляет обновление кошелька через WebSocket."""
    try:
        await manager.broadcast_to_user(user_id, "wallet_updated", wallet_data)
        logger.debug(f"Broadcast кошелька отправлен: user_id={user_id}")
    except Exception as e:
        logger.error(f"Ошибка broadcast кошелька для пользователя {user_id}: {e}")


from fastapi import APIRouter

router = APIRouter()


@router.websocket("/ws/pets/{user_id}")
async def websocket_pets(
    websocket: WebSocket,
    user_id: str,
):
    """
    WebSocket endpoint для получения реального времени обновлений данных питомцев.
    
    После подключения клиент получает:
    1. Начальное состояние всех питомцев
    2. Обновления при изменениях (health_up, create_pet, stage_change и т.д.)
    
    Формат сообщений:
    ```json
    {
        "type": "pets_update" | "pet_updated" | "stage_changed" | "health_changed" | "wallet_updated",
        "data": { /* данные */ },
        "timestamp": "2025-10-31T12:00:00Z"
    }
    ```
    
    Клиент может отправлять:
    - "ping" - для проверки соединения (сервер отвечает "pong")
    """
    await manager.connect(websocket, user_id)
    
    try:
        # Отправляем начальное состояние при подключении
        try:
            # Получаем начальные данные питомцев
            from api.summary import get_all_pets_summary_internal
            from db import get_db
            # Используем async for для правильного управления сессией
            async for db in get_db():
                pets_data = await get_all_pets_summary_internal(user_id, db)
                await websocket.send_json({
                    "type": "pets_update",
                    "data": pets_data,
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                })
                break  # Важно: break закрывает генератор и сессию
        except Exception as e:
            logger.error(f"Ошибка получения начальных данных для {user_id}: {e}")
            await websocket.send_json({
                "type": "error",
                "data": {"message": "Ошибка загрузки данных питомцев"},
                "timestamp": datetime.utcnow().isoformat() + "Z",
            })
        
        # Основной цикл обработки сообщений от клиента
        while True:
            try:
                # Ожидаем сообщение от клиента (с таймаутом для проверки соединения)
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                
                # Обработка команд от клиента
                if data == "ping":
                    await websocket.send_text("pong")
                elif data.startswith("subscribe:"):
                    # В будущем можно добавить подписку на конкретные события
                    # Например: "subscribe:wallet" или "subscribe:pets"
                    pass
                else:
                    # Неизвестная команда - игнорируем
                    logger.debug(f"Неизвестная команда от {user_id}: {data}")
            
            except asyncio.TimeoutError:
                # Таймаут - отправляем ping для проверки соединения
                try:
                    await websocket.send_json({
                        "type": "ping",
                        "timestamp": datetime.utcnow().isoformat() + "Z",
                    })
                except Exception:
                    # Соединение разорвано
                    break
            
            except WebSocketDisconnect:
                break
            
            except Exception as e:
                logger.error(f"Ошибка обработки WebSocket сообщения от {user_id}: {e}")
                # Продолжаем работу, но логируем ошибку
                await asyncio.sleep(1)
    
    except WebSocketDisconnect:
        logger.info(f"WebSocket отключен пользователем: {user_id}")
    except Exception as e:
        logger.error(f"Ошибка WebSocket для пользователя {user_id}: {e}")
    finally:
        await manager.disconnect(websocket, user_id)


@router.get("/ws/stats")
async def get_websocket_stats():
    """Получить статистику WebSocket подключений (для мониторинга)."""
    return {
        "total_connections": manager.get_connection_count(),
        "users_with_connections": len(manager.active_connections),
        "connections_by_user": {
            user_id: manager.get_connection_count(user_id)
            for user_id in manager.active_connections.keys()
        }
    }

