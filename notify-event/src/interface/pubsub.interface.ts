export interface PubSubEncodedMessage {
    data?: string;
}

export interface PubsubMessageBody {
    notificationType: string;
    projectKey: string;
    id: string;
    version: number;
    sequenceNumber: number;
    resource: {
        typeId: string;
        id: string;
    };
    resourceVersion: number;
    type: string;
    createdAt: string;
    lastModifiedAt: string;
    createdBy: {
        isPlatformClient: boolean;
        user: {
            typeId: string;
            id: string;
        };
    };
    lastModifiedBy: {
        isPlatformClient: boolean;
        user: {
            typeId: string;
            id: string;
        };
    };
    [key: string]: any;
}