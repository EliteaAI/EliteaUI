import { memo, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import { COMPARE_MESSAGES } from '../../lib/constants/compareVersions.constants';
import { matchDependencies } from '../../lib/helpers/compareVersions.helpers';

// The tools of a sub-agent on both sides, matched by name; a tool on one side only is marked as added
const CompareNestedTools = memo(props => {
  const { leftTools, rightTools } = props;
  const styles = compareNestedToolsStyles;
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

CompareNestedTools.displayName = 'CompareNestedTools';

/** @type {MuiSx} */
const compareNestedToolsStyles = {
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

export default CompareNestedTools;
