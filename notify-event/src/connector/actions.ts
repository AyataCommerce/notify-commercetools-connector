import { GoogleCloudPubSubDestination } from '@commercetools/platform-sdk';
import { deleteCustomObjectRepository, getCustomObjectRepository, getSingleCustomObjectRepository, updateCustomObjectRepository } from '../repository/customObjects/customObjects.repository';
import { CreateCustomObjectInterface } from '../interface/customObject.interface';
import { removeSubscriptionRepository } from '../repository/subscription/subscription.repository';
import { logger } from '../utils/logger.utils';
import { ChannelInterfaceRequest } from '../interface/channels.interface';
import { SubscriptionInterfaceRequest } from '../interface/subscription.interface';

export async function createNotifyObjects(topicName: string, projectId: string): Promise<void> {
  const destination: GoogleCloudPubSubDestination = {
    type: 'GoogleCloudPubSub',
    topic: topicName,
    projectId,
  };
  await createInitialProjectCustomObjects(destination);
}

async function createInitialProjectCustomObjects(destination: GoogleCloudPubSubDestination) {

  const channelContainer = await initializeChannels();
  await initializeSubscriptions(channelContainer.id, destination);
  await initializeTriggerList();
}

// create channel container
async function initializeChannels() {
  const channelBody: ChannelInterfaceRequest = {
    container: "notify-channels",
    key: "notify-channels-key",
    value: {
      whatsapp: {
        configurations: {
          isEnabled: false,
          messageBody: {},
          sender_id: ''
        }
      },
      email: {
        configurations: {
          isEnabled: false,
          messageBody: {},
          sender_id: ''
        }
      },
      sms: {
        configurations: {
          isEnabled: false,
          messageBody: {},
          sender_id: ''
        }
      }
    }
  }
  const response = await updateCustomObjectRepository(channelBody)
  return response;
}

async function initializeSubscriptions(channelId: string, destination: GoogleCloudPubSubDestination) {
  const subscriptionBody: SubscriptionInterfaceRequest = {
    container: "notify-subscriptions",
    key: "notify-subscriptions-key",
    value: {
      pubsubReference: {
        projectId: destination.projectId,
        topic: destination.topic
      },
      references: {
        id: channelId,
        typeId: "key-value-document"
      },
      channels: {
        whatsapp: {
          subscriptions: []
        },
        sms: {
          subscriptions: []
        },
        email: {
          subscriptions: []
        }
      }
    }
  }
  const response = await updateCustomObjectRepository(subscriptionBody)
  return response;
}

