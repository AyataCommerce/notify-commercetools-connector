import { PubsubMessageBody } from "./pubsub.interface";


interface ChannelStatus {
    retry: number,
    isSent: "processing" | boolean;
}

interface MessageStateValue {
    channelsProcessed: {
        [key: string]: ChannelStatus;
    };
    message: PubsubMessageBody;
}

export interface MessageStateRequest {
    container: string;
    version: number;
    key: string;
    value: MessageStateValue;
}

interface ModifiedBy {
    clientId?: string;
    isPlatformClient?: boolean;
    user?: {
        typeId: string;
        id: string;
    };
}


export interface MessageStateResponse {
    id: string;
    version: number;
    versionModifiedAt?: string;
    createdAt: string;
    lastModifiedAt: string;
    lastModifiedBy?: ModifiedBy;
    createdBy?: ModifiedBy;
    container: string;
    key: string;
    value: MessageStateValue;
}

export interface MessageStateRequest {
    container: string;
    key: string;
    value: MessageStateValue;
}
