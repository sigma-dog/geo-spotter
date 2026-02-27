import type { User } from 'shared/types';

import { api } from '../api';

export type GetFriendsInfiniteParams = { offset: number; limit: number };
export type GetFriendsInfiniteResponse = { items: User[]; hasMore: boolean };

export const friendsApi = api.injectEndpoints({
    endpoints: (build) => ({
        getFriendsInfinite: build.query<
            GetFriendsInfiniteResponse,
            GetFriendsInfiniteParams
        >({
            query: ({ offset, limit }) => ({
                url: '/friends',
                params: { offset, limit },
            }),

            serializeQueryArgs: ({ endpointName }) => {
                return endpointName;
            },

            merge: (currentCache, newData) => {
                currentCache.items.push(...newData.items);
                currentCache.hasMore = newData.hasMore;
            },

            forceRefetch({ currentArg, previousArg }) {
                return currentArg?.offset !== previousArg?.offset;
            },
        }),
    }),
});
