import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = () => {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Initialize socket connection
        // In development, the dev server proxies /socket.io to the backend
        const socket = io({
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('[SOCKET] Connected to server');
            setIsConnected(true);
        });

        socket.on('disconnect', () => {
            console.log('[SOCKET] Disconnected from server');
            setIsConnected(false);
        });

        socket.on('connect_error', (error) => {
            console.error('[SOCKET] Connection error:', error);
        });

        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, []);

    const joinMatch = (matchId: string) => {
        if (socketRef.current) {
            socketRef.current.emit('joinMatch', matchId);
        }
    };

    const leaveMatch = (matchId: string) => {
        if (socketRef.current) {
            socketRef.current.emit('leaveMatch', matchId);
        }
    };

    const joinRegion = (region: string) => {
        if (socketRef.current) {
            socketRef.current.emit('joinRegion', region);
        }
    };

    const leaveRegion = (region: string) => {
        if (socketRef.current) {
            socketRef.current.emit('leaveRegion', region);
        }
    };

    const on = (event: string, callback: (...args: any[]) => void) => {
        if (socketRef.current) {
            socketRef.current.on(event, callback);
        }
    };

    const off = (event: string) => {
        if (socketRef.current) {
            socketRef.current.off(event);
        }
    };

    return {
        socket: socketRef.current,
        isConnected,
        joinMatch,
        leaveMatch,
        joinRegion,
        leaveRegion,
        on,
        off
    };
};
