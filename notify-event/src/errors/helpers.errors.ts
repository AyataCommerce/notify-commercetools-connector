import CustomError from './custom.error';

// Error for invalid placeholders in the template
export class InvalidPlaceholder extends CustomError {
    constructor(placeholder: string) {
        super(400, `Invalid placeholder: ${placeholder}`);
    }
}


// General error for unexpected issues
export class GeneralError extends CustomError {
    constructor(message: string) {
        super(500, message);
    }
}
