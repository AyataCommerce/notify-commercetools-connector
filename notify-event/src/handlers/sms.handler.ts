import twilio, { Twilio } from 'twilio';
import { ChannelHandler } from "../interface/channels.interface";
import { logger } from "../utils/logger.utils";
import GlobalError from '../errors/global.error';
import { decryptString } from '../utils/helpers.utils';

const client: Twilio = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
const twilio_sid = process.env.TWILIO_ACCOUNT_SID || '';

export const smsHandler: ChannelHandler = {
    async sendMessage(message, senderAddress, recipient) {
        try {
            const decryptedSenderAddress = await decryptString(senderAddress, twilio_sid)
            logger.info(`Sending SMS message to ${recipient}`);
            logger.info(message);
            // // Send the message
            const response = await client.messages.create({
                body: message,
                from: decryptedSenderAddress,
                to: recipient
            });
            return response;
        } catch (error: any) {
            logger.error(`Error sending SMS message: ${error}`);
            throw new GlobalError(error.statusCode || 500, error.message || `Failed to send message`);

        }
    },
};
