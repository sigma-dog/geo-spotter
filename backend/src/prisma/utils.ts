import { ConfigService } from '@nestjs/config';

export const getDBConnectionString = (config: ConfigService) => {
    const bdUser = config.get<string>('POSTGRES_USER');
    const bdPassword = config.get<string>('POSTGRES_PASSWORD');
    const bdHost = config.get<string>('POSTGRES_HOST');
    const bdPort = config.get<string>('POSTGRES_PORT');
    const bdName = config.get<string>('POSTGRES_DATABASE');

    return `postgresql://${bdUser}:${bdPassword}@${bdHost}:${bdPort}/${bdName}?schema=public`;
};
