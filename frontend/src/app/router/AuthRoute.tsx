import { Navigate } from 'react-router-dom';
import { Center, Spinner } from '@chakra-ui/react';

import { useGetCurrentUserDataQuery } from 'shared/api/currentUser';
import { getAccessToken, getRefreshToken } from 'shared/api/tokensUtils';
import { getUserInfo } from 'shared/lib';

import Auth from '../../pages/auth';

export const AuthRoute = () => {
    const storedUser = getUserInfo();
    const hasStoredSession =
        Boolean(storedUser?.id) &&
        Boolean(getAccessToken() || getRefreshToken());
    const { data, isFetching, isLoading, isSuccess } =
        useGetCurrentUserDataQuery(undefined, {
            skip: !hasStoredSession,
        });

    if (hasStoredSession && (isLoading || isFetching)) {
        return (
            <Center minH="100vh">
                <Spinner size="lg" />
            </Center>
        );
    }

    if (hasStoredSession && (isSuccess || data)) {
        return <Navigate to="/home" replace />;
    }

    return <Auth />;
};
