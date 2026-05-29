import { HStack, Spinner, Text } from '@chakra-ui/react';

type ViewerToolbarProps = {
    isViewerLoading: boolean;
    spotTitle: string;
};

export const ViewerToolbar = ({
    isViewerLoading,
    spotTitle,
}: ViewerToolbarProps) => {
    return (
        <HStack
            position="absolute"
            top={4}
            left={4}
            zIndex={7}
            px={4}
            py={2}
            borderRadius="full"
            bg="blackAlpha.700"
            color="white"
        >
            <Text fontWeight="600">{spotTitle}</Text>
            {isViewerLoading && <Spinner size="sm" />}
        </HStack>
    );
};
