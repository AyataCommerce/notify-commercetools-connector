import { emailHandler } from "../../handlers/email.handler";
import { smsHandler } from "../../handlers/sms.handler";
import { whatsappHandler } from "../../handlers/whatsapp.handler";
import { ChannelAndSubscriptions, ChannelHandler, ChannelInterfaceResponse } from "../../interface/channels.interface";
import { MessageStateRequest, MessageStateResponse } from "../../interface/messageState.interface";
import { updateCustomObjectRepository } from "../../repository/customObjects/customObjects.repository";
import { fetchResource } from "../../repository/allResources/resource.repository";
import { parsePlaceholder } from "../../utils/helpers.utils";
import { logger } from "../../utils/logger.utils";
import { PubsubMessageBody } from "../../interface/pubsub.interface";
import { addProcessLog } from "../logs/addLogs.service";
import GlobalError from "../../errors/global.error";

export const handlers: Record<string, ChannelHandler> = {
    sms: smsHandler,
    whatsapp: whatsappHandler,
    email: emailHandler
};

type ChannelProcessingStatus = "processing" | boolean;

export interface ChannelProcessingState {
    isSent: ChannelProcessingStatus;
    retry: number;
}

export const getChannelHandler = (channel: string): ChannelHandler => {
    const handler = handlers[channel];
    if (!handler) {
        throw new GlobalError(`No handler found for channel: ${channel}`, '400');
    }
    return handler;
};

export const addNewMessageStateEntry = async (
    message: PubsubMessageBody,
    channelsAndSubscriptions: ChannelAndSubscriptions
) => {
    try {
        const channels: ChannelInterfaceResponse = channelsAndSubscriptions.value.references.obj;
        const allChannels = Object.keys(channels.value);
        const enabledChannels = Object.entries(channels.value)
            .filter(([_, config]) => config.configurations.isEnabled)
            .map(([channelName]) => channelName);


        const channelsToSend = enabledChannels.filter((channel) => {
            const channelSubscriptions = channelsAndSubscriptions.value.channels[channel]?.subscriptions || [];
            const hasTriggerType = channelSubscriptions.some(subscription =>
                subscription.triggers.some(trigger => trigger.triggerType === message.type)
            );
            return hasTriggerType;
        });

        const channelsProcessed = allChannels.reduce((acc, channelName) => {
            acc[channelName] = {
                isSent: channelsToSend.includes(channelName) ? "processing" : false,
                retry: 0
            };
            return acc;
        }, {} as Record<string, ChannelProcessingState>);

        const newMessageState: MessageStateRequest = {
            container: "notify-messageState",
            version: 0,
            key: message.id,
            value: {
                channelsProcessed,
                message,
            },
        };

        const newMessageStateResponse = await updateCustomObjectRepository(newMessageState);
        await processDeliveringMessage(newMessageStateResponse, channelsAndSubscriptions, message);
        return newMessageState;
    } catch (error) {
        logger.error(`Error in addNewMessageStateEntry for message ${message.id}:`, error);
        throw error;
    }
};

export const processDeliveringMessage = async (
    currentMessageState: MessageStateResponse,
    channelsAndSubscriptions: ChannelAndSubscriptions,
    message: PubsubMessageBody
): Promise<boolean> => {
    try {
        const channels: ChannelInterfaceResponse = channelsAndSubscriptions.value.references.obj;


        const enabledChannels = Object.entries(channels.value)
            .filter(([_, config]) => config.configurations.isEnabled)
            .map(([channelName]) => channelName);

        const channelsToSend = enabledChannels.filter((channel) => {
            const channelState = currentMessageState.value.channelsProcessed[channel];

            const retryCount = channelState.retry;

            const channelSubscriptions = channelsAndSubscriptions.value.channels[channel]?.subscriptions || [];
            const hasTriggerType = channelSubscriptions.some(subscription =>
                subscription.triggers.some(trigger => trigger.triggerType === message.type)
            );

            if (channelState.isSent === "processing" || channelState.isSent === false) {
                channelState.retry = retryCount + 1;
            }

            // Only process if not already successfully sent and has matching trigger
            return channelState.isSent !== true && hasTriggerType;
        });

        if (channelsToSend.length === 0) {
            logger.debug(`No channels to process for message ${message.id}`);
            // Check if all channels are successfully sent
            return checkAllChannelsCompleted(currentMessageState);
        }

        const currentResource = await fetchResource(message.resource.typeId, message.resource.id, message);
        await deliverMessages(
            currentMessageState,
            channelsToSend,
            channels,
            currentResource,
            message
        );

        await updateCustomObjectRepository({
            container: "notify-messageState",
            key: message.id,
            version: currentMessageState.version,
            value: currentMessageState.value,
        });

        // Final check if all channels are completed
        return checkAllChannelsCompleted(currentMessageState);
    } catch (error) {
        logger.error(`Error in processDeliveringMessage for message ${message.id}:`, error);
        throw error;
    }
};

