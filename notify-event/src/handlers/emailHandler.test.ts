// Set env before importing the module that reads it
process.env.TWILIO_ACCOUNT_SID = 'mock_sid';
process.env.SENDGRID_API_KEY = 'test_sendgrid_key';

import sgMail from '@sendgrid/mail';
import { decryptString } from '../utils/helpers.utils';
import { logger } from '../utils/logger.utils';
import GlobalError from '../errors/global.error';

jest.mock('@sendgrid/mail');
jest.mock('../utils/helpers.utils');
jest.mock('../utils/logger.utils');

import { emailHandler } from '../handlers/email.handler';

describe('emailHandler.sendMessage', () => {
    const mockSend = jest.fn();
    const mockDecryptString = decryptString as jest.Mock;
    const mockLoggerInfo = jest.fn();
    const mockLoggerError = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        (sgMail.setApiKey as jest.Mock).mockImplementation(() => { });
        (sgMail.send as jest.Mock) = mockSend;

        mockDecryptString.mockResolvedValue('decrypted@example.com');
        (logger.info as jest.Mock) = mockLoggerInfo;
        (logger.error as jest.Mock) = mockLoggerError;
    });

    it('should send email successfully', async () => {
        const mockMessage = '<p>Hello World</p>';
        const mockSender = 'encrypted@example.com';
        const mockRecipient = 'recipient@example.com';
        const mockSubject = 'Test Subject';
        const mockSendResponse = [{ statusCode: 202 }];

        mockSend.mockResolvedValue(mockSendResponse);

        const result = await emailHandler.sendMessage(mockMessage, mockSender, mockRecipient, mockSubject);

        expect(mockDecryptString).toHaveBeenCalledWith(mockSender, 'mock_sid');
        expect(mockSend).toHaveBeenCalledWith({
            to: mockRecipient,
            from: 'decrypted@example.com',
            subject: mockSubject,
            text: mockMessage,
            html: mockMessage,
        });

        expect(result).toBe(mockSendResponse);
        expect(mockLoggerInfo).toHaveBeenCalledWith(expect.stringContaining('Sending email message'));
    });

    it('should throw GlobalError if SendGrid fails', async () => {
        const mockError = { message: 'Send failed', statusCode: 400 };
        mockSend.mockRejectedValue(mockError);

        await expect(emailHandler.sendMessage('msg', 'sender', 'recipient', 'subj')).rejects.toThrow(GlobalError);
        expect(mockLoggerError).toHaveBeenCalledWith(expect.stringContaining('Error sending email message'));
    });
});
