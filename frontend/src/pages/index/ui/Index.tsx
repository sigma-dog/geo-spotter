import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Spinner } from '@chakra-ui/react';

import { getUserInfo } from 'shared/lib';

const Index = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const user = getUserInfo();

        if (!user) {
            navigate('/auth');
            return;
        }

        navigate('/home');
    }, []);

    return (
        <div className="flex w-full h-full bg">
            <Spinner />
        </div>
    );
};

export default Index;
