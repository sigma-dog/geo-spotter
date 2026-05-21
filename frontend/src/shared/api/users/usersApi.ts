import type { User } from 'shared/types';

import { api } from '../api';
import { apiMethods } from '../constants';

export type GetFriendsInfiniteParams = { offset: number; limit: number };
export type GetFriendsInfiniteResponse = { items: User[]; hasMore: boolean };

export type SendFriendRequestBody = { addresseeId: string };

const friendsApi = api.injectEndpoints({
    endpoints: (build) => ({
        getUsers: build.query<User[], string>({
            query: (search) => ({
                url: '/users',
                method: apiMethods.get,
                params: {
                    search,
                },
            }),
        }),
    }),
});

export const { useLazyGetUsersQuery } = friendsApi;
