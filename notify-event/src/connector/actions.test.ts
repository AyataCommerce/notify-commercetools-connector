jest.mock('../utils/config.utils.ts', () => ({
    readConfiguration: jest.fn().mockReturnValue({
        CLIENT_ID: "XXXXXXXXXXXXXXXXXXXXXXXX",
        CLIENT_SECRET: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        PROJECT_KEY: "test-scope",
        SCOPE: "manage_project:test-scope",
        REGION: "europe-west1.gcp"
    })
}));

jest.mock('../repository/customObjects/customObjects.repository');
jest.mock('../repository/subscription/subscription.repository');
jest.mock('../utils/logger.utils');
import {
    deleteCustomObjectRepository,
    getCustomObjectRepository,
    getSingleCustomObjectRepository,
    updateCustomObjectRepository
} from '../repository/customObjects/customObjects.repository';


import { removeSubscriptionRepository } from '../repository/subscription/subscription.repository';
import { logger } from '../utils/logger.utils';
import { createNotifyObjects, removeSubscriptions, deleteAllObjects, deleteAllMessageState, deleteAllMessageLogs } from './actions';



describe('Notification Object Operations', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createNotifyObjects', () => {
        it('should call updateCustomObjectRepository 3 times for channel, subscription, and trigger list', async () => {
            (updateCustomObjectRepository as jest.Mock).mockResolvedValue({ id: 'test-id' });

            await createNotifyObjects('test-topic', 'test-project');

            expect(updateCustomObjectRepository).toHaveBeenCalledTimes(3);
            expect(updateCustomObjectRepository).toHaveBeenCalledWith(expect.objectContaining({ container: 'notify-channels' }));
            expect(updateCustomObjectRepository).toHaveBeenCalledWith(expect.objectContaining({ container: 'notify-subscriptions' }));
            expect(updateCustomObjectRepository).toHaveBeenCalledWith(expect.objectContaining({ container: 'notify-trigger-list' }));
        });
    });

    describe('removeSubscriptions', () => {
        it('should call removeSubscriptionRepository for each subscription', async () => {
            (getCustomObjectRepository as jest.Mock).mockResolvedValue({
                value: {
                    channels: {
                        whatsapp: { subscriptions: [{ resourceType: 'order' }] },
                        sms: { subscriptions: [{ resourceType: 'customer' }] },
                        email: { subscriptions: [] }
                    }
                }
            });

            await removeSubscriptions();

            expect(removeSubscriptionRepository).toHaveBeenCalledTimes(2);
            expect(removeSubscriptionRepository).toHaveBeenCalledWith('notify-order-subscription');
            expect(removeSubscriptionRepository).toHaveBeenCalledWith('notify-customer-subscription');
        });

        it('should handle errors during individual subscription removal', async () => {
            (getCustomObjectRepository as jest.Mock).mockResolvedValue({
                value: {
                    channels: {
                        whatsapp: { subscriptions: [{ resourceType: 'order' }] }
                    }
                }
            });
            (removeSubscriptionRepository as jest.Mock).mockRejectedValue(new Error('fail'));
            await removeSubscriptions();
            expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to unsubscribe from order:'), expect.any(Error));
        });
    });

    describe('deleteAllObjects', () => {
        it('should call deleteCustomObjectRepository for all expected keys', async () => {
            (deleteCustomObjectRepository as jest.Mock).mockResolvedValue({});
            (getSingleCustomObjectRepository as jest.Mock).mockResolvedValue([]);

            await deleteAllObjects();

            expect(deleteCustomObjectRepository).toHaveBeenCalledWith('notify-channels', 'notify-channels-key');
            expect(deleteCustomObjectRepository).toHaveBeenCalledWith('notify-subscriptions', 'notify-subscriptions-key');
            expect(deleteCustomObjectRepository).toHaveBeenCalledWith('notify-trigger-list', 'notify-trigger-list-key');
        });
    });

    describe('deleteAllMessageState', () => {
        it('should delete each message state object', async () => {
            (getSingleCustomObjectRepository as jest.Mock).mockResolvedValue([
                { container: 'notify-messageState', key: 'state1' },
                { container: 'notify-messageState', key: 'state2' }
            ]);
            await deleteAllMessageState();
            expect(deleteCustomObjectRepository).toHaveBeenCalledTimes(2);
            expect(deleteCustomObjectRepository).toHaveBeenCalledWith('notify-messageState', 'state1');
            expect(deleteCustomObjectRepository).toHaveBeenCalledWith('notify-messageState', 'state2');
        });

    });

    describe('deleteAllMessageLogs', () => {
        it('should delete each message log object', async () => {
            (getSingleCustomObjectRepository as jest.Mock).mockResolvedValue([
                { container: 'notify-messagelogs', key: 'log1' }
            ]);
            await deleteAllMessageLogs();
            expect(deleteCustomObjectRepository).toHaveBeenCalledWith('notify-messagelogs', 'log1');
        });

        
    });

});
  