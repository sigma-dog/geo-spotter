import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Button, Field, Flex, Input } from '@chakra-ui/react';

import { useRegisterMutation } from 'shared/api/auth';
import { setAccessToken, setRefreshToken } from 'shared/api/tokensUtils';
import { setUserInfo } from 'shared/lib';

type RegisterFormValues = {
    username: string;
    email: string;
    password: string;
    birthDate: string;
};

export const Register = () => {
    const navigate = useNavigate();
    const [registerUser, { isLoading }] = useRegisterMutation();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormValues>({
        mode: 'onBlur',
    });

    const onSubmit = async (data: RegisterFormValues) => {
        try {
            const formattedBirthdate = new Date(data.birthDate).toISOString();

            const userData = await registerUser({
                ...data,
                birthDate: formattedBirthdate,
            }).unwrap();

            setUserInfo(userData);
            setAccessToken(userData.access);
            setRefreshToken(userData.refresh);

            navigate('/home');
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <Flex
            as="form"
            direction="column"
            gap={5}
            w="full"
            onSubmit={handleSubmit(onSubmit)}
        >
            <Flex direction="column" gap={5} w="full">
                <Field.Root invalid={!!errors.username}>
                    <Field.Label>Ваше имя</Field.Label>
                    <Input
                        placeholder="Амир Зиннатуллин"
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
                    <Field.ErrorText>
                        {errors.username?.message}
                    </Field.ErrorText>
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

                <Field.Root invalid={!!errors.password}>
                    <Field.Label>Введите ваш пароль</Field.Label>
                    <Input
                        placeholder="Ваш пароль"
                        variant="subtle"
                        size="md"
                        type="password"
                        {...register('password', {
                            required: 'Пароль обязателен',
                            minLength: {
                                value: 6,
                                message: 'Минимум 6 символов',
                            },
                        })}
                    />
                    <Field.ErrorText>
                        {errors.password?.message}
                    </Field.ErrorText>
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
                    <Field.ErrorText>
                        {errors.birthDate?.message}
                    </Field.ErrorText>
                </Field.Root>
            </Flex>

            <Button mt={6} w="full" size="lg" type="submit" loading={isLoading}>
                Зарегистрироваться
            </Button>
        </Flex>
    );
};
