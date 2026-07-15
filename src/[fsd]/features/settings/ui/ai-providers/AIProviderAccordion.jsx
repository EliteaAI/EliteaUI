import { memo, useCallback, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import { StyledAccordion, StyledAccordionDetails, StyledAccordionSummary } from '@/[fsd]/shared/ui/accordion';
import ArrowRightIcon from '@/components/Icons/ArrowRightIcon';
import InfoIcon from '@/components/Icons/InfoIcon';

const AIProviderAccordion = memo(props => {
  const { title, count, metaItems = [], defaultExpanded = false, children } = props;

  const [expanded, setExpanded] = useState(defaultExpanded);

  const onChange = useCallback((_, value) => setExpanded(value), []);

  return (
    <StyledAccordion
      showMode={AccordionConstants.AccordionShowMode.LeftMode}
      expanded={expanded}
      onChange={onChange}
      sx={aiProviderAccordionStyles.accordion}
      slotProps={{ transition: { unmountOnExit: true } }}
    >
      <StyledAccordionSummary
        expandIcon={<ArrowRightIcon style={aiProviderAccordionStyles.expandIconStyle} />}
        showMode={AccordionConstants.AccordionShowMode.LeftMode}
        sx={aiProviderAccordionStyles.summary}
      >
        <Box sx={aiProviderAccordionStyles.summaryContent}>
          <Box sx={aiProviderAccordionStyles.summaryBody}>
            <Typography
              variant="headingSmall"
              sx={aiProviderAccordionStyles.title}
            >
              {title}
            </Typography>
            {metaItems.length > 0 && !expanded && (
              <Box sx={aiProviderAccordionStyles.metaRow}>
                {metaItems.map((item, idx) => (
                  <Box
                    key={idx}
                    sx={aiProviderAccordionStyles.metaItem}
                  >
                    <Box sx={aiProviderAccordionStyles.metaLabel}>
                      <Typography
                        variant="bodyMedium"
                        sx={aiProviderAccordionStyles.metaLabelText}
                      >
                        {item.label}
                      </Typography>
                      {item.tooltip && <InfoIcon sx={aiProviderAccordionStyles.infoIcon} />}
                    </Box>
                    <Typography
                      variant="bodyMedium"
                      sx={aiProviderAccordionStyles.metaValue}
                    >
                      {item.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
          {count !== undefined && (
            <Box sx={aiProviderAccordionStyles.countBadge}>
              <Typography
                variant="bodyMedium"
                sx={aiProviderAccordionStyles.countText}
              >
                {count}
              </Typography>
            </Box>
          )}
        </Box>
      </StyledAccordionSummary>
      <StyledAccordionDetails sx={aiProviderAccordionStyles.details}>{children}</StyledAccordionDetails>
    </StyledAccordion>
  );
});

AIProviderAccordion.displayName = 'AIProviderAccordion';

/** @type {MuiSx} */
const aiProviderAccordionStyles = {
  accordion: {
    width: '100%',
  },
  summary: ({ palette }) => ({
    width: '100% !important',
    borderRadius: '0.75rem',
    minHeight: 'unset !important',
    padding: '0.75rem 1rem !important',
    alignItems: 'flex-start',
    gap: '0.5rem',
    border: '0.0625rem solid',
    borderColor: palette.border.cardsOutlines,
    backgroundColor: palette.background.aiProviderAccordion.default,
    '&:hover': {
      backgroundColor: palette.background.aiProviderAccordion.hover,
    },
    '& .MuiAccordionSummary-content': {
      margin: '0 !important',
    },
    '& .MuiAccordionSummary-expandIconWrapper': {
      marginTop: '0.25rem',
    },
  }),
  expandIconStyle: {
    width: '1rem',
    height: '1rem',
  },
  summaryContent: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '0.75rem',
  },
  summaryBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    flex: 1,
    minWidth: 0,
  },
  title: ({ palette }) => ({
    color: palette.text.secondary,
    lineHeight: '1.5rem',
  }),
  metaRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: '1.5rem',
    flexWrap: 'wrap',
  },
  metaItem: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '0.5rem',
  },
  metaLabel: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '0.125rem',
  },
  metaLabelText: ({ palette }) => ({
    color: palette.text.primary,
    lineHeight: '1.5rem',
    whiteSpace: 'nowrap',
  }),
  infoIcon: {
    width: '1rem',
    height: '1rem',
    flexShrink: 0,
  },
  metaValue: ({ palette }) => ({
    color: palette.text.secondary,
    lineHeight: '1.5rem',
    whiteSpace: 'nowrap',
  }),
  countBadge: ({ palette }) => ({
    flexShrink: 0,
    width: '1.5rem',
    height: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    border: `0.0625rem solid ${palette.border.cardsOutlines}`,
  }),
  countText: ({ palette }) => ({
    color: palette.text.primary,
    lineHeight: '1.5rem',
    whiteSpace: 'nowrap',
  }),
  details: {
    paddingTop: '0.5rem',
    paddingBottom: '0.5rem',
    paddingLeft: '1.75rem',
    paddingRight: '0.5rem',
    gap: '0.75rem',
    width: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
  },
};

export default AIProviderAccordion;
