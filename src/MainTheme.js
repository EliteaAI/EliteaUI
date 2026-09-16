import { typographyVariants } from '@/[fsd]/shared/config/theme';
import { mergePalette } from '@/[fsd]/shared/lib/helpers/theme.helpers';
import { MuiButtonStyles } from '@/[fsd]/shared/ui/button/BaseBtn';
import { eliteaCheckboxVariants, eliteaUnifiedRadioVariants } from '@/[fsd]/shared/ui/checkbox/BaseCheckbox';
import { eliteaInputVariants, eliteaTextFieldVariants } from '@/[fsd]/shared/ui/input/textFieldVariants';
import { eliteaSingleSelectVariants } from '@/[fsd]/shared/ui/select/singleSelectVariants';
import { eliteaSwitchVariants } from '@/[fsd]/shared/ui/switch/BaseSwitch';
import { eliteaTabGroupVariants } from '@/[fsd]/shared/ui/tab-group-button/TabGroupButton';
import { MuiTabStyles } from '@/[fsd]/shared/ui/tabs/BaseTab';
import { MuiTabsStyles } from '@/[fsd]/shared/ui/tabs/BaseTabs';
import { eliteaDataGridStyle } from '@/components/DataGrid.jsx';
import { eliteaTreeItemStyle } from '@/components/TreeItem.jsx';

import { eliteaIconButtonStyle } from './components/IconButton';
import darkPalette from './darkPalette';
import lightPalette from './lightPalette';
import { eliteaMenuItemVariants, eliteaMenuListVariants } from './theme/menuListVariants';

const getPalette = (mode, customPalette) => {
  const basePalette = mode === 'dark' ? darkPalette : lightPalette;

  return customPalette ? mergePalette(basePalette, customPalette) : basePalette;
};

