import { PubsubMessageBody } from "../../interface/pubsub.interface";
import { updateCustomObjectRepository } from "../../repository/customObjects/customObjects.repository";
import { logger } from "../../utils/logger.utils";
import { GlobalError } from "../../errors/global.error";
import { ChannelAndSubscriptions } from "../../interface/channels.interface";
import { getChannelHandler, addNewMessageStateEntry, processDeliveringMessage, checkAllChannelsCompleted, deliverMessages } from "./messageDispatcher.service";
import { MessageStateResponse } from "../../interface/messageState.interface";
import { fetchResource } from "../../repository/allResources/resource.repository";
import { Order } from "@commercetools/platform-sdk";

// First define the mock handlers that will be used in the mocks
const mockHandlers = {
    email: {
        sendMessage: jest.fn().mockResolvedValue([{ statusCode: 202 }, {}])
    },
    sms: {
        sendMessage: jest.fn().mockResolvedValue({ sid: 'mock-sms-sid' })
    },
    whatsapp: {
        sendMessage: jest.fn().mockResolvedValue({ sid: 'mock-whatsapp-sid' })
    }
};

// Use jest.doMock to avoid hoisting issues
jest.doMock('../../handlers/email.handler', () => ({
    emailHandler: mockHandlers.email
}));

jest.doMock('../../handlers/sms.handler', () => ({
    smsHandler: mockHandlers.sms
}));

jest.doMock('../../handlers/whatsapp.handler', () => ({
    whatsappHandler: mockHandlers.whatsapp
}));

// Mock other dependencies
jest.mock('../../repository/customObjects/customObjects.repository');
jest.mock('../../repository/allResources/resource.repository');
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

// Mock Twilio client
jest.mock('twilio', () => {
    return jest.fn().mockImplementation(() => ({
        messages: {
            create: jest.fn().mockResolvedValue({ sid: 'mock-message-sid' })
        }
    }));
});

jest.mock('../../utils/helpers.utils', () => ({
    decryptString: jest.fn().mockImplementation((str) => Promise.resolve(str)),
    parsePlaceholder: jest.fn().mockImplementation((obj, path) => {
        if (path === '{{shippingAddress.lastName}}') return 'Doe';
        if (path === '{{shippingAddress.mobile}}') return '+1234567890';
        if (path === 'invalid.path') return undefined;
        return '';
    })
}));

beforeAll(() => {
    // Set up environment variables needed for the tests
    process.env.TWILIO_ACCOUNT_SID = 'mock-account-sid';
    process.env.TWILIO_AUTH_TOKEN = 'mock-auth-token';
    process.env.SENDGRID_API_KEY = 'SG.mock-sendgrid-key';
});


beforeEach(() => {
    jest.clearAllMocks();
})

