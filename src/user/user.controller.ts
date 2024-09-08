import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserReqDto } from './dto/request/update-user.req.dto';
import { CreateUserResDto } from './dto/response/create-user.res.dto';
import { CreateUserReqDto } from './dto/request/create-user.req.dto';
import { GetUserResDto } from './dto/response/get-user.res.dto';
import { ReqUser } from './decorators/req-user.decorator';
import { JwtAuthGuard } from '@_/auth/guards/auth-jwt.guard';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getUsers(): Promise<GetUserResDto[]> {
    return await this.userService.getUsers();
  }

  @Get('/:userId')
  @HttpCode(HttpStatus.OK)
  async getUser(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<GetUserResDto> {
    return await this.userService.getUser(userId);
  }

  @Post('/sign-up')
  @HttpCode(HttpStatus.CREATED)
  async createUser(
    @Body() createUserReqDto: CreateUserReqDto,
  ): Promise<CreateUserResDto> {
    return await this.userService.createUser(createUserReqDto);
  }

  @Put()
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async updateUser(
    @Body() updateUserReqDto: UpdateUserReqDto,
    @ReqUser('userId', ParseIntPipe) userId: number,
  ): Promise<void> {
    return await this.userService.updateUser({ updateUserReqDto, userId });
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async deleteUser(
    @ReqUser('userId', ParseIntPipe) userId: number,
  ): Promise<void> {
    return await this.userService.deleteUser(userId);
  }
}
