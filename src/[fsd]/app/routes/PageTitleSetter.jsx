import { memo } from 'react';

import { useBrowserPageTitle } from '@/[fsd]/shared/lib/hooks';

/**
 * Renders nothing; isolates title updates from re-rendering the parent routes.
 */
const PageTitleSetter = memo(() => {
  useBrowserPageTitle();
  return null;
});

PageTitleSetter.displayName = 'PageTitleSetter';

export default PageTitleSetter;
