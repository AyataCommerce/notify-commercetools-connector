import { MC_API_PROXY_TARGETS } from "@commercetools-frontend/constants";
import { actions } from '@commercetools-frontend/sdk';
import { fetchCustomObjectRepository } from "./customObject.repository";



export const createCommerceToolsSubscriptionRepository = async (dispatch: any, subscriptionKey: string, resourceTypeId: string, types: string[]) => {
    try {
        const gcpPropreties = await fetchCustomObjectRepository(dispatch, 'notify-subscriptions', 'notify-subscriptions-key');
        console.log('gcp propreties', gcpPropreties);

        const destination = {
            type: 'GoogleCloudPubSub',
            topic: gcpPropreties.value.pubsubReference.topic,
            projectId: gcpPropreties.value.pubsubReference.projectId,
        };
        const result = await dispatch(
            actions.post({
                mcApiProxyTarget: MC_API_PROXY_TARGETS.COMMERCETOOLS_PLATFORM,
                service: 'subscriptions',
                options: {},
                payload: {
                    key: subscriptionKey,
                    destination,
                    messages: [
                        {
                            resourceTypeId: resourceTypeId,
                            types: types,
                        },
                    ],
                }
            })
        );

        return result;
    } catch (error) {
        console.error('Error updating custom object:', error);
        throw error;
    }
};

export const fetchCommerceToolsSubscriptionRepository = async (dispatch: any, subscriptionKey: string) => {
    try {
        const result = await dispatch(
            actions.get({
                mcApiProxyTarget: MC_API_PROXY_TARGETS.COMMERCETOOLS_PLATFORM,
                service: 'subscriptions',
                options: {
                    key: subscriptionKey,
                },
            })
        );

        return result;
    } catch (error) {
        console.error('Error fetching custom objects:', error);
        throw error;
    }
};


export const updateCommerceToolsSubscriptionRepository = async (dispatch: any, subscriptionKey: string, resourceTypeId: string, types: string[]) => {
    try {
        const version = await fetchCommerceToolsSubscriptionRepository(dispatch, subscriptionKey).then(response => response.version);

        const result = await dispatch(
            actions.post({
                mcApiProxyTarget: MC_API_PROXY_TARGETS.COMMERCETOOLS_PLATFORM,
                service: 'subscriptions',
                options: {
                    key: subscriptionKey,
                },
                payload: {
                    version: version,
                    actions: [
                        {
                            action: 'setMessages',
                            messages: [
                                {
                                    resourceTypeId: resourceTypeId,
                                    types: types,
                                },
                            ]
                        },
                    ],
                }
            })
        );

        return result;
    } catch (error) {
        console.error('Error updating custom object:', error);
        throw error;
    }
};

export const deleteCommerceToolsSubscriptionRepository = async (dispatch: any, subscriptionKey: string) => {
    try {
        const version = await fetchCommerceToolsSubscriptionRepository(dispatch, subscriptionKey).then(response => response.version);

        const result = await dispatch(
            actions.del({
                mcApiProxyTarget: MC_API_PROXY_TARGETS.COMMERCETOOLS_PLATFORM,
                service: 'subscriptions',
                options: {
                    version: version,
                    key: subscriptionKey,
                },
            })
        );

        return result;
    } catch (error) {
        console.error('Error updating custom object:', error);
        throw error;
    }
};


export const commerceToolsSubscriptionExistsRepository = async (dispatch: any, subscriptionKey: string): Promise<boolean> => {
    try {
        await dispatch(
            actions.get({
                mcApiProxyTarget: MC_API_PROXY_TARGETS.COMMERCETOOLS_PLATFORM,
                service: 'subscriptions',
                options: {
                    key: subscriptionKey,
                },
            })
        );

        return true;
    } catch (error: any) {
        if (error?.statusCode === 404) {
            return false;
        }
        throw error;
    }
};