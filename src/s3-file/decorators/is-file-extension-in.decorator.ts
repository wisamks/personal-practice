import { registerDecorator, ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";
import * as path from "path";

@ValidatorConstraint({ async: false })
export class IsFileExtensionInConstraint implements ValidatorConstraintInterface {
    validate(value: any, validationArguments?: ValidationArguments): boolean {
        const allowedExtensions = validationArguments.constraints;
        const fileExtension = path.extname(value).toLowerCase();
        return allowedExtensions.includes(fileExtension);
    }

    defaultMessage(validationArguments?: ValidationArguments): string {
        const allowedExtensions = validationArguments.constraints.join(', ');
        return `허용되지 않은 파일 확장자입니다. [허용 확장자: ${allowedExtensions}]`
    }
}

export const isFileExtensionIn = (
    allowedExtensions: string[],
    validationOptions: ValidationOptions,
) => (object: Object, propertyName: string) => registerDecorator({
    target: object.constructor,
    propertyName,
    options: validationOptions,
    constraints: allowedExtensions,
    validator: IsFileExtensionInConstraint,
});