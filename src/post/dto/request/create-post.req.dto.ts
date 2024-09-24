import { IsArray, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreatePostReqDto {
  @IsNotEmpty({ message: 'title은 필수값입니다.' })
  @IsString({ message: 'title은 string입니다.' })
  @MaxLength(50, { message: 'title은 50글자 이하입니다.' })
  readonly title: string;

  @IsNotEmpty({ message: 'content는 필수값입니다.' })
  @IsString({ message: 'content는 string입니다.' })
  readonly content: string;

  @IsArray({ message: 'tags는 배열입니다.' })
  @IsString({ each: true, message: 'tags의 요소는 string입니다.' })
  readonly tags?: string[];
}
