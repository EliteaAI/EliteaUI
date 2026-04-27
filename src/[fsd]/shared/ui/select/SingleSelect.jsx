import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  Box,
  FormControl,
  FormHelperText,
  InputLabel,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { TypographyWithConditionalTooltip } from '@/[fsd]/shared/ui/tooltip';
import CheckedIcon from '@/assets/checked-icon.svg?react';
import { filterProps } from '@/common/utils';
import ArrowDownIcon from '@/components/Icons/ArrowDownIcon';
import StyledSelect from '@/components/StyledSelect';

const SingleSelect = memo(props => {
  const {
    value = '',
    label,
    options,
    onValueChange,
    onChange,
    onClear,
    displayEmpty,
    disabled = false,
    customSelectedColor,
    customSelectedFontSize,
    showOptionIcon = false,
    iconPosition = 'left',
    menuItemIconSX,
    optionsWithAvatar = false,
    showBorder,
    sx,
    labelSX = {},
    inputSX,
    inputProps,
    id,
    name,
    required,
    error = false,
    helperText = '',
    maxDisplayValueLength,
    className,
    customRenderValue,
    customRenderOption,
    showEmptyPlaceholder = true,
    emptyPlaceholder = <em>None</em>,
    onScroll,
    maxListHeight,
    customMenuProps = {},
    labelNode,
  } = props;

  const scrollListenerRef = useRef(null);
  const menuListRef = useRef(null);

  const theme = useTheme();
  const styles = singleSelectStyles();

  const [menuOpen, setMenuOpen] = useState(false);

  const realValue = useMemo(() => (options && options.length ? value : ''), [options, value]);

  const handleChange = useCallback(
    event => {
      setMenuOpen(false);

      if (onValueChange) onValueChange(event.target.value);
      if (onChange) onChange(event);
    },
    [onChange, onValueChange],
  );

  const attachScrollListener = useCallback(() => {
    if (!onScroll) return;

    // Find the menu list element in the portal
    setTimeout(() => {
      const menuPaperElement = document.querySelector('.MuiMenu-paper');

      if (menuPaperElement) {
        const menuListElement = menuPaperElement.querySelector('.MuiMenu-list') || menuPaperElement;

        if (menuListElement) {
          menuListRef.current = menuListElement;
          scrollListenerRef.current = onScroll;
          menuListElement.addEventListener('scroll', scrollListenerRef.current, { passive: true });
        }
      }
    }, 50);
  }, [onScroll]);

  const removeScrollListener = useCallback(() => {
    if (menuListRef.current && scrollListenerRef.current) {
      menuListRef.current.removeEventListener('scroll', scrollListenerRef.current);
      menuListRef.current = null;
      scrollListenerRef.current = null;
    }
  }, []);

  const handleMenuOpen = useCallback(() => {
    setMenuOpen(true);
    attachScrollListener();
  }, [attachScrollListener]);

  const handleMenuClose = useCallback(() => {
    setMenuOpen(false);
    removeScrollListener();
  }, [removeScrollListener]);

  useEffect(() => {
    return () => {
      removeScrollListener();
    };
  }, [removeScrollListener]);

  const renderValue = useCallback(
    selectedValue => {
      const foundOption = options.find(({ value: itemValue }) => itemValue === selectedValue);
      if (!foundOption) return showEmptyPlaceholder ? emptyPlaceholder : '';

      const typography = (
        <Typography
          variant="bodyMedium"
          color="text.secondary"
          component="div"
          maxWidth={maxDisplayValueLength}
          overflow={maxDisplayValueLength ? 'hidden' : undefined}
          whiteSpace={maxDisplayValueLength ? 'nowrap' : undefined}
          textOverflow={maxDisplayValueLength ? 'ellipsis' : undefined}
          sx={{ whiteSpaceCollapse: 'preserve' }}
        >
          {foundOption.label}
        </Typography>
      );

      const content = customRenderValue ? (
        customRenderValue(foundOption)
      ) : showOptionIcon ? (
        <ListItemText
          variant="bodyMedium"
          primary={typography}
        />
      ) : (
        typography
      );

      return (
        <Box
          key={foundOption.value}
          value={foundOption.value}
          sx={styles.valueItem}
        >
          {content}
        </Box>
      );
    },
    [
      options,
      showEmptyPlaceholder,
      emptyPlaceholder,
      maxDisplayValueLength,
      customRenderValue,
      showOptionIcon,
      styles,
    ],
  );

  return (
    <StyledFormControl
      fullWidth
      required={required}
      sx={sx}
      variant="standard"
      size="small"
      showBorder={showBorder}
      error={error}
    >
      {labelNode ??
        (label && (
          <InputLabel sx={{ color: 'text.primary', left: '0.75rem', fontSize: '0.875rem', ...labelSX }}>
            {label}
          </InputLabel>
        ))}
      <StyledSelect
        className={className}
        labelId={id ? id + '-label' : 'simple-select-label-' + label}
        id={id || 'simple-select-' + label}
        name={name}
        value={realValue}
        disabled={disabled}
        open={menuOpen}
        onOpen={handleMenuOpen}
        onClose={handleMenuClose}
        onChange={handleChange}
        IconComponent={ArrowDownIcon}
        customSelectedColor={customSelectedColor}
        customSelectedFontSize={customSelectedFontSize}
        displayEmpty={displayEmpty}
        renderValue={renderValue}
        label={label}
        sx={inputSX}
        inputProps={inputProps}
        MenuProps={{
          sx: {
            '& .MuiPaper-root': {
              marginTop: '.5rem',
              maxHeight: maxListHeight,
            },
            ...customMenuProps.sx,
          },
          ...(onScroll && {
            PaperProps: {
              onScroll,
            },
          }),
          ...customMenuProps,
        }}
      >
        {options.length < 1 ? (
          <MenuItem
            sx={{ justifyContent: 'space-between' }}
            value=""
          >
            <Box component="em">None</Box>
          </MenuItem>
        ) : (
          options.map(option => {
            const isSelected = option.value === value;
            const background = isSelected ? theme.palette.background.participant.active : undefined;

            return (
              <MenuItem
                key={option.value}
                value={option.value}
                sx={{
                  justifyContent: 'space-between',
                  background: `${background} !important`,
                  ...(option.style || {}),

                  '&:hover #show-on-hover': {
                    display: 'flex',
                  },
                }}
                onClick={isSelected ? onClear : undefined}
              >
                {customRenderOption ? (
                  customRenderOption(option, isSelected)
                ) : showOptionIcon ? (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {iconPosition === 'left' &&
                      (optionsWithAvatar ? (
                        <ListItemIcon sx={styles.menuItemIconWithAvatar}>{option.icon}</ListItemIcon>
                      ) : (
                        <MenuItemIcon sx={menuItemIconSX}>{option.icon}</MenuItemIcon>
                      ))}
                    <TypographyWithConditionalTooltip
                      title={
                        showOptionIcon
                          ? `${option.label}${option.date ? ' - ' + option.date : ''}`
                          : option.label
                      }
                      placement="top"
                      variant="bodyMedium"
                      color="text.secondary"
                      sx={{
                        whiteSpaceCollapse: 'preserve',
                        maxWidth: 'inherit',
                        width: '100%',
                      }}
                    >
                      {showOptionIcon
                        ? `${option.label}${option.date ? ' - ' + option.date : ''}`
                        : option.label}
                    </TypographyWithConditionalTooltip>
                    {iconPosition === 'right' &&
                      (optionsWithAvatar ? (
                        <ListItemIcon
                          sx={[styles.menuItemIconWithAvatar, { marginRight: '0rem', marginLeft: '0.5rem' }]}
                        >
                          {option.icon}
                        </ListItemIcon>
                      ) : (
                        <MenuItemIcon sx={[menuItemIconSX, { marginRight: '0rem', marginLeft: '0.5rem' }]}>
                          {option.icon}
                        </MenuItemIcon>
                      ))}
                  </Box>
                ) : (
                  <TypographyWithConditionalTooltip
                    title={option.label}
                    placement="top"
                    variant="bodyMedium"
                    color="text.secondary"
                    sx={{
                      whiteSpaceCollapse: 'preserve',
                      maxWidth: 'inherit',
                      width: '100%',
                    }}
                  >
                    {option.label}
                  </TypographyWithConditionalTooltip>
                )}

                {isSelected && (
                  <StyledMenuItemIcon>
                    <CheckedIcon />
                  </StyledMenuItemIcon>
                )}
              </MenuItem>
            );
          })
        )}
      </StyledSelect>
      {error && <FormHelperText>{helperText}</FormHelperText>}
    </StyledFormControl>
  );
});

