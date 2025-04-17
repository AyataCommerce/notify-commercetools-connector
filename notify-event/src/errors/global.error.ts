import CustomError from "./custom.error";

type ErrorBody = {
    statusCode?: number;
    message?: string;
    [key: string]: any;
};

export class GlobalError extends CustomError {
    body: ErrorBody;

    /**
     * Create a GlobalError that handles both custom errors and API/external errors
     * @param statusCodeOrError - Either a status code number/string OR an error object from catch blocks
     * @param message - Error message (optional if first param is an error object)
     */
    constructor(statusCodeOrError: number | string | any, message?: string) {
        // If the first argument is an error object
        if (typeof statusCodeOrError === 'object' && statusCodeOrError !== null) {
            const error = statusCodeOrError;

            // Initialize with defaults that will be overridden if needed
            const statusCode = error.body?.statusCode || error.statusCode || 500;
            const errorMessage = error.body?.message || error.message || 'An error occurred';

            super(statusCode, errorMessage);

            // Store original error body or create one
            this.body = error.body || {
                statusCode,
                message: errorMessage
            };
        }
        // If traditional status code and message are provided
        else {
            const statusCode = statusCodeOrError;
            const errorMessage = message || 'An error occurred';

            super(statusCode, errorMessage);

            this.body = {
                statusCode: Number(statusCode) || 500,
                message: errorMessage
            };
        }

        // Ensure proper prototype chain for instanceof checks
        Object.setPrototypeOf(this, GlobalError.prototype);
    }

    /**
     * Get response-ready error object
     */
    getResponseBody(): ErrorBody {
        return this.body;
    }

    /**
     * Get HTTP status code to use for response
     */
    getStatusCode(): number {
        return Number(this.body.statusCode) || 500;
    }

    /**
     * Static helper to create error from any caught exception
     */
    static fromCatch(error: any): GlobalError {
        return new GlobalError(error);
    }
}

export default GlobalError;