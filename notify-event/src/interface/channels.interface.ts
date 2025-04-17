import { ClientResponse } from "@sendgrid/mail";
import { MessageInstance } from "twilio/lib/rest/api/v2010/account/message";

// Structure for each message template in a channel
export interface MessageTemplate {
    subject?: string,
    message: string;
    sendToPath: string;
}

// Structure for channel configuration
export interface ChannelConfiguration {
    isEnabled: boolean;
    sender_id: string;
    messageBody: {
        [triggerType: string]: MessageTemplate;
    };
}

// Represents the value of a channel interface document
export interface ChannelValue {
    [channelType: string]: {
        configurations: ChannelConfiguration;
    };
}

interface ModifiedBy {
    clientId?: string;
    isPlatformClient?: boolean;
    user?: {
        typeId: string;
        id: string;
    };
}

export interface ChannelInterfaceResponse {
    id: string;
    version: number;
    versionModifiedAt?: string;
    createdAt: string;
    lastModifiedAt: string;
    lastModifiedBy?: ModifiedBy;
    createdBy?: ModifiedBy;
    container: string;
    key: string;
    value: ChannelValue;
}


export interface ChannelInterfaceRequest {
    container: string;
    key: string;
    value: ChannelValue;
}

// A handler to send messages through a channel
export interface ChannelHandler {
    sendMessage: (
        messageData: string,
        senderAddress: string,
        recipient: string,
        subject?: string
    ) => Promise<MessageInstance> | Promise<[ClientResponse, object]>;
}

// Subscription trigger type
export interface Trigger {
    triggerType: string;
    subscribedAt: string;
}

// One subscribed resource type with its triggers
export interface SubscriptionResource {
    resourceType: string;
    triggers: Trigger[];
}

// All subscriptions for a channel
export interface ChannelSubscriptions {
    subscriptions: SubscriptionResource[];
}

// Map of channels to their subscription configurations
export interface SubscriptionChannels {
    [channels: string]: ChannelSubscriptions;
}

// The full top-level document that includes pubsub reference, referenced channel configuration, and active channel subscriptions
export interface ChannelAndSubscriptions {
    id: string;
    version: number;
    versionModifiedAt?: string;
    createdAt: string;
    lastModifiedAt: string;
    lastModifiedBy?: ModifiedBy;
    createdBy?: ModifiedBy;
    container: string;
    key: string;
    value: {
        pubsubReference: {
            projectId: string;
            topic: string;
        };
        references: {
            typeId: string;
            id: string;
            obj: ChannelInterfaceResponse;
        };
        channels: SubscriptionChannels;
    };
}