async function initializeTriggerList() {
  const triggerListBody: CreateCustomObjectInterface = {
    container: "notify-trigger-list",
    key: "notify-trigger-list-key",
    value: {
      "category": [
        "CategoryCreated",
        "CategorySlugChanged"
      ],
      "customer": [
        "CustomerCreated",
        "CustomerAddressChanged",
        "CustomerEmailChanged",
        "CustomerEmailVerified",
        "CustomerFirstNameSet",
        "CustomerLastNameSet",
        "CustomerTitleSet",
        "CustomerCompanyNameSet",
        "CustomerDateOfBirthSet",
        "CustomerGroupSet",
        "CustomerAddressRemoved",
        "CustomerAddressAdded",
        "CustomerPasswordUpdated",
        "CustomerCustomFieldAdded",
        "CustomerCustomFieldChanged",
        "CustomerCustomFieldRemoved",
        "CustomerCustomTypeSet",
        "CustomerCustomTypeRemoved",
        "CustomerAddressCustomFieldAdded",
        "CustomerAddressCustomFieldChanged",
        "CustomerAddressCustomFieldRemoved",
        "CustomerAddressCustomTypeSet",
        "CustomerAddressCustomTypeRemoved"
      ],
      "inventory": [
        "InventoryEntryCreated",
        "InventoryEntryQuantitySet"
      ],
      "order": [
        "OrderCreated",
        "OrderImported",
        "OrderEditApplied",
        "PurchaseOrderNumberSet",
        "OrderCustomerSet",
        "OrderCustomerEmailSet",
        "OrderCustomerGroupSet",
        "OrderLineItemAdded",
        "OrderLineItemRemoved",
        "OrderCustomLineItemAdded",
        "OrderCustomLineItemRemoved",
        "OrderDiscountCodeAdded",
        "OrderDiscountCodeRemoved",
        "OrderDiscountCodeStateSet",
        "OrderPaymentAdded",
        "OrderPaymentStateChanged",
        "OrderBillingAddressSet",
        "OrderShippingAddressSet",
        "OrderShippingInfoSet",
        "OrderShippingRateInputSet",
        "OrderShipmentStateChanged",
        "DeliveryAdded",
        "DeliveryRemoved",
        "ReturnInfoAdded",
        "ReturnInfoSet",
        "OrderStateChanged",
        "OrderStateTransition",
        "OrderStoreSet",
        "OrderBusinessUnitSet",
        "OrderLineItemDistributionChannelSet",
        "OrderLineItemDiscountSet",
        "LineItemStateTransition",
        "OrderCustomLineItemQuantityChanged",
        "OrderCustomLineItemDiscountSet",
        "CustomLineItemStateTransition",
        "DeliveryAddressSet",
        "ParcelAddedToDelivery",
        "ParcelRemovedFromDelivery",
        "DeliveryItemsUpdated",
        "DeliveryCustomFieldAdded",
        "DeliveryCustomFieldChanged",
        "DeliveryCustomFieldRemoved",
        "DeliveryCustomTypeSet",
        "DeliveryCustomTypeRemoved",
        "ParcelMeasurementsUpdated",
        "ParcelTrackingDataUpdated",
        "ParcelItemsUpdated",
        "OrderReturnShipmentStateChanged",
        "OrderCustomFieldAdded",
        "OrderCustomFieldChanged",
        "OrderCustomFieldRemoved",
        "OrderCustomTypeSet",
        "OrderCustomTypeRemoved"
      ],
      "payment": [
        "PaymentCreated",
        "PaymentInteractionAdded",
        "PaymentTransactionAdded",
        "PaymentTransactionStateChanged",
        "PaymentStatusStateTransition",
        "PaymentStatusInterfaceCodeSet"
      ],
      "product": [
        "ProductCreated",
        "ProductPublished",
        "ProductUnpublished",
        "ProductStateTransition",
        "ProductSlugChanged",
        "ProductImageAdded",
        "ProductRevertedStagedChanges",
        "ProductPriceKeySet",
        "ProductPriceDiscountsSet",
        "ProductPriceDiscountsSetUpdatedPrice",
        "ProductPriceExternalDiscountSet",
        "ProductPriceAdded",
        "ProductPriceChanged",
        "ProductPricesSet",
        "ProductPriceRemoved",
        "ProductPriceModeSet",
        "ProductVariantAdded",
        "ProductAddedToCategory",
        "ProductRemovedFromCategory",
        "ProductPriceCustomFieldAdded",
        "ProductPriceCustomFieldChanged",
        "ProductPriceCustomFieldRemoved",
        "ProductPriceCustomFieldsSet",
        "ProductPriceCustomFieldsRemoved"
      ],
      "product-selection": [
        "ProductSelectionCreated",
        "ProductSelectionProductAdded",
        "ProductSelectionProductExcluded",
        "ProductSelectionProductRemoved",
        "ProductSelectionVariantSelectionChanged",
        "ProductSelectionVariantExclusionChanged",
      ],
      "quote": [
        "QuoteCreated",
        "QuoteRenegotiationRequested",
        "QuoteStateChanged",
        "QuoteStateTransition",
        "QuoteCustomerChanged",
      ],
      "quote-request": [
        "QuoteRequestCreated",
        "QuoteRequestStateChanged",
        "QuoteRequestStateTransition",
        "QuoteRequestCustomerChanged",
      ],
      "review": [
        "ReviewCreated",
        "ReviewStateTransition",
        "ReviewRatingSet"
      ],
      "staged-quote": [
        "StagedQuoteCreated",
        "StagedQuoteStateChanged",
        "StagedQuoteStateTransition",
        "StagedQuoteValidToSet",
        "StagedQuoteSellerCommentSet",
      ],
      "product-tailoring": [
        "ProductTailoringCreated",
        "ProductTailoringNameSet",
        "ProductTailoringDescriptionSet",
        "ProductTailoringSlugSet",
        "ProductTailoringPublished",
        "ProductTailoringUnpublished",
        "ProductVariantTailoringAdded",
        "ProductVariantTailoringRemoved",
        "ProductTailoringImageAdded",
        "ProductTailoringImagesSet"
      ],
      "standalone-price": [
        "StandalonePriceCreated",
        "StandalonePriceValueChanged",
        "StandalonePriceKeySet",
        "StandalonePriceDiscountSet",
        "StandalonePriceExternalDiscountSet",
        "StandalonePriceStagedChangesApplied",
        "StandalonePriceStagedChangesRemoved",
        "StandalonePriceActiveChanged",
        "StandalonePriceValidFromSet",
        "StandalonePriceValidUntilSet",
        "StandalonePriceValidFromAndUntilSet",
        "StandalonePriceTierAdded",
        "StandalonePriceTierRemoved",
        "StandalonePriceTiersSet"
      ],
      "store": [
        "StoreCreated",
        "StoreLanguagesChanged",
        "StoreCountriesChanged",
        "StoreNameSet",
        "StoreProductSelectionsChanged",
        "StoreDistributionChannelsChanged",
        "StoreSupplyChannelsChanged"
      ]
    }
  }
  const response = await updateCustomObjectRepository(triggerListBody)
  return response;
}

