import { MC_API_PROXY_TARGETS } from "@commercetools-frontend/constants";
import { actions } from '@commercetools-frontend/sdk';

export const fetchCurrentResourceData = async (dispatch: any, resourceType: string) => {
    const validatedResourceType = resourceValidator(resourceType);
    console.log('validatedResourceType resource : ', validatedResourceType);

    try {
        const result = await dispatch(
            actions.get({
                mcApiProxyTarget: MC_API_PROXY_TARGETS.COMMERCETOOLS_PLATFORM,
                service: validatedResourceType,
                options: {},
            })
        );

        return result.results;
    } catch (error) {
        console.error(`Error fetching ${resourceType}:`, error);
        throw error;
    }
}

function resourceValidator(resource: string) {
    switch (resource) {
        case 'inventory':
            return 'inventory';
        case 'category':
            return 'categories';
        case 'product-tailoring':
            return 'product-tailoring';
        default:
            return `${resource}s`;
    }
}
