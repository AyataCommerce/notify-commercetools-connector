import {
    getMessageLogs,
    updateMessageLogs,
    addProcessLog
} from './addLogs.service'; 

import * as customObjectsRepo from '../../repository/customObjects/customObjects.repository';
import * as helpers from '../../utils/helpers.utils';
import GlobalError from '../../errors/global.error';
import { PubsubMessageBody } from '../../interface/pubsub.interface';
import { LogValueInterface } from '../../interface/log.interface';

jest.mock('../../repository/customObjects/customObjects.repository');
jest.mock('../../utils/helpers.utils');
jest.mock('../../utils/logger.utils');

jest.mock('../../utils/config.utils.ts', () => ({
    readConfiguration: jest.fn().mockReturnValue({
        CTP_CLIENT_ID: "XXXXXXXXXXXXXXXXXXXXXXXX",
        CTP_CLIENT_SECRET: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        CTP_PROJECT_KEY: "test-scope",
        CTP_SCOPE: "manage_project:test-scope",
        CTP_REGION: "europe-west1.gcp"
    })
}));


describe('messageLogs.service', () => {
    const mockMessageId = 'msg-123';
    const mockChannel = 'whatsapp';
    const mockRecipient = 'user123';
    const mockPubsubMessage: PubsubMessageBody = {
        id: mockMessageId,
        notificationType: 'Message',
        // ... add other required fields
    } as PubsubMessageBody;

    const mockProcessLog = {
        message: 'sent',
        statusCode: '200',
        createdAt: new Date().toISOString()
    };

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getMessageLogs', () => {
        it('should return logs if they exist', async () => {
            const mockValue: LogValueInterface = {
                message: 'abc',
                channels: {}
            };
            (customObjectsRepo.getCustomObjectRepository as jest.Mock).mockResolvedValue({ value: mockValue });

            const result = await getMessageLogs(mockMessageId);

            expect(result).toEqual(mockValue);
        });

        it('should return null if no logs found', async () => {
            (customObjectsRepo.getCustomObjectRepository as jest.Mock).mockResolvedValue(null);

            const result = await getMessageLogs(mockMessageId);

            expect(result).toBeNull();
        });

        it('should throw GlobalError if fetching fails', async () => {
            (customObjectsRepo.getCustomObjectRepository as jest.Mock).mockRejectedValue(new Error('DB error'));

            await expect(getMessageLogs(mockMessageId)).rejects.toThrow(GlobalError);
        });
    });

    describe('updateMessageLogs', () => {
        it('should update logs when existing logs are found', async () => {
            (customObjectsRepo.getCustomObjectRepository as jest.Mock).mockResolvedValueOnce({
                value: {
                    message: 'old',
                    channels: {
                        [mockChannel]: {
                            isSent: false,
                            lastProcessedDate: 'old-date',
                            recipient: mockRecipient,
                            processLogs: []
                        }
                    }
                },
                version: 1
            });
            (helpers.jsonToBase64 as jest.Mock).mockReturnValue('base64-mock');

            await updateMessageLogs(
                mockMessageId,
                mockChannel,
                mockRecipient,
                true,
                mockProcessLog,
                mockPubsubMessage
            );

            expect(customObjectsRepo.updateCustomObjectRepository).toHaveBeenCalledWith(
                expect.objectContaining({
                    container: 'notify-messagelogs',
                    key: mockMessageId,
                    version: 1
                })
            );
        });

        it('should create new logs if none exist', async () => {
            (customObjectsRepo.getCustomObjectRepository as jest.Mock).mockResolvedValueOnce(null);
            (helpers.jsonToBase64 as jest.Mock).mockReturnValue('base64-new');

            await updateMessageLogs(
                mockMessageId,
                mockChannel,
                mockRecipient,
                false,
                mockProcessLog,
                mockPubsubMessage
            );

            expect(customObjectsRepo.updateCustomObjectRepository).toHaveBeenCalledWith(
                expect.objectContaining({
                    container: 'notify-messagelogs',
                    key: mockMessageId,
                    version: 0,
                    value: expect.objectContaining({
                        channels: expect.objectContaining({
                            [mockChannel]: expect.any(Object)
                        })
                    })
                })
            );
        });

        it('should throw GlobalError if update fails', async () => {
            (customObjectsRepo.getCustomObjectRepository as jest.Mock).mockResolvedValueOnce(null);
            (customObjectsRepo.updateCustomObjectRepository as jest.Mock).mockRejectedValue(new Error('Update error'));

            await expect(updateMessageLogs(
                mockMessageId,
                mockChannel,
                mockRecipient,
                false,
                mockProcessLog,
                mockPubsubMessage
            )).rejects.toThrow(GlobalError);
        });
    });

    describe('addProcessLog', () => {
        it('should create and update process log', async () => {
            const status = {
                message: 'Success',
                statusCode: '200',
                isSent: true
            };

            (customObjectsRepo.getCustomObjectRepository as jest.Mock).mockResolvedValueOnce(null);
            (customObjectsRepo.updateCustomObjectRepository as jest.Mock).mockResolvedValueOnce(undefined); // ✅ FIX
            (helpers.jsonToBase64 as jest.Mock).mockReturnValue('base64');

            await expect(addProcessLog(
                mockMessageId,
                mockChannel,
                mockRecipient,
                status,
                mockPubsubMessage
            )).resolves.not.toThrow(); // ✅ Ensure no error is thrown

            expect(customObjectsRepo.updateCustomObjectRepository).toHaveBeenCalled();
        });
    });
      
});
  