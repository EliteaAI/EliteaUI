import { RouterProvider } from 'react-router-dom';

import { gaInit } from '@/GA';
import { router } from '@/[fsd]/app/routes';
import { MISSING_ENVS } from '@/common/constants';
import EnvMissingPage from '@/pages/EnvMissingPage';

gaInit();

const App = () => {
  return MISSING_ENVS.length > 0 ? <EnvMissingPage /> : <RouterProvider router={router} />;
};

App.displayName = 'App';

export default App;
