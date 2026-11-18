import { memo } from 'react';

import { DrawerPageHeader } from '@/[fsd]/features/settings/ui/drawer-page';
import { BreadcrumbsOrTitle } from '@/[fsd]/shared/ui';
import { NAV_BAR_HEIGHT } from '@/common/constants';

import AppDetailActions from './AppDetailActions';

const AppDetailHeader = memo(props => {
  const { appId, appName } = props;
  const styles = appDetailHeaderStyles();

  return (
    <DrawerPageHeader
      sx={styles.root}
      data-testid="app-detail-header"
      slotProps={{ titleContainer: { sx: styles.titleContainer } }}
      title={
        <BreadcrumbsOrTitle
          title={appName}
          entityName={appName}
          testId="app-detail-title"
        />
      }
      extraContent={
        <AppDetailActions
          appId={appId}
          appName={appName}
        />
      }
    />
  );
});

AppDetailHeader.displayName = 'AppDetailHeader';

/** @type {MuiSx} */
const appDetailHeaderStyles = () => ({
  root: ({ palette }) => ({
    gap: '0.75rem',
    height: `calc(${NAV_BAR_HEIGHT / 16}rem + 0.0625rem)`,
    minHeight: `calc(${NAV_BAR_HEIGHT / 16}rem + 0.0625rem)`,
    flexShrink: 0,
    borderBottom: `0.0625rem solid ${palette.border.subtle}`,
    backgroundColor: palette.background.default.primary,
  }),
  titleContainer: {
    minWidth: 0,
    '& > .MuiTypography-root': {
      minWidth: 0,
      overflow: 'hidden',
    },
  },
});

export default AppDetailHeader;
