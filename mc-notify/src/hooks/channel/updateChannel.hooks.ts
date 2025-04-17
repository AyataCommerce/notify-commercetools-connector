import { ChannelConfigurationRequest, MessageBody, MessagingChannel } from "../../interfaces/channel.interface";
import { CreateCustomObjectInterface } from "../../interfaces/customObject.interface";
import { fetchCustomObjectRepository, updateCustomObjectRepository } from "../../repository/customObject.repository";

export const toggleChannelStatusHook = async (dispatch: any, channel: string, updateRequest: ChannelConfigurationRequest) => {

    try {
        // Fetch the existing object
        const response = await fetchCustomObjectRepository(dispatch, 'notify-channels', 'notify-channels-key');
        if (!response) {
            throw new Error('Notification channels not found');
        }

        // Check if the requested channel exists
        const channelData: MessagingChannel = response.value[channel];
        if (!channelData) {
            throw new Error(`Channel '${channel}' not found`);
        }

        // Update the `isEnabled` field
        channelData.configurations.isEnabled = updateRequest.isEnabled;

        // Prepare the updated object with the correct version
        const updatedObject: CreateCustomObjectInterface = {
            container: response.container,
            key: response.key,
            version: response.version,
            value: response.value,
        };

        // Save the updated object
        const updatedResponse = await updateCustomObjectRepository(dispatch, updatedObject);

        return { message: `Channel '${channel}' updated successfully`, updatedChannel: updatedResponse.value[channel] };
    } catch (error) {
        throw error;
    }
};

export const updateSenderId = async (dispatch: any, channel: string, updateRequest: ChannelConfigurationRequest) => {

    try {
        // Fetch the existing object
        const response = await fetchCustomObjectRepository(dispatch, 'notify-channels', 'notify-channels-key');
        if (!response) {
            throw new Error('Notification channels not found');
        }

        // Check if the requested channel exists
        const channelData: MessagingChannel = response.value[channel];
        if (!channelData) {
            throw new Error(`Channel '${channel}' not found`);
        }

        // Update the `sender_id` field
        channelData.configurations.sender_id = updateRequest.sender_id;

        // Prepare the updated object with the correct version
        const updatedObject: CreateCustomObjectInterface = {
            container: response.container,
            key: response.key,
            version: response.version,
            value: response.value,
        };

        // Save the updated object
        const updatedResponse = await updateCustomObjectRepository(dispatch, updatedObject);

        return { message: `Channel '${channel}' updated successfully`, updatedChannel: updatedResponse.value[channel] };
    } catch (error) {
        throw error;
    }
};

export const updateMessageBodyHook = async (
    dispatch: any,
    channel: string,
    updateRequest: MessageBody
) => {
    try {
        // Fetch the existing object
        const response = await fetchCustomObjectRepository(
            dispatch,
            'notify-channels',
            'notify-channels-key'
        );

        if (!response) {
            throw new Error('Notification channels not found');
        }

        // Check if the requested channel exists
        if (!response.value[channel]) {
            throw new Error(`Channel '${channel}' not found`);
        }

        // Ensure `configurations` and `messageBody` exist
        if (!response.value[channel].configurations) {
            response.value[channel].configurations = {};
        }
        if (!response.value[channel].configurations.messageBody) {
            response.value[channel].configurations.messageBody = {};
        }

        // Update or add message body fields
        Object.keys(updateRequest).forEach((key) => {
            // If the trigger doesn't exist, create it
            if (!response.value[channel].configurations.messageBody[key]) {
                response.value[channel].configurations.messageBody[key] = {
                    subject: '',
                    message: '',
                    sendToPath: ''
                };
            }

            // Update the values
            if (updateRequest[key].subject !== undefined) {
                response.value[channel].configurations.messageBody[key].subject =
                    updateRequest[key].subject;
            }
            if (updateRequest[key].message !== undefined) {
                response.value[channel].configurations.messageBody[key].message =
                    updateRequest[key].message;
            }
            if (updateRequest[key].sendToPath !== undefined) {
                response.value[channel].configurations.messageBody[key].sendToPath =
                    updateRequest[key].sendToPath;
            }
        });

        // Prepare the updated object with the correct version
        const updatedObject = {
            container: response.container,
            key: response.key,
            version: response.version,
            value: response.value,
        };

        // Save the updated object
        const updatedResponse = await updateCustomObjectRepository(dispatch, updatedObject);

        return {
            message: `Message body for '${channel}' updated successfully`,
            updatedMessageBody: updatedResponse.value[channel].configurations.messageBody,
        };
    } catch (error) {
        throw error;
    }
};
