import { Controller, Get, Logger, Request, Response } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
// biome-ignore lint/style/useImportType: <explanation>
import { AppService } from './app.service';
import { ApiTags } from '@nestjs/swagger';

@Controller()
export class AppController {
  private logger = new Logger();
  constructor(private readonly appService: AppService) { }

  @Get()
  @ApiTags('getHello')
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('books')
  @ApiTags('getBooks')
  getBooks(): Promise<{ books: any[] }> {
    return this.appService.getBooks();
  }
  /**
   * @description
   * 注意:一旦用 @Response 注入了响应对象，就不能通过 return 的方式来返回响应内容了，
   * 需要手动调用 res.send。
   * 这点用 express 时也是一样。
   * @date 2024/08/17
   * @param {FastifyRequest} request
   * @param {FastifyReply} reply
   * @memberof AppController
   */
  @Get('master')
  @ApiTags('getMaster')
  getMaster(@Request() request: FastifyRequest, @Response() reply: FastifyReply) {
    reply.header('url', request.url)
    reply.type('text/html').code(200);
    reply.send('<h1>Hello BIZ SAAS!</h1>');
  }

  @Get('loger')
  @ApiTags('getLoger')
  getLoger(): string {
    this.logger.log('Calling getLoger()', AppController.name);
    this.logger.debug('Calling getLoger()', AppController.name);
    this.logger.verbose('Calling getLoger()', AppController.name);
    this.logger.warn('Calling getLoger()', AppController.name);
    try {
      throw new Error()
    } catch (e) {
      this.logger.error('Calling getLoger()', e.stack, AppController.name);
    }

    return this.appService.getHello();
  }
}
