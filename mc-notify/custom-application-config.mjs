import { PERMISSIONS } from './src/constants';

/**
 * @type {import('@commercetools-frontend/application-config').ConfigOptionsForCustomApplication}
 */
const config = {
  name: 'Notify',
  entryPointUriPath: '${env:ENTRY_POINT_URI_PATH}',
  cloudIdentifier: '${env:CLOUD_IDENTIFIER}',
  env: {
    development: {
      initialProjectKey: "ayata-connectors",
    },
    production: {
      applicationId: '${env:CUSTOM_APPLICATION_ID}',
      url: '${env:APPLICATION_URL}',
    },
  },
  additionalEnv: {
    twilio_sid: "${env:TWILIO_ACCOUNT_SID}"
  },
  oAuthScopes: {
    view: [
      'view_orders',
      'view_key_value_documents',
      'view_api_clients',
      'view_approval_flows',
      'view_approval_rules',
      'view_associate_roles',
      'view_attribute_groups',
      'view_audit_log',
      'view_business_units',
      'view_cart_discounts',
      'view_categories',
      'view_checkout_transactions',
      'view_customer_groups',
      'view_customers',
      'view_discount_codes',
      'view_import_containers',
      'view_messages',
      'view_order_edits',
      'view_payments',
      'view_product_selections',
      'view_products',
      'view_project_settings',
      'view_published_products',
      'view_quote_requests',
      'view_quotes',
      'view_recurring_orders',
      'view_sessions',
      'view_shipping_methods',
      'view_shopping_lists',
      'view_staged_quotes',
      'view_standalone_prices',
      'view_states',
      'view_stores',
      'view_tax_categories',
      'view_types'
    ],
    manage: ['manage_orders', 'manage_key_value_documents', 'manage_subscriptions'],
  },
  icon: '${path:@commercetools-frontend/assets/application-icons/bell.svg}',
  mainMenuLink: {
    defaultLabel: 'Notify',
    labelAllLocales: [],
    permissions: [PERMISSIONS.View],
  },
};

export default config;
