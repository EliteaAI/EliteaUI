import { memo, useCallback, useEffect, useState } from 'react';

import { Box, CircularProgress, Typography, useTheme } from '@mui/material';

import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import { StyledAccordion, StyledAccordionDetails, StyledAccordionSummary } from '@/[fsd]/shared/ui/accordion';
import ArrowRightIcon from '@/assets/arrow-right-icon.svg?react';

import { resolveSubAgentIcon } from './subAgentIcon.helpers';

// VS Code-style collapsible group for one sub-agent's activity. Collapsed by
// default with a left-to-right shimmer sweeping the name while the sub-agent is
// running; auto-expands when it pauses for HITL approval (shimmer stops). The
// children (chips / live content box / HITL cards) live inside the details.
const SubAgentAccordion = memo(props => {
  const {
    name,
    tools,
    agentType,
    running = false,
    paused = false,
    defaultExpanded = false,
    transparent = false,
    children,
  } = props;
  const theme = useTheme();

  const [expanded, setExpanded] = useState(defaultExpanded || paused);

  // A pause for sensitive-action approval must surface its cards — force-open
  // the accordion when this sub-agent enters the paused state.
  useEffect(() => {
    if (paused) setExpanded(true);
  }, [paused]);

  const onChange = useCallback((_, value) => setExpanded(value), []);

  const shimmer = running && !paused;

  return (
    <StyledAccordion
      showMode={AccordionConstants.AccordionShowMode.LeftMode}
      expanded={expanded}
      onChange={onChange}
      sx={[subAgentAccordionStyles.accordion, transparent && subAgentAccordionStyles.transparent]}
      slotProps={{ transition: { unmountOnExit: true } }}
    >
      <StyledAccordionSummary
        expandIcon={<ArrowRightIcon style={subAgentAccordionStyles.expandIcon} />}
        showMode={AccordionConstants.AccordionShowMode.LeftMode}
        sx={subAgentAccordionStyles.summary}
      >
        <Box sx={subAgentAccordionStyles.summaryContent}>
          {resolveSubAgentIcon(name, tools, theme, agentType)}
          <Typography
            variant="bodySmall2"
            sx={shimmer ? subAgentAccordionStyles.labelRunning : subAgentAccordionStyles.label}
          >
            {name}
          </Typography>
          {shimmer && (
            <CircularProgress
              size={12}
              thickness={5}
              sx={subAgentAccordionStyles.spinner}
            />
          )}
        </Box>
      </StyledAccordionSummary>
      <StyledAccordionDetails sx={subAgentAccordionStyles.details}>{children}</StyledAccordionDetails>
    </StyledAccordion>
  );
});

SubAgentAccordion.displayName = 'SubAgentAccordion';

/** @type {MuiSx} */
const subAgentAccordionStyles = {
  accordion: ({ palette }) => ({
    width: '100%',
    paddingBottom: '0.5rem',
    borderBottom: `1px solid ${palette.border.lines}`,
    '&.Mui-expanded': { margin: '0 0' },
    '&::before': { display: 'none' },
    '& .MuiAccordion-heading': { display: 'inline-block' },
  }),
  // Drop the accordion's own Paper background/border so only the wrapped block
  // (e.g. the HITL approval card) carries its own styling.
  transparent: {
    backgroundColor: 'transparent',
    backgroundImage: 'none',
    border: 'none',
    borderRadius: 0,
    boxShadow: 'none',
  },
  summary: ({ palette }) => ({
    width: 'auto !important',
    borderRadius: '1rem',
    minHeight: '1.5rem !important',
    padding: '0rem 0.5rem !important',
    '&:hover': {
      backgroundColor: palette.background.userInputBackgroundActive,
    },
    '& .MuiAccordionSummary-content': {
      margin: '0 0 0 0.5rem !important',
    },
    '& .MuiAccordionSummary-expandIconWrapper': {
      color: palette.icon.fill.default,
    },
    '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
      transform: 'rotate(90deg)',
    },
  }),
  expandIcon: {
    width: '1rem',
    height: '1rem',
  },
  summaryContent: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '0.5rem',
  },
  label: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 600,
    whiteSpace: 'nowrap',
  }),
  spinner: ({ palette }) => ({
    color: palette.text.secondary,
    flexShrink: 0,
  }),
  labelRunning: ({ palette }) => ({
    fontWeight: 600,
    whiteSpace: 'nowrap',
    // Left-to-right shimmer sweeping the name to signal "running".
    background: `linear-gradient(90deg, ${palette.text.secondary} 0%, ${palette.text.secondary} 35%, ${palette.text.primary} 50%, ${palette.text.secondary} 65%, ${palette.text.secondary} 100%)`,
    backgroundSize: '200% auto',
    color: 'transparent',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    animation: 'subAgentNameShimmer 1.8s linear infinite',
    '@keyframes subAgentNameShimmer': {
      '0%': { backgroundPosition: '200% center' },
      '100%': { backgroundPosition: '-200% center' },
    },
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

export default SubAgentAccordion;
