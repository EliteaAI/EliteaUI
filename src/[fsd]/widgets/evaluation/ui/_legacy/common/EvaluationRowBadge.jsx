import { memo } from 'react';

import { Typography } from '@mui/material';

const EvaluationRowBadge = memo(props => {
  const { children, sx = {} } = props;

  const styles = evaluationRowBadgeStyles();

  return (
    <Typography
      component="span"
      variant="bodySmall"
      sx={[styles.root, sx]}
      data-testid="evaluation-row-badge"
    >
      {children}
    </Typography>
  );
});

EvaluationRowBadge.displayName = 'EvaluationRowBadge';

/** @type {MuiSx} */
const evaluationRowBadgeStyles = () => ({
  root: ({ palette }) => ({
    padding: '0.0625rem 0.5rem',
    borderRadius: '0.75rem',
    color: palette.text.secondary,
    backgroundColor: palette.background.tabPanel,
    border: `0.0625rem solid ${palette.border.lines}`,
  }),
});

export default EvaluationRowBadge;
