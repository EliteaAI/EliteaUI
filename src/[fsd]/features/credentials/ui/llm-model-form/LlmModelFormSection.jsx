import { memo, useCallback, useEffect, useState } from 'react';

import { Box } from '@mui/material';

import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import { BasicAccordion } from '@/[fsd]/shared/ui/accordion';

const LlmModelFormSection = memo(props => {
  const { title, hasError = false, children } = props;
  const [isExpanded, setIsExpanded] = useState(true);
  const styles = llmModelFormSectionStyles();

  const onToggle = useCallback((event, isNowExpanded) => setIsExpanded(isNowExpanded), []);

  useEffect(() => {
    if (hasError) setIsExpanded(true);
  }, [hasError]);

  return (
    <BasicAccordion
      showMode={AccordionConstants.AccordionShowMode.LeftMode}
      accordionSX={styles.accordion}
      expanded={isExpanded || hasError}
      onChange={onToggle}
      items={[
        {
          title,
          testId: `llm-model-section-${title.toLowerCase()}`,
          content: <Box sx={styles.content}>{children}</Box>,
        },
      ]}
    />
  );
});

LlmModelFormSection.displayName = 'LlmModelFormSection';

/** @type {MuiSx} */
const llmModelFormSectionStyles = () => ({
  accordion: {
    padding: '0 !important',
    background: 'transparent !important',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    marginTop: '0.6rem',
  },
});

export default LlmModelFormSection;
