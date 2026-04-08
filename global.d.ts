import type { SxProps } from '@mui/material';
import type { Theme } from '@mui/material/styles';

declare global {
  /** Alias for MUI Theme */
  type MuiTheme = Theme;

  /** Alias for MUI SxProps */
  type MuiSx = SxProps<Theme>;
}
