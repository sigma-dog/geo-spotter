import { type FC } from 'react';
import { type FieldErrors, type UseFormRegister } from 'react-hook-form';
import { Field, Input, VStack } from '@chakra-ui/react';

import type { UserDataFormValues } from '../lib/types';

type ProfileFormProps = {
    register: UseFormRegister<UserDataFormValues>;
    errors: FieldErrors<UserDataFormValues>;
};

export const ProfileForm: FC<ProfileFormProps> = ({ register, errors }) => {
    return (
        <VStack gap={6} w="full">
            <Field.Root invalid={!!errors.username}>
                <Field.Label>Ваше имя</Field.Label>
                <Input
                    placeholder="Введите ваше имя"
                    variant="subtle"
                    size="md"
                    {...register('username', {
                        required: 'Имя обязательно',
                        minLength: {
                            value: 2,
                            message: 'Минимум 2 символа',
                        },
                    })}
                />
                <Field.ErrorText>{errors.username?.message}</Field.ErrorText>
            </Field.Root>

            <Field.Root invalid={!!errors.email}>
                <Field.Label>Email</Field.Label>
                <Input
                    placeholder="example@geospotter.com"
                    variant="subtle"
                    size="md"
                    type="email"
                    {...register('email', {
                        required: 'Email обязателен',
                        pattern: {
                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: 'Некорректный email',
                        },
                    })}
                />
                <Field.ErrorText>{errors.email?.message}</Field.ErrorText>
            </Field.Root>

            <Field.Root invalid={!!errors.birthDate}>
                <Field.Label>Введите вашу дату рождения</Field.Label>
                <Input
                    placeholder="Дата рождения"
                    variant="subtle"
                    size="md"
                    type="date"
                    {...register('birthDate', {
                        required: 'Дата рождения обязательна',
                    })}
                />
                <Field.ErrorText>{errors.birthDate?.message}</Field.ErrorText>
            </Field.Root>
        </VStack>
    );
};
