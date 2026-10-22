import ArrowDownIcon from '@/components/Icons/ArrowDownIcon';
import ArrowLeftIcon from '@/components/Icons/ArrowLeftIcon';
import ArrowRightIcon from '@/components/Icons/ArrowRightIcon';
import CalendarIcon from '@/components/Icons/CalendarIcon';

/** Props shared by every date picker in the Analytics design; callers add `format` and `ampm`. */
export const datePickerCommonProps = {
  localeText: { okButtonLabel: 'Apply' },
  slots: {
    openPickerIcon: CalendarIcon,
    leftArrowIcon: ArrowLeftIcon,
    rightArrowIcon: ArrowRightIcon,
    switchViewIcon: ArrowDownIcon,
  },
};

/** @type {MuiSx} */
export const datePickerStyles = {
  datePickerField: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '.5rem',
    borderBottom: `.0625rem solid ${palette.border.lines}`,
    padding: '.375rem .75rem',
    height: '1.75rem',
    boxSizing: 'border-box',
  }),
  datePickerFieldActive: ({ palette }) => ({
    borderBottomColor: palette.primary.main,
  }),
  datePickerLabel: ({ palette }) => ({
    color: palette.text.primary,
    fontFamily: 'Montserrat',
    fontSize: '.75rem',
    fontWeight: 500,
    lineHeight: '1rem',
    whiteSpace: 'nowrap',
  }),
  dateInput: {
    width: 'auto',

    '& .MuiInput-root': {
      display: 'inline-flex',
      padding: 0,
      alignItems: 'center',

      '&::before': { display: 'none' },
      '&::after': { display: 'none' },
    },
    '& .MuiInput-input': {
      color: 'text.secondary',
      fontFamily: 'Montserrat',
      fontSize: '.75rem',
      fontWeight: 500,
      lineHeight: '1rem',
      height: '1rem',
      padding: 0,
      fontVariantNumeric: 'tabular-nums',
      width: '7.5rem',
      minWidth: 0,
      flex: 'none',
    },

    '& .MuiInputAdornment-root': ({ palette }) => ({
      display: 'inline-flex',
      alignItems: 'center',
      height: '1rem',
      marginLeft: 0,
      marginRight: '.5rem',
      marginBottom: '.5rem',

      '& .MuiIconButton-root': {
        padding: 0,
        display: 'inline-flex',
        alignItems: 'center',

        '& svg': {
          width: '1rem',
          height: '1rem',
          fontSize: '1rem',

          '& path': { fill: palette.icon.subtle },
        },
      },
    }),
  },
  datePickerPopper: ({ palette }) => ({
    // Dropdown container
    '& .MuiPaper-root': {
      backgroundColor: palette.background.default.secondary,
      border: `.0625rem solid ${palette.border.lines}`,
      borderRadius: '1rem',
      color: palette.text.secondary,
      backgroundImage: 'none',
      boxShadow: 'none',
    },

    // Month/year header
    '& .MuiPickersCalendarHeader-root': {
      color: palette.text.secondary,
    },
    '& .MuiPickersCalendarHeader-label': {
      color: palette.text.secondary,
      fontSize: '.875rem',
      fontWeight: 500,
    },
    '& .MuiPickersCalendarHeader-switchViewButton': {
      color: palette.text.primary,
      '& svg': { fill: palette.icon.default },

      '&:hover': {
        color: palette.text.secondary,
        '& svg': { fill: palette.icon.secondary },
      },
    },

    // Arrow navigation buttons — tertiary style
    '& .MuiPickersArrowSwitcher-button': {
      color: palette.text.primary,
      background: 'transparent',
      borderRadius: '50%',
      width: '1.625rem',
      height: '1.625rem',
      padding: 0,
      '& svg': { fill: palette.icon.default },
      '&:hover': {
        background: palette.background.interactiveItem.hover,
        color: palette.text.secondary,
        '& svg': { fill: palette.icon.secondary },
      },
      '&:active': {
        background: palette.components.button.background.tertiary.pressed,
      },
    },

    // Weekday labels (M T W T F S S)
    '& .MuiDayCalendar-weekDayLabel': {
      color: palette.text.primary,
      fontSize: '.875rem',
    },

    // Day numbers — 14px, round selected
    '& .MuiPickersDay-root': {
      color: palette.text.secondary,
      fontSize: '.875rem',
      borderRadius: '50%',
      '&:hover': {
        backgroundColor: palette.background.interactiveItem.hover,
      },
      '&.Mui-selected': {
        backgroundColor: palette.components.split.background.default,
        color: palette.text.secondary,
        borderRadius: '50%',
        '&:hover': {
          backgroundColor: palette.components.split.background.default,
        },
      },
      '&.MuiPickersDay-today': {
        borderColor: palette.border.lines,
        borderRadius: '50%',
      },
    },

    // Year picker
    '& .MuiPickersYear-yearButton': {
      color: palette.text.secondary,
      fontSize: '.875rem',
      '&:hover': {
        backgroundColor: palette.background.interactiveItem.hover,
      },
      '&.Mui-selected': {
        backgroundColor: palette.components.split.background.default,
        color: palette.text.secondary,
        '&:hover': {
          backgroundColor: palette.components.split.background.default,
        },
      },
    },

    // Time picker columns
    '& .MuiMultiSectionDigitalClock-root': {
      padding: '.75rem .5rem',

      '& .MuiList-root': {
        '&::-webkit-scrollbar': { width: '.25rem' },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: palette.border.lines,
          borderRadius: '.125rem',
        },
      },
    },

    // Time numbers — keep gray
    '& .MuiMultiSectionDigitalClockSection-item': {
      color: palette.text.primary,
      fontSize: '.875rem',
      borderRadius: '1.75rem',
      '&:hover': {
        backgroundColor: palette.background.interactiveItem.hover,
      },
      '&.Mui-selected': {
        backgroundColor: palette.components.split.background.default,
        color: palette.text.secondary,
        borderRadius: '1.75rem',
        '&:hover': {
          backgroundColor: palette.components.split.background.default,
        },
      },
    },

    // Action buttons footer
    '& .MuiDialogActions-root': {
      backgroundColor: palette.background.default.tertiary,
      borderRadius: '0 0 1rem 1rem',
      padding: '1rem',
      gap: '.5rem',

      // Clear button — secondary style
      '& .MuiButton-root': {
        backgroundColor: palette.background.surface.interactive.active,
        color: palette.text.secondary,
        fontFamily: 'Montserrat',
        fontSize: '.75rem',
        fontWeight: 500,
        lineHeight: '1rem',
        borderRadius: '1.75rem',
        textTransform: 'none',
        padding: '.5rem 1.5rem',
        '&:hover': {
          backgroundColor: palette.background.surface.interactive.selected,
        },
        '&:active': {
          backgroundColor: palette.components.button.background.secondary.pressed,
        },
      },

      // Apply button — primary style
      '& .MuiButton-root:last-child': {
        backgroundColor: palette.primary.main,
        color: palette.components.button.text.primary,
        '&:hover': {
          backgroundColor: palette.components.button.background.primary.hover,
        },
        '&:active': {
          backgroundColor: palette.components.button.background.primary.pressed,
        },
      },
    },
  }),
};

/** Slot props for a date picker in the Analytics design; `testid` goes on the <input>. */
export const getDateFieldSlotProps = (testid, textFieldProps) => ({
  textField: {
    size: 'small',
    sx: datePickerStyles.dateInput,
    variant: 'standard',
    ...textFieldProps,
    inputProps: { 'data-testid': testid, ...textFieldProps?.inputProps },
  },
  actionBar: { actions: ['clear', 'accept'] },
  popper: {
    sx: datePickerStyles.datePickerPopper,
    modifiers: [{ name: 'offset', options: { offset: [0, 8] } }],
  },
});
