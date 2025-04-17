interface Reference {
    id: string;
    typeId: string;
}

interface ReferenceObject {
    [key: string]: Reference;
}

export interface Subscription {
    resourceType: string;
    triggers: TriggerList[];
}

export interface TriggerList {
    triggerType: string;
    subscribedAt: string;
}
export interface ChannelSubscriptions {
    subscriptions: Subscription[];
}

interface PubsubPropreties {
    projectId: string;
    topic: string;
}

export interface CreateSubscriptionInterface {
    pubsubPropreties?: PubsubPropreties;
    references?: ReferenceObject;
    channels: {
        [key: string]: ChannelSubscriptions;
    };
}


export interface AddSubscriptionRequestInterface {
    channel: string;
    updateBody: ChannelSubscriptions;
}

export interface RemoveSubscriptionRequestInterface {
    channel: string;
    subscription: {
        resourceType: string;
        triggerType: string;
    }
}