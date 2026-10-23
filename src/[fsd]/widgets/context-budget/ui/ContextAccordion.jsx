import { memo } from 'react';

import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';

const ContextAccordion = memo(props => {
  const { title, content, expanded, onChange } = props;

  return (
    <BasicAccordion
      showMode={AccordionConstants.AccordionShowMode.LeftMode}
      expanded={expanded}
      onChange={onChange}
      accordionSX={{
        background: 'transparent !important',
      }}
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

export default ContextAccordion;
