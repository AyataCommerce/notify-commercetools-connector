export interface NotificationValue {
  channel: string;
  status: string;
  logs: Logs;
  resourceType: string;
  recipient: string;
}

interface Logs {
  message: string,
  statusCode: number
}

export interface NotificationResult {
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
  value: NotificationValue;
}

export interface ApiResponse {
  limit: number;
  offset: number;
  count: number;
  total: number;
  results: NotificationResult[];
}
