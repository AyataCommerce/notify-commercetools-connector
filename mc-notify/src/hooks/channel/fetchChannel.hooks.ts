import { fetchCustomObjectRepository } from "../../repository/customObject.repository";



export const fetchAllChannelsHook = async (dispatch: any) => {
    try {
        const response = await fetchCustomObjectRepository(dispatch, 'notify-channels', 'notify-channels-key');
        if (!response) {
            throw new Error('Channel not found');
        }
        return response;
    } catch (error) {
        throw error;
    }
}

export const fetchChannelHook = async (dispatch: any, channel: string) => {
    try {
        const response = await fetchCustomObjectRepository(dispatch, 'notify-channels', 'notify-channels-key');
        if (!response) {
            throw new Error('Channel not found');
        }
        const channelData = response.value[channel];
        if (!channelData) {
            throw new Error(`Channel '${channel}' not found`);
        }
        return channelData;
    } catch (error) {
        throw error;
    }
};
