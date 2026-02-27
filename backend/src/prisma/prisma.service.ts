import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'generated/prisma/client';
import { getDBConnectionString } from './utils';

@Injectable()
export class PrismaService extends PrismaClient {
    constructor(config: ConfigService) {
        const adapter = new PrismaPg({
            connectionString: getDBConnectionString(config),
        });
        super({ adapter });
    }
}