export const checkAllChannelsCompleted = (messageState: MessageStateResponse): boolean => {
    return Object.values(messageState.value.channelsProcessed).every(
        channelState => channelState.isSent === true
    );
};

export const deliverMessages = async (
    currentMessageState: MessageStateResponse,
    channelsToSend: string[],
    channels: ChannelInterfaceResponse,
    currentResource: object,
    message: PubsubMessageBody
): Promise<boolean> => {
    logger.info('started sending....')
    const sendResults = await Promise.allSettled(channelsToSend.map(async (channel) => {
        try {
            const handler = getChannelHandler(channel);
            const channelConfig = channels.value[channel];

            const channelState = currentMessageState.value.channelsProcessed[channel];

            if (!channelConfig.configurations) {
                throw new GlobalError('400', `Configuration not found for channel: ${channel}`);
            }
            const senderAddress = channelConfig.configurations.sender_id;
            logger.info(`sender address id is ${senderAddress}`)
            const rawSubject = channelConfig.configurations.messageBody?.[message.type]?.subject || ''
            const recipientPath = channelConfig.configurations.messageBody?.[message.type]?.sendToPath;
            const messageBodyPath = channelConfig.configurations.messageBody?.[message.type]?.message;

            if (!recipientPath || !messageBodyPath) {
                throw new GlobalError('400', `Message configuration not found for channel ${channel} and type ${message.type}`);
            }

            const generatedMessageBody = parsePlaceholder(currentResource, messageBodyPath);
            const subject = parsePlaceholder(currentResource, rawSubject) || '';
            const recipient = parsePlaceholder(currentResource, `{{${recipientPath}}}`);
            if (!recipient) {
                throw new GlobalError('400', `Invalid receiver address for channel ${channel} and type ${message.type}`);
            }

            if (!generatedMessageBody) {
                throw new GlobalError('400', `Failed to generate message body for channel ${channel}`);
            }

            if (!recipient) {
                throw new GlobalError('400', `Recipient not found for channel ${channel}`);
            }

            // Mark as processing before attempting to send
            channelState.isSent = "processing";

            await handler.sendMessage(generatedMessageBody, senderAddress, recipient, subject);

            // Update state only after successful send
            channelState.isSent = true;

            await addProcessLog(
                message.id,
                channel,
                recipient,
                {
                    message: "Message sent successfully",
                    statusCode: "200",
                    isSent: true,
                },
                message
            );

            return true;
        } catch (error: any) {
            logger.error(`Error sending to ${channel} for message ${message.id}:`, error);

            const channelState = currentMessageState.value.channelsProcessed[channel];
            channelState.isSent = false;

            const errorMessage = error instanceof GlobalError ? error.message : "Unknown error";
            const errorStatusCode = error instanceof GlobalError ? error.statusCode : 500;

            await addProcessLog(
                message.id,
                channel,
                "",
                {
                    message: errorMessage,
                    statusCode: errorStatusCode.toString(),
                    isSent: false,
                },
                message
            );

            return false;
        }
    }));

    return sendResults.every(result =>
        result.status === 'fulfilled' && result.value === true
    );
};

