import type { FC } from 'react';
import { GiHamburgerMenu } from 'react-icons/gi';
import { useNavigate } from 'react-router-dom';
import { IconButton, Menu, Portal } from '@chakra-ui/react';

import { removeAccessToken, removeRefreshToken } from 'shared/api/tokensUtils';
import { useConfirmDialog } from 'shared/hooks';
import { removeUserInfo } from 'shared/lib';

type ProfileMenuProps = {
    openEditProfilePanel: () => void;
};

export const ProfileMenu: FC<ProfileMenuProps> = ({ openEditProfilePanel }) => {
    const navigate = useNavigate();

    const [ConfirmLogoutDialog, openConfirmLogoutDialog] = useConfirmDialog({
        title: 'Выход',
        message: 'Вы действительно хотите выйти из аккаунта?',
        confirmText: 'Да, выйти',
        cancelText: 'Нет, остаться',
    });

    const logout = () => {
        openConfirmLogoutDialog().then((res) => {
            if (res === 'confirm') {
                removeUserInfo();

                removeAccessToken();
                removeRefreshToken();

                navigate('/auth');
            }
        });
    };

    return (
        <>
            <Menu.Root>
                <Menu.Trigger asChild>
                    <IconButton variant="plain" size="sm">
                        <GiHamburgerMenu />
                    </IconButton>
                </Menu.Trigger>
                <Portal>
                    <Menu.Positioner>
                        <Menu.Content>
                            <Menu.Item
                                value="edit"
                                onClick={openEditProfilePanel}
                            >
                                Редактировать
                            </Menu.Item>
                            <Menu.Item
                                value="logout"
                                color="red"
                                onClick={logout}
                            >
                                Выйти
                            </Menu.Item>
                        </Menu.Content>
                    </Menu.Positioner>
                </Portal>
            </Menu.Root>

            {ConfirmLogoutDialog}
        </>
    );
};
