import type {
    GameSession,
    MultiplayerLobby,
    SelectionPayload,
    SelectionVerificationResult,
} from 'pages/game/lib/types';

import { api } from '../api';
import { apiMethods, tagTypes } from '../constants';

const gameApi = api.injectEndpoints({
    endpoints: (build) => ({
        abandonActiveGameSession: build.mutation<{ ok: true }, void>({
            query: () => ({
                url: '/game/sessions/active/abandon',
                method: apiMethods.post,
            }),
            invalidatesTags: [tagTypes.GameSession],
        }),
        completeGameTaskForDebug: build.mutation<
            GameSession,
            { sessionId: string; sessionTaskId: string }
        >({
            query: ({ sessionId, sessionTaskId }) => ({
                url: `/game/debug/sessions/${sessionId}/tasks/${sessionTaskId}/complete`,
                method: apiMethods.post,
            }),
            invalidatesTags: [tagTypes.CurrentUser, tagTypes.GameSession],
        }),
        getActiveGameSession: build.query<GameSession | null, void>({
            query: () => ({
                url: '/game/sessions/active',
                method: apiMethods.get,
            }),
            providesTags: [tagTypes.GameSession],
        }),
        getRecentGameSessions: build.query<GameSession[], void>({
            query: () => ({
                url: '/game/sessions/recent',
                method: apiMethods.get,
            }),
            providesTags: [tagTypes.GameSession],
        }),
        startSoloGameSession: build.mutation<GameSession, void>({
            query: () => ({
                url: '/game/sessions/solo/start',
                method: apiMethods.post,
            }),
            invalidatesTags: [tagTypes.GameSession],
        }),
        createMultiplayerLobby: build.mutation<
            MultiplayerLobby,
            { friendIds: string[] }
        >({
            query: (body) => ({
                url: '/game/lobbies',
                method: apiMethods.post,
                body,
            }),
            invalidatesTags: [tagTypes.GameSession],
        }),
        getPendingMultiplayerLobby: build.query<MultiplayerLobby | null, void>({
            query: () => ({
                url: '/game/lobbies/pending',
                method: apiMethods.get,
            }),
        }),
        getIncomingMultiplayerLobbies: build.query<MultiplayerLobby[], void>({
            query: () => ({
                url: '/game/lobbies/incoming',
                method: apiMethods.get,
            }),
        }),
        respondToMultiplayerLobby: build.mutation<
            MultiplayerLobby | null,
            { accept: boolean; lobbyId: string }
        >({
            query: (body) => ({
                url: '/game/lobbies/respond',
                method: apiMethods.post,
                body,
            }),
            invalidatesTags: [tagTypes.GameSession],
        }),
        submitGameTaskSelection: build.mutation<
            SelectionVerificationResult,
            SelectionPayload
        >({
            query: (body) => ({
                url: '/game/tasks/submit-selection',
                method: apiMethods.post,
                body,
            }),
            invalidatesTags: [tagTypes.CurrentUser, tagTypes.GameSession],
        }),
    }),
});

export const {
    useAbandonActiveGameSessionMutation,
    useCompleteGameTaskForDebugMutation,
    useGetActiveGameSessionQuery,
    useGetIncomingMultiplayerLobbiesQuery,
    useGetPendingMultiplayerLobbyQuery,
    useGetRecentGameSessionsQuery,
    useCreateMultiplayerLobbyMutation,
    useRespondToMultiplayerLobbyMutation,
    useStartSoloGameSessionMutation,
    useSubmitGameTaskSelectionMutation,
} = gameApi;
