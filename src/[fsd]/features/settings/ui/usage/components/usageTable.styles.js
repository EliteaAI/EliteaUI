import {
  analyticsColumnSx,
  analyticsRowMinWidthSx,
} from '@/[fsd]/features/settings/ui/analytics/components/analyticsTable.styles';
import { customScrollbarSx } from '@/[fsd]/shared/lib/helpers';

// Usage cards are narrower than the Analytics tables and their rows have no horizontal padding,
// so they use a smaller column unit with the same header/body sizing as Analytics
const USAGE_TABLE_OPTIONS = { unitRem: 3.5, paddingXRem: 0 };

export const usageColumnSx = flex => analyticsColumnSx(flex, USAGE_TABLE_OPTIONS);

export const usageRowMinWidthSx = flexes => analyticsRowMinWidthSx(flexes, USAGE_TABLE_OPTIONS);

// Visible thin scrollbar: the app hides scrollbars globally, see analyticsTableWrapperSx
export const usageTableWrapperSx = theme => ({
  display: 'flex',
  flexDirection: 'column',
  overflowX: 'auto',
  ...customScrollbarSx(theme),
});
