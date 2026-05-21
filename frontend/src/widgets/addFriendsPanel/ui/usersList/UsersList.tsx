import { useEffect, useState } from 'react';
import { LuSearch } from 'react-icons/lu';
import { Input, InputGroup, Spinner, Text, VStack } from '@chakra-ui/react';

import { useLazyGetUsersQuery } from 'shared/api/users';

import { UserItem } from '../UserItem';

export const UsersList = () => {
    const [searchValue, setSearchValue] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [triggerSearch, { isFetching, data }] = useLazyGetUsersQuery();
    const hasSubmittedSearch = debouncedSearch.length > 0;

    useEffect(() => {
        const normalizedValue = searchValue.trim();

        const timeoutId = window.setTimeout(() => {
            setDebouncedSearch(normalizedValue);

            if (normalizedValue) {
                void triggerSearch(normalizedValue);
            }
        }, 350);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [searchValue, triggerSearch]);

    return (
        <VStack w="full" gap={4}>
            <InputGroup startElement={<LuSearch />}>
                <Input
                    variant="subtle"
                    size="sm"
                    placeholder="Введите имя пользователя"
                    value={searchValue}
                    onChange={(event) => {
                        const nextValue = event.target.value;

                        setSearchValue(nextValue);

                        if (!nextValue.trim()) {
                            setDebouncedSearch('');
                        }
                    }}
                />
            </InputGroup>
            {isFetching && <Spinner />}
            {!hasSubmittedSearch && (
                <Text fontSize="sm" color="gray.500" textAlign="center">
                    Начни вводить имя или email, и поиск запустится сам.
                </Text>
            )}
            {hasSubmittedSearch && data?.length === 0 && !isFetching && (
                <Text fontSize="sm" color="gray.500" textAlign="center">
                    Никого не нашли по этому запросу.
                </Text>
            )}
            {hasSubmittedSearch && data && data.length > 0 && (
                <VStack width="full" gap={2}>
                    {data.map((user) => (
                        <UserItem key={user.id} user={user} />
                    ))}
                </VStack>
            )}
        </VStack>
    );
};
