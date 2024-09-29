import { isFileExtensionIn } from "@_/s3-file/decorators/is-file-extension-in.decorator";
import { IsNotEmpty, IsString } from "class-validator";

export class GetPresignedUrlReqDto {
    @IsNotEmpty({ message: 'fileName은 필수값입니다.' })
    @IsString({ message: 'fileName은 string입니다.'})
    @isFileExtensionIn(['.jpg', '.jpeg', 'png'], { message: '파일 확장자는 jpg, jpeg, png 중 하나입니다.'})
    readonly fileName: string;
}