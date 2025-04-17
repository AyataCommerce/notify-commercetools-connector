# Running the Application Locally

Follow these steps to set up and run the Notify application on your local machine:

## 1. Clone the Repository
```
git clone https://github.com/AyataCommerce/notify-commercetools-connector.git
```

## 2. Navigate to the Project Directory
Depending on the component you want to run:

**For the event-based application (backend):**
```
cd notify-commercetools-connector/notify-event
```

**For the custom front-end application (Merchant Center UI):**
```
cd notify-commercetools-connector/mc-notify
```

## 3. Install Dependencies
Run the following command in the appropriate directory:
```
yarn install
```

## 4. Configure Environment Variables
Make sure the .env file is created and updated with the required variables (refer to the Prerequisites section). This file should include API keys, credentials, and app-specific configurations.

## 5. Start the Application in Development Mode
**To start the event application (backend):**
```
yarn start:dev
```

**To start the Merchant Center application (frontend):**
```
yarn start
```