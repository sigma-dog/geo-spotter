import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Center, Spinner } from '@chakra-ui/react';

import { useGetCurrentUserDataQuery } from 'shared/api/currentUser';
import { getAccessToken, getRefreshToken } from 'shared/api/tokensUtils';
import { getUserInfo } from 'shared/lib';

type ProtectedRouteProps = {
    children: ReactNode;
};

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const storedUser = getUserInfo();
    const hasStoredSession =
        Boolean(storedUser?.id) &&
        Boolean(getAccessToken() || getRefreshToken());
    const { data, isError, isFetching, isLoading, isSuccess } =
        useGetCurrentUserDataQuery(undefined, {
            skip: !hasStoredSession,
        });

    if (!hasStoredSession) {
        return <Navigate to="/auth" replace />;
    }

    if (isLoading || isFetching) {
        return (
            <Center minH="100vh">
                <Spinner size="lg" />
            </Center>
        );
    }

    if (isError || (!isSuccess && !data)) {
        return <Navigate to="/auth" replace />;
    }

    return <>{children}</>;
};