const getDesignTokens = (mode, customPalette = null) => ({
  breakpoints: {
    values: {
      prompt_list_xs: 0,
      prompt_list_sm: 600,
      prompt_list_full_width_sm: 1024,
      prompt_list_md: 1366,
      prompt_list_lg: 1440,
      prompt_list_xl: 1800,
      prompt_list_xxl: 2560,
      prompt_list_xxxl: 3440,
      prompt_list_xxxxl: 3840,
      prompt_list_xxxxxl: 5120,
      tablet: 1024,
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  typography: {
    fontFamily: '"Montserrat", Roboto, Arial, sans-serif',
    fontFeatureSettings: '"clig" 0, "liga" 0',
    ...typographyVariants,
  },
  palette: getPalette(mode, customPalette),
  components: {
    MuiButton: MuiButtonStyles,
    MuiToggleButton: {
      variants: eliteaTabGroupVariants,
    },
    MuiTextField: {
      variants: eliteaTextFieldVariants,
    },
    MuiInput: {
      variants: eliteaInputVariants(typographyVariants.bodyMedium),
    },
    MuiIconButton: {
      variants: [
        {
          props: { variant: 'elitea' },
          style: ({ theme, color }) => eliteaIconButtonStyle(theme, color),
        },
      ],
    },
    MuiDataGrid: {
      variants: [
        {
          props: { variant: 'elitea' },
          style: ({ theme }) => eliteaDataGridStyle(theme),
        },
      ],
    },
    MuiDialog: {
      styleOverrides: {
        paper: ({ theme }) => ({
          background: theme.palette.background.default.secondary,
          borderRadius: '1rem',
          border: '0.0625rem solid',
          borderColor: theme.palette.border.lines,
          boxShadow: theme.palette.boxShadow.dialog,
        }),
      },
    },
    MuiTreeItem: {
      variants: [
        {
          props: { variant: 'elitea' },
          style: ({ theme }) => eliteaTreeItemStyle(theme),
        },
      ],
    },
    MuiMenuList: {
      variants: eliteaMenuListVariants,
    },
    MuiMenuItem: {
      variants: eliteaMenuItemVariants,
    },
    MuiFormControl: {
      styleOverrides: {
        root: {
          '&.Mui-error': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: ({ theme }) => ({
          '&.Mui-error': {
            color: theme.palette.status.rejected,
          },
        }),
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          scrollbarWidth: 'none',
        },
        body: {
          caretColor: 'transparent',
          height: '100%',
          '::-webkit-scrollbar': {
            display: 'none',
          },
          msOverflowStyle: 'none',
        },
        input: {
          caretColor: 'auto',
        },
        textArea: {
          caretColor: 'auto',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: ({ theme }) => ({
          background: theme.palette.background.avatar,
          color: theme.palette.text.primary,
        }),
      },
    },
    MuiChip: {
      styleOverrides: {
        root: ({ theme }) => ({
          background: theme.palette.background.avatar,
        }),
        outlined: ({ theme }) => ({
          background: theme.palette.background.default.primary,
          color: theme.palette.text.secondary,
        }),
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: ({ theme }) => ({
          background: theme.palette.background.default.primary,
        }),
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: ({ theme }) => ({
          color: theme.palette.text.secondary,
        }),
      },
      variants: eliteaSingleSelectVariants,
    },
    MuiMenu: {
      styleOverrides: {
        paper: ({ theme }) => ({
          background: theme.palette.background.default.secondary,
          borderRadius: '0.5rem',
          border: `0.0625rem solid ${theme.palette.border.lines}`,
        }),
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        root: ({ theme }) => ({
          fontSize: '0.75rem',
          color: theme.palette.text.primary,
          '& .MuiTablePagination-select.MuiSelect-standard': {
            color: theme.palette.text.primary,
          },
        }),
        selectLabel: ({ theme }) => ({
          ...typographyVariants.labelSmall,
          color: theme.palette.text.muted,
        }),
        displayedRows: ({ theme }) => ({
          ...typographyVariants.labelSmall,
          color: theme.palette.text.primary,
        }),
        menuItem: {
          fontSize: '0.75rem',
        },
      },
    },
    MuiTab: MuiTabStyles,
    MuiTabs: MuiTabsStyles,
    MuiAlert: {
      styleOverrides: {
        filledSuccess: ({ theme }) => ({
          backgroundColor: theme.palette.components.toast.success.background,
          background: theme.palette.components.toast.success.background,
          color: theme.palette.components.toast.success.color,
        }),
        filledError: ({ theme }) => ({
          backgroundColor: theme.palette.components.toast.error.background,
          background: theme.palette.components.toast.error.background,
          color: theme.palette.components.toast.error.color,
        }),
        filledInfo: ({ theme }) => ({
          backgroundColor: theme.palette.components.toast.info.background,
          background: theme.palette.components.toast.info.background,
          color: theme.palette.components.toast.info.color,
        }),
        filledWarning: ({ theme }) => ({
          backgroundColor: theme.palette.components.toast.warning.background,
          background: theme.palette.components.toast.warning.background,
          color: theme.palette.components.toast.warning.color,
        }),
      },
    },
    MuiRadio: {
      variants: eliteaUnifiedRadioVariants,
    },
    MuiCheckbox: {
      variants: eliteaCheckboxVariants,
    },
    MuiSwitch: {
      variants: eliteaSwitchVariants,
    },
    MuiDrawer: {
      styleOverrides: {
        paper: ({ theme }) => ({
          background: theme.palette.background.default.secondary, // Your color here
        }),
        paperAnchorLeft: ({ theme }) => ({
          borderRight: `0.0625rem solid ${theme.palette.border.lines}`,
        }),
        paperAnchorRight: ({ theme }) => ({
          borderLeft: `0.0625rem solid ${theme.palette.border.lines}`,
        }),
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: ({ theme }) => ({
          background: theme.palette.background.default.primary, // Your color here
        }),
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: ({ theme }) => ({
          ...typographyVariants.labelSmall,
          color: theme.palette.text.secondary,
          height: '1rem',
          minWidth: '1rem',
          borderRadius: '0.5rem',
          padding: '0 0.28125rem',
          background: theme.palette.background.badge,
        }),
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: ({ theme }) => ({
          backgroundColor: theme.palette.background.tooltip,
          color: theme.palette.text.tooltip,
          ...typographyVariants.labelSmall,
          '& .MuiTooltip-arrow': {
            color: theme.palette.background.tooltip,
          },
        }),
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        paper: ({ theme }) => ({
          backgroundColor: theme.palette.background.default.secondary,
          border: `0.0625rem solid ${theme.palette.border.lines}`,
          borderRadius: '0.5rem',
          boxShadow: theme.palette.components.tagEditor.shadow,
        }),
      },
    },
  },
});

export default getDesignTokens;
