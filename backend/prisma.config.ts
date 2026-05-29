import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: `postgresql://${env('POSTGRES_USER')}:${env('POSTGRES_PASSWORD')}@${env('POSTGRES_HOST')}:${env('POSTGRES_PORT')}/${env('POSTGRES_DATABASE')}?schema=public`,
  },
});
