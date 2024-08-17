import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Logger } from '@nestjs/common';
import cluster from 'node:cluster';
import { isDev, isMainProcess } from './env';
import { ConfigService } from '@nestjs/config';
import type { ConfigKeyPaths } from './config';
import { RedisIoAdapter } from './common/adapters/socket.adapter';

declare const module: any;

async function bootstrap() {

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    {
      abortOnError: false, //不是必要的，创建失败是不是抛出错误代码，而是直接抛出错误
      bufferLogs: true, // 启用了日志缓冲功能。当设置为 true 时，日志信息会被暂时存储在一个缓冲区中，而不是立即写入到日志文件或输出到控制台。
      snapshot: true, // 启用了快照功能。当设置为 true 时，系统会在某个特定的时间点创建当前状态的快照。快照可以用于多种用途，例如调试、回滚、或是数据恢复。
      // forceCloseConnections: true, // 强制关闭所有的连接
    }
  );

  const configService = app.get(ConfigService<ConfigKeyPaths>);

  const { port, globalPrefix } = configService.get('app', { infer: true });

  // 更换日志输出器 为 nest-winston
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  // 允许跨域
  app.enableCors({ origin: '*', credentials: true });
  // app.setGlobalPrefix(globalPrefix);

  // 生产环境启用应用程序的关闭钩子
  !isDev && app.enableShutdownHooks();
  // Swagger
  const options = new DocumentBuilder()
    .setTitle('BIZ SAAS API')
    .setDescription('The Biz Saas API description')
    .setVersion('1.0')
    .addTag('BIZ SAAS')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);

  // redis
  app.useWebSocketAdapter(new RedisIoAdapter(app))

  await app.listen(port, '0.0.0.0', async () => {

    // 控制台的日志输出依然是nestjs内置的 Logger
    const logger = new Logger('NestApplication');
    const url = await app.getUrl();
    const { pid } = process;
    const env = cluster.isPrimary;
    const prefix = env ? 'P' : 'W';

    if (!isMainProcess)
      return;

    logger.log(`[${prefix + pid}] Master Server running on: ${url}`)

    if (isDev)
      logger.log(`[${prefix + pid}] OpenAPI: ${url}/api-docs`)
  });

  if (module.hot) {
    module.hot.accept()
    module.hot.dispose(() => app.close())
  };
}
bootstrap();
