export interface LogState {
    id?: string;
    version?: number;
    versionModifiedAt?: string;
    createdAt?: string;
    lastModifiedAt?: string;
    container?: string;
    key?: string;
    value?: {
        channel?: string;
        status?: string;
        logs?: {
            message?: string;
            statusCode?: number;
        };
        resourceType?: string;
        recipient?: string;
    };
}