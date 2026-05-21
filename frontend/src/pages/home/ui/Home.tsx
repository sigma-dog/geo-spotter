import { type FC, useState } from 'react';
import { LuSearch, LuShare } from 'react-icons/lu';
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

import { Map } from './Map';

const Home: FC = () => {
    const [isOpenEditProfilePanel, setIsOpenEditProfilePanel] = useState(false);

    const handleCloseEditProfilePanel = ({ open }: DialogOpenChangeDetails) => {
        setIsOpenEditProfilePanel(open);
    };

    const openEditProfilePanel = () => {
        setIsOpenEditProfilePanel(true);
    };

    const openAddFriendsPanel = useOpenAddFriendsPanel();

    return (
        <>
            <Flex w="full" h="full">
                <Map />
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
                            <Button variant="outline" size="sm">
                                <LuShare />
                                Одиночная игра
                            </Button>
                        </ActionBar.Content>
                    </ActionBar.Positioner>
                </Portal>
            </ActionBar.Root>
        </>
    );
};

export default Home;
