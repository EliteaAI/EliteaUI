import { memo } from 'react';

import { Box } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { DecisionOutputHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { Chip } from '@/[fsd]/shared/ui';
import RemoveIcon from '@/assets/remove-icon.svg?react';
import StyledChip from '@/components/DataDisplay/StyledChip';
import { useEdges, useNodes } from '@xyflow/react';

export const DecisionOutputs = memo(props => {
  const { id, decisionOutput, onRemoveOutput, isRunningPipeline, disabled } = props;
  const edges = useEdges();
  const nodes = useNodes();
  const styles = decisionOutputsStyles();

  return (
    <Box sx={styles.decisionOutputsContainer}>
      <Chip.HeadingChip label="Decision outputs" />

      <Box sx={styles.outputsBorderContainer}>
        {(decisionOutput || []).map(item => {
          const { borderColor, tooltip } = DecisionOutputHelpers.getBorderColorAndTooltip(
            edges,
            nodes,
            id,
            item,
          );
          return (
            <StyledTooltip
              key={item}
              title={tooltip}
              placement="top"
            >
              <StyledChip
                label={item}
                disabled={isRunningPipeline || disabled}
                className="nopan nodrag nowheel"
                sx={styles.styledChip(borderColor)}
                deleteIcon={<RemoveIcon />}
                onDelete={onRemoveOutput(item)}
              />
            </StyledTooltip>
          );
        })}
      </Box>
    </Box>
  );
});

DecisionOutputs.displayName = 'DecisionOutputs';

/** @type {MuiSx} */
export const commonComponentStyles = () => ({
  renderValueBox: {
    // Base styles are handled by the Box props, dynamic background in component
  },
  removeIcon: {
    cursor: 'pointer',
  },
  multipleSelect: {
    marginBottom: '0rem',
  },
  labelSX: {
    left: '.75rem',
    '& .Mui-focused': {
      top: '-0.3125rem',
    },
  },
  selectSX: {
    '& .MuiSelect-icon': {
      top: 'calc(50% - .6875rem) !important;',
    },
  },
  valueItemSX: {
    maxWidth: '100% !important',
    overflow: 'scroll !important',
    gap: '.75rem',
    display: 'flex',
    flexDirection: 'row',
    paddingBottom: '.25rem',
  },
  inputEnhancerContainer: {
    marginBottom: '0rem !important',
    className: 'nopan nodrag nowheel',
  },
});

/** @type {MuiSx} */
const decisionOutputsStyles = () => ({
  decisionOutputsContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    padding: '.5rem 0rem',
    gap: '.5rem',
    overflow: 'hidden',
  },
  outputsBorderContainer: {
    width: '100%',
    borderRadius: '.5rem',
    border: ({ palette }) => `.0625rem solid ${palette.border.lines}`,
    display: 'flex',
    alignItems: 'center',
    padding: '.75rem 1rem',
    gap: '.5rem',
    boxSizing: 'border-box',
    flexWrap: 'wrap',
  },
  styledChip:
    borderStatus =>
    ({ palette }) => ({
      padding: '0rem .5rem',
      height: '1.5rem',
      borderRadius: '1.25rem',
      marginBottom: '0rem',
      marginRight: '0rem',
      gap: '.25rem',
      '& .MuiChip-deleteIcon': {
        margin: '0rem',
        color: `${palette.icon.fill.secondary} !important`,
        '&:hover': {
          color: palette.icon.fill.secondary,
        },
      },
      border: `.0625rem solid ${palette.status[borderStatus]} !important`,
    }),
});
