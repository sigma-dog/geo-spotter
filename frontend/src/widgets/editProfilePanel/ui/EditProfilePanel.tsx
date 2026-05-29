import { type FC, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
    Button,
    Dialog,
    type DialogOpenChangeDetails,
    VStack,
} from '@chakra-ui/react';
import type { SerializedError } from '@reduxjs/toolkit';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

import {
    useGetCurrentUserDataQuery,
    useUpdateUserDataMutation,
} from 'shared/api/currentUser';
import { dateInputToIso, isoToDateInput } from 'shared/lib';
import { toaster } from 'shared/ui/chakra/toaster';

import { AvatarWithUpdateButton } from './AvatarWithUpdateButton';
import { ProfileForm } from './ProfileForm';
import type { UserDataFormValues } from '../lib/types';

export type EditProfilePanelProps = {
    isOpen: boolean;
    onOpenChange: (details: DialogOpenChangeDetails) => void;
};

export const EditProfilePanel: FC<EditProfilePanelProps> = ({
    isOpen,
    onOpenChange,
}) => {
    const { data, isSuccess } = useGetCurrentUserDataQuery();
    const [updateUserData, { isLoading }] = useUpdateUserDataMutation();

    const {
        register,
        reset,
        formState: { errors, isSubmitting },
        handleSubmit,
    } = useForm<UserDataFormValues>({
        mode: 'onBlur',
    });

    const onSubmit = async (values: UserDataFormValues) => {
        try {
            const payload = {
                ...values,
                birthDate: values.birthDate
                    ? dateInputToIso(values.birthDate)
                    : null,
            };

            await updateUserData(payload).unwrap();

            toaster.create({
                type: 'success',
                title: 'Пользовательские данные успешно обновлены',
            });

            onOpenChange({ open: false });
        } catch (e) {
            const error = e as FetchBaseQueryError | SerializedError;

            toaster.create({
                type: 'error',
                title: 'Ошибка обновления пользовательских данных',
                description:
                    'status' in error
                        ? `API error: ${error.data}`
                        : `Serialized error: ${error.message}`,
            });
        }
    };

    useEffect(() => {
        if (isSuccess && data) {
            reset({
                username: data.username,
                email: data.email,
                birthDate: isoToDateInput(data.birthDate),
            });
        }
    }, [isSuccess, data, reset]);

    return (
        <Dialog.Root
            lazyMount
            onOpenChange={onOpenChange}
            open={isOpen}
            closeOnEscape={!isLoading}
        >
            <Dialog.Trigger />
            <Dialog.Backdrop />
            <Dialog.Positioner>
                <Dialog.Content as="form" onSubmit={handleSubmit(onSubmit)}>
                    <Dialog.CloseTrigger />
                    <Dialog.Header>
                        <Dialog.Title>Ваш профиль</Dialog.Title>
                    </Dialog.Header>
                    <Dialog.Body>
                        <VStack>
                            <AvatarWithUpdateButton />
                            <ProfileForm register={register} errors={errors} />
                        </VStack>
                    </Dialog.Body>
                    <Dialog.Footer>
                        <Button colorPalette="red">Назад</Button>
                        <Button
                            type="submit"
                            loading={isSubmitting || isLoading}
                        >
                            Сохранить
                        </Button>
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog.Positioner>
        </Dialog.Root>
    );
};
