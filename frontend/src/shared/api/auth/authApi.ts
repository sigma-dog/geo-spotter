import { api, apiMethods } from 'shared/api';
import type { User } from 'shared/types';

import type { LoginBody, RegisterBody } from './types';
import { tagTypes } from '../constants';

const getUrl = () => 'auth';

type Tokens = {
    access: string;
    refresh: string;
};

type LoginResponse = Tokens & User;
type RegisterResponse = Tokens & User;

export const authApi = api.injectEndpoints({
    endpoints: (build) => ({
        login: build.mutation<LoginResponse, LoginBody>({
            query: (body: LoginBody) => ({
                url: `${getUrl()}/login`,
                method: apiMethods.post,
                body,
            }),
        }),

        register: build.mutation<RegisterResponse, RegisterBody>({
            query: (body: RegisterBody) => ({
                url: `${getUrl()}/register`,
                method: apiMethods.post,
                body,
            }),
        }),

        logout: build.mutation<void, void>({
            queryFn: () => ({ data: undefined }), // Не делаем реального запроса
            invalidatesTags: [tagTypes.CurrentUser],
        }),
    }),
    overrideExisting: false,
});

export const { useLoginMutation, useRegisterMutation, useLogoutMutation } =
    authApi;
