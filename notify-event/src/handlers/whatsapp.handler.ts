import twilio, { Twilio } from 'twilio';
import { ChannelHandler } from '../interface/channels.interface';
import { logger } from '../utils/logger.utils';
import { GlobalError } from '../errors/global.error';
import { decryptString } from '../utils/helpers.utils';

const client: Twilio = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const twilio_sid = process.env.TWILIO_ACCOUNT_SID || '';
export const whatsappHandler: ChannelHandler = {
    async sendMessage(message, senderAddress, recipientAddress) {
        try {
                        logger.info(`twilio sid is : ${twilio_sid}`)
            
            const decryptedSenderAddress = await decryptString(senderAddress, twilio_sid)
            logger.info(`Sending WhatsApp message to ${recipientAddress}`);
            logger.info(message);

            const response = await client.messages.create({
                body: message,
                from: `whatsapp:${decryptedSenderAddress}`,
                to: `whatsapp:${recipientAddress}`,
            });
            return response;
        } catch (error: any) {
            logger.error(`Error sending WhatsApp message: ${error}`);
            throw new GlobalError(error.statusCode || 500, error.message || `Failed to send message`);
        }
    },
};