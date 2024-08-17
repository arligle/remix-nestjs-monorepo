import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
} from 'nest-winston';
import * as winston from 'winston';
import config from './config';
import { DrizzlePGModule } from '@ifc-drizzle/node-postgres';
import * as schema from '@ifc-drizzle/biz-saas-db-schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      // 指定多个 env 文件时，第一个优先级最高
      envFilePath: ['.env.local', `.env.${process.env.NODE_ENV}`, '.env'],
      load: [...Object.values(config)],
    }),

    WinstonModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        transports: [
          // 以文件的方式输出日志，日志文件路径为配置文件中的 LOG_PATH
          // 一般用在生产环境
          new winston.transports.File({
            filename: `${process.cwd()}/${configService.get('LOG_PATH')}`,
          }),
          // 以控制台的方式输出日志,一般用在开发环境
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.ms(),
              nestWinstonModuleUtilities.format.nestLike('BIZ SAAS',
                {
                  colors: true,
                  prettyPrint: true,
                  processId: true,
                  appName: true,
                }),
            ),
          }),
        ],
      }),
      inject: [ConfigService],
    }),

    DrizzlePGModule.registerAsync({
      tag: 'DB_DEV',
      useFactory() {
        return {
          pg: {
            connection: 'client',
            config: {
              connectionString: process.env.DATABASE_URL,
            },
          },
          config: { schema: { ...schema } },
        };
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
