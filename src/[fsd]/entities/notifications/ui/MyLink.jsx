import { memo } from 'react';

import MyCurrentTabLink from './MyCurrentTabLink';
import MyNewTabLink from './MyNewTabLink';

const MyLink = memo(props => {
  const { linkInfo } = props;

  return linkInfo?.isNewTab ? <MyNewTabLink {...props} /> : <MyCurrentTabLink {...props} />;
});

MyLink.displayName = 'MyLink';

export default MyLink;
