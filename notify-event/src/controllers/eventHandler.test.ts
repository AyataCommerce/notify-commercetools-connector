import { Request, Response } from 'express';
import { post } from '../controllers/event.controller'; 

import * as helperUtils from '../utils/helpers.utils';
import * as messageDispatcher from '../services/messageState/messageDispatcher.service';
import * as customObjectsRepo from '../repository/customObjects/customObjects.repository';
import { logger } from '../utils/logger.utils';
import GlobalError from '../errors/global.error';

jest.mock('../utils/helpers.utils');
jest.mock('../services/messageState/messageDispatcher.service');
jest.mock('../repository/customObjects/customObjects.repository');
jest.mock('../utils/logger.utils');

jest.mock('../utils/config.utils.ts', () => ({
    readConfiguration: jest.fn().mockReturnValue({
        CTP_CLIENT_ID: "XXXXXXXXXXXXXXXXXXXXXXXX",
        CTP_CLIENT_SECRET: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        CTP_PROJECT_KEY: "test-scope",
        CTP_SCOPE: "manage_project:test-scope",
        CTP_REGION: "europe-west1.gcp"
    })
}));

describe('post controller', () => {
    const mockRequest = {
        body: {
            message: 'mockPubSubEncoded',
        },
    } as unknown as Request;

    const mockResponse = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
    } as unknown as Response;

    const mockDecodedMessage = {
        id: 'msg-123',
        notificationType: 'Message',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return 200 if notificationType is not Message', async () => {
        (helperUtils.decodePubSubData as jest.Mock).mockReturnValue({ notificationType: 'SubscriptionConfirmation' });

        await post(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should handle existing message and return 200 if processDeliveringMessage is successful', async () => {
        (helperUtils.decodePubSubData as jest.Mock).mockReturnValue(mockDecodedMessage);
        (customObjectsRepo.checkIfCustomObjectExists as jest.Mock).mockResolvedValue(true);
        (customObjectsRepo.getCustomObjectRepository as jest.Mock)
            .mockResolvedValueOnce({ state: 'in_progress' }) // currentMessageState
            .mockResolvedValueOnce([{ id: 'channel1' }, { id: 'channel2' }]); // subscriptions
        (messageDispatcher.processDeliveringMessage as jest.Mock).mockResolvedValue(true);

        await post(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.send).toHaveBeenCalled();
        expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Processing message msg-123'));
    });

    it('should handle new message and return 400 after adding entry', async () => {
        (helperUtils.decodePubSubData as jest.Mock).mockReturnValue(mockDecodedMessage);
        (customObjectsRepo.checkIfCustomObjectExists as jest.Mock).mockResolvedValue(false);
        (customObjectsRepo.getCustomObjectRepository as jest.Mock).mockResolvedValue([{ id: 'sub1' }]);
        (messageDispatcher.addNewMessageStateEntry as jest.Mock).mockResolvedValue(undefined);

        await post(mockRequest, mockResponse);

        expect(messageDispatcher.addNewMessageStateEntry).toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should return error response on exception (generic error)', async () => {
        (helperUtils.decodePubSubData as jest.Mock).mockImplementation(() => {
            throw new Error('decode error');
        });

        await post(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.send).toHaveBeenCalledWith('decode error');
        expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('decode error'));
    });

    it('should return error response on GlobalError', async () => {
        (helperUtils.decodePubSubData as jest.Mock).mockImplementation(() => {
            throw new GlobalError(403, 'forbidden');
        });

        await post(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(403);
        expect(mockResponse.send).toHaveBeenCalledWith('forbidden');
    });
});
