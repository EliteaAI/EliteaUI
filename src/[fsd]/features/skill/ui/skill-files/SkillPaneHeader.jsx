import { memo } from 'react';

import { Box, Typography } from '@mui/material';

/**
 * The header row of a skill editor column: a title on the left (text or a node), actions on the right.
 * Every column has it at the same height, so the rows line up across the page.
 */
const SkillPaneHeader = memo(props => {
  const { title, subtitle, children, testId, sx } = props;
  const styles = skillPaneHeaderStyles();

  return (
    <Box
      sx={[styles.header, sx]}
      data-testid={testId}
    >
      <Box sx={styles.title}>
        {typeof title === 'string' ? (
          <Typography
            variant="headingSmall"
            sx={styles.titleText}
            title={subtitle ? `${title} ${subtitle}` : title}
          >
            {title}
            {subtitle && (
              <Box
                component="span"
                sx={styles.subtitle}
              >
                {` ${subtitle}`}
              </Box>
            )}
          </Typography>
        ) : (
          title
        )}
      </Box>
      {children && <Box sx={styles.actions}>{children}</Box>}
    </Box>
  );
});

SkillPaneHeader.displayName = 'SkillPaneHeader';

/** @type {MuiSx} */
const skillPaneHeaderStyles = () => ({
  header: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.9375rem',
    height: '3.3125rem',
    flexShrink: 0,
    padding: '0 1rem 0 1.5rem',
    boxSizing: 'border-box',
    backgroundColor: palette.background.default.tertiary,
    borderBottom: `0.0625rem solid ${palette.border.default}`,
  }),
  title: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
  },
  titleText: ({ palette }) => ({
    color: palette.text.secondary,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }),
  subtitle: ({ palette }) => ({
    color: palette.text.primary,
    fontWeight: 500,
  }),
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flexShrink: 0,
  },
});

export default SkillPaneHeader;
