import { Controller, Get, NotFoundException, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.types';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiCookieAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  /** The protected endpoint: the signed-in user's profile. */
  @Get('me')
  @ApiOkResponse({ type: UserResponseDto })
  @ApiUnauthorizedResponse({ description: 'No valid session cookie' })
  async me(@CurrentUser() auth: JwtPayload): Promise<UserResponseDto> {
    const user = await this.users.findById(auth.sub);
    if (!user) throw new NotFoundException('User not found');
    return UserResponseDto.from(user);
  }
}
