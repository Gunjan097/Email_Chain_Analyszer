import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Email, EmailDocument } from './email.schema';

@Injectable()
export class EmailsService {
  constructor(
    @InjectModel(Email.name) private emailModel: Model<EmailDocument>,
  ) {}

  async findAll(): Promise<Email[]> {
    return this.emailModel.find().sort({ createdAt: -1 }).exec();
  }

  async findById(id: string): Promise<Email> {
    const email = await this.emailModel.findById(id).exec();
    if (!email) {
      throw new NotFoundException(`Email with id ${id} not found`);
    }
    return email;
  }
}
