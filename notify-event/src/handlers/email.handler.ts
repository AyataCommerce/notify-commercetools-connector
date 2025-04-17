import GlobalError from '../errors/global.error';
import { ChannelHandler } from '../interface/channels.interface';
import { decryptString } from '../utils/helpers.utils';
import { logger } from '../utils/logger.utils';
import sgMail from '@sendgrid/mail'

const SG_API_KEY = process.env.SENDGRID_API_KEY || 'INVALID_API_KEY'
const twilio_sid = process.env.TWILIO_ACCOUNT_SID || '';

sgMail.setApiKey(SG_API_KEY)

export const emailHandler: ChannelHandler = {
    async sendMessage(message, senderAddress, recipient, subject) {
        try {
            logger.info(`twilio sid is : ${twilio_sid}`)
            const decryptedSenderAddress = await decryptString(senderAddress, twilio_sid)

            logger.info(`Sending email message to ${recipient}`);
            logger.info(message);
            const msg = {
                to: recipient,
                from: decryptedSenderAddress,
                subject: subject,
                text: message,
                html: message,
            };
            const response = await sgMail.send(msg);
            return response;
        } catch (error: any) {
            logger.error(`Error sending email message: ${error}`);
            throw new GlobalError(error.statusCode || 500, error.message || `Failed to send message`);

        }
    },
};