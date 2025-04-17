import React, { useEffect, useState } from 'react';
import styles from './Logs.module.css';
import { fetchAllCustomObjectsRepository, fetchCustomObjectsCount } from '../../../repository/customObject.repository';
import { useAsyncDispatch } from '@commercetools-frontend/sdk';
import processLogsIcon from '../../../assets/icons/process_logs.svg'
import messageDetailsIcon from '../../../assets/icons/details-more.svg'
import TabBar from '../tabBar/TabBar';


type ProcessLog = {
    message: string;
    statusCode: number;
    createdAt: string;
};

type ChannelData = {
    isSent: boolean;
    lastProcessedDate: string;
    recipient: string;
    processLogs?: ProcessLog[]; // Made optional
};

type MessageData = {
    notificationType?: string;
    projectKey?: string;
    id?: string;
    version?: number;
    sequenceNumber?: number;
    resource?: {
        typeId?: string;
        id?: string;
    };
    resourceVersion?: number;
    type?: string;
    shipmentState?: string;
    oldShipmentState?: string;
    createdAt?: string;
    lastModifiedAt?: string;
    createdBy?: {
        isPlatformClient?: boolean;
        user?: {
            typeId?: string;
            id?: string;
        };
    };
    lastModifiedBy?: {
        isPlatformClient?: boolean;
        user?: {
            typeId?: string;
            id?: string;
        };
    };
};

type LogItem = {
    id: string;
    version?: number;
    versionModifiedAt?: string;
    createdAt?: string;
    lastModifiedAt?: string;
    container?: string;
    key?: string;
    value: {
        message: string;
        channels?: {
            [key: string]: ChannelData | undefined;
        };
    };
    decodedMessage?: MessageData | null;
};

type LogsProps = {
    channel: string;
};

const getStatusColor = (isSent: boolean, lastLog?: ProcessLog) => {
    if (!isSent) return '#dc3545';
    if (!lastLog) return '#6c757d';
    if (lastLog.statusCode >= 200 && lastLog.statusCode < 300) return '#28a745';
    if (lastLog.statusCode >= 400 && lastLog.statusCode < 500) return '#ffc107';
    return '#dc3545';
};

const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleString();
    } catch {
        return 'Invalid date';
    }
};

const decodeBase64Message = (base64String: string): MessageData | null => {
    try {
        const decodedString = atob(base64String);
        return JSON.parse(decodedString) as MessageData;
    } catch (error) {
        console.error('Error decoding message:', error);
        return null;
    }
};

const processLogsForChannel = (response: any, channel: string): LogItem[] => {
    if (!response) return [];

    const results = Array.isArray(response.results) ? response.results :
        Array.isArray(response) ? response : [];

    return results
        .filter((item: any) => item?.value?.message)
        .map((item: any) => ({
            ...item,
            decodedMessage: decodeBase64Message(item.value.message),
            value: {
                ...item.value,
                channels: item.value.channels || {}
            }
        }))
        .filter((item: LogItem) => item.value.channels && item.value.channels[channel]);
};

