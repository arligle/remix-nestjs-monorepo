import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
} from 'nest-winston';
import * as winston from 'winston';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
