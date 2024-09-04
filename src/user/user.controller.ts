import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserReqDto } from './dto/update-user.req.dto';
import { CreateUserResDto } from './dto/create-user.res.dto';
import { CreateUserReqDto } from './dto/create-user.req.dto';
import { GetUserResDto } from './dto/get-user.res.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @HttpCode(200)
  async getUsers(): Promise<GetUserResDto[]> {
    return await this.userService.getUsers();
  }

  @Get('/:userId')
  @HttpCode(200)
  async getUser(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<GetUserResDto> {
    return await this.userService.getUser(userId);
  }

  @Post('/sign-up')
  @HttpCode(201)
  async createUser(
    @Body() createUserReqDto: CreateUserReqDto,
  ): Promise<CreateUserResDto> {
    return await this.userService.createUser(createUserReqDto);
  }

  @Put('/:userId')
  @HttpCode(204)
  async updateUser(
    @Body() updateUserReqDto: UpdateUserReqDto,
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<void> {
    return await this.userService.updateUser({ updateUserReqDto, userId });
  }

  @Delete('/:userId')
  @HttpCode(204)
  async deleteUser(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<void> {
    return await this.userService.deleteUser(userId);
  }
}
