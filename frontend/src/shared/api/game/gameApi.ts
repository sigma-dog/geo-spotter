import type {
    GameSession,
    SelectionPayload,
    SelectionVerificationResult,
} from 'pages/game/lib/types';

import { api } from '../api';
import { apiMethods, tagTypes } from '../constants';

const gameApi = api.injectEndpoints({
    endpoints: (build) => ({
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
    useCompleteGameTaskForDebugMutation,
    useGetActiveGameSessionQuery,
    useGetRecentGameSessionsQuery,
    useStartSoloGameSessionMutation,
    useSubmitGameTaskSelectionMutation,
} = gameApi;
