import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import {
  StyledAccordion,
  StyledAccordionDetails,
  StyledAccordionSummary,
  StyledExpandMoreIcon,
} from '@/[fsd]/shared/ui/accordion';
import { filterProps } from '@/common/utils';
import styled from '@emotion/styled';

const StyledTypography = styled(
  Typography,
  filterProps('uppercase'),
)(({ uppercase }) => ({
  fontSize: '0.75rem',
  textTransform: uppercase ? 'uppercase' : 'unset',
  lineHeight: '1rem',
  fontStyle: 'normal',
  fontWeight: 500,
  letterSpacing: '0.045rem',
}));

const BasicAccordion = memo(props => {
  const {
    items = [],
    showMode = AccordionConstants.AccordionShowMode.LeftMode,
    accordionSX,
    style,
    uppercase = true,
    defaultExpanded = true,
    expanded,
    onChange,
    summarySX,
    titleSX,
    accordionDetailsSX,
    card = false,
    'data-testid': dataTestId,
  } = props;

  const styles = basicAccordionStyles();

  return (
    <Box
      sx={style}
      data-testid={dataTestId}
    >
      {items.map(({ title, content, summaryAction, headerContent, testId }, index) => (
        <Box
          key={index}
          sx={styles.accordionWrapper}
        >
          <StyledAccordion
            sx={accordionSX}
            showMode={showMode}
            card={card}
            defaultExpanded={defaultExpanded}
            expanded={expanded}
            onChange={onChange}
          >
            <StyledAccordionSummary
              expandIcon={<StyledExpandMoreIcon sx={styles.expandIcon} />}
              aria-controls={`panel-content-${index}`}
              showMode={showMode}
              card={card}
              sx={summarySX}
              data-testid={testId}
            >
              <StyledTypography
                sx={titleSX}
                uppercase={uppercase}
              >
                {title}
              </StyledTypography>
              {headerContent && <Box sx={styles.headerContent}>{headerContent}</Box>}
            </StyledAccordionSummary>
            <StyledAccordionDetails
              card={card}
              sx={accordionDetailsSX}
            >
              {content}
            </StyledAccordionDetails>
          </StyledAccordion>
          {summaryAction && (
            <Box
              sx={styles.summaryAction}
              onClick={e => e.stopPropagation()}
              onMouseDown={e => e.stopPropagation()}
            >
              {summaryAction}
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
});

BasicAccordion.displayName = 'BasicAccordion';

/** @type {MuiSx} */
const basicAccordionStyles = () => ({
  accordionWrapper: {
    position: 'relative',
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginLeft: 'auto',
  },
  expandIcon: {
    width: '1rem',
    height: '1rem',
  },
  summaryAction: {
    position: 'absolute',
    top: '0.35rem',
    right: '0.1rem',
    display: 'flex',
    alignItems: 'center',
  },
});

export default BasicAccordion;
