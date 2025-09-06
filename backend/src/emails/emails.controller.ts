// backend/src/emails/emails.controller.ts
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ImapService } from './imap.service';

@Controller('emails')
export class EmailsController {
  constructor(private readonly imapService: ImapService) {}

  // GET /api/emails?limit=20&page=1&esp=Gmail%20/%20Google
  @Get()
  async latest(
    @Query('limit') limit = '20',
    @Query('page') page = '1',
    @Query('esp') esp?: string,
  ) {
    const n = Math.max(1, Number(limit) || 20);
    const p = Math.max(1, Number(page) || 1);
    return this.imapService.getLatest(n, p, esp);
  }

  @Get('test-config')
  testConfig() {
    return this.imapService.getTestConfig();
  }

  @Get(':id')
  async byId(@Param('id') id: string) {
    return this.imapService.getById(id);
  }
}
