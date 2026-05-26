import type {
    GameSession,
    SelectionPayload,
    SelectionVerificationResult,
} from 'pages/game/lib/types';

import { api } from '../api';
import { apiMethods } from '../constants';

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
        }),
        getActiveGameSession: build.query<GameSession | null, void>({
            query: () => ({
                url: '/game/sessions/active',
                method: apiMethods.get,
            }),
        }),
        startSoloGameSession: build.mutation<GameSession, void>({
            query: () => ({
                url: '/game/sessions/solo/start',
                method: apiMethods.post,
            }),
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
        }),
    }),
});

export const {
    useCompleteGameTaskForDebugMutation,
    useGetActiveGameSessionQuery,
    useStartSoloGameSessionMutation,
    useSubmitGameTaskSelectionMutation,
} = gameApi;
