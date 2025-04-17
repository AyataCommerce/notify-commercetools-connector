import CustomError from './custom.error';

// Error for when the Pub/Sub message is missing data
export class MissingPubSubMessageDataError extends CustomError {
    constructor() {
        super(400, 'Missing or invalid "data" field in the Pub/Sub message.');
    }
}

// Error for when base64 decoding fails
export class Base64DecodingError extends CustomError {
    constructor() {
        super(400, 'Failed to decode base64 data from the Pub/Sub message.');
    }
}

// Error for when JSON parsing fails
export class JsonParsingError extends CustomError {
    constructor() {
        super(400, 'Failed to parse the JSON data from the Pub/Sub message.');
    }
}
