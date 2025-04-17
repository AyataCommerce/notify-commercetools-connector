import { actions } from '@commercetools-frontend/sdk';
import { MC_API_PROXY_TARGETS } from '@commercetools-frontend/constants';
import { ApiResponse } from '../interfaces/messages.interface';

export const fetchMessageBodyObject = async (dispatch: any) => {
    try {
        const result = await dispatch(
            actions.get({
                mcApiProxyTarget: MC_API_PROXY_TARGETS.COMMERCETOOLS_PLATFORM,
                service: 'customObjects',
                options: {
                    id: 'messageBody',
                },
            })
        ) as ApiResponse;

        return result.results;
    } catch (error) {
        console.error('Error fetching custom objects:', error);
        throw error;
    }
};

export const updateMessageBodyObject = async (dispatch: any, payload: object) => {
    try {
        await dispatch(
            actions.post({
                mcApiProxyTarget: MC_API_PROXY_TARGETS.COMMERCETOOLS_PLATFORM,
                service: 'customObjects',
                options: {},
                payload: payload
            })
        );
    } catch (error) {
        console.error('Error fetching custom objects:', error);
        throw error;
    }
};

export const fetchOrders = async (dispatch: any) => {
    try {
        const result = await dispatch(
            actions.get({
                mcApiProxyTarget: MC_API_PROXY_TARGETS.COMMERCETOOLS_PLATFORM,
                service: 'orders',
                options: {},
            })
        ) as ApiResponse;

        return result.results;
    } catch (error) {
        console.error('Error fetching orders:', error);
        throw error;
    }
};

// export const fetch = async (dispatch: any) => {
//     try {
//         const result = await dispatch(
//             actions.get({
//                 mcApiProxyTarget: MC_API_PROXY_TARGETS.COMMERCETOOLS_PLATFORM,
//                 uri: ''
//             })
//         );

//         return result.results;
//     } catch (error) {
//         console.error('Error fetching orders:', error);
//         throw error;
//     }
// };