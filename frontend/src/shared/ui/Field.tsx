import type { FC } from 'react';
import { Field as ChakraField, Input, type InputProps } from '@chakra-ui/react';

type FieldProps = InputProps & {
    label?: string;
};

export const Field: FC<FieldProps> = ({ label, ...props }) => {
    return (
        <ChakraField.Root>
            {label && <ChakraField.Label>{label}</ChakraField.Label>}
            <Input {...props} />
        </ChakraField.Root>
    );
};
