import { memo } from 'react';

import BuildIcon from '@mui/icons-material/Build';
import { Box } from '@mui/material';

import { ConfigurationHelpers } from '@/[fsd]/features/settings/lib/helpers';
import AmazonBedrock from '@/assets/amazon-bedrock.svg?react';
import AmazonIcon from '@/assets/amazon.svg?react';
import AzureIcon from '@/assets/azure-icon.svg?react';
import ChromaIcon from '@/assets/chroma-icon.svg?react';
import ClaudeIcon from '@/assets/claude-icon.svg?react';
import DialIcon from '@/assets/dial-icon.svg?react';
import OllamaIcon from '@/assets/ollama.svg?react';
import PostgreSQLIcon from '@/assets/postgre-sql-icon.svg?react';
import { ICON_SIZES } from '@/common/designTokens';
import HuggingFaceIcon from '@/components/Icons/HuggingFaceIcon';
import OpenAIIcon from '@/components/Icons/OpenAIIcon';
import VertexAIIcon from '@/components/Icons/VertexAIIcon';

const { getIconTypeKey } = ConfigurationHelpers;

const ConfigurationIcon = memo(({ name, type, label }) => {
  const iconType = getIconTypeKey(name, type, label);

  const renderIcon = () => {
    switch (iconType) {
      case 'VERTEX_AI':
        return (
          <VertexAIIcon
            width={ICON_SIZES.MD}
            height={ICON_SIZES.MD}
          />
        );
      case 'AI_DIAL':
        return (
          <DialIcon
            width={ICON_SIZES.MD}
            height={ICON_SIZES.MD}
          />
        );
      case 'OPEN_AI':
        return (
          <OpenAIIcon
            width={ICON_SIZES.MD}
            height={ICON_SIZES.MD}
          />
        );
      case 'CLAUDE':
        return (
          <ClaudeIcon
            width={ICON_SIZES.MD}
            height={ICON_SIZES.MD}
          />
        );
      case 'OLLAMA':
        return (
          <OllamaIcon
            width={ICON_SIZES.LG}
            height={ICON_SIZES.LG}
          />
        );
      case 'AMAZON_BEDROCK':
        return (
          <AmazonBedrock
            width={ICON_SIZES.LG}
            height={ICON_SIZES.LG}
          />
        );
      case 'AMAZON':
        return (
          <AmazonIcon
            width={ICON_SIZES.LG}
            height={ICON_SIZES.LG}
          />
        );
      case 'HUGGING_FACE':
        return (
          <HuggingFaceIcon
            width={ICON_SIZES.MD}
            height={ICON_SIZES.MD}
          />
        );
      case 'CHROMA':
        return (
          <ChromaIcon
            width={ICON_SIZES.MD}
            height={ICON_SIZES.MD}
          />
        );
      case 'AZURE':
        return (
          <AzureIcon
            width={ICON_SIZES.MD}
            height={ICON_SIZES.MD}
          />
        );
      case 'PGVECTOR':
        return (
          <PostgreSQLIcon
            width={ICON_SIZES.MD}
            height={ICON_SIZES.MD}
          />
        );
      default:
        return <BuildIcon sx={{ width: ICON_SIZES.MD, height: ICON_SIZES.MD }} />;
    }
  };

  const styles = configurationIconStyles();

  return <Box sx={styles.container}>{renderIcon()}</Box>;
});

ConfigurationIcon.displayName = 'ConfigurationIcon';

/** @type {MuiSx} */
const configurationIconStyles = () => ({
  container: ({ palette }) => ({
    minWidth: '2.25rem',
    width: '2.25rem',
    height: '2.25rem',
    borderRadius: '50%',
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    background: palette.background.icon.entityGradient,
    '&::before': {
      content: '""',
      position: 'absolute',
      inset: 0,
      borderRadius: 'inherit',
      padding: '0.0625rem',
      background: palette.background.icon.entityBorderGradient,
      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
      WebkitMaskComposite: 'xor',
      maskComposite: 'exclude',
      pointerEvents: 'none',
    },
  }),
});

export default ConfigurationIcon;
