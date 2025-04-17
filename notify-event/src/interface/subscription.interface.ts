interface pubsubReference {
    projectId: string;
    topic: string;
}


interface References {
    id: string;
    typeId: string;
}

interface Triggers {
    triggerType: string;
    subscribedAt: string;
}
interface Subscription {
    resourceType: string;
    triggers: Triggers[];
}

interface ChannelSubscriptions {
    subscriptions: Subscription[];
}

export interface CreateSubscriptionInterface {
    pubsubReference: pubsubReference;
    references?: References;
    channels: {
        [key: string]: ChannelSubscriptions;
    };
}

export interface SubscriptionInterfaceRequest {
    container: string;
    key: string;
    value: CreateSubscriptionInterface;
}
