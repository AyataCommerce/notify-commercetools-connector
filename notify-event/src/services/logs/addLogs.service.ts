import { ProcessLogInterface, LogValueInterface } from "../../interface/log.interface";
import { PubsubMessageBody } from "../../interface/pubsub.interface";
import {
    getCustomObjectRepository,
    updateCustomObjectRepository
} from "../../repository/customObjects/customObjects.repository";
import { jsonToBase64 } from "../../utils/helpers.utils";
import { logger } from "../../utils/logger.utils";
import GlobalError from "../../errors/global.error";

export const getMessageLogs = async (messageId: string): Promise<LogValueInterface | null> => {
    try {
        const existingLogs = await getCustomObjectRepository("notify-messagelogs", messageId);
        return existingLogs?.value || null;
    } catch (error) {
        logger.error(`Error fetching logs for message ${messageId}:`, error);
        throw new GlobalError({
            statusCode: 500,
            message: 'Failed to retrieve message logs',
            details: error instanceof Error ? error.message : String(error)
        });
    }
};

export const updateMessageLogs = async (
    messageId: string,
    channel: string,
    recipient: string,
    isSent: boolean,
    processLog: ProcessLogInterface,
    message: PubsubMessageBody
): Promise<void> => {
    try {
        const now = new Date().toISOString();
        let existingLogs: LogValueInterface | null;
        let version = 0;

        try {
            const existing = await getCustomObjectRepository("notify-messagelogs", messageId);
            existingLogs = existing?.value || null;
            version = existing?.version || 0;
        } catch {
            existingLogs = null;
        }

        const baseLogValue: LogValueInterface = {
            message: jsonToBase64(message),
            channels: {
                [channel]: {
                    isSent,
                    lastProcessedDate: now,
                    recipient,
                    processLogs: [processLog]
                }
            }
        };

        const updatedLogs = existingLogs
            ? updateExistingLogs(existingLogs, channel, recipient, isSent, processLog, now)
            : baseLogValue;

        await updateCustomObjectRepository({
            container: "notify-messagelogs",
            key: messageId,
            version,
            value: updatedLogs
        });

        logger.info(`Successfully updated logs for message ${messageId} on channel ${channel}`);
    } catch (error) {
        logger.error(`Error updating logs for message ${messageId}:`, error);
        throw new GlobalError({
            statusCode: 500,
            message: 'Failed to update message logs',
            details: error instanceof Error ? error.message : String(error),
            channel,
            messageId
        });
    }
};

const updateExistingLogs = (
    existingLogs: LogValueInterface,
    channel: string,
    recipient: string,
    isSent: boolean,
    processLog: ProcessLogInterface,
    timestamp: string
): LogValueInterface => {
    const updatedLogs = { ...existingLogs };

    if (!updatedLogs.channels) {
        updatedLogs.channels = {};
    }

    if (!updatedLogs.channels[channel]) {
        updatedLogs.channels[channel] = {
            isSent,
            lastProcessedDate: timestamp,
            recipient,
            processLogs: [processLog]
        };
    } else {
        updatedLogs.channels[channel] = {
            ...updatedLogs.channels[channel],
            isSent,
            lastProcessedDate: timestamp,
            processLogs: [
                ...(updatedLogs.channels[channel].processLogs || []),
                processLog
            ]
        };
    }

    return updatedLogs;
};

export const addProcessLog = async (
    messageId: string,
    channel: string,
    recipient: string,
    status: {
        message: string;
        statusCode: string;
        isSent: boolean;
    },
    message: PubsubMessageBody
): Promise<void> => {
    const processLog: ProcessLogInterface = {
        message: status.message,
        statusCode: status.statusCode,
        createdAt: new Date().toISOString()
    };

    await updateMessageLogs(
        messageId,
        channel,
        recipient,
        status.isSent,
        processLog,
        message
    );
};