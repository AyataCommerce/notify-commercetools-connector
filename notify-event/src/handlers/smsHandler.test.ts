// ✅ Set environment variables BEFORE importing smsHandler
process.env.TWILIO_ACCOUNT_SID = 'mock_sid';
process.env.TWILIO_AUTH_TOKEN = 'mock_token';

import { logger } from '../utils/logger.utils';
import { decryptString } from '../utils/helpers.utils';
import GlobalError from '../errors/global.error';

jest.mock('twilio');
jest.mock('../utils/helpers.utils');
jest.mock('../utils/logger.utils');

import twilio from 'twilio';
import { smsHandler } from '../handlers/sms.handler';

describe('smsHandler.sendMessage', () => {
    const mockDecryptString = decryptString as jest.Mock;
    const mockLoggerInfo = jest.fn();
    const mockLoggerError = jest.fn();
    const mockCreate = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        (twilio as unknown as jest.Mock).mockReturnValue({
            messages: {
                create: mockCreate,
            },
        });

        (logger.info as jest.Mock) = mockLoggerInfo;
        (logger.error as jest.Mock) = mockLoggerError;
    });

    it('should send SMS successfully', async () => {
        mockDecryptString.mockResolvedValue('+1234567890');
        const mockResponse = { sid: 'SM123' };
        mockCreate.mockResolvedValue(mockResponse);

        const result = await smsHandler.sendMessage(
            'Hello from test',
            'encryptedSender',
            '+1987654321'
        );

        expect(mockDecryptString).toHaveBeenCalledWith('encryptedSender', 'mock_sid');
        expect(mockCreate).toHaveBeenCalledWith({
            body: 'Hello from test',
            from: '+1234567890',
            to: '+1987654321',
        });
        expect(result).toBe(mockResponse);
        expect(mockLoggerInfo).toHaveBeenCalledWith(expect.stringContaining('Sending SMS message'));
    });

    it('should throw GlobalError if Twilio fails with statusCode and message', async () => {
        mockDecryptString.mockResolvedValue('+1234567890');
        const mockError = { message: 'Twilio failed', statusCode: 400 };
        mockCreate.mockRejectedValue(mockError);

        await expect(
            smsHandler.sendMessage('msg', 'sender', 'recipient')
        ).rejects.toThrow(GlobalError);

        expect(mockLoggerError).toHaveBeenCalledWith(expect.stringContaining('Error sending SMS message'));
    });

    it('should throw GlobalError with default values if Twilio error lacks message and statusCode', async () => {
        mockDecryptString.mockResolvedValue('+1234567890');
        const mockError = {}; // No message or statusCode
        mockCreate.mockRejectedValue(mockError);

        await expect(
            smsHandler.sendMessage('msg', 'sender', 'recipient')
        ).rejects.toThrow('Failed to send message');

        expect(mockLoggerError).toHaveBeenCalledWith(expect.stringContaining('Error sending SMS message'));
    });

    it('should throw GlobalError if decryptString fails', async () => {
        mockDecryptString.mockRejectedValue(new Error('Decrypt failed'));

        await expect(
            smsHandler.sendMessage('msg', 'badSender', 'recipient')
        ).rejects.toThrow('Decrypt failed');

        expect(mockLoggerError).toHaveBeenCalledWith(expect.stringContaining('Error sending SMS message'));
    });
});
