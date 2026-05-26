'use client';

import {
    Box,
    createToaster,
    HStack,
    Portal,
    Spinner,
    Stack,
    Toast,
    Toaster as ChakraToaster,
} from '@chakra-ui/react';

export const toaster = createToaster({
    placement: 'bottom-end',
    pauseOnPageIdle: true,
});

export const Toaster = () => {
    return (
        <Portal>
            <ChakraToaster toaster={toaster} insetInline={{ mdDown: '4' }}>
                {(toast) => (
                    <Toast.Root unstyled width={{ md: 'sm' }}>
                        <HStack
                            align="flex-start"
                            gap="3"
                            px="4"
                            py="3.5"
                            borderRadius="xl"
                            bg={
                                toast.type === 'success'
                                    ? '#0f3a2a'
                                    : toast.type === 'error'
                                      ? '#4a1414'
                                      : toast.type === 'warning'
                                        ? '#4a2f12'
                                        : toast.type === 'loading'
                                          ? '#132c4f'
                                          : '#171923'
                            }
                            color="white"
                            borderWidth="1px"
                            borderColor="rgba(255,255,255,0.18)"
                            boxShadow="0 20px 40px rgba(0, 0, 0, 0.45)"
                        >
                            <Box pt="0.5">
                                {toast.type === 'loading' ? (
                                    <Spinner size="sm" color="blue.200" />
                                ) : (
                                    <Toast.Indicator color="white" />
                                )}
                            </Box>
                            <Stack gap="1" flex="1" maxWidth="100%">
                                {toast.title && (
                                    <Toast.Title color="white">
                                        {toast.title}
                                    </Toast.Title>
                                )}
                                {toast.description && (
                                    <Toast.Description color="whiteAlpha.900">
                                        {toast.description}
                                    </Toast.Description>
                                )}
                            </Stack>
                            {toast.action && (
                                <Toast.ActionTrigger color="white">
                                    {toast.action.label}
                                </Toast.ActionTrigger>
                            )}
                            {toast.closable && (
                                <Toast.CloseTrigger color="white" />
                            )}
                        </HStack>
                    </Toast.Root>
                )}
            </ChakraToaster>
        </Portal>
    );
};