const ChannelLogs = ({ channel }: LogsProps) => {
    const dispatch = useAsyncDispatch();
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [logData, setLogData] = useState<LogItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 20,
        total: 0,
    });
    const [activeTab, setActiveTab] = useState('process_logs');

    const tabs = [
        { id: 'process_logs', label: 'Process Logs', icon: processLogsIcon },
        { id: 'message_details', label: 'Message Details', icon: messageDetailsIcon },
    ];
    const fetchData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Fetch count first
            const total = await fetchCustomObjectsCount(dispatch, 'notify-messagelogs') || 0;

            // Then fetch paginated data
            const offset = (pagination.page - 1) * pagination.pageSize;
            const response = await fetchAllCustomObjectsRepository(
                dispatch,
                'notify-messagelogs',
                { limit: pagination.pageSize, offset }
            );

            const processedData = processLogsForChannel(response, channel);
            setLogData(processedData);
            setPagination(prev => ({
                ...prev,
                total,
            }));
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Failed to load logs. Please try again later.');
            setLogData([]);
            setPagination(prev => ({ ...prev, total: 0 }));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            await fetchData();
        };

        if (isMounted) {
            loadData();
        }

        return () => {
            isMounted = false;
        };
    }, [dispatch, channel, pagination.page, pagination.pageSize]);

    const toggleRow = (id: string) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    const getChannelData = (item: LogItem): ChannelData | undefined => {
        return item.value.channels?.[channel];
    };

    const handlePageChange = (newPage: number) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newSize = Number(e.target.value);
        setPagination(prev => ({ ...prev, pageSize: newSize, page: 1 }));
    };

    const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.pageSize));

    if (isLoading) {
        return <div className={styles.container}>Loading logs...</div>;
    }

    if (error) {
        return <div className={styles.container}>{error}</div>;
    }

    if (logData.length === 0) {
        return <div className={styles.container}>No logs available for the selected channel.</div>;
    }

    return (
        <div className={styles.container}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Trigger Type</th>
                        <th>Resource Type</th>
                        <th>Last updated</th>
                        <th>Status</th>
                        <th>Recipient</th>
                    </tr>
                </thead>
                <tbody>
                    {logData.map((item) => {
                        const channelData = getChannelData(item);
                        if (!channelData) return null;

                        const lastLog = channelData.processLogs?.[channelData.processLogs.length - 1];
                        const decodedMessage = item.decodedMessage;

                        return (
                            <React.Fragment key={item.id}>
                                <tr onClick={() => toggleRow(item.id)} className={styles.clickableRow}>
                                    <td>{decodedMessage?.type || 'N/A'}</td>
                                    <td>{decodedMessage?.resource?.typeId || 'N/A'}</td>
                                    <td>{formatDate(channelData.lastProcessedDate)}</td>
                                    <td>
                                        <span style={{
                                            display: 'inline-block',
                                            width: '12px',
                                            height: '12px',
                                            borderRadius: '50%',
                                            backgroundColor: getStatusColor(channelData.isSent, lastLog),
                                            marginRight: '8px'
                                        }} />
                                        {channelData.isSent ? 'Delivered' : 'Failed'}
                                    </td>
                                    <td>{channelData.recipient || 'N/A'}</td>
                                </tr>
                                {expandedRow === item.id && (
                                    <tr className={styles.expandedRow}>
                                        <td colSpan={5}>
                                            <div className={styles.expandedContent}>
                                                <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

                                                <div className={styles.tabContent}>
                                                    {activeTab === 'process_logs' && (<div className={styles.logsContainer}>
                                                        {channelData.processLogs?.length ? (
                                                            channelData.processLogs.map((log, index) => (
                                                                <div key={`${item.id}-log-${index}`} className={styles.logEntry}>
                                                                    <div className={styles.logHeader}>
                                                                        <span
                                                                            className={styles.logStatus}
                                                                            style={{
                                                                                backgroundColor:
                                                                                    log.statusCode >= 200 && log.statusCode < 300
                                                                                        ? '#28a745'
                                                                                        : log.statusCode >= 400 && log.statusCode < 500
                                                                                            ? '#ffc107'
                                                                                            : '#dc3545',
                                                                            }}
                                                                        >
                                                                            {log.statusCode}
                                                                        </span>
                                                                        <span className={styles.logTime}>{formatDate(log.createdAt)}</span>
                                                                    </div>
                                                                    <div className={styles.logMessage}>{log.message}</div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className={styles.logEntry}>No process logs available</div>
                                                        )}
                                                    </div>)}
                                                    {activeTab === 'message_details' && (<>
                                                        {decodedMessage ? (
                                                            <>
                                                                <div className={styles.messagEntry}>
                                                                    {
                                                                        Object.entries(decodedMessage).map(([key, value]) => (
                                                                            <div key={key} className={styles.messageItems}>
                                                                                <strong>{key}:</strong>
                                                                                <span>
                                                                                    {typeof value === 'object'
                                                                                        ? JSON.stringify(value).length > 100
                                                                                            ? JSON.stringify(value).substring(0, 100) + '...'
                                                                                            : JSON.stringify(value)
                                                                                        : (value?.toString()?.length > 100
                                                                                            ? value.toString().substring(0, 100) + '...'
                                                                                            : value || 'N/A')}
                                                                                </span>                                                                    </div>
                                                                        ))
                                                                    }
                                                                </div>


                                                            </>
                                                        ) : (
                                                            <div>Message details unavailable</div>
                                                        )}</>)}
                                                </div>



                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>

            <div className={styles.paginationControls}>
                <div className={styles.pageSizeSelector}>
                    <label htmlFor="pageSize">Items per page:</label>
                    <select
                        id="pageSize"
                        value={pagination.pageSize}
                        onChange={handlePageSizeChange}
                        disabled={isLoading}
                    >
                        <option value={5}>5</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>

                <div className={styles.pageNavigation}>
                    <button
                        onClick={() => handlePageChange(1)}
                        disabled={pagination.page === 1 || isLoading}
                    >
                        «
                    </button>
                    <button
                        onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                        disabled={pagination.page === 1 || isLoading}
                    >
                        ‹
                    </button>

                    <span className={styles.pageInfo}>
                        Page {pagination.page} of {totalPages}
                    </span>

                    <button
                        onClick={() => handlePageChange(Math.min(totalPages, pagination.page + 1))}
                        disabled={pagination.page >= totalPages || isLoading}
                    >
                        ›
                    </button>
                    <button
                        onClick={() => handlePageChange(totalPages)}
                        disabled={pagination.page >= totalPages || isLoading}
                    >
                        »
                    </button>
                </div>

                <div className={styles.totalItems}>
                    Total: {pagination.total} items
                </div>
            </div>
        </div>
    );
};

export default ChannelLogs;