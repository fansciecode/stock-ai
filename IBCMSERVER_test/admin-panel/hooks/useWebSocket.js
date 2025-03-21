import { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE_URL } from '../config';

const useWebSocket = (path, options = {}) => {
    const {
        reconnectAttempts = 5,
        reconnectInterval = 3000,
        heartbeatInterval = 30000,
        onOpen,
        onClose,
        onMessage,
        onError,
        autoConnect = true,
        protocols = []
    } = options;

    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState(null);
    const [error, setError] = useState(null);

    const wsRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);
    const reconnectTimeoutRef = useRef(null);
    const heartbeatIntervalRef = useRef(null);
    const messageQueueRef = useRef([]);

    // Create WebSocket URL
    const getWebSocketUrl = useCallback(() => {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const baseUrl = API_BASE_URL.replace(/^http(s)?:\/\//, '');
        return `${wsProtocol}//${baseUrl}${path}`;
    }, [path]);

    // Send heartbeat
    const sendHeartbeat = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'ping' }));
        }
    }, []);

    // Connect to WebSocket
    const connect = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
        }

        try {
            const ws = new WebSocket(getWebSocketUrl(), protocols);
            wsRef.current = ws;

            ws.onopen = () => {
                setIsConnected(true);
                setError(null);
                reconnectAttemptsRef.current = 0;

                // Process queued messages
                while (messageQueueRef.current.length > 0) {
                    const message = messageQueueRef.current.shift();
                    send(message);
                }

                // Start heartbeat
                heartbeatIntervalRef.current = setInterval(sendHeartbeat, heartbeatInterval);

                if (onOpen) {
                    onOpen();
                }
            };

            ws.onclose = (event) => {
                setIsConnected(false);
                clearInterval(heartbeatIntervalRef.current);

                // Attempt to reconnect
                if (reconnectAttemptsRef.current < reconnectAttempts) {
                    reconnectTimeoutRef.current = setTimeout(() => {
                        reconnectAttemptsRef.current++;
                        connect();
                    }, reconnectInterval);
                } else {
                    setError(new Error('Maximum reconnection attempts reached'));
                }

                if (onClose) {
                    onClose(event);
                }
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    
                    // Handle heartbeat response
                    if (data.type === 'pong') {
                        return;
                    }

                    setLastMessage(data);
                    if (onMessage) {
                        onMessage(data);
                    }
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            ws.onerror = (event) => {
                setError(new Error('WebSocket error'));
                if (onError) {
                    onError(event);
                }
            };
        } catch (error) {
            setError(error);
            if (onError) {
                onError(error);
            }
        }
    }, [
        getWebSocketUrl,
        protocols,
        reconnectAttempts,
        reconnectInterval,
        heartbeatInterval,
        onOpen,
        onClose,
        onMessage,
        onError,
        sendHeartbeat
    ]);

    // Disconnect from WebSocket
    const disconnect = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        clearTimeout(reconnectTimeoutRef.current);
        clearInterval(heartbeatIntervalRef.current);
        reconnectAttemptsRef.current = 0;
        messageQueueRef.current = [];
    }, []);

    // Send message
    const send = useCallback((message) => {
        const stringifiedMessage = typeof message === 'string'
            ? message
            : JSON.stringify(message);

        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(stringifiedMessage);
        } else {
            // Queue message if not connected
            messageQueueRef.current.push(message);
        }
    }, []);

    // Subscribe to a channel
    const subscribe = useCallback((channel) => {
        send({
            type: 'subscribe',
            channel
        });
    }, [send]);

    // Unsubscribe from a channel
    const unsubscribe = useCallback((channel) => {
        send({
            type: 'unsubscribe',
            channel
        });
    }, [send]);

    // Initialize connection
    useEffect(() => {
        if (autoConnect) {
            connect();
        }

        return () => {
            disconnect();
        };
    }, [autoConnect, connect, disconnect]);

    return {
        isConnected,
        lastMessage,
        error,
        connect,
        disconnect,
        send,
        subscribe,
        unsubscribe
    };
};

// Utility hooks for specific WebSocket connections
export const useRealtimeUpdates = (options = {}) => {
    return useWebSocket('/ws/updates', {
        ...options,
        onMessage: (data) => {
            if (options.onMessage) {
                options.onMessage(data);
            }
        }
    });
};

export const useNotificationsSocket = (options = {}) => {
    return useWebSocket('/ws/notifications', {
        ...options,
        onMessage: (data) => {
            if (options.onMessage) {
                options.onMessage(data);
            }
        }
    });
};

export const useOrderUpdates = (options = {}) => {
    return useWebSocket('/ws/orders', {
        ...options,
        onMessage: (data) => {
            if (options.onMessage) {
                options.onMessage(data);
            }
        }
    });
};

export const useFraudAlerts = (options = {}) => {
    return useWebSocket('/ws/fraud-alerts', {
        ...options,
        onMessage: (data) => {
            if (options.onMessage) {
                options.onMessage(data);
            }
        }
    });
};

export default useWebSocket; 