import { LuSearch, LuUserRoundPlus } from 'react-icons/lu';
import {
    Flex,
    Heading,
    Input,
    InputGroup,
    Text,
    VStack,
} from '@chakra-ui/react';

import type { User } from 'shared/types';

import { FriendItem } from './FriendItem';

export type Friend = Omit<User, 'email' | 'birthDate' | 'xp'>;

const mockFriends: Friend[] = [];

export const Friends = () => {
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
                <LuUserRoundPlus size={16} cursor="pointer" />
            </Flex>

            <InputGroup startElement={<LuSearch />}>
                <Input
                    variant="subtle"
                    size="sm"
                    placeholder="Введите имя вашего друга"
                />
            </InputGroup>

            <VStack w="full" overflowY="auto">
                {mockFriends.map((friend, index) => (
                    <FriendItem {...friend} key={index} />
                ))}

                {!mockFriends.length && (
                    <Text textStyle="sm" color="gray.600">
                        Список пуст
                    </Text>
                )}
            </VStack>
        </Flex>
    );
};
