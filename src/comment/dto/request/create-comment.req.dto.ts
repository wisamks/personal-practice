import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCommentReqDto {
  @IsNotEmpty({ message: 'content는 필수값입니다.' })
  @IsString({ message: 'content는 string입니다.' })
  readonly content: string;
}