// Mock fetchResource to return our mock resource
const mockedFetchResource = fetchResource as jest.MockedFunction<typeof fetchResource>;
const order: Order = {
    "id": "9bda752a-447a-47e6-bbc7-07dac970ecb8",
    "version": 19,
    "lastMessageSequenceNumber": 18,
    "createdAt": "2025-03-06T06:43:50.757Z",
    "lastModifiedAt": "2025-03-21T10:10:27.289Z",
    "createdBy": {
        "clientId": "b8ecYsR-66Ckdd9AOQIYY0Pb",
    },
    "totalPrice": {
        "type": "centPrecision",
        "currencyCode": "USD",
        "centAmount": 30999,
        "fractionDigits": 2
    },
    "taxedPrice": {
        "totalNet": {
            "type": "centPrecision",
            "currencyCode": "USD",
            "centAmount": 25832,
            "fractionDigits": 2
        },
        "totalGross": {
            "type": "centPrecision",
            "currencyCode": "USD",
            "centAmount": 30999,
            "fractionDigits": 2
        },
        "taxPortions": [
            {
                "rate": 0.2,
                "amount": {
                    "type": "centPrecision",
                    "currencyCode": "USD",
                    "centAmount": 5167,
                    "fractionDigits": 2
                },
                "name": "Standard VAT for US"
            }
        ],
        "totalTax": {
            "type": "centPrecision",
            "currencyCode": "USD",
            "centAmount": 5167,
            "fractionDigits": 2
        }
    },
    "country": "US",
    "orderState": "Confirmed",
    "shipmentState": "Shipped",
    "syncInfo": [],
    "returnInfo": [],
    "taxMode": "Platform",
    "inventoryMode": "None",
    "taxRoundingMode": "HalfEven",
    "taxCalculationMode": "LineItemLevel",
    "origin": "Customer",
    "shippingMode": "Single",
    "shippingAddress": {
        "salutation": "Mr.",
        "firstName": "John",
        "lastName": "Doe",
        "streetName": "Main Street",
        "streetNumber": "123",
        "additionalStreetInfo": "Apartment 4B",
        "postalCode": "10001",
        "city": "New York",
        "state": "NY",
        "country": "US",
        "phone": "+1-555-1234",
        "mobile": "+917306227380",
        "additionalAddressInfo": "Near Central Park"
    },
    "shipping": [],
    "discountTypeCombination": {
        "type": "Stacking"
    },
    "lineItems": [
        {
            "id": "531e49d8-7417-4b63-a31b-9d6aa4b15a82",
            "productId": "82f5cdfc-bf31-4a05-8b69-3c3ea13ed380",
            "name": {
                "en": "Bose QuietComfort 35 II Wireless Headphones"
            },
            "productType": {
                "typeId": "product-type",
                "id": "c140cbb5-1f07-44b3-82f9-3c2cdae42645",
            },
            "productSlug": {
                "en": "bose-quietcomfort-35-ii-wireless-headphones"
            },
            "variant": {
                "id": 2,
                "sku": "BOSE-QC35II-SLV2",
                "key": "bose-qc35ii-silver2",
                "prices": [
                    {
                        "id": "53d8f445-db15-4e11-8fcd-61a70f217371",
                        "value": {
                            "type": "centPrecision",
                            "currencyCode": "USD",
                            "centAmount": 30999,
                            "fractionDigits": 2
                        }
                    },
                    {
                        "id": "a1825abb-d241-4acc-b745-68f1f75a895e",
                        "value": {
                            "type": "centPrecision",
                            "currencyCode": "GBP",
                            "centAmount": 25999,
                            "fractionDigits": 2
                        }
                    },
                    {
                        "id": "e27604ec-76db-45ba-a2db-eb7132b35f77",
                        "value": {
                            "type": "centPrecision",
                            "currencyCode": "EUR",
                            "centAmount": 27999,
                            "fractionDigits": 2
                        }
                    }
                ],
                "images": [],
                "attributes": [
                    {
                        "name": "brand",
                        "value": "Bose"
                    },
                    {
                        "name": "noiseCancellation",
                        "value": true
                    },
                    {
                        "name": "Color",
                        "value": "Silver"
                    },
                    {
                        "name": "batteryLife",
                        "value": 20
                    },
                    {
                        "name": "warranty",
                        "value": 24
                    }
                ],
                "assets": []
            },
            "price": {
                "id": "53d8f445-db15-4e11-8fcd-61a70f217371",
                "value": {
                    "type": "centPrecision",
                    "currencyCode": "USD",
                    "centAmount": 30999,
                    "fractionDigits": 2
                }
            },
            "quantity": 1,
            "discountedPricePerQuantity": [],
            "taxRate": {
                "name": "Standard VAT for US",
                "amount": 0.2,
                "includedInPrice": true,
                "country": "US",
                "id": "sHe1gvl4",
                "key": "vat-standard-us",
                "subRates": []
            },
            "perMethodTaxRate": [],
            "addedAt": "2025-03-06T06:43:25.272Z",
            "lastModifiedAt": "2025-03-06T06:43:25.272Z",
            "state": [
                {
                    "quantity": 1,
                    "state": {
                        "typeId": "state",
                        "id": "04ff3604-563e-45c8-b65c-c6be098c3623"
                    }
                }
            ],
            "priceMode": "Platform",
            "lineItemMode": "Standard",
            "totalPrice": {
                "type": "centPrecision",
                "currencyCode": "USD",
                "centAmount": 30999,
                "fractionDigits": 2
            },
            "taxedPrice": {
                "totalNet": {
                    "type": "centPrecision",
                    "currencyCode": "USD",
                    "centAmount": 25832,
                    "fractionDigits": 2
                },
                "totalGross": {
                    "type": "centPrecision",
                    "currencyCode": "USD",
                    "centAmount": 30999,
                    "fractionDigits": 2
                },
                "taxPortions": [
                    {
                        "rate": 0.2,
                        "amount": {
                            "type": "centPrecision",
                            "currencyCode": "USD",
                            "centAmount": 5167,
                            "fractionDigits": 2
                        },
                        "name": "Standard VAT for US"
                    }
                ],
                "totalTax": {
                    "type": "centPrecision",
                    "currencyCode": "USD",
                    "centAmount": 5167,
                    "fractionDigits": 2
                }
            },
            "taxedPricePortions": []
        }
    ],
    "customLineItems": [],
    "discountCodes": [],
    "directDiscounts": [],
    "cart": {
        "typeId": "cart",
        "id": "f10e82eb-2c2c-452a-9486-1e5302305031"
    },
    "itemShippingAddresses": [],
    "refusedGifts": []
}
mockedFetchResource.mockResolvedValue(order);

