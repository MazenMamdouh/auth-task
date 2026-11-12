import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

const DUPLICATE_KEY = 11000;

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly users: Model<User>) {}

  async create(data: { email: string; name: string; passwordHash: string }): Promise<UserDocument> {
    try {
      return await this.users.create(data);
    } catch (err) {
      // The unique index is the source of truth - a pre-check alone would race.
      if ((err as { code?: number }).code === DUPLICATE_KEY) {
        throw new ConflictException('An account with this email already exists');
      }
      throw err;
    }
  }

  findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.users.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash').exec();
  }

  findById(id: string): Promise<UserDocument | null> {
    if (!isValidObjectId(id)) return Promise.resolve(null);
    return this.users.findById(id).exec();
  }
}
