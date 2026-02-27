import type { User } from 'shared/types';

export type RegisterBody = Pick<User, 'username' | 'email' | 'birthDate'> & {
    password: string;
};

export type LoginBody = Omit<RegisterBody, 'username' | 'birthDate'>;
