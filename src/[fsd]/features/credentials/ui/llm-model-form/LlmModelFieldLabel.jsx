import { memo } from 'react';

import { Label } from '@/[fsd]/shared/ui';

import { LlmModelFormConstants } from '../../lib/constants';
import { getLlmModelInfoTestIds } from '../../lib/helpers/llmModelForm.helpers';

const { LLM_MODEL_FIELD_INFO_TEXTS, LLM_MODEL_FIELD_LABELS } = LlmModelFormConstants;

const LlmModelFieldLabel = memo(props => {
  const { field, required = false } = props;
  const { testId, contentTestId } = getLlmModelInfoTestIds(field);

  return (
    <Label.InfoLabelWithTooltip
      label={LLM_MODEL_FIELD_LABELS[field]}
      required={required}
      tooltip={LLM_MODEL_FIELD_INFO_TEXTS[field]}
      tooltipTestId={testId}
      tooltipContentTestId={contentTestId}
    />
  );
});

LlmModelFieldLabel.displayName = 'LlmModelFieldLabel';

export default LlmModelFieldLabel;
