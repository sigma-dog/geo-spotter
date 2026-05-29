import { type ReactElement, useRef } from 'react';

import type { TypeOrNull } from 'shared/types';

import { useOpen } from './useOpen';
import {
    ConfirmDialog,
    type ConfirmDialogProps,
} from '../ui/confirmDialog/ConfirmDialog';

type PromiseValue = 'confirm' | 'cancel';

export const useConfirmDialog = (
    dialogProps?: Omit<ConfirmDialogProps, 'isOpen' | 'onClose' | 'onConfirm'>
): [ReactElement, () => Promise<PromiseValue>] => {
    const { open, close, isOpen } = useOpen();

    const handleResolve =
        useRef<
            TypeOrNull<
                (value: PromiseValue | PromiseLike<PromiseValue>) => void
            >
        >(null);

    const onClose = () => {
        close();
        handleResolve.current?.('cancel');
    };

    const onConfirm = () => {
        close();
        handleResolve.current?.('confirm');
    };

    const openConfirmModal = async () => {
        const { promise, resolve } = Promise.withResolvers<PromiseValue>();
        handleResolve.current = resolve;
        open();

        return promise;
    };

    const Modal = (
        <ConfirmDialog
            {...dialogProps}
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={onConfirm}
        />
    );

    return [Modal, openConfirmModal];
};
