import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Button, Field, Flex, Input } from '@chakra-ui/react';

import { useLoginMutation } from 'shared/api/auth';
import { setAccessToken, setRefreshToken } from 'shared/api/tokensUtils';
import { setUserInfo } from 'shared/lib';

type LoginFormValues = {
    email: string;
    password: string;
};

export const Login = () => {
    const navigate = useNavigate();
    const [loginUser, { isLoading }] = useLoginMutation();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        mode: 'onBlur',
    });

    const onSubmit = async (data: LoginFormValues) => {
        try {
            const userData = await loginUser(data).unwrap();

            setUserInfo(userData);
            setAccessToken(userData.access);
            setRefreshToken(userData.refresh);

            navigate('/home');
        } catch (error) {
            console.error(error);
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
                    <Field.Label>Пароль</Field.Label>
                    <Input
                        placeholder="Введите ваш пароль"
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
            </Flex>

            <Button mt={6} w="full" size="lg" type="submit" loading={isLoading}>
                Войти
            </Button>
        </Flex>
    );
};
