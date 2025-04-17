import { expect } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app';
import * as enventController from '../../src/controllers/event.controller';
import { readConfiguration } from '../../src/utils/config.utils';

jest.mock('../../src/utils/config.utils');
// Mock environment variable reading
jest.mock('../../src/utils/config.utils.ts', () => ({
  readConfiguration: jest.fn().mockReturnValue({
      CTP_CLIENT_ID: "client-id",
      CTP_CLIENT_SECRET: "client-secret",
      CTP_PROJECT_KEY: "project-key",
      CTP_SCOPE: "scope",
      CTP_REGION: "region"
  })
}));

// Mock Twilio client
jest.mock('twilio', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({ sid: 'mock-message-sid' })
    }
  }));
});


beforeAll(() => {
  // Set up environment variables needed for the tests
  process.env.TWILIO_ACCOUNT_SID = 'mock-account-sid';
  process.env.TWILIO_AUTH_TOKEN = 'mock-auth-token';
  process.env.SENDGRID_API_KEY = 'SG.mock-sendgrid-key';
});


beforeEach(() => {
  jest.clearAllMocks();
})


describe('Testing router', () => {
  beforeEach(() => {
    (readConfiguration as jest.Mock).mockClear();
  });
  test('Post to non existing route', async () => {
    const response = await request(app).post('/none');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      message: 'Path not found.',
    });
  });

});
describe('unexpected error', () => {
  let postMock: jest.SpyInstance;

  beforeEach(() => {
    // Mock the post method to throw an error
    postMock = jest.spyOn(enventController, 'post').mockImplementation(() => {
      throw new Error('Test error');
    });
    (readConfiguration as jest.Mock).mockClear();
  });

  afterEach(() => {
    // Restore the original implementation
    postMock.mockRestore();
  });
  test('should handle errors thrown by post method', async () => {
    // Call the route handler
    const response = await request(app).post('/event');
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: 'Internal server error' });
  });
});
