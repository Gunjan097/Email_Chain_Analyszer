// backend/src/emails/emails.controller.ts
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ImapService } from './imap.service';

@Controller('emails')
export class EmailsController {
  constructor(private readonly imapService: ImapService) {}

  @Get()
  async latest(@Query('limit') limit = '20') {
    const n = Number(limit) || 20;
    return this.imapService.getLatest(n);
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
