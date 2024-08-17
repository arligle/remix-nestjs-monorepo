import { Inject, Injectable } from '@nestjs/common';
import type * as schema from '@ifc-drizzle/biz-saas-db-schema';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

@Injectable()
export class AppService {
  constructor(
    @Inject("DB_DEV") private drizzle: NodePgDatabase<typeof schema>,
  ) { }

  getHello(): string {
    return "Hello Master!";
  }

  async getBooks() {
    const books = await this.drizzle.query.books.findMany();
    return {
      books: books,
    };
  }
}
