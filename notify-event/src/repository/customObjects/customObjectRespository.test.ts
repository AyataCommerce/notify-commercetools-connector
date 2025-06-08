// Mocks
const executeMock = jest.fn();
const getMock = jest.fn(() => ({ execute: executeMock }));
const postMock = jest.fn(() => ({ execute: executeMock }));
const deleteMock = jest.fn(() => ({ execute: executeMock }));

const customObjectsMock = {
    withContainerAndKey: jest.fn(() => ({
        get: getMock,
        delete: deleteMock,
    })),
    withContainer: jest.fn(() => ({
        get: getMock,
    })),
    post: postMock,
};

const fakeApiRoot = {
    customObjects: jest.fn(() => customObjectsMock),
};

jest.mock('../../client/create.client', () => ({
    createApiRoot: () => fakeApiRoot,
}));

import {
    updateCustomObjectRepository,
    getCustomObjectRepository,
    getSingleCustomObjectRepository,
    checkIfCustomObjectExists,
    deleteCustomObjectRepository,
} from './customObjects.repository';

import GlobalError from '../../errors/global.error';

describe('customObjects.repository', () => {
    afterEach(() => jest.clearAllMocks());

    test('updateCustomObjectRepository should post custom object', async () => {
        const fakeResponse = { body: { success: true } };
        executeMock.mockResolvedValue(fakeResponse);

        const result = await updateCustomObjectRepository({
            container: 'test-container',
            key: 'test-key',
            value: { foo: 'bar' },
            version: 1,
        });

        expect(postMock).toHaveBeenCalled();
        expect(result).toEqual(fakeResponse.body);
    });

    test('updateCustomObjectRepository should throw GlobalError on failure', async () => {
        executeMock.mockRejectedValue({ statusCode: 500, message: 'Post failed' });

        await expect(updateCustomObjectRepository({
            container: 'fail',
            key: 'fail-key',
            value: {},
            version: 0
        })).rejects.toThrow(GlobalError);
    });

    test('getCustomObjectRepository should return object', async () => {
        const fakeResponse = { body: { id: '123' } };
        executeMock.mockResolvedValue(fakeResponse);

        const result = await getCustomObjectRepository('test-container', 'test-key', 'expand=value');
        expect(customObjectsMock.withContainerAndKey).toHaveBeenCalledWith({ container: 'test-container', key: 'test-key' });
        expect(result).toEqual(fakeResponse.body);
    });

    test('getCustomObjectRepository should throw GlobalError on failure', async () => {
        executeMock.mockRejectedValue({ statusCode: 404, message: 'Not Found' });

        await expect(getCustomObjectRepository('bad-container', 'bad-key'))
            .rejects.toThrow(GlobalError);
    });

    test('getSingleCustomObjectRepository should return results', async () => {
        const fakeResponse = { body: { results: [{ id: 'result1' }] } };
        executeMock.mockResolvedValue(fakeResponse);

        const result = await getSingleCustomObjectRepository('test-container');
        expect(customObjectsMock.withContainer).toHaveBeenCalledWith({ container: 'test-container' });
        expect(result).toEqual(fakeResponse.body.results);
    });

    test('getSingleCustomObjectRepository should throw GlobalError on failure', async () => {
        executeMock.mockRejectedValue({ statusCode: 500, message: 'Server Error' });

        await expect(getSingleCustomObjectRepository('fail-container'))
            .rejects.toThrow(GlobalError);
    });

    test('checkIfCustomObjectExists should return true for valid object', async () => {
        const fakeResponse = { statusCode: 200, body: { id: '123' } };
        executeMock.mockResolvedValue(fakeResponse);

        const exists = await checkIfCustomObjectExists('test-container', 'test-key');
        expect(exists).toBe(true);
    });

    test('checkIfCustomObjectExists should return false when API throws error', async () => {
        executeMock.mockRejectedValue(new Error('Not found'));
        const exists = await checkIfCustomObjectExists('missing-container', 'missing-key');
        expect(exists).toBe(false);
    });

    test('checkIfCustomObjectExists should return false for non-200 status or missing ID', async () => {
        const fakeResponse = { statusCode: 404, body: {} };
        executeMock.mockResolvedValue(fakeResponse);

        const exists = await checkIfCustomObjectExists('test-container', 'test-key');
        expect(exists).toBe(false);
    });

    test('deleteCustomObjectRepository should delete the object', async () => {
        const fakeResponse = { body: { success: true } };
        executeMock.mockResolvedValue(fakeResponse);

        const result = await deleteCustomObjectRepository('test-container', 'test-key');
        expect(deleteMock).toHaveBeenCalled();
        expect(result).toEqual(fakeResponse.body);
    });

    test('deleteCustomObjectRepository should throw GlobalError on failure', async () => {
        executeMock.mockRejectedValue({ statusCode: 500, message: 'Delete failed' });

        await expect(deleteCustomObjectRepository('fail-container', 'fail-key'))
            .rejects.toThrow(GlobalError);
    });
});
