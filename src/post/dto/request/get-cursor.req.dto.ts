import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsOptional, IsPositive } from "class-validator";

export class GetCursorReqDto {
    @Type(() => Number)
    @IsOptional()
    @IsPositive({ message: 'cursor는 양수입니다.' })
    @IsInt({ message: 'cursor는 정수입니다.' })
    readonly cursor?: number;

    @Type(() => Number)
    @IsNotEmpty({ message: 'take는 필수값입니다.' })
    @IsPositive({ message: 'take는 양수입니다.' })
    @IsInt({ message: 'take는 정수입니다.' })
    readonly take: number;
}