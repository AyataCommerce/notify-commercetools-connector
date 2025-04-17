import { lazy } from 'react';

const Loader = lazy(
  () => import('./loader' /* webpackChunkName: "welcome" */)
);

export default Loader;
