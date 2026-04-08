import { memo } from 'react';

import { Box } from '@mui/material';

import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import {
  StyledAccordion,
  StyledAccordionDetails,
  StyledAccordionSummary,
  StyledExpandMoreIcon,
} from '@/[fsd]/shared/ui/accordion';
import { useTheme } from '@emotion/react';

const FilledAccordion = memo(props => {
  const {
    title,
    expanded,
    onChange,
    showMode = AccordionConstants.AccordionShowMode.RightMode,
    defaultExpanded = true,
    rightContent,
    children,
  } = props;

  const theme = useTheme();
  const styles = filledAccordionStyles();

  return (
    <StyledAccordion
      showMode={showMode}
      sx={styles.accordion(theme)}
      defaultExpanded={defaultExpanded}
      expanded={expanded}
      onChange={onChange}
    >
      <Box sx={styles.contentBox}>
        <StyledAccordionSummary
          expandIcon={<StyledExpandMoreIcon sx={styles.expandIcon} />}
          aria-controls="panel-content"
          showMode={showMode}
          onClick={event => event.stopPropagation()}
          sx={styles.summary(theme)}
        >
          {title}
        </StyledAccordionSummary>
        {rightContent}
      </Box>
      <StyledAccordionDetails>{children}</StyledAccordionDetails>
    </StyledAccordion>
  );
});

FilledAccordion.displayName = 'FilledAccordion';

/** @type {MuiSx} */
const filledAccordionStyles = () => ({
  accordion: theme => ({
    background: `${theme.palette.background.tabPanel} !important`,
  }),
  contentBox: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '0.5rem',
  },
  summary: theme => ({
    display: 'flex',
    flexGrow: '1',
    padding: '0.5rem 0.75rem',
    alignItems: 'center',
    gap: '0.75rem',
    alignSelf: 'stretch',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${theme.palette.border.lines}`,
    background: theme.palette.background.button.default,
  }),
  expandIcon: {
    width: '1rem',
    height: '1rem',
  },
});

export default FilledAccordion;
