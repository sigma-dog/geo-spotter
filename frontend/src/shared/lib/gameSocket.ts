import { io, type Socket } from 'socket.io-client';

import { getAccessToken } from 'shared/api/tokensUtils';

let gameSocket: Socket | null = null;

const getSocketBaseUrl = () => {
    const apiUrl = import.meta.env.VITE_API_URL;

    if (!apiUrl) {
        return window.location.origin;
    }

    return new URL(apiUrl, window.location.origin).origin;
};

export const getGameSocket = () => {
    const token = getAccessToken();

    if (!token) {
        return null;
    }

    if (gameSocket) {
        const authPayload =
            typeof gameSocket.auth === 'function'
                ? {}
                : ((gameSocket.auth ?? {}) as { token?: string });
        const currentToken = String(authPayload.token ?? '');

        if (currentToken !== `Bearer ${token}`) {
            gameSocket.auth = {
                token: `Bearer ${token}`,
            };
            gameSocket.connect();
        }

        return gameSocket;
    }

    gameSocket = io(`${getSocketBaseUrl()}/game`, {
        autoConnect: true,
        auth: {
            token: `Bearer ${token}`,
        },
        transports: ['websocket'],
    });

    return gameSocket;
};
