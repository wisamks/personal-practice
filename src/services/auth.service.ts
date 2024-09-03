import { UserModel } from "@_/models/user.model";
import { CreateUserReqDto } from "@_/routes/reqDto/create-user.req.dto";
import { NotFoundException } from "@_/utils/customError.util";
import * as bcrypt from 'bcryptjs';
import { plainToInstance } from "class-transformer";
import { GetUserResDto } from "./resDto/get-user.res.dto";

export class AuthService {
    static async getUsers(): Promise<GetUserResDto[]> {
        const foundUsers = await UserModel.getUsers();
        return foundUsers.map(user => plainToInstance(GetUserResDto, user));
    }

    static async getUser(userId: number = 1): Promise<GetUserResDto> {
        const foundUser = await UserModel.getUser(userId);
        if (!foundUser) {
            throw new NotFoundException('존재하지 않는 유저입니다.');
        }
        return plainToInstance(GetUserResDto, foundUser);
    }

    static async createUser(createUserReqDto: CreateUserReqDto): Promise<number> {
        const hashedPassword = await bcrypt.hash(createUserReqDto.password, 10);
        createUserReqDto.password = hashedPassword;
        return await UserModel.createUser(createUserReqDto);
    }

    static async deleteUser(userId: number): Promise<void> {
        const foundUser = await UserModel.getUser(userId);
        if (!foundUser) {
            throw new NotFoundException('존재하지 않는 유저입니다.');
        }
        await UserModel.deleteUser(userId);
        return;
    }
}