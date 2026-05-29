import {
    Accordion,
    Badge,
    HStack,
    Span,
    Spinner,
    Text,
} from '@chakra-ui/react';

import { useGetFriendshipRequestsQuery } from 'shared/api/friends';

import { FriendShipRequestItem } from './FriendshipRequestItem';

export const FriendshipRequests = () => {
    const { data, isLoading } = useGetFriendshipRequestsQuery();

    const isNoRequests = data && !data.length;

    return (
        <Accordion.Root collapsible>
            <Accordion.Item value="item">
                <Accordion.ItemTrigger cursor="pointer">
                    <Accordion.ItemIndicator />

                    <HStack>
                        <Span flex="1">Входящие запросы</Span>
                        {!isLoading && data && (
                            <Badge colorPalette={isNoRequests ? 'gray' : 'red'}>
                                {data.length}
                            </Badge>
                        )}
                    </HStack>
                </Accordion.ItemTrigger>
                <Accordion.ItemContent>
                    <Accordion.ItemBody>
                        {isLoading ? (
                            <Spinner />
                        ) : (
                            data &&
                            data.map(({ requester, id }) => (
                                <FriendShipRequestItem
                                    user={requester}
                                    friendshipId={id}
                                />
                            ))
                        )}

                        {isNoRequests && (
                            <Text textStyle="sm" color="gray.600">
                                Список пуст
                            </Text>
                        )}
                    </Accordion.ItemBody>
                </Accordion.ItemContent>
            </Accordion.Item>
        </Accordion.Root>
    );
};