describe('Message Dispatcher Service', () => {
    const mockMessage: PubsubMessageBody = {
        notificationType: "Message",
        projectKey: "ayata-connectors",
        id: "72bdda14-b87b-481e-8f17-751f6433d906",
        version: 1,
        sequenceNumber: 17,
        resource: {
            typeId: "order",
            id: "9bda752a-447a-47e6-bbc7-07dac970ecb8"
        },
        resourceVersion: 18,
        type: "OrderCreated",
        shipmentState: "Pending",
        oldShipmentState: "Ready",
        createdAt: "2025-03-21T09:21:14.174Z",
        lastModifiedAt: "2025-03-21T09:21:14.174Z",
        createdBy: {
            isPlatformClient: true,
            user: {
                typeId: "user",
                id: "451f98c6-4796-444d-b7e3-9c1ee47d5d68"
            }
        },
        lastModifiedBy: {
            isPlatformClient: true,
            user: {
                typeId: "user",
                id: "451f98c6-4796-444d-b7e3-9c1ee47d5d68"
            }
        }
    };

    const mockChannelsAndSubscriptions: ChannelAndSubscriptions = {
        value: {
            references: {
                obj: {
                    container: 'notify-channels',
                    key: 'notify-channels-key',
                    value: {
                        whatsapp: {
                            configurations: {
                                isEnabled: true,
                                sender_id: '+917306227381',
                                messageBody: {
                                    OrderCreated: {
                                        subject: '',
                                        message: 'WhatsApp message {{shippingAddress.lastName}}',
                                        sendToPath: 'shippingAddress.mobile'
                                    }
                                }
                            }
                        },
                        email: {
                            configurations: {
                                isEnabled: true,
                                sender_id: 'example@gmail.com',
                                messageBody: {
                                    OrderCreated: {
                                        subject: 'Email subject',
                                        message: 'Email message {{shippingAddress.lastName}}',
                                        sendToPath: 'shippingAddress.lastName'
                                    }
                                }
                            }
                        },
                        sms: {
                            configurations: {
                                isEnabled: false,
                                sender_id: '+917306227381',
                                messageBody: {
                                    OrderCreated: {
                                        subject: '',
                                        message: 'SMS message {{shippingAddress.lastName}}',
                                        sendToPath: 'shippingAddress.lastName'
                                    }
                                }
                            }
                        }
                    },
                    id: "fsefsefsefsef",
                    version: 0,
                    createdAt: "",
                    lastModifiedAt: ""
                },
                typeId: "key-value-document",
                id: "cdsfsfewrfergrgergergreg"
            },
            channels: {
                whatsapp: {
                    subscriptions: [{
                        resourceType: 'order',
                        triggers: [{
                            triggerType: 'OrderCreated',
                            subscribedAt: '2024-01-01T00:00:00Z'
                        }]
                    }]
                },
                email: {
                    subscriptions: [{
                        resourceType: 'order',
                        triggers: [{
                            triggerType: 'OrderCreated',
                            subscribedAt: '2024-01-01T00:00:00Z'
                        }]
                    }]
                },
                sms: {
                    subscriptions: [{
                        resourceType: 'order',
                        triggers: [{
                            triggerType: 'OrderCreated',
                            subscribedAt: '2024-01-01T00:00:00Z'
                        }]
                    }]
                }
            },
            pubsubReference: {
                projectId: "dfsdfsdf",
                topic: "fdsfsdf"
            }
        },
        id: "fdfsdfdsfsdfdsfdsfdsf",
        version: 0,
        createdAt: "",
        lastModifiedAt: "",
        container: "notify-subscriptions",
        key: "notify-subscriptions-key"
    };

    const mockCurrentResource = {
        shippingAddress: {
            lastName: 'Doe',
            mobile: '+1234567890'
        }
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (updateCustomObjectRepository as jest.Mock).mockResolvedValue({
            id: 'new-object-id',
            version: 1,
            value: {
                channelsProcessed: {
                    whatsapp: { isSent: "processing", retry: 0 },
                    email: { isSent: "processing", retry: 0 },
                    sms: { isSent: false, retry: 0 }
                },
                message: mockMessage
            }
        });
    });

    describe('getChannelHandler', () => {
        it('should return handler for existing channel', () => {
            const handler = getChannelHandler('email');
            expect(handler).toBeDefined();
        });

        it('should throw error for non-existent channel', () => {
            expect(() => getChannelHandler('nonexistent')).toThrow(GlobalError);
        });
    });

    describe('addNewMessageStateEntry', () => {
        it('should create message state with correct channel statuses', async () => {
            const result = await addNewMessageStateEntry(mockMessage, mockChannelsAndSubscriptions);

            expect(result.value.channelsProcessed.whatsapp.isSent).toBe("processing");
            expect(result.value.channelsProcessed.email.isSent).toBe("processing");
            expect(result.value.channelsProcessed.sms.isSent).toBe(false);
        });

        it('should handle error during custom object creation', async () => {
            const error = new Error('Database error');
            (updateCustomObjectRepository as jest.Mock).mockRejectedValue(error);

            await expect(addNewMessageStateEntry(mockMessage, mockChannelsAndSubscriptions))
                .rejects.toThrow(error);
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('processDeliveringMessage', () => {
        const mockMessageState = {
            id: 'mock-state-id',
            version: 1,
            value: {
                channelsProcessed: {
                    whatsapp: { isSent: "processing", retry: 0 },
                    email: { isSent: "processing", retry: 0 },
                    sms: { isSent: false, retry: 0 }
                },
                message: mockMessage
            }
        } as unknown as MessageStateResponse;

        it('should handle errors during message delivery', async () => {
            mockHandlers.email.sendMessage.mockRejectedValueOnce(new Error('Send failed'));

            const result = await processDeliveringMessage(
                mockMessageState,
                mockChannelsAndSubscriptions,
                mockMessage
            );

            expect(result).toBe(false);
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('checkAllChannelsCompleted', () => {
        it('should return true when all channels are successfully sent', () => {
            const messageState = {
                value: {
                    channelsProcessed: {
                        whatsapp: { isSent: true, retry: 1 },
                        email: { isSent: true, retry: 1 },
                        sms: { isSent: true, retry: 1 }
                    },
                    message: mockMessage
                },
                id: "72bdda14-b87b-481e-8f17-751f6433d906",
                version: 0,
                createdAt: "2025-04-14T07:49:23.715Z",
                lastModifiedAt: "2025-04-14T07:49:23.715Z",
                container: "notify-messageState",
                key: "72bdda14-b87b-481e-8f17-751f6433d906"
            } as MessageStateResponse;

            expect(checkAllChannelsCompleted(messageState)).toBe(true);
        });

        it('should return false when any channel is not successfully sent', () => {
            const messageState = {
                value: {
                    channelsProcessed: {
                        whatsapp: { isSent: false, retry: 1 },
                        email: { isSent: true, retry: 1 },
                        sms: { isSent: true, retry: 1 }
                    },
                    message: mockMessage
                },
                id: "72bdda14-b87b-481e-8f17-751f6433d906",
                version: 0,
                createdAt: "2025-04-14T07:49:23.715Z",
                lastModifiedAt: "2025-04-14T07:49:23.715Z",
                container: "notify-messageState",
                key: "72bdda14-b87b-481e-8f17-751f6433d906"
            } as MessageStateResponse;

            expect(checkAllChannelsCompleted(messageState)).toBe(false);
        });
    });

    describe('deliverMessages', () => {
        const mockMessageState: MessageStateResponse = {
            value: {
                channelsProcessed: {
                    whatsapp: { isSent: false, retry: 0 },
                    email: { isSent: false, retry: 0 },
                },
                message: mockMessage
            },
            id: "72bdda14-b87b-481e-8f17-751f6433d906",
            version: 0,
            createdAt: "2025-04-14T07:49:23.715Z",
            lastModifiedAt: "2025-04-14T07:49:23.715Z",
            container: "notify-messageState",
            key: "72bdda14-b87b-481e-8f17-751f6433d906"
        };



        it('should handle failed message deliveries', async () => {
            mockHandlers.email.sendMessage.mockRejectedValueOnce(new Error('Send failed'));

            const result = await deliverMessages(
                mockMessageState,
                ['whatsapp', 'email'],
                mockChannelsAndSubscriptions.value.references.obj,
                mockCurrentResource,
                mockMessage
            );

            expect(result).toBe(false);
            expect(logger.error).toHaveBeenCalled();
        });


        it('should handle missing recipient or message body', async () => {
            const modifiedChannels = {
                ...mockChannelsAndSubscriptions.value.references.obj,
                value: {
                    whatsapp: {
                        configurations: {
                            isEnabled: true,
                            sender_id: '+917306227381',
                            messageBody: {
                                OrderCreated: {
                                    subject: '',
                                    message: 'invalid.path',
                                    sendToPath: 'invalid.path'
                                }
                            }
                        }
                    }
                }
            };

            await expect(deliverMessages(
                mockMessageState,
                ['whatsapp'],
                modifiedChannels,
                mockCurrentResource,
                mockMessage
            )).resolves.toBe(false);
        });
    });
});