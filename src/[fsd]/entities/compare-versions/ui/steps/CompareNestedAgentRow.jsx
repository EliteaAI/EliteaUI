import { memo, useCallback, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import ArrowDownIcon from '@/components/Icons/ArrowDownIcon';

import { COMPARE_MESSAGES } from '../../lib/constants/compareVersions.constants';
import { NESTED_STATUS } from '../../lib/helpers/compareVersions.helpers';
import CompareNestedField from './CompareNestedField';
import CompareNestedTools from './CompareNestedTools';

const MAX_INDENT_LEVELS = 3;

const joinLines = list => (Array.isArray(list) ? list.filter(Boolean).join('\n') : '');

// A sub-agent of the compared versions, with what differs in it and the sub-agents below it
const CompareNestedAgentRow = memo(props => {
  const { row, depth = 0 } = props;
  const [expanded, setExpanded] = useState(false);
  const styles = compareNestedAgentRowStyles;

  const handleToggle = useCallback(() => setExpanded(prev => !prev), []);

  const leftData = row.left?.data ?? {};
  const rightData = row.right?.data ?? {};
  const isUnavailable = Boolean(row.left?.unavailable || row.right?.unavailable);
  const statusLabel = COMPARE_MESSAGES.nestedStatus[row.status] ?? row.status;
  const isDifferent = row.status !== NESTED_STATUS.same;
  const indent = Math.min(depth, MAX_INDENT_LEVELS) * 1.25;

  const renderBody = () => {
    if (isUnavailable) {
      return (
        <Box sx={styles.columns}>
          <Typography
            sx={styles.muted}
            variant="bodySmall2"
            color="text.primary"
          >
            {row.left?.unavailable ? COMPARE_MESSAGES.nestedUnavailable : ''}
          </Typography>
          <Typography
            sx={styles.muted}
            variant="bodySmall2"
            color="text.primary"
          >
            {row.right?.unavailable ? COMPARE_MESSAGES.nestedUnavailable : ''}
          </Typography>
        </Box>
      );
    }
    return (
      <>
        {(!row.left || !row.right) && (
          <Box sx={styles.columns}>
            <Typography
              sx={styles.muted}
              variant="bodySmall2"
              color="text.primary"
            >
              {row.left ? '' : COMPARE_MESSAGES.nestedNotPresent}
            </Typography>
            <Typography
              sx={styles.muted}
              variant="bodySmall2"
              color="text.primary"
            >
              {row.right ? '' : COMPARE_MESSAGES.nestedNotPresent}
            </Typography>
          </Box>
        )}
        <CompareNestedField
          label={COMPARE_MESSAGES.nestedInstructions}
          leftText={leftData.instructions ?? ''}
          rightText={rightData.instructions ?? ''}
        />
        <CompareNestedField
          label={COMPARE_MESSAGES.nestedWelcome}
          leftText={leftData.welcome_message ?? ''}
          rightText={rightData.welcome_message ?? ''}
        />
        <CompareNestedField
          label={COMPARE_MESSAGES.nestedStarters}
          leftText={joinLines(leftData.conversation_starters)}
          rightText={joinLines(rightData.conversation_starters)}
        />
        <CompareNestedTools
          leftTools={leftData.tools}
          rightTools={rightData.tools}
        />
      </>
    );
  };

  return (
    <Box
      sx={[styles.root, { marginLeft: `${indent}rem` }]}
      data-testid={`compare-nested-agent-${row.key}`}
    >
      <Button.BaseBtn
        variant={BUTTON_VARIANTS.secondary}
        aria-expanded={expanded}
        onClick={handleToggle}
        sx={styles.header}
        data-testid={`compare-nested-toggle-${row.key}`}
      >
        <ArrowDownIcon
          fill="currentColor"
          style={styles.arrow(expanded)}
        />
        <Typography
          variant="labelMedium"
          color="text.primary"
          sx={styles.name}
        >
          {row.name}
        </Typography>
        <Typography
          variant="bodySmall"
          color="text.secondary"
          sx={styles.entityType}
        >
          {row.entityType}
        </Typography>
        <Typography
          variant={isDifferent ? 'labelSmall' : 'bodySmall'}
          color={isDifferent ? 'text.attention' : 'text.secondary'}
          data-testid={`compare-nested-status-${row.key}`}
        >
          {statusLabel}
        </Typography>
      </Button.BaseBtn>
      {expanded && <Box sx={styles.body}>{renderBody()}</Box>}
      {row.children.map(child => (
        <CompareNestedAgentRow
          key={child.key}
          row={child}
          depth={depth + 1}
        />
      ))}
    </Box>
  );
});

CompareNestedAgentRow.displayName = 'CompareNestedAgentRow';

/** @type {MuiSx} */
const compareNestedAgentRowStyles = {
  // Plain style object: the legacy SvgIcon wrapper takes `style`, not `sx`
  arrow: expanded => ({ transform: expanded ? 'rotate(180deg)' : 'rotate(-90deg)', flexShrink: 0 }),
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  // A full-width row: the button keeps its theme states, only its layout is overridden
  header: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: '0.75rem',
    width: '100%',
    height: 'auto',
    padding: '0.5rem 1rem',
    textAlign: 'left',
    textTransform: 'none',
    color: palette.text.secondary,
    border: `0.0625rem solid ${palette.border.lines}`,
    borderRadius: '0.5rem',
    '&:hover': { borderColor: palette.border.hover },
  }),
  name: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  entityType: {
    textTransform: 'capitalize',
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    padding: '0.5rem 0 0.5rem 1rem',
  },
  columns: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  },
  muted: {
    fontStyle: 'italic',
  },
};

export default CompareNestedAgentRow;
