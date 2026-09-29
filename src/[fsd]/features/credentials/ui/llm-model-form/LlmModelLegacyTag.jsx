import { memo } from 'react';

import { Box } from '@mui/material';

import { Chip } from '@/[fsd]/shared/ui';

import { LlmModelFormConstants } from '../../lib/constants';

const { LLM_MODEL_LEGACY_TAG } = LlmModelFormConstants;

const LlmModelLegacyTag = memo(() => (
  <Box
    component="span"
    data-testid="llm-model-legacy-tag"
  >
    <Chip.HeadingChip label={LLM_MODEL_LEGACY_TAG} />
  </Box>
));

LlmModelLegacyTag.displayName = 'LlmModelLegacyTag';

export default LlmModelLegacyTag;
