import type { User } from 'shared/types';

import { api } from '../api';
import { apiMethods, tagTypes } from '../constants';

export type GetFriendsInfiniteParams = { offset: number; limit: number };
export type GetFriendsInfiniteResponse = { items: User[]; hasMore: boolean };

export type SendFriendRequestBody = { addresseeId: string };

export type RespondFriendRequestBody = {
    friendshipId: string;
    accept: boolean;
};

type FriendshipRequest = {
    id: string;
    requester: User;
};
export type GetFriendshipRequestsResponse = FriendshipRequest[];

type DeleteFriendPayload = {
    friendId: string;
};

const friendsApi = api.injectEndpoints({
    endpoints: (build) => ({
        getFriendsInfinite: build.query<
            GetFriendsInfiniteResponse,
            GetFriendsInfiniteParams
        >({
            query: ({ offset, limit }) => ({
                url: '/friends',
                params: { offset, limit },
            }),

            providesTags: (result) =>
                result
                    ? [
                          // Тег для всего списка
                          { type: tagTypes.FriendsList, id: 'LIST' },
                          // Индивидуальные теги для каждого друга
                          ...result.items.map((friend) => ({
                              type: tagTypes.Friend,
                              id: friend.id,
                          })),
                      ]
                    : [{ type: tagTypes.FriendsList, id: 'LIST' }],

            serializeQueryArgs: ({ endpointName }) => {
                return endpointName;
            },

            merge: (currentCache, newData, { arg }) => {
                if (arg.offset === 0) {
                    // Если запрошена первая страница - полностью заменяем кэш
                    currentCache.items = newData.items;
                    currentCache.hasMore = newData.hasMore;
                } else {
                    // Для следующих страниц добавляем
                    currentCache.items.push(...newData.items);
                    currentCache.hasMore = newData.hasMore;
                }
            },

            // forceRefetch({ currentArg, previousArg }) {
            //     // Всегда перезапрашиваем первую страницу при инвалидации
            //     if (currentArg?.offset === 0) {
            //         return true;
            //     }
            //     return currentArg?.offset !== precacheDataviousArg?.offset;
            // },
        }),

        sendFriendRequest: build.mutation<void, SendFriendRequestBody>({
            query: (body: SendFriendRequestBody) => ({
                url: '/friends/request',
                method: apiMethods.post,
                body,
            }),
        }),

        getFriendshipRequests: build.query<GetFriendshipRequestsResponse, void>(
            {
                query: () => ({
                    url: '/friends/requests',
                    method: apiMethods.get,
                }),
                providesTags: [tagTypes.FriendshipRequests],
            }
        ),

        respondFriendRequest: build.mutation<void, RespondFriendRequestBody>({
            query: (body: RespondFriendRequestBody) => ({
                url: '/friends/respond',
                method: apiMethods.post,
                body,
            }),

            invalidatesTags: [
                tagTypes.FriendshipRequests,
                { type: tagTypes.FriendsList, id: 'LIST' },
            ],
        }),

        deleteFriend: build.mutation<void, DeleteFriendPayload>({
            query: ({ friendId }: DeleteFriendPayload) => ({
                url: `/friends/${friendId}`,
                method: apiMethods.delete,
            }),

            invalidatesTags: (_, __, { friendId }) => [
                { type: tagTypes.Friend, id: friendId },
                { type: tagTypes.FriendsList, id: 'LIST' },
            ],
        }),
    }),
});

export const {
    useGetFriendsInfiniteQuery,
    useSendFriendRequestMutation,
    useGetFriendshipRequestsQuery,
    useRespondFriendRequestMutation,
    useDeleteFriendMutation,
} = friendsApi;
