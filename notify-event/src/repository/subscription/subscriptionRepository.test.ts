// Mocks
const executeMock = jest.fn();
const getMock = jest.fn(() => ({ execute: executeMock }));
const deleteMock = jest.fn(() => ({ execute: executeMock }));

const subscriptionsMock = {
    withKey: jest.fn(() => ({
        get: getMock,
        delete: deleteMock,
    })),
};

const fakeApiRoot = {
    subscriptions: jest.fn(() => subscriptionsMock),
};

jest.mock('../../client/create.client', () => ({
    createApiRoot: () => fakeApiRoot,
}));

import {
    getSubscriptionRepository,
    removeSubscriptionRepository,
} from './subscription.repository';

import GlobalError from '../../errors/global.error';



describe('subscription.repository', () => {
    afterEach(() => jest.clearAllMocks());

    test('getSubscriptionRepository should return subscription data', async () => {
        const fakeResponse = { body: { key: 'test-sub', id: '123' } };
        executeMock.mockResolvedValue(fakeResponse);

        const result = await getSubscriptionRepository('test-sub');
        expect(fakeApiRoot.subscriptions).toHaveBeenCalled();
        expect(subscriptionsMock.withKey).toHaveBeenCalledWith({ key: 'test-sub' });
        expect(result).toEqual(fakeResponse.body);
    });

    test('getSubscriptionRepository should throw GlobalError on failure', async () => {
        executeMock.mockRejectedValue({ statusCode: 404, message: 'Not found' });

        await expect(getSubscriptionRepository('bad-sub')).rejects.toThrow(GlobalError);
    });

    test('removeSubscriptionRepository should delete subscription by key', async () => {
        const fakeSubscription = { version: 5, id: 'sub-123', key: 'test-sub' };
        const deleteResponse = { body: { deleted: true } };

        // First call is getSubscriptionRepository
        executeMock
            .mockResolvedValueOnce({ body: fakeSubscription }) // getSubscriptionRepository
            .mockResolvedValueOnce(deleteResponse); // delete

        const result = await removeSubscriptionRepository('test-sub');

        expect(fakeApiRoot.subscriptions).toHaveBeenCalledTimes(2);
        expect(subscriptionsMock.withKey).toHaveBeenCalledWith({ key: 'test-sub' });
        expect(deleteMock).toHaveBeenCalledWith({ queryArgs: { version: 5 } });
        expect(result).toEqual(deleteResponse.body);
    });

    test('removeSubscriptionRepository should throw GlobalError on delete failure', async () => {
        const fakeSubscription = { version: 5 };
        executeMock
            .mockResolvedValueOnce({ body: fakeSubscription }) // getSubscriptionRepository
            .mockRejectedValueOnce({ statusCode: 500, message: 'Delete failed' }); // delete

        await expect(removeSubscriptionRepository('fail-sub')).rejects.toThrow(GlobalError);
    });
});
  