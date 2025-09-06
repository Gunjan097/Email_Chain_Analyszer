// backend/src/emails/email.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Email {
  @Prop({ required: true })
  subject: string;

  @Prop()
  from: string;

  @Prop()
  to: string;

  @Prop()
  date: Date;

  @Prop()
  text: string;

  // Normalized receiving chain: array of server/domain names (strings)
  @Prop([String])
  receivingChain: string[];

  // Detected ESP name or domain
  @Prop()
  esp: string;

  // IMAP UID if available
  @Prop()
  uid: number;
}

export type EmailDocument = Email & Document;
export const EmailSchema = SchemaFactory.createForClass(Email);
