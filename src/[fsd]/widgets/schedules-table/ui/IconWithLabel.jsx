import { memo } from 'react';

import { Box } from '@mui/material';

import { Icon, Tooltip } from '@/[fsd]/shared/ui';

const ENTITY_TYPE_LABELS = { agent: 'Agent', pipeline: 'Pipeline', toolkit_index: 'Toolkit Index' };

const IconWithLabel = memo(props => {
  const { type, label } = props;
  const styles = iconWithLabelStyles();
  const typeLabel = ENTITY_TYPE_LABELS[type] ?? type;

  return (
    <Box sx={styles.iconLabel}>
      <Box
        component="span"
        role="img"
        aria-label={typeLabel}
        title={typeLabel}
        sx={styles.icon}
      >
        <Icon.EntityTypeIcon type={type} />
      </Box>
      <Tooltip.TypographyWithConditionalTooltip
        title={label}
        placement="top"
        variant="bodyMedium"
        color="text.secondary"
      >
        {label}
      </Tooltip.TypographyWithConditionalTooltip>
    </Box>
  );
});

IconWithLabel.displayName = 'IconWithLabel';

/** @type {MuiSx} */
const iconWithLabelStyles = () => ({
  iconLabel: { display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 },
  icon: { display: 'flex', flexShrink: 0 },
});

export default IconWithLabel;
