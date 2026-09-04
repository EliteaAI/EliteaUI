import { memo } from 'react';

import { Tooltip as SharedTooltip } from '@/[fsd]/shared/ui';

const CaseInputNameCell = memo(props => {
  const { row } = props;
  const inputText = row?.input || '';
  const truncated = inputText.split('\n')[0]?.slice(0, 100) || '—';

  const styles = caseInputNameCellStyles();

  return (
    <SharedTooltip.TypographyWithConditionalTooltip
      title={truncated}
      placement="top"
      variant="bodyMedium"
      sx={styles.text}
    >
      {truncated}
    </SharedTooltip.TypographyWithConditionalTooltip>
  );
});

CaseInputNameCell.displayName = 'CaseInputNameCell';

/** @type {MuiSx} */
const caseInputNameCellStyles = () => ({
  text: ({ palette }) => ({
    color: palette.text.secondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
});

export default CaseInputNameCell;
