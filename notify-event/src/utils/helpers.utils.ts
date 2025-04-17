import GlobalError from '../errors/global.error';
import { Base64DecodingError, JsonParsingError, MissingPubSubMessageDataError } from '../errors/pubsub.error';
import { PubSubEncodedMessage, PubsubMessageBody } from '../interface/pubsub.interface';
import { logger } from './logger.utils';

// Helper function to decode base64 and parse JSON
const decodeAndParseData = (data: string): PubsubMessageBody => {
    try {
        // Decode base64 and parse JSON in a single block
        const decodedData = Buffer.from(data, 'base64').toString().trim();
        const parsedData = JSON.parse(decodedData);

        return parsedData;
    } catch (error) {
        // Check if it's a decoding or parsing error
        if (error instanceof SyntaxError) {
            logger.error('Failed to parse JSON:', { error });
            throw new JsonParsingError();
        } else {
            logger.error('Failed to decode base64 data', { error });
            throw new Base64DecodingError();
        }
    }
};

// Process the event data
export const decodePubSubData = (pubSubMessage: PubSubEncodedMessage): PubsubMessageBody => {
    // Check if the message has data to decode
    if (!pubSubMessage.data) {
        logger.error('Missing data field in the Pub/Sub message');
        throw new MissingPubSubMessageDataError();
    }

    // Decode and parse the data
    return decodeAndParseData(pubSubMessage.data);
};


// generate random key
export const generateRandomKey = (): string => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const length = 32;

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomIndex);
    }
    return result;
};


export const parsePlaceholder = (data: object, template: string): string => {
    try {
        const placeholderRegex = /\{\{([^{}]+?)\}\}/g;
        const pathCache = new Map<string, { segments: string[], wildcards: (boolean | number)[] }>();

        return template.replace(placeholderRegex, (_, path) => {
            try {
                const values = extractValues(data, path.trim(), pathCache);
                return values.length > 0 ? String(values[0]) : '';
            } catch (error) {
                throw new GlobalError({
                    statusCode: 400,
                    message: `Failed to parse placeholder '${path}'`,
                    details: error instanceof Error ? error.message : String(error)
                });
            }
        });
    } catch (error) {
        throw GlobalError.fromCatch(error);
    }
};

const parsePath = (pathString: string): { segments: string[], wildcards: (boolean | number)[] } => {
    const segments: string[] = [];
    const wildcards: (boolean | number)[] = [];
    let currentPos = 0;

    while (currentPos < pathString.length) {
        const dotPos = pathString.indexOf('.', currentPos);
        const segmentEnd = dotPos === -1 ? pathString.length : dotPos;
        const segment = pathString.slice(currentPos, segmentEnd);

        const arrayMatch = segment.match(/^([^[]+)(?:\[(\*|\d+)\])?$/);
        if (!arrayMatch) {
            segments.push(segment);
            wildcards.push(false);
        } else {
            segments.push(arrayMatch[1]);
            wildcards.push(
                arrayMatch[2]
                    ? arrayMatch[2] === '*'
                        ? true
                        : parseInt(arrayMatch[2], 10)
                    : false
            );
        }

        currentPos = segmentEnd + 1;
    }

    return { segments, wildcards };
};

const extractValues = (
    obj: object,
    pathString: string,
    pathCache: Map<string, { segments: string[], wildcards: (boolean | number)[] }>
): any[] => {
    const cached = pathCache.get(pathString) || parsePath(pathString);
    if (!pathCache.has(pathString)) {
        pathCache.set(pathString, cached);
    }

    const { segments, wildcards } = cached;
    let current: any[] = [obj];

    for (let i = 0; i < segments.length && current.length > 0; i++) {
        current = processSegment(current, segments[i], wildcards[i]);
    }

    return current.filter(val => val !== undefined && val !== null);
};

const processSegment = (items: any[], segment: string, wildcard: boolean | number): any[] => {
    return items.flatMap(item => {
        if (item === null || typeof item !== 'object') return [];

        const value = item[segment];
        if (value === undefined) return [];

        if (wildcard === true) {
            return Array.isArray(value) ? value : [];
        }
        if (typeof wildcard === 'number') {
            return Array.isArray(value) && value[wildcard] !== undefined ? [value[wildcard]] : [];
        }
        return [value];
    });
};


export function jsonToBase64(json: object): string {
    const jsonString = JSON.stringify(json);
    const base64 = Buffer.from(jsonString).toString('base64');
    return base64;
}


export async function decryptString(encryptedBase64: string, secretKey: string): Promise<string> {
    try {
        const encoder = new TextEncoder();

        // Convert from base64
        const binaryString = atob(encryptedBase64);
        const combined = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            combined[i] = binaryString.charCodeAt(i);
        }

        // Extract salt (first 16 bytes), IV (next 12 bytes), and ciphertext
        const salt = combined.slice(0, 16);
        const iv = combined.slice(16, 28);
        const ciphertext = combined.slice(28);

        // Derive key using PBKDF2
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(secretKey),
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );

        const aesKey = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['decrypt']
        );

        // Decrypt
        const decrypted = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            aesKey,
            ciphertext
        );

        return new TextDecoder().decode(decrypted);
    } catch (error) {
        logger.error('Decryption error:', error);
        throw error;
    }
}