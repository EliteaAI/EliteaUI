import { memo, useCallback, useMemo, useState } from 'react';

import { Box, TextField as MuiTextField } from '@mui/material';

import { Label } from '@/[fsd]/shared/ui';
import useAutoBlur from '@/hooks/useAutoBlur';
import useToast from '@/hooks/useToast';

import InputActionsToolbar from './InputActionsToolbar';
import { INPUT_VARIANTS } from './textFieldVariants';

const PROMPT_PAGE_INPUT = {
  ROWS: {
    TWO: '2.75rem',
    THREE: '4.3rem',
  },
  CLAMP: {
    TWO: '2',
    THREE: '3',
  },
};

/**
 * StyledInputEnhancerBase - Base component for enhanced input fields
 *
 * Provides common functionality:
 * - Hover state management
 * - Copy/Expand/Full-screen action toolbar
 * - Auto-blur behavior
 * - Drag & drop handling
 * - Expand/collapse rows functionality
 *
 * This is a presentational component that doesn't handle modal rendering itself.
 * Child components should handle their own modal logic.
 *
 * @param {Object} props - Component props
 * @param {string} [props.variant='standard'] - Visual variant (INPUT_VARIANTS.standard)
 * @param {boolean} [props.showexpandicon=false] - Show expand/collapse icon in endAdornment
 * @param {boolean} [props.editswitcher=false] - Enable edit switcher mode
 * @param {Object} [props.editswitchconfig={}] - Configuration for edit switcher
 * @param {function} [props.onDrop] - Drop event handler
 * @param {function} [props.onDragOver] - Drag over event handler
 * @param {function} [props.onBlur] - Blur event handler
 * @param {function} [props.onChange] - Change event handler
 * @param {function} [props.onKeyPress] - Key press event handler
 * @param {function} [props.onKeyDown] - Key down event handler
 * @param {*} props.value - Input value
 * @param {Object} [props.containerProps={}] - Props for container Box
 * @param {Object} [props.InputLabelProps] - Props for input label
 * @param {number} [props.maxRows=null] - Maximum number of rows
 * @param {number} [props.minRows=3] - Minimum number of rows
 * @param {boolean} [props.collapseContent=false] - Start with collapsed content
 * @param {Object} [props.inputProps] - Props for HTML input element
 * @param {boolean} [props.hasActionsToolBar=false] - Show actions toolbar on hover
 * @param {boolean} [props.showCopyAction=true] - Show copy button in toolbar
 * @param {boolean} [props.showFullScreenAction=true] - Show full-screen button in toolbar
 * @param {boolean} [props.showExpandAction=true] - Show expand/collapse button in toolbar
 * @param {boolean} [props.enableAutoBlur=true] - Enable auto-blur on change
 * @param {Object} [props.actionsBarProps={}] - Props for actions toolbar Box
 * @param {boolean} [props.disableUnderline] - Disable input underline
 * @param {Object} [props.inputRef] - Ref for input element
 * @param {function} [props.onFullScreen] - Full-screen button click handler
 * @param {React.ReactNode} [props.fullScreenIcon] - Custom full-screen icon
 * @param {string} [props.tooltipDescription] - Optional description for info icon tooltip next to label
 * @param {boolean} [props.forceShowActionsToolbar=false] - Force actions toolbar to show (e.g. for Storybook demos)
 * @param {Object} props...rest - All other props passed through to TextField
 */
