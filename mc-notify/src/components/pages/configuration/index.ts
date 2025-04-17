import { lazy } from 'react';

const ConfigurationPage = lazy(
    () => import('./configurationPage' /* webpackChunkName: "configurationPage" */)
);

export default ConfigurationPage;