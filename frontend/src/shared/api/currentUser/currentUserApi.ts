import { getUserInfo } from 'shared/lib';
import type { User } from 'shared/types';

import { api } from '../api';
import { apiMethods, tagTypes } from '../constants';

const getUrl = () => 'users';

export type UpdateUserBody = Partial<{
    email: string;
    username: string;
    birthdate: string;
}>;

export type UpdateAvatarResponse = {
    avatarUrl: string;
};

const currentUserApi = api.injectEndpoints({
    endpoints: (build) => ({
        getCurrentUserData: build.query<User, void>({
            query: () => ({
                url: `${getUrl()}/${getUserInfo()?.id}`,
                method: apiMethods.get,
            }),
            providesTags: [tagTypes.CurrentUser],
        }),

        updateUserData: build.mutation<User, UpdateUserBody>({
            query: (body: UpdateUserBody) => ({
                url: `${getUrl()}/${getUserInfo()?.id}`,
                method: apiMethods.patch,
                body,
            }),
            invalidatesTags: [tagTypes.CurrentUser],
        }),

        updateAvatar: build.mutation<UpdateAvatarResponse, FormData>({
            query: (body: FormData) => ({
                url: `${getUrl()}/avatar`,
                method: apiMethods.post,
                body,
            }),
            invalidatesTags: [tagTypes.CurrentUser],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetCurrentUserDataQuery,
    useUpdateUserDataMutation,
    useUpdateAvatarMutation,
} = currentUserApi;
