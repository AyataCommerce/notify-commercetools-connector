export interface MessageBody {
    [key: string]: {
        subject?: string,
        message: string;
        sendToPath: string;
    };
}

export interface ChannelConfigurationRequest {
    isEnabled?: boolean;
    sender_id?: string;
    messageBody?: MessageBody;
}



export interface ChannelValue {
    [key: string]: {
        configurations: ChannelConfigurationRequest
    }
}



export interface ChannelInterfaceResponse {
    id: string;
    version: number;
    versionModifiedAt: string;
    createdAt: string;
    lastModifiedAt: string;
    lastModifiedBy: {
        clientId: string;
        isPlatformClient: boolean;
    };
    createdBy: {
        clientId: string;
        isPlatformClient: boolean;
    };
    container: string;
    key: string;
    value: ChannelValue
}