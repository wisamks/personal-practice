import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsPositive } from "class-validator";

export class GetUsersReqDto {
    @Type(() => Number)
    @IsNotEmpty({ message: 'page는 필수값입니다.' })
    @IsInt({ message: 'page는 number입니다.' })
    @IsPositive({ message: 'page는 양수입니다.' })
    page: number;

    @Type(() => Number)
    @IsNotEmpty({ message: 'perPage는 필수값입니다.' })
    @IsInt({ message: 'perPage는 number입니다.' })
    @IsPositive({ message: 'perPage는 양수입니다.' })
    perPage: number;
}