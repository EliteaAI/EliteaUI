import { memo } from 'react';

import { TypographyWithConditionalTooltip } from '@/[fsd]/shared/ui/tooltip';

const BaseCardBody = memo(({ tool, onClickShowActions, showActions }) => {
  const styles = getStyles();

  return (
    <>
      {!tool.settings?.selected_tools?.length ? (
        <TypographyWithConditionalTooltip
          title={tool.description}
          placement="top"
          component="div"
          variant="bodySmall"
          sx={styles.description}
        >
          {tool.description}
        </TypographyWithConditionalTooltip>
      ) : (
        <TypographyWithConditionalTooltip
          title={showActions ? 'Hide tools' : 'Show tools'}
          placement="top"
          component="div"
          variant="bodySmall"
          onClick={onClickShowActions}
          sx={styles.toggleText}
        >
          {showActions ? 'Hide tools' : 'Show tools'}
        </TypographyWithConditionalTooltip>
      )}
    </>
  );
});

/** @type {MuiSx} */
const getStyles = () => ({
  description: ({ palette }) => ({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    width: '100%',
    color: palette.text.primary,
  }),
  toggleText: ({ palette }) => ({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    width: '100%',
    cursor: 'pointer',
    display: 'inline',
    padding: '0.125rem 0',
    borderRadius: '0.25rem',
    textDecoration: 'none',
    color: palette.text.primary,
    '&:hover': {
      color: palette.text.createButton,
    },
  }),
});

BaseCardBody.displayName = 'BaseCardBody';

export default BaseCardBody;
