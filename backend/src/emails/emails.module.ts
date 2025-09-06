// backend/src/emails/emails.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ImapService } from './imap.service';
import { EmailsController } from './emails.controller';
import { Email, EmailSchema } from './email.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Email.name, schema: EmailSchema }])],
  providers: [ImapService],
  controllers: [EmailsController],
  exports: [ImapService],
})
export class EmailsModule {}
