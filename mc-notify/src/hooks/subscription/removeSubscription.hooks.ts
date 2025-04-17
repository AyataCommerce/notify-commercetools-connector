import { logger } from "@commercetools-frontend/application-shell-connectors";
import { RemoveSubscriptionRequestInterface } from "../../interfaces/subscription.interface";
import { fetchCustomObjectRepository, updateCustomObjectRepository } from "../../repository/customObject.repository";
import { deleteCommerceToolsSubscriptionRepository, updateCommerceToolsSubscriptionRepository } from "../../repository/subscription.repository";

export const removeSubscriptionHook = async (dispatch: any, removeSubscriptionInterface: RemoveSubscriptionRequestInterface) => {
    try {
        const { channel, subscription } = removeSubscriptionInterface;
        const subscriptionKey = `notify-${subscription.resourceType}-subscription`;

        // Fetch custom object and prepare Commerce Tools operations in parallel
        const [currentCustomObject] = await Promise.all([
            fetchCustomObjectRepository(dispatch, "notify-subscriptions", "notify-subscriptions-key")
        ]);

        const updatedValue = structuredClone(currentCustomObject.value); // Faster than JSON.parse/stringify
        const currentChannel = updatedValue.channels[channel];

        if (!currentChannel) {
            throw new Error(`Channel ${channel} not found`);
        }

        const subscriptionIndex = currentChannel.subscriptions.findIndex((currentSubscription: { triggerType: string, resourceType: string }) =>
            (currentSubscription.resourceType === subscription.resourceType)
        );

        if (subscriptionIndex === -1) {
            throw new Error(`Subscription for resource type ${subscription.resourceType} not found`);
        }

        const currentSubscription = currentChannel.subscriptions[subscriptionIndex];
        const updatedTriggers = currentSubscription.triggers.filter(
            (trigger: { triggerType: string }) => trigger.triggerType !== subscription.triggerType
        );

        // Handle Commerce Tools operations and custom object update in parallel
        if (updatedTriggers.length === 0) {
            currentChannel.subscriptions.splice(subscriptionIndex, 1);

            // Execute delete operation and custom object update in parallel
            await Promise.all([
                deleteCommerceToolsSubscriptionRepository(dispatch, subscriptionKey)
                    .then(() => logger.info(`Deleted Commerce Tools subscription ${subscriptionKey}`))
                    .catch(error => logger.error(`Failed to delete Commerce Tools subscription ${subscriptionKey}`, error)),
                updateCustomObjectRepository(dispatch, {
                    container: "notify-subscriptions",
                    key: "notify-subscriptions-key",
                    version: currentCustomObject.version,
                    value: updatedValue
                })
            ]);
        } else {
            currentChannel.subscriptions[subscriptionIndex].triggers = updatedTriggers;
            const remainingTriggerTypes = updatedTriggers.map(
                (trigger: { triggerType: string }) => trigger.triggerType
            );

            // Execute update operation and custom object update in parallel
            await Promise.all([
                updateCommerceToolsSubscriptionRepository(
                    dispatch,
                    subscriptionKey,
                    subscription.resourceType,
                    remainingTriggerTypes
                )
                    .then(() => logger.info(`Updated Commerce Tools subscription ${subscriptionKey}`))
                    .catch(error => logger.error(`Failed to update Commerce Tools subscription ${subscriptionKey}`, error)),
                updateCustomObjectRepository(dispatch, {
                    container: "notify-subscriptions",
                    key: "notify-subscriptions-key",
                    version: currentCustomObject.version,
                    value: updatedValue
                })
            ]);
        }

        return updatedValue;
    } catch (error) {
        throw error;
    }
};
