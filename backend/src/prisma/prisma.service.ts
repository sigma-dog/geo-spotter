import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { getDBConnectionString } from './utils';
import { PrismaClient } from '../../generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
    constructor(config: ConfigService) {
        const adapter = new PrismaPg({
            connectionString: getDBConnectionString(config),
        });
        super({ adapter });
    }
}
