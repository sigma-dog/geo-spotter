import { useEffect, useState } from 'react';
import { Box, Center, Flex, Image, Text } from '@chakra-ui/react';
import logo from 'assets/logo.svg';
import background from 'assets/register-bg-light.webp';

import { Login } from './Login';
import { Register } from './Register';

type Mode = 'register' | 'login';

const Auth = () => {
    const [mode, setMode] = useState<Mode>('login');
    const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

    const toggleMode = () => {
        mode === 'register' ? setMode('login') : setMode('register');
    };

    useEffect(() => {
        const handleMove = (e: MouseEvent) => {
            const nx = e.clientX / window.innerWidth - 0.5;
            const ny = e.clientY / window.innerHeight - 0.5;

            const rx = ny * -8;
            const ry = nx * 8;

            setTilt({ rx, ry });
        };

        window.addEventListener('mousemove', handleMove);
        return () => window.removeEventListener('mousemove', handleMove);
    }, []);

    return (
        <>
            <Box
                position="fixed"
                top={0}
                left={0}
                w="100vw"
                h="100vh"
                style={{ perspective: '1700px' }}
                zIndex={-1}
            >
                <Box
                    w="110vw"
                    h="110vh"
                    backgroundImage={`url('${background}')`}
                    backgroundSize="cover"
                    backgroundPosition="center"
                    filter="blur(4px) brightness(.9) "
                    transform={`rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale(1.1)`}
                    transition="transform 0.08s ease-out"
                />
            </Box>

            <Center w="full" h="full">
                <Flex
                    w={480}
                    backgroundColor="bg.panel"
                    padding={10}
                    direction="column"
                    alignItems="center"
                    gap={10}
                    borderRadius="lg"
                >
                    {/* <Heading size="4xl">GeoSpotter</Heading> */}
                    <Image src={logo} h="10" />
                    {mode === 'login' ? <Login /> : <Register />}
                    <Flex gap={1} w="full" justifyContent="space-between">
                        <Text>Впервые у нас?</Text>
                        <Text
                            color="teal.700"
                            onClick={toggleMode}
                            cursor="pointer"
                        >
                            {mode === 'login' ? 'Регистрация' : 'Войти'}
                        </Text>
                    </Flex>
                </Flex>
            </Center>

            <style>{`
                @keyframes moveBg {
                    0% { transform: scale(1.1) translate(0, 0); }
                    50% { transform: scale(1.15) translate(-20px, -20px); }
                    100% { transform: scale(1.1) translate(0, 0); }
                }
            `}</style>
        </>
    );
};

export default Auth;
