import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsPositive } from 'class-validator';

export class GetPostsReqDto {
  @Type(() => Number)
  @IsNotEmpty({ message: 'skip은 필수값입니다.' })
  @IsInt({ message: 'skip은 정수입니다.' })
  @IsPositive({ message: 'skip은 양수입니다.' })
  readonly skip: number;

  @Type(() => Number)
  @IsNotEmpty({ message: 'take는 필수값입니다.' })
  @IsInt({ message: 'take는 정수입니다.' })
  @IsPositive({ message: 'take는 양수입니다.' })
  readonly take: number;
}
