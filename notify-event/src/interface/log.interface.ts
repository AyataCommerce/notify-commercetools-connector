export interface ProcessLogInterface {
    message: string;
    statusCode: string;
    createdAt: string;
}

export interface LogValueInterface {
    message: string;
    channels: {
        [key: string]: {
            isSent: boolean;
            lastProcessedDate: string;
            recipient: string;
            processLogs: ProcessLogInterface[];
        };
    };
}

export interface LogsRequest {
    container: string;
    key: string;
    value: LogValueInterface;
}
