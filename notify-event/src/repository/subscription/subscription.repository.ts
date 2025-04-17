import { createApiRoot } from "../../client/create.client";
import GlobalError from "../../errors/global.error";

const apiRoot = createApiRoot();


export const getSubscriptionRepository = async (key: string) => {

    try {
        const response = await apiRoot.subscriptions()
            .withKey({ key })
            .get()
            .execute();
        return response.body;
    } catch (error: any) {
        throw new GlobalError(error.statusCode || 500, error.message || `Failed to fetch ${key}`);
    }

};


export const removeSubscriptionRepository = async (key: string) => {
    const currentSubscription = await getSubscriptionRepository(key);
    try {
        const response = await apiRoot.subscriptions()
            .withKey({ key }).delete({ queryArgs: { version: currentSubscription.version } })
            .execute();
        return response.body;
    } catch (error: any) {
        throw new GlobalError(error.statusCode || 500, error.message || `Failed to delete ${key}`);
    }
};