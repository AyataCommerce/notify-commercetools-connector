

// Define the fakeApiClient first
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

// Now you can mock createApiRoot
jest.mock('../../client/create.client', () => ({
    createApiRoot: () => fakeApiClient,
}));

// Mock the logger (optional)
jest.mock('../../utils/logger.utils', () => ({
    logger: { info: jest.fn(), error: jest.fn() },
}));

import GlobalError from '../../errors/global.error';
import { PubsubMessageBody } from '../../interface/pubsub.interface';
import { fetchResource } from './resource.repository';


describe('fetchResource', () => {
    const resourceId = 'resource-123';

    // Create a sample PubsubMessageBody that will be used for fallback.
    // For example, when resourceType is "order" and the API returns no body,
    // the function will try to return `pubSubMessage['order']`.
    const pubSubMessage: PubsubMessageBody = {
        notificationType: 'Message',
        projectKey: 'project-key',
        id: 'msg-id',
        version: 1,
        sequenceNumber: 1,
        resource: {
            typeId: 'order', // resourceType lowercased
            id: resourceId,
        },
        resourceVersion: 1,
        type: 'SomeType',
        createdAt: new Date().toISOString(),
        lastModifiedAt: new Date().toISOString(),
        createdBy: { isPlatformClient: true, user: { typeId: 'user', id: 'user-id' } },
        lastModifiedBy: { isPlatformClient: true, user: { typeId: 'user', id: 'user-id' } },
        // When needed, fallback data is provided as a property keyed on resource type.
        order: { fallbackData: 'order fallback' },
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return API response body for resourceType "order" if available', async () => {
        const expectedData = { orderData: 'order from API' };

        // Simulate the API chain returning a body (non-falsy)
        fakeExecute.mockResolvedValue({ body: expectedData });

        const result = await fetchResource('order', resourceId, pubSubMessage);

        expect(fakeApiClient.orders).toHaveBeenCalledTimes(1);
        expect(fakeWithId).toHaveBeenCalledWith({ ID: resourceId });
        expect(result).toEqual(expectedData);
    });

    it('should return fallback data from PubSub message for resourceType "order" if API response body is falsy', async () => {
        // Simulate the API chain returning no body (falsy)
        fakeExecute.mockResolvedValue({ body: null });

        const result = await fetchResource('order', resourceId, pubSubMessage);

        // In fallback, it looks in the pubSubMessage for a key that matches the resourceType.
        expect(result).toEqual(pubSubMessage.order);
    });

    it('should work similarly for resourceType "customer"', async () => {
        const customerData = { customerData: 'from API' };

        // For "customer", the function uses apiRoot.customers()...
        fakeExecute.mockResolvedValue({ body: customerData });
        // Adjust pubSubMessage so that it has a "customer" property for fallback.
        const customerMessage = { ...pubSubMessage, customer: { fallback: 'customer fallback' } };

        const result = await fetchResource('customer', resourceId, customerMessage);

        expect(fakeApiClient.customers).toHaveBeenCalledTimes(1);
        expect(result).toEqual(customerData);
    });

    it('should throw GlobalError for an invalid resource type', async () => {
        const invalidResourceType = 'invalidType';

        await expect(fetchResource(invalidResourceType, resourceId, pubSubMessage))
            .rejects.toThrow(GlobalError);

        // You can also check the error message if needed:
        await expect(fetchResource(invalidResourceType, resourceId, pubSubMessage))
            .rejects.toThrow(`Invalid resource type: ${invalidResourceType}`);
    });

    it('should return fallback data when API call returns falsy body for resourceType with API chain using products (e.g. "product")', async () => {
        fakeExecute.mockResolvedValue({ body: undefined });
        // Provide fallback data in the message for "product"
        const productMessage = { ...pubSubMessage, product: { fallbackProduct: 'product fallback' } };

        const result = await fetchResource('product', resourceId, productMessage);

        expect(fakeApiClient.products).toHaveBeenCalled();
        expect(result).toEqual(productMessage.product);
    });
});
