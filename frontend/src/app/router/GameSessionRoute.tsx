import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Center, Spinner } from '@chakra-ui/react';

import { useGetActiveGameSessionQuery } from 'shared/api/game';

type GameSessionRouteProps = {
    children: ReactNode;
};

export const GameSessionRoute = ({ children }: GameSessionRouteProps) => {
    const { data, isLoading, isSuccess } = useGetActiveGameSessionQuery();

    if (isLoading && !data) {
        return (
            <Center minH="100vh">
                <Spinner size="lg" />
            </Center>
        );
    }

    if (!isSuccess || !data) {
        return <Navigate to="/home" replace />;
    }

    return <>{children}</>;
};
