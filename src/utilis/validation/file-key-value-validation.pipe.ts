import {
    ParseFilePipe,
    MaxFileSizeValidator,
    FileTypeValidator,
    UnprocessableEntityException,
} from '@nestjs/common';

interface FileValidationOptions {
    fieldName?: string; // default "file"
    required?: boolean; // default false
    maxSize?: number; // optional (in bytes)
    fileType?: RegExp; // default all
    message?: string | null; // custom messages
}

export class KeyValueFileValidationPipe extends ParseFilePipe {
    constructor(options: FileValidationOptions = {}) {
        const {
            fieldName = 'file', // default field name
            required = false,  // default false
            maxSize, // format 2 * 1024 * 1024 2mb
            fileType, // default all file types and format /.*\.(jpg|jpeg|png|gif)$/
            message = null,
        } = options;

        const validators = [];
        if (maxSize) {
            validators.push(new MaxFileSizeValidator({ maxSize }));
        }
        if (fileType) {
            validators.push(new FileTypeValidator({ fileType }));
        }

        super({
            validators,
            fileIsRequired: required,
            exceptionFactory: (errors) => {
                const formattedErrors: Record<string, string> = {};
                console.log(errors);
                if (message) {
                    formattedErrors[fieldName] = message;
                } else {
                    formattedErrors[fieldName] = errors;
                }
                return new UnprocessableEntityException({
                    message: 'Validation Error',
                    error: 'Unprocessable Entity',
                    statusCode: 422,
                    errors: formattedErrors,
                });
            },
        });
    }
}

// @UploadedFile(
//   new KeyValueFileValidationPipe({
//     fieldName: 'avatar',
//     required: true,
//     maxSize: 1024 * 1024,
//     fileType: /(jpg|png)$/,
//     message: "hh",
//   }),
// ) file: Express.Multer.File

