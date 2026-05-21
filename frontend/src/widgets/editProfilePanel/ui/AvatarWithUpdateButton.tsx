import { useRef } from 'react';
import { CiEdit } from 'react-icons/ci';
import { Avatar, Box, IconButton, Spinner } from '@chakra-ui/react';

import {
    useGetCurrentUserDataQuery,
    useUpdateAvatarMutation,
} from 'shared/api/currentUser';

export const AvatarWithUpdateButton = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { isFetching, data: currentUser } = useGetCurrentUserDataQuery();

    const [uploadAvatar] = useUpdateAvatarMutation();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (!file) {
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        uploadAvatar(formData);
    };

    const handleClickButton = () => {
        fileInputRef.current?.click();
    };

    return (
        <Box w="48" h="48" position="relative">
            <Avatar.Root size="full">
                <Avatar.Fallback />
                {isFetching && <Spinner />}
                {currentUser?.avatarUrl && (
                    <Avatar.Image src={currentUser?.avatarUrl} />
                )}
            </Avatar.Root>

            <>
                <IconButton
                    variant="subtle"
                    position="absolute"
                    right={0}
                    bottom={0}
                    colorPalette="white"
                    onClick={handleClickButton}
                >
                    <CiEdit />
                </IconButton>

                <input
                    type="file"
                    accept="image/*"
                    hidden
                    ref={fileInputRef}
                    onChange={handleFileChange}
                />
            </>
        </Box>
    );
};
