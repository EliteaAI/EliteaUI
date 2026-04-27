import { memo, useCallback, useMemo, useState } from 'react';

import { useFormikContext } from 'formik';

import CheckIcon from '@mui/icons-material/Check';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { Box, IconButton } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { TypographyWithConditionalTooltip } from '@/[fsd]/shared/ui/tooltip';
import ChipWithCheckIcon from '@/components/ChipWithCheckIcon';
import CopyIcon from '@/components/Icons/CopyIcon';
import useToast from '@/hooks/useToast';

const ToolView = memo(props => {
  const { toolOption, isSelected, toggleHandler } = props;
  const { toastInfo } = useToast();
  const [isHovering, setIsHovering] = useState(false);

  const onMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const onMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  const onCopy = useCallback(
    value => async event => {
      event.stopPropagation();
      await navigator.clipboard.writeText(value);
      toastInfo('The content has been copied to the clipboard');
    },
    [toastInfo],
  );

  const styles = toolViewStyles(isSelected, isHovering);

  return (
    <Box
      key={toolOption.value}
      sx={styles.toolContainer}
      onClick={toggleHandler}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {isSelected && <CheckIcon sx={styles.checkIcon} />}

      <TypographyWithConditionalTooltip
        title={toolOption.label}
        placement="right"
        variant="bodyMedium"
        color="text.secondary"
        sx={styles.toolLabel}
      >
        {toolOption.label}
      </TypographyWithConditionalTooltip>

      {isHovering && (
        <Box sx={styles.copyButtonContainer}>
          <Tooltip
            title="Copy the tool name"
            placement="top"
          >
            <IconButton
              sx={styles.copyActionButton}
              variant="alita"
              color="tertiary"
              onClick={onCopy(toolOption.value)}
            >
              <CopyIcon sx={styles.copyActionIcon} />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
});

ToolView.displayName = 'ToolView';

const UnavailableToolView = memo(props => {
  const { toolOption, isSelected, onClick } = props;
  const styles = unavailableToolViewStyles();

  return (
    <Tooltip
      key={toolOption.value}
      title="Tool is not available"
      placement="top"
    >
      <span>
        <ChipWithCheckIcon
          isSelected={isSelected}
          clickable={!!onClick}
          onClick={onClick}
          label={toolOption.label}
          warning={true}
          icon={
            <ErrorOutlineIcon
              fontSize="small"
              color="warning"
            />
          }
          sx={styles.chip}
        />
      </span>
    </Tooltip>
  );
});

UnavailableToolView.displayName = 'UnavailableToolView';

const EnhancedCardToolActions = memo(props => {
  const {
    toolOptions = [],
    selectedTools = [],
    availableTools = [],
    showActions = false,
    index,
    disabled,
  } = props;
  const { setFieldValue } = useFormikContext();

  // Sort tools: selected first (alphabetically), then unselected (alphabetically)
  const sortedTools = useMemo(() => {
    const selectedSet = new Set(selectedTools);

    // Separate selected and unselected tools
    const selected = toolOptions.filter(toolItem => selectedSet.has(toolItem.value));
    const unselected = toolOptions.filter(toolItem => !selectedSet.has(toolItem.value));

    // Sort both arrays alphabetically by label
    const sortByLabel = (a, b) => a.label.localeCompare(b.label);
    selected.sort(sortByLabel);
    unselected.sort(sortByLabel);

    // Return selected first, then unselected
    return [...selected, ...unselected];
  }, [selectedTools, toolOptions]);

  // Handle tool selection/deselection
  const handleToolToggle = useCallback(
    async toolValue => {
      if (!disabled) {
        const currentSelectedTools = selectedTools || [];
        let newSelectedTools;

        if (currentSelectedTools.includes(toolValue)) {
          // Remove tool from selection
          newSelectedTools = currentSelectedTools.filter(toolItem => toolItem !== toolValue);
        } else {
          // Add tool to selection
          newSelectedTools = [...currentSelectedTools, toolValue];
        }

        // Update the tool's selected_tools in formik
        await setFieldValue(`version_details.tools.${index}.settings.selected_tools`, newSelectedTools);
      }
    },
    [disabled, selectedTools, setFieldValue, index],
  );

  // Create handlers for each tool to avoid arrow functions in JSX
  const createToggleHandler = useCallback(
    toolValue => {
      return () => handleToolToggle(toolValue);
    },
    [handleToolToggle],
  );

  const styles = enhancedCardToolActionsStyles();

  return showActions ? (
    <Box sx={styles.actionsContainer}>
      <Box sx={styles.dividerLine} />
      <Box sx={styles.toolsWrapper}>
        {sortedTools.map(toolOption => {
          const isSelected = selectedTools.includes(toolOption.value);
          const isAvailable = !availableTools?.length || availableTools.includes(toolOption.value);
          const toggleHandler = createToggleHandler(toolOption.value);

          return isAvailable ? (
            <ToolView
              key={toolOption.value}
              toolOption={toolOption}
              isSelected={isSelected}
              toggleHandler={toggleHandler}
            />
          ) : (
            <UnavailableToolView
              key={toolOption.value}
              toolOption={toolOption}
              isSelected={isSelected}
              onClick={isSelected ? toggleHandler : undefined}
            />
          );
        })}
      </Box>
    </Box>
  ) : null;
});

EnhancedCardToolActions.displayName = 'EnhancedCardToolActions';

/** @type {MuiSx} */
const enhancedCardToolActionsStyles = () => ({
  actionsContainer: {
    mt: 0,
    padding: '0rem 0.5rem 0.5rem 0.5rem',
  },
  dividerLine: ({ palette, spacing }) => ({
    width: '100%',
    height: '0.0625rem',
    background: palette.border.lines,
    marginBottom: spacing(2),
  }),
  toolsWrapper: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    alignContent: 'flex-start',
    padding: '0.25rem 1rem',
    gap: '0.5rem',
    width: '100%',
  },
});

/** @type {MuiSx} */
const toolViewStyles = (isSelected, isHovering) => ({
  toolContainer: ({ palette }) => ({
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    padding: '0.25rem 1rem',
    boxSizing: 'border-box',
    gap: '0.5rem',
    height: '2rem',
    background: isSelected
      ? palette.background.select.selected.default
      : palette.background.button.secondary.default,
    borderRadius: '0.625rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease, padding-right 0.2s ease',
    maxWidth: '100%',
    overflow: 'hidden',
    '&:hover': {
      background: isSelected
        ? palette.background.select.selected.hover
        : palette.background.button.secondary.hover,
    },
  }),
  checkIcon: ({ palette }) => ({
    width: '1rem',
    height: '1rem',
    color: palette.text.secondary,
    flexShrink: 0,
  }),
  copyButtonContainer: {
    position: 'absolute',
    right: '0.5rem',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 1,
  },
  copyActionButton: {
    width: '1.75rem',
    height: '1.75rem',
    padding: '0.125rem',
  },
  copyActionIcon: {
    fontSize: '1rem',
  },
  toolLabel: {
    maxWidth: !isHovering ? undefined : `calc(100% - ${isSelected ? 3 : 1.25}rem)`,
  },
});

/** @type {MuiSx} */
const unavailableToolViewStyles = () => ({
  chip: {
    '.MuiChip-label': {
      paddingLeft: '0rem',
      paddingRight: '0rem',
    },
    '.MuiChip-icon': {
      marginLeft: '0rem',
      marginRight: '0rem',
    },
  },
});

export default EnhancedCardToolActions;
