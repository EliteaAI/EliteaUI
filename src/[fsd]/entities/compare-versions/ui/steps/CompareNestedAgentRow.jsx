import { memo, useCallback, useMemo, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { TextDiffHighlight } from '@/[fsd]/entities/edit-entity-with-ai';
import ArrowDownIcon from '@/components/Icons/ArrowDownIcon';

import { COMPARE_MESSAGES } from '../../lib/constants/compareVersions.constants';
import { NESTED_STATUS, matchDependencies } from '../../lib/helpers/compareVersions.helpers';

const MAX_INDENT_LEVELS = 3;

const joinLines = list => (Array.isArray(list) ? list.filter(Boolean).join('\n') : '');

// One field of a sub-agent on both sides, as two read-only texts with the differences marked
const NestedField = memo(props => {
  const { label, leftText, rightText } = props;
  const styles = compareNestedAgentRowStyles;

  return (
    <Box sx={styles.field}>
      <Typography variant="labelSmall">{label}</Typography>
      <Box sx={styles.columns}>
        <Box sx={styles.card}>
          <TextDiffHighlight
            original={rightText}
            modified={leftText}
            mode="modified"
          />
        </Box>
        <Box sx={styles.card}>
          <TextDiffHighlight
            original={leftText}
            modified={rightText}
            mode="modified"
          />
        </Box>
      </Box>
    </Box>
  );
});

NestedField.displayName = 'NestedField';

const NestedTools = memo(props => {
  const { leftTools, rightTools } = props;
  const styles = compareNestedAgentRowStyles;
  const rows = useMemo(() => matchDependencies(leftTools ?? [], rightTools ?? []), [leftTools, rightTools]);

  return (
    <Box sx={styles.field}>
      <Typography variant="labelSmall">{COMPARE_MESSAGES.nestedTools}</Typography>
      {rows.length === 0 ? (
        <Typography
          sx={styles.muted}
          variant="bodySmall2"
          color="text.primary"
        >
          {COMPARE_MESSAGES.nestedNoTools}
        </Typography>
      ) : (
        rows.map(row => (
          <Box
            key={row.key}
            sx={styles.columns}
          >
            {[row.left, row.right].map((tool, index) => (
              <Box
                key={index}
                sx={[
                  styles.toolCell,
                  !tool && styles.toolCellEmpty,
                  tool && !(row.left && row.right) && styles.toolCellUnique,
                ]}
              >
                {tool && (
                  <>
                    <Typography
                      variant="bodyMedium"
                      color="text.primary"
                    >
                      {tool.name}
                    </Typography>
                    <Typography
                      variant="bodySmall"
                      color="text.secondary"
                    >
                      {tool.type ?? tool.entityType}
                    </Typography>
                  </>
                )}
              </Box>
            ))}
          </Box>
        ))
      )}
    </Box>
  );
});

NestedTools.displayName = 'NestedTools';

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
        <NestedField
          label={COMPARE_MESSAGES.nestedInstructions}
          leftText={leftData.instructions ?? ''}
          rightText={rightData.instructions ?? ''}
        />
        <NestedField
          label={COMPARE_MESSAGES.nestedWelcome}
          leftText={leftData.welcome_message ?? ''}
          rightText={rightData.welcome_message ?? ''}
        />
        <NestedField
          label={COMPARE_MESSAGES.nestedStarters}
          leftText={joinLines(leftData.conversation_starters)}
          rightText={joinLines(rightData.conversation_starters)}
        />
        <NestedTools
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
      <Box
        component="button"
        type="button"
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
      </Box>
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
  header: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    width: '100%',
    padding: '0.5rem 1rem',
    textAlign: 'left',
    cursor: 'pointer',
    color: palette.text.secondary,
    backgroundColor: palette.background.surface.interactive.default,
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
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  columns: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  },
  card: ({ palette }) => ({
    padding: '0.5rem 1rem',
    minHeight: '2.5rem',
    maxHeight: '12rem',
    overflowY: 'auto',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.surface.interactive.default,
    border: `0.0625rem solid ${palette.border.lines}`,
  }),
  muted: {
    fontStyle: 'italic',
  },
  toolCell: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    minHeight: '2.5rem',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.lines}`,
  }),
  toolCellEmpty: ({ palette }) => ({
    border: `0.0625rem dashed ${palette.border.lines}`,
  }),
  toolCellUnique: ({ palette }) => ({
    backgroundColor: palette.diff.added,
  }),
};

export default CompareNestedAgentRow;
