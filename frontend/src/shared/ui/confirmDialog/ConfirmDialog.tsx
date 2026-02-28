import { Button, CloseButton, Dialog, Portal } from '@chakra-ui/react';

export type ConfirmDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    confirmColorScheme?: string;
    isLoading?: boolean;
};

export const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Подтверждение действия',
    message = 'Вы уверены, что хотите выполнить это действие?',
    confirmText = 'Подтвердить',
    cancelText = 'Отмена',
}: ConfirmDialogProps) => {
    return (
        <Dialog.Root
            lazyMount
            open={isOpen}
            placement="center"
            onEscapeKeyDown={onClose}
        >
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Header>
                            <Dialog.Title>{title}</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body>{message}</Dialog.Body>
                        <Dialog.Footer>
                            <Dialog.ActionTrigger asChild>
                                <Button variant="outline" onClick={onClose}>
                                    {cancelText}
                                </Button>
                            </Dialog.ActionTrigger>
                            <Dialog.ActionTrigger asChild>
                                <Button
                                    variant="solid"
                                    colorPalette="red"
                                    onClick={onConfirm}
                                >
                                    {confirmText}
                                </Button>
                            </Dialog.ActionTrigger>
                        </Dialog.Footer>
                        <Dialog.CloseTrigger asChild onClick={onClose}>
                            <CloseButton size="sm" />
                        </Dialog.CloseTrigger>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
};
