// Define the fakeApiClient mocks
const fakeExecute = jest.fn();
const fakeGet = jest.fn(() => ({ execute: fakeExecute }));
const fakeWithId = jest.fn(() => ({ get: fakeGet }));

const fakeChain = {
    withId: fakeWithId,
};

const fakeApiClient = {
    orders: jest.fn(() => fakeChain),
    customers: jest.fn(() => fakeChain),
    products: jest.fn(() => fakeChain),
};

jest.mock('../../client/create.client', () => ({
    createApiRoot: () => fakeApiClient,
}));

jest.mock('../../utils/logger.utils', () => ({
    logger: { info: jest.fn(), error: jest.fn() },
}));

import GlobalError from '../../errors/global.error';
import { PubsubMessageBody } from '../../interface/pubsub.interface';
import { fetchResource } from './resource.repository';

describe('fetchResource', () => {
    const resourceId = 'resource-123';

    const pubSubMessage: PubsubMessageBody = {
        notificationType: 'Message',
        projectKey: 'project-key',
        id: 'msg-id',
        version: 1,
        sequenceNumber: 1,
        resource: {
            typeId: 'order',
            id: resourceId,
        },
        resourceVersion: 1,
        type: 'SomeType',
        createdAt: new Date().toISOString(),
        lastModifiedAt: new Date().toISOString(),
        createdBy: { isPlatformClient: true, user: { typeId: 'user', id: 'user-id' } },
        lastModifiedBy: { isPlatformClient: true, user: { typeId: 'user', id: 'user-id' } },
        order: { fallbackData: 'order fallback' },
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return API response body for resourceType "order" if available', async () => {
        const expectedData = { orderData: 'order from API' };
        fakeExecute.mockResolvedValue({ body: expectedData });

        const result = await fetchResource('order', resourceId, pubSubMessage);

        expect(fakeApiClient.orders).toHaveBeenCalledTimes(1);
        expect(fakeWithId).toHaveBeenCalledWith({ ID: resourceId });
        expect(result).toEqual(expectedData);
    });

    it('should return fallback data from PubSub message for resourceType "order" if API response body is falsy', async () => {
        fakeExecute.mockResolvedValue({ body: null });

        const result = await fetchResource('order', resourceId, pubSubMessage);
        expect(result).toEqual(pubSubMessage.order);
    });

    it('should work for "customer" resourceType with fallback', async () => {
        fakeExecute.mockResolvedValue({ body: null });
        const customerMessage = {
            ...pubSubMessage,
            customer: { fallback: 'customer fallback' },
            resource: { typeId: 'customer', id: resourceId },
        };

        const result = await fetchResource('customer', resourceId, customerMessage);
        expect(fakeApiClient.customers).toHaveBeenCalledTimes(1);
        expect(result).toEqual(customerMessage.customer);
    });

    it('should throw GlobalError for invalid resource type', async () => {
        const invalidResourceType = 'invalidType';

        await expect(fetchResource(invalidResourceType, resourceId, pubSubMessage))
            .rejects.toThrow(GlobalError);
        await expect(fetchResource(invalidResourceType, resourceId, pubSubMessage))
            .rejects.toThrow(`Invalid resource type: ${invalidResourceType}`);
    });

    it('should return fallback data for "product" when API response is falsy', async () => {
        fakeExecute.mockResolvedValue({ body: undefined });
        const productMessage = {
            ...pubSubMessage,
            product: { fallbackProduct: 'product fallback' },
            resource: { typeId: 'product', id: resourceId },
        };

        const result = await fetchResource('product', resourceId, productMessage);
        expect(fakeApiClient.products).toHaveBeenCalled();
        expect(result).toEqual(productMessage.product);
    });

    const productLikeTypes = [
        'inventory-entry', 'payment', 'product-selection', 'quote', 'quote-request', 'review',
        'staged-quote', 'product-tailoring', 'standalone-price', 'store',
    ];

    describe.each(productLikeTypes)('resourceType "%s"', (type) => {
        it(`should return fallback data if API call for "${type}" returns falsy`, async () => {
            fakeExecute.mockResolvedValue({ body: null });

            const message = {
                ...pubSubMessage,
                [type]: { fallbackData: `${type} fallback` },
                resource: { typeId: type, id: resourceId },
            };

            const result = await fetchResource(type, resourceId, message as any);
            expect(fakeApiClient.products).toHaveBeenCalled();
            expect(result).toEqual(message[type]);
        });
    });



    it('should throw GlobalError from catch if message is malformed', async () => {
        fakeExecute.mockResolvedValue({ body: null });

        const brokenMessage = {
            type: 'BrokenType', // no resource field
        };

        await expect(fetchResource('order', resourceId, brokenMessage as any))
            .rejects.toThrow(`Can't find data or process data for the trigger BrokenType`);
    });
});
