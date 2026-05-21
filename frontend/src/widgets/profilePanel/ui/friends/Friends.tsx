import type { FC } from 'react';
import { LuSearch, LuUserRoundPlus } from 'react-icons/lu';
import {
    Flex,
    Heading,
    Input,
    InputGroup,
    Text,
    VStack,
} from '@chakra-ui/react';

import { useGetFriendsInfiniteQuery } from 'shared/api/friends';
import type { User } from 'shared/types';

import { FriendItem } from './FriendItem';

export type Friend = Omit<User, 'email' | 'birthDate' | 'xp'>;

type FriendsProps = {
    openAddFriendsPanel: () => void;
};

export const Friends: FC<FriendsProps> = ({ openAddFriendsPanel }) => {
    const { data, isLoading, isError, error } = useGetFriendsInfiniteQuery({
        offset: 0,
        limit: 20,
    });

    if (isLoading) {
        return <div>Загрузка...</div>;
    }
    if (isError) {
        return <div>Ошибка: {error.toString()}</div>;
    }

    return (
        <Flex
            direction="column"
            w="full"
            gap={4}
            bgColor="bg.panel"
            borderRadius="lg"
            shadow="md"
            padding={4}
            maxHeight="full"
            overflow="hidden"
        >
            <Flex align="center" justify="space-between">
                <Heading size="md">Друзья</Heading>
                <LuUserRoundPlus
                    size={16}
                    cursor="pointer"
                    onClick={openAddFriendsPanel}
                />
            </Flex>

            <InputGroup startElement={<LuSearch />}>
                <Input
                    variant="subtle"
                    size="sm"
                    placeholder="Введите имя вашего друга"
                />
            </InputGroup>

            {data && (
                <VStack w="full" overflowY="auto">
                    {data.items.map((friend, index) => (
                        <FriendItem {...friend} key={index} />
                    ))}

                    {!data.items.length && (
                        <Text textStyle="sm" color="gray.600">
                            Список пуст
                        </Text>
                    )}
                </VStack>
            )}
        </Flex>
    );
};
