import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserReqDto } from './dto/create-user.req.dto';
import { CreateUserResDto } from './dto/create-user.res.dto';
import { GetUserResDto } from './dto/get-user.res.dto';
import { UpdateUserReqDto } from './dto/update-user.req.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  @HttpCode(200)
  async getUsers(): Promise<GetUserResDto[]> {
    return await this.authService.getUsers();
  }

  @Get('/:userId')
  @HttpCode(200)
  async getUser(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<GetUserResDto> {
    return await this.authService.getUser(userId);
  }

  @Post('/sign-up')
  @HttpCode(201)
  async createUser(
    @Body() createUserReqDto: CreateUserReqDto,
  ): Promise<CreateUserResDto> {
    return await this.authService.createUser(createUserReqDto);
  }

  @Put('/:userId')
  @HttpCode(204)
  async updateUser(
    @Body() updateUserReqDto: UpdateUserReqDto,
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<void> {
    return await this.authService.updateUser({ updateUserReqDto, userId });
  }

  @Delete('/:userId')
  @HttpCode(204)
  async deleteUser(
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return await this.authService.deleteUser(userId);
  }
}
