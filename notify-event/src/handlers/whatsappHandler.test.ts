// ✅ Set environment variables before importing the handler
process.env.TWILIO_ACCOUNT_SID = 'mock_sid';
process.env.TWILIO_AUTH_TOKEN = 'mock_token';

import { decryptString } from '../utils/helpers.utils';
import { logger } from '../utils/logger.utils';
import { GlobalError } from '../errors/global.error';

// Mocks
jest.mock('twilio');
jest.mock('../utils/helpers.utils');
jest.mock('../utils/logger.utils');

import twilio from 'twilio';
import { whatsappHandler } from '../handlers/whatsapp.handler';

describe('whatsappHandler.sendMessage', () => {
    const mockDecryptString = decryptString as jest.Mock;
    const mockLoggerInfo = jest.fn();
    const mockLoggerError = jest.fn();
    const mockCreate = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock Twilio client
        (twilio as unknown as jest.Mock).mockReturnValue({
            messages: {
                create: mockCreate,
            },
        });

        mockDecryptString.mockResolvedValue('+1234567890');

        // Assign mocks to logger
        (logger.info as jest.Mock) = mockLoggerInfo;
        (logger.error as jest.Mock) = mockLoggerError;
    });

    it('should send WhatsApp message successfully', async () => {
        const mockResponse = { sid: 'SM456' };
        mockCreate.mockResolvedValue(mockResponse);

        const result = await whatsappHandler.sendMessage(
            'Test WhatsApp message',
            'encryptedSender',
            '+1987654321'
        );

        expect(mockDecryptString).toHaveBeenCalledWith('encryptedSender', 'mock_sid');
        expect(mockCreate).toHaveBeenCalledWith({
            body: 'Test WhatsApp message',
            from: 'whatsapp:+1234567890',
            to: 'whatsapp:+1987654321',
        });
        expect(result).toBe(mockResponse);
        expect(mockLoggerInfo).toHaveBeenCalledWith(expect.stringContaining('Sending WhatsApp message'));
    });

    it('should throw GlobalError if Twilio fails', async () => {
        const mockError = { message: 'Twilio error', statusCode: 400 };
        mockCreate.mockRejectedValue(mockError);

        await expect(
            whatsappHandler.sendMessage('msg', 'sender', 'recipient')
        ).rejects.toThrow(GlobalError);

        expect(mockLoggerError).toHaveBeenCalledWith(expect.stringContaining('Error sending WhatsApp message'));
    });
});
