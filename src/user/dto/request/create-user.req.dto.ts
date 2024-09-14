import { ProviderType } from "@_/auth/types/oauth-user.output.interface";
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateUserReqDto {
    @IsNotEmpty({ message: 'email은 필수값입니다.' })
    @IsEmail({}, { message: '이메일 형식에 맞지 않습니다.' })
    readonly email: string;

    @IsNotEmpty({ message: 'password는 필수값입니다.' })
    @IsString({ message: 'password는 string입니다.' })
    @MinLength(4, { message: 'password는 4글자 이상입니다.' })
    @MaxLength(20, { message: 'password는 20글자 이하입니다.' })
    password: string;

    @IsNotEmpty({ message: 'name은 필수값입니다.' })
    @IsString({ message: 'name은 string입니다.' })
    @MaxLength(30, { message: 'name은 30글자 이하입니다.'})
    readonly name: string;

    @IsOptional()
    readonly provider: ProviderType;

    @IsOptional()
    readonly providerId: string;
}