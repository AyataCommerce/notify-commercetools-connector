import { actions } from '@commercetools-frontend/sdk';
import { MC_API_PROXY_TARGETS } from '@commercetools-frontend/constants';
import { ApiResponse } from '../interfaces/notifications.interface';
import { LogState } from '../interfaces/LogState.interface';

export const fetchAllNotificationsObject = async (dispatch: any, limit: number) => {
    try {
        const result = await dispatch(
            actions.get({
                mcApiProxyTarget: MC_API_PROXY_TARGETS.COMMERCETOOLS_PLATFORM,
                service: 'customObjects',
                options: {
                    id: `notifications?limit=${limit}`,
                },
            })
        ) as ApiResponse;

        return result.results;
    } catch (error) {
        console.error('Error fetching custom objects:', error);
        throw error;
    }
};
export const fetchNotificationsObject = async (dispatch: any, id: string) => {
    try {
        const result = await dispatch(
            actions.get({
                mcApiProxyTarget: MC_API_PROXY_TARGETS.COMMERCETOOLS_PLATFORM,
                service: 'customObjects',
                options: {
                    id: id,
                },
            })
        ) as LogState;
        return result;
    } catch (error) {
        console.error('Error fetching custom objects:', error);
        throw error;
    }
};


export const deleteAllCustomObjects = async (dispatch: any) => {
    console.log('deleteAllCustomObjects');
    try {
        // Get all custom objects with type 'notifications'
        const result = await dispatch(
            actions.get({
                mcApiProxyTarget: MC_API_PROXY_TARGETS.COMMERCETOOLS_PLATFORM,
                service: 'customObjects',
                options: {
                    id: 'notifications',

                },
            })
        ) as ApiResponse;
        console.log(result);
        // Delete each custom object
        const deletePromises = result.results.map(async (obj: any) => {
            await dispatch(
                actions.del({
                    mcApiProxyTarget: MC_API_PROXY_TARGETS.COMMERCETOOLS_PLATFORM,
                    service: 'customObjects',
                    options: {
                        container: obj.container,
                        key: obj.key,
                    },
                })
            );
        });

        await Promise.all(deletePromises);

    } catch (error) {
        console.error('Error deleting custom objects:', error);
        throw error;
    }
};


// <SecondaryButton iconLeft={<ExportIcon />} label="del" onClick={() => { deleteAllCustomObjects(dispatch) }} />
