import { memo } from 'react';

import { AccordionSummary } from '@mui/material';

import { AccordionConstants } from '@/[fsd]/shared/lib/constants';

const StyledAccordionSummary = memo(props => {
  const { showMode, card, sx, ...rest } = props;

  const styles = styledAccordionSummaryStyles(showMode, card);

  return (
    <AccordionSummary
      sx={[styles.summary, ...(Array.isArray(sx) ? sx : [sx])]}
      {...rest}
    />
  );
});

StyledAccordionSummary.displayName = 'StyledAccordionSummary';

const isLeftMode = showMode => showMode === AccordionConstants.AccordionShowMode.LeftMode;

const getContentMargin = (showMode, card) => {
  if (card) return '0 0 0 0.5rem !important';
  return isLeftMode(showMode) ? '0 0 0 0.75rem !important' : '0 0';
};

const cardSurface = palette => {
  const isDark = palette.mode === 'dark';

  return {
    borderRadius: '0.75rem',
    backgroundColor: palette.background.aiProviderAccordion.default,
    ...(isDark
      ? {
          border: '0.0625rem solid transparent',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            padding: '0.0625rem',
            background: palette.border.toolCardGradient,
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            pointerEvents: 'none',
          },
        }
      : {
          border: `0.0625rem solid ${palette.border.toolCardGradient}`,
        }),
  };
};

/** @type {MuiSx} */
const styledAccordionSummaryStyles = (showMode, card) => ({
  summary: ({ palette }) => ({
    flexDirection: isLeftMode(showMode) ? 'row-reverse' : undefined,
    ...(card ? cardSurface(palette) : {}),
    '& .MuiAccordionSummary-content': {
      margin: getContentMargin(showMode, card),
      ...(card ? { alignItems: 'center', gap: '0.5rem' } : {}),
    },
    '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
      transform: 'rotate(90deg)',
    },
  }),
});

export default StyledAccordionSummary;
