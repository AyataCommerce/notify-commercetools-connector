import { MC_API_PROXY_TARGETS } from "@commercetools-frontend/constants";
import { actions } from '@commercetools-frontend/sdk';
import { CreateCustomObjectInterface } from "../interfaces/customObject.interface";


export const fetchAllCustomObjectsRepository = async (
    dispatch: any,
    container: string,
    options: { limit?: number; offset?: number } = {}
) => {
    try {
        const result = await dispatch(
            actions.get({
                mcApiProxyTarget: MC_API_PROXY_TARGETS.COMMERCETOOLS_PLATFORM,
                service: 'customObjects',
                options: {
                    id: container,
                    container: `${container}?limit=${options.limit}?offset=${options.offset}?sort=createdAt desc`,
                },
            })
        );

        return result;
    } catch (error) {
        console.error('Error fetching custom all objects:', error);
        throw error;
    }
};

export const fetchCustomObjectsCount = async (dispatch: any, container: string) => {
    try {
        const result = await dispatch(
            actions.get({
                mcApiProxyTarget: MC_API_PROXY_TARGETS.COMMERCETOOLS_PLATFORM,
                service: 'customObjects',
                options: {
                    id: container,
                    container: `${container}?limit=${1}`,
                },
            })
        );

        return result.total || 0;
    } catch (error) {
        console.error('Error fetching custom objects count:', error);
        throw error;
    }
};

export const fetchCustomObjectRepository = async (dispatch: any, container: string, key: string) => {
    try {
        const result = await dispatch(
            actions.get({
                mcApiProxyTarget: MC_API_PROXY_TARGETS.COMMERCETOOLS_PLATFORM,
                service: 'customObjects',
                options: {
                    container: container,
                    key: key,
                },
            })
        );

        return result;
    } catch (error) {
        console.error('Error fetching custom objects:', error);
        throw error;
    }
};


export const fetchCustomObjectQueryRepository = async (dispatch: any, container: string, key: string, Query?: string) => {
    try {
        const result = await dispatch(
            actions.get({
                mcApiProxyTarget: MC_API_PROXY_TARGETS.COMMERCETOOLS_PLATFORM,
                service: 'customObjects',
                options: {
                    container: container,
                    key: `${key}?${Query}`,
                },
            })
        );

        return result;
    } catch (error) {
        console.error('Error fetching custom objects:', error);
        throw error;
    }
};

export const updateCustomObjectRepository = async (dispatch: any, objectBody: CreateCustomObjectInterface) => {
    try {
        const result = await dispatch(
            actions.post({
                mcApiProxyTarget: MC_API_PROXY_TARGETS.COMMERCETOOLS_PLATFORM,
                service: 'customObjects',
                options: {},
                payload: {
                    container: objectBody.container,
                    key: objectBody.key,
                    value: objectBody.value
                }
            })
        );



        return result;
    } catch (error) {
        console.error('Error updating custom object:', error);
        throw error;
    }
};