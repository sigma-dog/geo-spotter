import type { FC, PropsWithChildren } from 'react';

import type { DefaultPanelType } from 'shared/types';
import { createPanelContext } from 'shared/utils';

import { AddFriendsPanel } from '../ui/AddFriendsPanel';

export type AddFriendsPanelType = DefaultPanelType;

export const [Provider, useAddFriendsPanel] =
    createPanelContext<AddFriendsPanelType>();

export const renderAddFriendsPanel = (props: AddFriendsPanelType) => (
    <AddFriendsPanel {...props} />
);

export const useOpenAddFriendsPanel = () => {
    const openAddFriendsModal = useAddFriendsPanel();

    const onClose = () => {
        openAddFriendsModal({
            ...AddFriendsPanelProps,
            isOpen: false,
        });
    };

    const AddFriendsPanelProps = {
        onClose,
    };

    const open = () => {
        openAddFriendsModal({
            ...AddFriendsPanelProps,
            isOpen: true,
        });
    };

    return open;
};

export const AddFriendsPanelProvider: FC<PropsWithChildren> = ({
    children,
}) => {
    return <Provider renderPanel={renderAddFriendsPanel}>{children}</Provider>;
};