export async function removeSubscriptions() {
  try {
    // Get the subscriptions data
    const repo = await getCustomObjectRepository("notify-subscriptions", "notify-subscriptions-key");
    const data = repo?.value;

    if (!data?.channels) {
      return;
    }

    const channelNames = ['whatsapp', 'sms', 'email'];

    // Process each channel
    for (const channelName of channelNames) {
      const channel = data.channels[channelName];
      if (!channel?.subscriptions) continue;

      // Process each subscription in the channel
      for (const sub of channel.subscriptions) {
        try {
          const subscriptionKey = `notify-${sub.resourceType}-subscription`;
          await removeSubscriptionRepository(subscriptionKey);
        } catch (error) {
          logger.error(`Failed to unsubscribe from ${sub.resourceType}:`, error);
        }
      }
    }
  } catch (error) {
    logger.error('Error in unsubscribe function:', error);
  }
}


export async function deleteAllObjects() {

  const toBeDeleted = {
    channels: {
      container: "notify-channels",
      key: "notify-channels-key"
    },
    subscriptions: {
      container: "notify-subscriptions",
      key: "notify-subscriptions-key"
    },
    triggerList: {
      container: "notify-trigger-list",
      key: "notify-trigger-list-key"
    }
  }

  await Promise.all([
    deleteCustomObjectRepository(toBeDeleted.channels.container, toBeDeleted.channels.key),
    deleteCustomObjectRepository(toBeDeleted.subscriptions.container, toBeDeleted.subscriptions.key),
    deleteCustomObjectRepository(toBeDeleted.triggerList.container, toBeDeleted.triggerList.key),
    deleteAllMessageState(),
    deleteAllMessageLogs(),
  ]);
}

export async function deleteAllMessageState() {
  try {
    const messageStateObjects = await getSingleCustomObjectRepository("notify-messageState");

    await Promise.all(
      messageStateObjects.map((item) =>
        deleteCustomObjectRepository(item.container, item.key)
      )
    );

    logger.info("All messageState objects deleted.");
  } catch (error) {
    logger.error(`Failed to delete messageState objects: ${JSON.stringify(error)}`);
  }
}

export async function deleteAllMessageLogs() {
  try {
    const messageStateObjects = await getSingleCustomObjectRepository("notify-messagelogs");

    await Promise.all(
      messageStateObjects.map((item) =>
        deleteCustomObjectRepository(item.container, item.key)
      )
    );

    logger.info("All messageState objects deleted.");
  } catch (error) {
    logger.error(`Failed to delete messageState objects: ${JSON.stringify(error)}`);
  }
}
