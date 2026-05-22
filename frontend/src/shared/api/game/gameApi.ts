import type {
    SelectionPayload,
    SelectionVerificationResult,
} from 'pages/game/lib/types';

import { api } from '../api';
import { apiMethods } from '../constants';

const gameApi = api.injectEndpoints({
    endpoints: (build) => ({
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

export const { useSubmitGameTaskSelectionMutation } = gameApi;
