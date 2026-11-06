import { memo } from 'react';

import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';

const ContextAccordion = memo(props => {
  const { title, content, expanded, onChange } = props;
  const styles = contextAccordionStyles();

  return (
    <BasicAccordion
      showMode={AccordionConstants.AccordionShowMode.LeftMode}
      expanded={expanded}
      onChange={onChange}
      accordionSX={styles.accordion}
      accordionDetailsSX={styles.details}
      items={[
        {
          title,
          content,
        },
      ]}
    />
  );
});

ContextAccordion.displayName = 'ContextAccordion';

/** @type {MuiSx} */
const contextAccordionStyles = () => ({
  accordion: {
    background: 'transparent !important',
  },
  details: {
    paddingTop: '0.5rem',
  },
});

export default ContextAccordion;
