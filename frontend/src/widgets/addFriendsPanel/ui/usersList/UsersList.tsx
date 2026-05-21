import { LuSearch } from 'react-icons/lu';
import { Input, InputGroup, Spinner, VStack } from '@chakra-ui/react';

import { useGetUsersQuery } from 'shared/api/users';

import { UserItem } from '../UserItem';

export const UsersList = () => {
    const { isLoading, data } = useGetUsersQuery();

    return (
        <VStack w="full" gap={4}>
            <InputGroup startElement={<LuSearch />}>
                <Input
                    variant="subtle"
                    size="sm"
                    placeholder="Введите имя пользователя"
                />
            </InputGroup>
            {isLoading && <Spinner />}
            {data && (
                <VStack width="full" gap={2}>
                    {data.map((user) => (
                        <UserItem key={user.id} user={user} />
                    ))}
                </VStack>
            )}
        </VStack>
    );
};
