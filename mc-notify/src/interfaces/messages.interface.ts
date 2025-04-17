export interface MessageBodyValue {
    channel: string;
    message: string;
}

export interface MessageBodyResult {
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
    value: MessageBodyValue;
}

export interface ApiResponse {
    limit: number;
    offset: number;
    count: number;
    total: number;
    results: MessageBodyResult[];
} 