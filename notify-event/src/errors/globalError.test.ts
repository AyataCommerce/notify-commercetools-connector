
import CustomError from './custom.error';
import GlobalError from './global.error';

describe('GlobalError', () => {
    // Test constructor with status code and message
    describe('constructor with status code and message', () => {
        it('should create error with numeric status code and message', () => {
            const statusCode = 404;
            const message = 'Not found';
            const error = new GlobalError(statusCode, message);

            expect(error).toBeInstanceOf(GlobalError);
            expect(error).toBeInstanceOf(CustomError);
            expect(error.getStatusCode()).toBe(statusCode);
            expect(error.message).toBe(message);
            expect(error.body).toEqual({
                statusCode,
                message
            });
        });

        it('should create error with string status code', () => {
            const statusCode = '400';
            const message = 'Bad request';
            const error = new GlobalError(statusCode, message);

            expect(error.getStatusCode()).toBe(400);
            expect(error.body.statusCode).toBe(400);
        });

        it('should use default message when not provided', () => {
            const error = new GlobalError(500);
            expect(error.message).toBe('An error occurred');
            expect(error.body.message).toBe('An error occurred');
        });
    });

    // Test constructor with error object
    describe('constructor with error object', () => {
        it('should handle Error objects', () => {
            const originalError = new Error('Original error');
            const error = new GlobalError(originalError);

            expect(error.getStatusCode()).toBe(500);
            expect(error.message).toBe('Original error');
            expect(error.body).toEqual({
                statusCode: 500,
                message: 'Original error'
            });
        });

        it('should handle CustomError objects', () => {
            const originalError = new CustomError(403, 'Forbidden');
            const error = new GlobalError(originalError);

            expect(error.getStatusCode()).toBe(403);
            expect(error.message).toBe('Forbidden');
            expect(error.body).toEqual({
                statusCode: 403,
                message: 'Forbidden'
            });
        });

        // it('should handle objects with body property', () => {
        //     const errorBody: ErrorBody = {
        //         statusCode: 422,
        //         message: 'Validation failed',
        //         errors: ['Invalid email', 'Missing name']
        //     };
        //     const originalError = { body: errorBody };
        //     const error = new GlobalError(originalError);

        //     expect(error.getStatusCode()).toBe(422);
        //     expect(error.message).toBe('Validation failed');
        //     expect(error.body).toEqual(errorBody);
        // });

        it('should handle objects with statusCode property', () => {
            const originalError = {
                statusCode: 401,
                message: 'Unauthorized'
            };
            const error = new GlobalError(originalError);

            expect(error.getStatusCode()).toBe(401);
            expect(error.message).toBe('Unauthorized');
            expect(error.body).toEqual({
                statusCode: 401,
                message: 'Unauthorized'
            });
        });

        it('should handle objects with both statusCode and body', () => {
            const originalError = {
                statusCode: 400,
                body: {
                    statusCode: 409,
                    message: 'Conflict'
                }
            };
            const error = new GlobalError(originalError);

            // Should prioritize body.statusCode over statusCode
            expect(error.getStatusCode()).toBe(409);
            expect(error.message).toBe('Conflict');
        });

        it('should handle non-error objects', () => {
            const originalError = { custom: 'error' };
            const error = new GlobalError(originalError);

            expect(error.getStatusCode()).toBe(500);
            expect(error.message).toBe('An error occurred');
            expect(error.body).toEqual({
                statusCode: 500,
                message: 'An error occurred'
            });
        });

        it('should handle null/undefined input', () => {
            const error1 = new GlobalError(null);
            expect(error1.getStatusCode()).toBe(500);
            expect(error1.message).toBe('An error occurred');

            const error2 = new GlobalError(undefined);
            expect(error2.getStatusCode()).toBe(500);
            expect(error2.message).toBe('An error occurred');
        });
    });

    // Test getResponseBody method
    describe('getResponseBody', () => {
        it('should return the error body', () => {
            const error = new GlobalError(404, 'Not found');
            expect(error.getResponseBody()).toEqual({
                statusCode: 404,
                message: 'Not found'
            });
        });

        it('should return extended body properties', () => {
            const originalError = {
                body: {
                    statusCode: 400,
                    message: 'Bad request',
                    details: ['Invalid input']
                }
            };
            const error = new GlobalError(originalError);
            expect(error.getResponseBody()).toEqual({
                statusCode: 400,
                message: 'Bad request',
                details: ['Invalid input']
            });
        });
    });

    // Test getStatusCode method
    describe('getStatusCode', () => {
        it('should return numeric status code', () => {
            const error1 = new GlobalError(200, 'OK');
            expect(error1.getStatusCode()).toBe(200);

            const error2 = new GlobalError('404', 'Not found');
            expect(error2.getStatusCode()).toBe(404);
        });

        it('should return 500 for invalid status codes', () => {
            const error1 = new GlobalError('invalid', 'Error');
            expect(error1.getStatusCode()).toBe(500);

            const error2 = new GlobalError({});
            expect(error2.getStatusCode()).toBe(500);
        });
    });

    // Test static fromCatch method
    describe('fromCatch', () => {
        it('should create GlobalError from caught exception', () => {
            const originalError = new Error('Test error');
            const error = GlobalError.fromCatch(originalError);

            expect(error).toBeInstanceOf(GlobalError);
            expect(error.message).toBe('Test error');
            expect(error.getStatusCode()).toBe(500);
        });

        it('should preserve status code from CustomError', () => {
            const originalError = new CustomError(403, 'Forbidden');
            const error = GlobalError.fromCatch(originalError);

            expect(error.getStatusCode()).toBe(403);
        });
    });

    // Test prototype chain
    it('should maintain proper prototype chain', () => {
        const error = new GlobalError(500, 'Test');
        expect(error instanceof GlobalError).toBe(true);
        expect(error instanceof CustomError).toBe(true);
        expect(error instanceof Error).toBe(true);
    });
});