SingleSelect.displayName = 'SingleSelect';

/** @type {MuiSx} */
const singleSelectStyles = () => ({
  valueItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuItemIconWithAvatar: {
    width: '1.255rem',
    height: '1.255rem',
    fontSize: '0.625rem',
    marginRight: '0.5rem',
    minWidth: '0.625rem !important',

    svg: {
      fontSize: '0.625rem',
    },
  },
});

export const StyledFormControl = styled(
  FormControl,
  filterProps('showBorder'),
)(({ theme, showBorder }) =>
  showBorder
    ? {
        '& .MuiSelect-icon': {
          marginRight: '.75rem',
        },
        verticalAlign: 'bottom',

        '& .MuiInputBase-root.MuiInput-root': {
          padding: '0 .75rem',

          '&:not(:hover, .Mui-error):before': {
            borderBottom: `.0625rem solid ${theme.palette.border.lines}`,
          },

          '&:hover:not(.Mui-disabled, .Mui-error):before': {
            borderBottom: `.125rem solid ${theme.palette.border.hover}`,
          },
        },

        '& .MuiFormHelperText-root.Mui-error': {
          paddingLeft: '.75rem',
        },
      }
    : {
        margin: '0 8px',
        verticalAlign: 'bottom',
        '& .MuiInputBase-root.MuiInput-root:before': {
          border: 'none',
        },
        '& .MuiOutlinedInput-root': {
          '& fieldset': {
            border: 'none',
          },
          '&:hover fieldset': {
            border: 'none',
          },
          '&.Mui-focused fieldset': {
            border: 'none',
          },
          '& .MuiFormHelperText-root.Mui-error': {
            paddingLeft: '.75rem',
          },
        },
      },
);

export const MenuItemIcon = styled(ListItemIcon)(() => ({
  width: '0.625rem',
  height: '0.625rem',
  fontSize: '0.625rem',
  marginRight: '0.6rem',
  minWidth: '0.625rem !important',
  svg: {
    fontSize: '0.625rem',
  },
}));

export const StyledMenuItemIcon = styled(MenuItemIcon)(() => ({
  justifySelf: 'flex-end',
  justifyContent: 'flex-end',
  marginRight: '0rem',
  marginLeft: '1rem',

  svg: {
    fontSize: '0.75rem',
  },
}));

export default SingleSelect;
