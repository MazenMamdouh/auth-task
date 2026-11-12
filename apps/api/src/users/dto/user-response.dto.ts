import { ApiProperty } from '@nestjs/swagger';
import { UserDocument } from '../schemas/user.schema';

/** The only user shape that ever leaves the API - no hash, no internal fields. */
export class UserResponseDto {
  @ApiProperty({ example: '6734f1c2a9e4b2d1c0f1e2a3' })
  id: string;

  @ApiProperty({ example: 'jane@example.com' })
  email: string;

  @ApiProperty({ example: 'Jane Doe' })
  name: string;

  @ApiProperty()
  createdAt: Date;

  static from(user: UserDocument): UserResponseDto {
    return { id: user.id as string, email: user.email, name: user.name, createdAt: user.createdAt };
  }
}
