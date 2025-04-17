import { createApiRoot } from "../../client/create.client";
import GlobalError from "../../errors/global.error";
import { PubsubMessageBody } from "../../interface/pubsub.interface";
import { logger } from "../../utils/logger.utils";

const apiRoot = createApiRoot();


export const fetchResource = async (resourceType: string, resourceId: string, pubSubMessage: PubsubMessageBody) => {
    logger.info(`Fetching ${resourceType} with ID ${resourceId}`);

    switch (resourceType) {
        case 'order':
            return (await apiRoot.orders().withId({ ID: resourceId }).get().execute()).body || fetchResourceDataFromTheMessage(pubSubMessage, resourceType);
        case 'customer':
            return (await apiRoot.customers().withId({ ID: resourceId }).get().execute()).body || fetchResourceDataFromTheMessage(pubSubMessage, resourceType);
        case 'product':
            return (await apiRoot.products().withId({ ID: resourceId }).get().execute()).body || fetchResourceDataFromTheMessage(pubSubMessage, resourceType);
        case 'inventory-entry':
            return (await apiRoot.products().withId({ ID: resourceId }).get().execute()).body || fetchResourceDataFromTheMessage(pubSubMessage, resourceType);
        case 'payment':
            return (await apiRoot.products().withId({ ID: resourceId }).get().execute()).body || fetchResourceDataFromTheMessage(pubSubMessage, resourceType);
        case 'product-selection':
            return (await apiRoot.products().withId({ ID: resourceId }).get().execute()).body || fetchResourceDataFromTheMessage(pubSubMessage, resourceType);
        case 'quote':
            return (await apiRoot.products().withId({ ID: resourceId }).get().execute()).body || fetchResourceDataFromTheMessage(pubSubMessage, resourceType);
        case 'quote-request':
            return (await apiRoot.products().withId({ ID: resourceId }).get().execute()).body || fetchResourceDataFromTheMessage(pubSubMessage, resourceType);
        case 'review':
            return (await apiRoot.products().withId({ ID: resourceId }).get().execute()).body || fetchResourceDataFromTheMessage(pubSubMessage, resourceType);
        case 'staged-quote':
            return (await apiRoot.products().withId({ ID: resourceId }).get().execute()).body || fetchResourceDataFromTheMessage(pubSubMessage, resourceType);
        case 'product-tailoring':
            return (await apiRoot.products().withId({ ID: resourceId }).get().execute()).body || fetchResourceDataFromTheMessage(pubSubMessage, resourceType);
        case 'standalone-price':
            return (await apiRoot.products().withId({ ID: resourceId }).get().execute()).body || fetchResourceDataFromTheMessage(pubSubMessage, resourceType);
        case 'store':
            return (await apiRoot.products().withId({ ID: resourceId }).get().execute()).body || fetchResourceDataFromTheMessage(pubSubMessage, resourceType);
        default:
            throw new GlobalError(400, `Invalid resource type: ${resourceType}`)
    }

}

const fetchResourceDataFromTheMessage = (pubSubMessage: PubsubMessageBody, resourceType: string): any => {
    try {
        // Check if the resourceType exists as a key in the message
        if (resourceType && pubSubMessage && typeof pubSubMessage === 'object' && resourceType in pubSubMessage) {
            return pubSubMessage[resourceType];
        }

        // If not found directly, check in the resource property
        if (pubSubMessage?.resource?.typeId === resourceType.toLowerCase()) {
            // Look for object with that resource type name
            if (resourceType in pubSubMessage) {
                return pubSubMessage[resourceType];
            }
        }
        throw new GlobalError('404',`No ${resourceType} data found in message`);
    } catch (error) {
        throw new GlobalError(
            500,
            `Can't find data or process data for the trigger ${pubSubMessage.type}`
        );
    }
};