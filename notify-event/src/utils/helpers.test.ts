

import { JsonParsingError, MissingPubSubMessageDataError } from '../errors/pubsub.error';
import { decodePubSubData, parsePlaceholder, jsonToBase64 } from './helpers.utils';

jest.mock('./logger.utils', () => ({
    logger: {
        error: jest.fn(),
    },
}));

describe('decodePubSubData', () => {
    it('should decode and parse valid base64 data', () => {
        const obj = { message: 'Hello' };
        const data = Buffer.from(JSON.stringify(obj)).toString('base64');
        const result = decodePubSubData({ data });
        expect(result).toEqual(obj);
    });

    it('should throw MissingPubSubMessageDataError if data is missing', () => {
        expect(() => decodePubSubData({} as any)).toThrow(MissingPubSubMessageDataError);
    });

    it('should throw JsonParsingError for invalid JSON', () => {
        const invalidJson = Buffer.from('not-json').toString('base64');
        expect(() => decodePubSubData({ data: invalidJson })).toThrow(JsonParsingError);
    });

    it('should throw JsonParsingError for bad base64', () => {
        const badBase64 = '###invalid_base64';
        expect(() => decodePubSubData({ data: badBase64 })).toThrow(JsonParsingError);
    });
});

describe('parsePlaceholder', () => {
    it('should replace placeholders with values from object', () => {
        const data = { user: { name: 'John' } };
        const result = parsePlaceholder(data, 'Hello {{ user.name }}');
        expect(result).toBe('Hello John');
    });

    it('should handle missing fields gracefully', () => {
        const data = { user: {} };
        const result = parsePlaceholder(data, 'Hi {{ user.age }}');
        expect(result).toBe('Hi ');
    });

});

describe('jsonToBase64', () => {
    it('should convert JSON object to base64 string', () => {
        const obj = { a: 1 };
        const base64 = jsonToBase64(obj);
        const decoded = JSON.parse(Buffer.from(base64, 'base64').toString());
        expect(decoded).toEqual(obj);
    });
});
