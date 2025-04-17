import { createApiRoot } from "../../client/create.client";
import GlobalError from "../../errors/global.error";
import { CreateCustomObjectInterface } from "../../interface/customObject.interface";


const apiRoot = createApiRoot();

export const updateCustomObjectRepository = async (objectBody: CreateCustomObjectInterface) => {

    try {
        const response = await apiRoot.customObjects()
            .post({
                body: {
                    container: objectBody.container,
                    version: objectBody?.version,
                    key: objectBody.key,
                    value: objectBody.value
                }
            })
            .execute();
        return response.body;
    } catch (error: any) {
        throw new GlobalError(error.statusCode || 500, error.message || `Failed to create ${objectBody.container}`);
    }

};

export const getCustomObjectRepository = async (container: string, key: string, expandQuery?: string) => {

    try {
        const response = await apiRoot.customObjects()
            .withContainerAndKey({ container, key })
            .get({ queryArgs: { expand: expandQuery } })
            .execute();
        return response.body;
    } catch (error: any) {
        throw new GlobalError(error.statusCode || 500, error.message || `Failed to fetch ${container}`);
    }

};

export const getSingleCustomObjectRepository = async (container: string) => {

    try {
        const response = await apiRoot.customObjects().withContainer({ container: container }).get().execute();
        return response.body.results;
    } catch (error: any) {
        throw new GlobalError(error.statusCode || 500, error.message || `Failed to fetch ${container}`);
    }

};

export const checkIfCustomObjectExists = async (container: string, key: string) => {
    try {
        const response = await apiRoot.customObjects()
            .withContainerAndKey({ container, key })
            .get()
            .execute();

        if (response && response.statusCode === 200 && response.body.id) {
            return true || response;
        } else {
            return false;
        }
    } catch (error) {

        return false;
    }
};



export const deleteCustomObjectRepository = async (container: string, key: string) => {
    try {
        const response = await apiRoot.customObjects()
            .withContainerAndKey({ container, key })
            .delete()
            .execute();
        return response.body;
    } catch (error: any) {
        throw new GlobalError(error.statusCode || 500, error.message || `Failed to delete ${container}`);
    }
};