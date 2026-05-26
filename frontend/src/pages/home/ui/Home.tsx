import { type FC, useState } from 'react';
import { LuPlay, LuSearch, LuShare } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import {
    ActionBar,
    Button,
    type DialogOpenChangeDetails,
    Flex,
    Portal,
} from '@chakra-ui/react';

import { useStartSoloGameSessionMutation } from 'shared/api/game';
import { toaster } from 'shared/ui/chakra/toaster';
import { useOpenAddFriendsPanel } from 'widgets/addFriendsPanel';
import { EditProfilePanel } from 'widgets/editProfilePanel';
import { ProfilePanel } from 'widgets/profilePanel';

const Home: FC = () => {
    const [isOpenEditProfilePanel, setIsOpenEditProfilePanel] = useState(false);
    const navigate = useNavigate();
    const [startSoloGameSession, { isLoading: isStartingSoloGame }] =
        useStartSoloGameSessionMutation();

    const handleCloseEditProfilePanel = ({ open }: DialogOpenChangeDetails) => {
        setIsOpenEditProfilePanel(open);
    };

    const openEditProfilePanel = () => {
        setIsOpenEditProfilePanel(true);
    };

    const openAddFriendsPanel = useOpenAddFriendsPanel();
    const openGame = () => {
        void (async () => {
            try {
                const session = await startSoloGameSession().unwrap();

                navigate('/game', {
                    state: {
                        preloadedSession: session,
                    },
                });
            } catch (error) {
                console.error('Failed to start solo game session', error);
                toaster.create({
                    title: 'Не удалось начать игру',
                    description:
                        error instanceof Error
                            ? error.message
                            : 'Unexpected client-side error.',
                    type: 'error',
                });
            }
        })();
    };

    return (
        <>
            <Flex w="full" h="full" bg="gray.100">
                <ProfilePanel
                    openAddFriendsPanel={openAddFriendsPanel}
                    openEditProfilePanel={openEditProfilePanel}
                />
                <EditProfilePanel
                    isOpen={isOpenEditProfilePanel}
                    onOpenChange={handleCloseEditProfilePanel}
                />
            </Flex>

            <ActionBar.Root open>
                <Portal>
                    <ActionBar.Positioner>
                        <ActionBar.Content>
                            <Button variant="subtle" size="sm">
                                <LuSearch />
                                Найти игру
                            </Button>
                            <ActionBar.Separator />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={openGame}
                                loading={isStartingSoloGame}
                            >
                                <LuPlay />
                                Одиночная игра
                            </Button>
                            <ActionBar.Separator />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={openAddFriendsPanel}
                            >
                                <LuShare />
                                Друзья и лобби
                            </Button>
                        </ActionBar.Content>
                    </ActionBar.Positioner>
                </Portal>
            </ActionBar.Root>
        </>
    );
};

export default Home;
