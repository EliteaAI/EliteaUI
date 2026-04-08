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
import darkPalette, { darkBlue, white } from './darkPalette';
import lightPalette from './lightPalette';
import { eliteaMenuItemVariants, eliteaMenuListVariants } from './theme/menuListVariants';

export const typographyVariants = {
  headingLarge: {
    color: theme => theme.palette.text.secondary,
    fontStyle: 'semibold',
    fontWeight: 600,
    fontSize: '1.25rem',
    lineHeight: '2rem',
  },
  headingMedium: {
    color: theme => theme.palette.text.secondary,
    fontStyle: 'normal',
    fontWeight: 600,
    fontSize: '1rem',
    lineHeight: '1.5rem',
  },
  headingSmall: {
    color: theme => theme.palette.text.secondary,
    fontStyle: 'normal',
    fontWeight: 600,
    fontSize: '0.875rem',
    lineHeight: '1.5rem',
  },
  labelLarge: {
    fontStyle: 'normal',
    fontWeight: 500,
    fontSize: '1rem',
    lineHeight: '1.5rem',
  },
  labelMedium: {
    fontStyle: 'normal',
    fontWeight: 500,
    fontSize: '0.875rem',
    lineHeight: '1.5rem',
  },
  labelSmall: {
    fontStyle: 'normal',
    fontWeight: 500,
    fontSize: '0.75rem',
    lineHeight: '1rem',
  },
  labelTiny: {
    fontStyle: 'normal',
    fontWeight: 400,
    fontSize: '0.625rem',
    lineHeight: '1rem',
  },
  bodyMedium: {
    fontStyle: 'normal',
    fontWeight: 400,
    fontSize: '0.875rem',
    lineHeight: '1.5rem',
  },
  bodySmall: {
    fontStyle: 'normal',
    fontWeight: 400,
    fontSize: '0.75rem',
    lineHeight: '1rem',
  },
  bodySmall2: {
    fontStyle: 'normal',
    fontWeight: 400,
    fontSize: '0.75rem',
    lineHeight: '1.25rem',
  },
  subtitle: {
    fontStyle: 'normal',
    fontWeight: 500,
    fontSize: '0.75rem',
    lineHeight: '1rem',
    letterSpacing: '0.72px',
    textTransform: 'uppercase',
  },
};

const getDesignTokens = mode => ({
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
  palette: mode === 'dark' ? darkPalette : lightPalette,
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
          background: theme.palette.background.secondary,
          borderRadius: '1rem',
          border: '0.0625rem solid',
          borderColor: theme.palette.border.lines,
          boxShadow: '0 0 1.475rem 0 #FFFFFF0D',
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
          color: theme.palette.text.default,
        }),
      },
    },
    MuiChip: {
      styleOverrides: {
        root: ({ theme }) => ({
          background: theme.palette.background.avatar,
        }),
        outlined: ({ theme }) => ({
          background: theme.palette.background.eliteaDefault,
          color: theme.palette.text.secondary,
        }),
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: ({ theme }) => ({
          background: theme.palette.background.eliteaDefault,
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
          background: theme.palette.background.secondary,
          borderRadius: '0.5rem',
          border: `0.0625rem solid ${theme.palette.border.lines}`,
        }),
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        root: ({ theme }) => ({
          fontSize: '0.75rem',
          color: theme.palette.text.default,
          '& .MuiTablePagination-select.MuiSelect-standard': {
            color: theme.palette.text.default,
          },
        }),
        selectLabel: ({ theme }) => ({
          ...typographyVariants.labelSmall,
          color: theme.palette.text.button.disabled,
        }),
        displayedRows: ({ theme }) => ({
          ...typographyVariants.labelSmall,
          color: theme.palette.text.default,
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
        filledSuccess: {
          backgroundColor: 'green',
          background: 'green',
          color: white,
        },
        filledError: {
          backgroundColor: 'red',
          background: 'red',
          color: white,
        },
        filledInfo: {
          backgroundColor: darkBlue,
          background: darkBlue,
          color: white,
        },
        filledWarning: {
          backgroundColor: 'orange',
          background: 'orange',
          color: white,
        },
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
          background: theme.palette.background.secondary, // Your color here
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
          background: theme.palette.background.eliteaDefault, // Your color here
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
          background: theme.palette.background.tabButton.active,
        }),
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: ({ theme }) => ({
          backgroundColor: theme.palette.background.tooltip.default,
          color: theme.palette.text.button.primary,
          ...typographyVariants.labelSmall,
          '& .MuiTooltip-arrow': {
            color: theme.palette.background.tooltip.default,
          },
        }),
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        paper: ({ theme }) => ({
          backgroundColor: theme.palette.background.secondary,
          border: `0.0625rem solid ${theme.palette.border.lines}`,
          borderRadius: '0.5rem',
          boxShadow: theme.palette.boxShadow.tagEditorPaper,
        }),
      },
    },
  },
});

export default getDesignTokens;
