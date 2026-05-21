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

import { useOpenAddFriendsPanel } from 'widgets/addFriendsPanel';
import { EditProfilePanel } from 'widgets/editProfilePanel';
import { ProfilePanel } from 'widgets/profilePanel';

const Home: FC = () => {
    const [isOpenEditProfilePanel, setIsOpenEditProfilePanel] = useState(false);
    const navigate = useNavigate();

    const handleCloseEditProfilePanel = ({ open }: DialogOpenChangeDetails) => {
        setIsOpenEditProfilePanel(open);
    };

    const openEditProfilePanel = () => {
        setIsOpenEditProfilePanel(true);
    };

    const openAddFriendsPanel = useOpenAddFriendsPanel();
    const openGame = () => {
        navigate('/game');
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
                            >
                                <LuPlay />
                                Начать игру
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