const InputBase = memo(props => {
  const {
    variant = INPUT_VARIANTS.standard,
    editswitcher = false,
    editswitchconfig = {},
    onDrop,
    onDragOver,
    onBlur,
    onChange,
    onKeyPress,
    value,
    containerProps = {},
    InputLabelProps,
    maxRows = null,
    minRows = 3,
    collapseContent = false,
    inputProps,
    hasActionsToolBar = false,
    showCopyAction = true,
    showFullScreenAction = true,
    showExpandAction = true,
    enableAutoBlur = true,
    actionsBarProps = {},
    disableUnderline,
    onKeyDown,
    inputRef,
    onFullScreen,
    fullScreenIcon,
    tooltipDescription,
    forceShowActionsToolbar = false,
    // eslint-disable-next-line no-unused-vars
    fieldName, // Extract but don't use - prevents DOM warning when passed from parent
    sx: externalSx,
    ...leftProps
  } = props;

  const { toastError, toastInfo } = useToast();
  const [isHovering, setIsHovering] = useState(false);
  const [rows, setRows] = useState(collapseContent ? minRows : maxRows);

  const switchRows = useCallback(() => {
    setRows(prev => {
      const newRows = prev === maxRows ? minRows : maxRows;
      return newRows;
    });
  }, [maxRows, minRows]);

  const autoBlur = useAutoBlur();

  const handlers = useMemo(
    () => ({
      onBlur: event => {
        if (onBlur) {
          onBlur(event);
        }
      },
      onChange: event => {
        if (onChange) onChange(event);
        if (enableAutoBlur) {
          autoBlur();
        }
      },
      onDrop: event => {
        event.preventDefault();
        if (onDrop) onDrop(event);
      },
      onDragOver: event => {
        event.preventDefault();
        if (onDragOver) onDragOver(event);
      },
      onKeyPress: event => {
        if (onKeyPress) onKeyPress(event);
      },
      onKeyDown: event => {
        onKeyDown?.(event);
      },
    }),
    [onBlur, onChange, enableAutoBlur, autoBlur, onDrop, onDragOver, onKeyPress, onKeyDown],
  );

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      toastInfo('The content has been copied to the clipboard');
    } catch {
      toastError('Failed to copy the content!');
    }
  }, [value, toastInfo, toastError]);

  const handleFullScreen = useCallback(() => {
    onFullScreen?.();
  }, [onFullScreen]);

  const isCollapsed = rows === minRows && minRows !== maxRows;
  const isExpanded = rows === maxRows;

  const needsLabelUnclip = typeof leftProps.label !== 'string' || Boolean(tooltipDescription);

  const styles = useMemo(
    () =>
      styledInputBaseStyles(
        leftProps.label,
        editswitcher,
        editswitchconfig,
        isCollapsed,
        minRows,
        needsLabelUnclip,
      ),
    [leftProps.label, editswitcher, editswitchconfig, isCollapsed, minRows, needsLabelUnclip],
  );

  const getLabelContent = () => {
    if (!leftProps.label) return undefined;
    // If label is already a React element (e.g. a <Typography> node passed from
    // OAuthFormFields), return it as-is — stringifying it via a template literal
    // would produce "[object Object]".
    if (typeof leftProps.label !== 'string') {
      return leftProps.label;
    }
    const labelText = `${leftProps.label}${leftProps.required ? ' *' : ''}`;
    return (
      <Label.InfoLabelWithTooltip
        label={labelText}
        inheritLabel
        inheritColor
        {...(tooltipDescription && {
          tooltip: tooltipDescription,
          labelTextPointerEventsNone: true,
        })}
      />
    );
  };

  const labelContent = getLabelContent();

  return (
    <>
      <Box
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        sx={styles.containerBox}
        {...containerProps}
      >
        {hasActionsToolBar && (isHovering || forceShowActionsToolbar) && (
          <InputActionsToolbar
            value={value}
            showCopyAction={showCopyAction}
            showFullScreenAction={showFullScreenAction}
            showExpandAction={showExpandAction}
            onCopy={onCopy}
            onFullScreen={handleFullScreen}
            switchRows={switchRows}
            fullScreenIcon={fullScreenIcon}
            isExpanded={isExpanded}
            actionsBarProps={actionsBarProps}
            toolbarSx={styles.actionsToolbar}
            iconButtonSx={styles.iconButton}
            iconSizeSx={styles.iconSize}
          />
        )}
        <MuiTextField
          variant={variant}
          fullWidth
          sx={[styles.textField, externalSx]}
          value={value}
          inputRef={inputRef}
          {...leftProps}
          label={labelContent}
          {...handlers}
          slotProps={{
            input: {
              sx: styles.inputSlot,
              readOnly: editswitcher,
              onDoubleClick: () => {},
              disableUnderline,
            },
            htmlInput: inputProps,
            inputLabel: {
              ...InputLabelProps,
              sx: {
                ...styles.inputLabelSlot,
                ...InputLabelProps?.sx,
                ...(leftProps.required && { '& .MuiInputLabel-asterisk': { display: 'none' } }),
                ...(tooltipDescription && { pointerEvents: 'auto', zIndex: 1 }),
              },
            },
          }}
          maxRows={rows}
        />
      </Box>
    </>
  );
});

InputBase.displayName = 'InputBase';

/** @type {MuiSx} */
const styledInputBaseStyles = (
  hasLabel,
  editswitcher,
  editswitchconfig,
  isCollapsed,
  minRows,
  needsLabelUnclip,
) => ({
  inputLabelSlot: {
    textOverflow: 'clip',
    ...(needsLabelUnclip && {
      overflow: 'visible',
      maxWidth: 'none',
    }),
  },
  containerBox: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  },
  actionsToolbar: ({ spacing }) => ({
    position: 'absolute',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: spacing(0.5),
    top: hasLabel ? '0.15rem' : '-1.25rem',
    right: spacing(1.5),
    zIndex: 999,
  }),
  iconButton: {
    marginLeft: '0rem',
  },
  expandIconButton: {
    zIndex: 100,
    marginLeft: '0px',
    position: 'absolute',
    top: '-1.875rem',
    right: '0px',
  },
  iconSize: {
    fontSize: '1rem',
  },
  unfoldIcon: ({ palette }) => ({
    color: palette.icon.fill.default,
  }),
  inputSlot: ({ spacing }) => ({
    paddingRight: spacing(1.5),
  }),
  textField: {
    '& .MuiFormHelperText-root:not(.Mui-error)': ({ palette }) => ({
      color: palette.secondary.main,
    }),
    '.MuiInputBase-input': {
      maxHeight: editswitcher ? editswitchconfig.inputHeight || PROMPT_PAGE_INPUT.ROWS.TWO : '100%',
      WebkitLineClamp: editswitcher
        ? editswitchconfig.inputHeight === PROMPT_PAGE_INPUT.ROWS.THREE
          ? PROMPT_PAGE_INPUT.CLAMP.THREE
          : PROMPT_PAGE_INPUT.CLAMP.TWO
        : isCollapsed
          ? minRows
          : 'unset',
      caretColor: editswitcher ? 'transparent' : 'auto',
      overflowWrap: 'break-word',
      overflow: isCollapsed ? 'hidden' : 'auto',
      ...(editswitcher || isCollapsed
        ? {
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
          }
        : {}),
    },
  },
});

export default InputBase;
