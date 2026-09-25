import { memo, useCallback, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import { Checkbox } from '@/[fsd]/shared/ui';
import ArrowForwardIcon from '@/components/Icons/ArrowForwardIcon';

import {
  EVAL_ENGINE,
  IMPORTANCE,
  IMPORTANCE_WEIGHT_MAP,
  SCALE_TYPE_PRESET_CONFIG,
} from '../../lib/constants';
import { getEngineLabel, getTargetLabel, getWeightLabel } from '../../lib/helpers';

const ARROW_CLASS_NAME = 'generated-dimension-arrow';

const getImportanceLabel = form => {
  if (form.importance !== IMPORTANCE.custom) return getWeightLabel(IMPORTANCE_WEIGHT_MAP[form.importance]);
  // `Number('')` is 0, which would render a meaningless "w0" tag for an unfilled custom value.
  if (form.customImportanceValue === '') return null;
  return getWeightLabel(Number(form.customImportanceValue));
};

const getDescription = form => {
  if (form.evaluator === EVAL_ENGINE.ai) return form.evaluationInstructions;
  if (form.evaluator === EVAL_ENGINE.human) return form.evaluationGuidance;
  return '';
};

const GeneratedDimensionCard = memo(props => {
  const { id, form, isSelected, isDisabled = false, onToggle, onOpen } = props;

  const tags = useMemo(() => {
    const scaleType = SCALE_TYPE_PRESET_CONFIG[form.scaleTypePreset]?.scaleType;
    const targetLabel =
      form.targetValue === ''
        ? null
        : getTargetLabel(Number(form.targetValue), form.successCriteria, scaleType);
    return [getEngineLabel(form.evaluator), targetLabel, getImportanceLabel(form)].filter(Boolean);
  }, [form]);

  const description = getDescription(form);

  const handleToggle = useCallback(() => {
    onToggle(id);
  }, [onToggle, id]);

  const handleOpen = useCallback(() => {
    onOpen(id);
  }, [onOpen, id]);

  const handleKeyDown = useCallback(
    event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onOpen(id);
      }
    },
    [onOpen, id],
  );

  const styles = generatedDimensionCardStyles(isDisabled);

  return (
    <Box sx={styles.root}>
      <Checkbox.BaseCheckbox
        checked={isSelected}
        onChange={handleToggle}
        disabled={isDisabled}
        sx={styles.checkbox}
        inputProps={{ 'aria-label': `Select ${form.name}` }}
        data-testid={`build-dimension-checkbox-${id}`}
      />
      <Box
        sx={styles.card}
        onClick={handleOpen}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={isDisabled ? -1 : 0}
        aria-disabled={isDisabled}
        data-testid={`build-dimension-select-${id}`}
      >
        <Box sx={styles.content}>
          <Box sx={styles.header}>
            <Typography
              variant="bodyMedium"
              sx={styles.name}
            >
              {form.name}
            </Typography>
            {tags.map(tag => (
              <Typography
                key={tag}
                component="span"
                variant="bodySmall"
                sx={styles.tag}
              >
                {tag}
              </Typography>
            ))}
          </Box>
          {description && (
            <Typography
              variant="bodySmall"
              sx={styles.description}
            >
              {description}
            </Typography>
          )}
        </Box>
        <Box
          component={ArrowForwardIcon}
          className={ARROW_CLASS_NAME}
          sx={styles.arrow}
        />
      </Box>
    </Box>
  );
});

GeneratedDimensionCard.displayName = 'GeneratedDimensionCard';

/** @type {MuiSx} */
const generatedDimensionCardStyles = isDisabled => ({
  root: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
  },
  checkbox: {
    padding: 0,
    marginTop: '1rem',
    flexShrink: 0,
  },
  card: ({ palette }) => ({
    flex: 1,
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    padding: '0.5rem 1.5rem 0.5rem 1rem',
    borderRadius: '0.75rem',
    border: `0.0625rem solid ${palette.border.default}`,
    backgroundColor: palette.components.aiProviderAccordion.background.default,
    cursor: isDisabled ? 'default' : 'pointer',
    opacity: isDisabled ? 0.6 : 1,
    '&:hover': {
      backgroundColor: palette.components.aiProviderAccordion.background.hover,
      borderColor: palette.border.lines,
    },
    [`&:hover .${ARROW_CLASS_NAME} path`]: {
      fill: palette.icon.accent,
    },
  }),
  content: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    minWidth: 0,
  },
  name: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 600,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  }),
  tag: ({ palette }) => ({
    flexShrink: 0,
    padding: '0.25rem 0.5rem',
    borderRadius: '1.0625rem',
    color: palette.text.primary,
    border: `0.0625rem solid ${palette.border.lines}`,
    fontSize: '0.75rem',
    lineHeight: '1rem',
    whiteSpace: 'nowrap',
  }),
  description: ({ palette }) => ({
    color: palette.text.primary,
    fontSize: '0.8125rem',
    lineHeight: '1.25rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
  }),
  arrow: ({ palette }) => ({
    width: '1rem',
    height: '1rem',
    flexShrink: 0,
    '& path': {
      fill: palette.icon.default,
      transition: 'fill 0.15s ease',
    },
  }),
});

export default GeneratedDimensionCard;
