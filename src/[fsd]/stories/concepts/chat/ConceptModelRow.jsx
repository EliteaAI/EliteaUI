// Piece 3 of the chat concept: a model row of the «who answers» list. A copy of
// src/[fsd]/widgets/llm-model-selector/ui/ModelRow.jsx; the lines marked «concept:» are the changes:
// - concept: `end` — what sits at the row's right instead of the check mark: ⚙ «Model settings» on the current model,
//   and a chevron on the «Model» row that opens the models beside it (approved.html › chatWithHTML, `.md .acts`, `.msw`);
// - concept: `rowProps` — the row's own attributes (aria, data-testid) for the «Model» row, which is not an option.
// - concept: `icon` — on the «Model» row only, the button's icon (shared or project model) in the round of the agent
//   rows below it, so the list has one column of icons and the row matches the button (owner 2026-11-24).
import { memo } from 'react';

import { Box, MenuItem, Tooltip, Typography } from '@mui/material';

import { AUTO_MODEL_ID } from '@/[fsd]/shared/lib/constants/autoRouting.constants';
import { Tooltip as SharedTooltip } from '@/[fsd]/shared/ui';
import { EntityIcon } from '@/[fsd]/shared/ui/icon';
import { AUTO_MODEL_INFO_TEXT, getDefaultModelDescription } from '@/[fsd]/widgets/llm-model-selector/lib';
import CheckedIcon from '@/assets/checked-icon.svg?react';
import ImageIcon from '@/assets/image.svg?react';
import ReasonIcon from '@/assets/reason-icon.svg?react';

const ConceptModelRow = memo(props => {
  const { model, isSelected, isOpen, isFirstRow, onClick, end, icon, rowProps = {} } = props;

  const isAuto = model.id === AUTO_MODEL_ID;
  const description = model.description || getDefaultModelDescription(model);
  const hasDescription = Boolean(description);
  // Auto routes to any capable model, so it always shows both capability icons (per Figma spec).
  const hasReasoning = isAuto || Boolean(model.supports_reasoning);
  const hasVision = isAuto || Boolean(model.supports_vision);
  const hasIcons = hasReasoning || hasVision;
  const tooltipPlacement = isFirstRow ? 'bottom' : 'top';

  return (
    <MenuItem
      data-testid={`model-selector-option-${model.name}`}
      selected={isSelected}
      role="option"
      aria-selected={isSelected}
      onClick={onClick}
      sx={[styles.menuItem, isOpen && styles.open]}
      {...rowProps}
    >
      {icon && (
        <EntityIcon
          icon={{ component: icon }}
          editable={false}
          sx={styles.entityIcon}
        />
      )}
      <Box sx={styles.itemContent}>
        <Box sx={styles.nameRow}>
          <Typography
            variant="bodyMedium"
            sx={styles.name}
          >
            {model.display_name || model.name}
          </Typography>
          {isAuto && (
            <SharedTooltip.InfoTooltip
              infoTooltip={{ title: AUTO_MODEL_INFO_TEXT, placement: tooltipPlacement }}
            />
          )}
        </Box>

        {(hasDescription || hasIcons) && (
          <Box sx={styles.metaRow}>
            {hasDescription && (
              <Typography
                variant="bodySmall"
                sx={styles.description}
                data-testid={`model-selector-option-description-${model.name}`}
              >
                {description}
              </Typography>
            )}
            {hasDescription && hasIcons && <Box sx={styles.divider} />}
            {hasReasoning && (
              <Tooltip
                title="Supports reasoning"
                placement={tooltipPlacement}
                enterDelay={600}
                enterNextDelay={600}
              >
                <Box sx={styles.capabilityIconWrapper}>
                  <Box
                    component={ReasonIcon}
                    sx={styles.capabilityIcon}
                  />
                </Box>
              </Tooltip>
            )}
            {hasReasoning && hasVision && <Box sx={styles.divider} />}
            {hasVision && (
              <Tooltip
                title="Supports image analysis"
                placement={tooltipPlacement}
                enterDelay={600}
                enterNextDelay={600}
              >
                <Box sx={styles.capabilityIconWrapper}>
                  <Box
                    component={ImageIcon}
                    sx={styles.capabilityIcon}
                  />
                </Box>
              </Tooltip>
            )}
          </Box>
        )}
      </Box>

      {/* concept: ⚙ and the chevron in place of the check mark */}
      {end && <Box sx={styles.end}>{end}</Box>}
      {!end && isSelected && (
        <Box sx={styles.checkIconWrapper}>
          <Box
            component={CheckedIcon}
            sx={styles.checkIcon}
          />
        </Box>
      )}
    </MenuItem>
  );
});

ConceptModelRow.displayName = 'ConceptModelRow';

/** @type {MuiSx} */
const styles = {
  // concept: inset with a radius and framed when it answers, as the agent rows under it (ParticipantNormalCard); the
  // team's LLMModelsMenu row runs edge to edge and marks the current one by fill only (approved.html › .mi.ag.md.on)
  menuItem: ({ palette }) => ({
    margin: '.125rem .5rem',
    padding: '0.5rem .75rem',
    borderRadius: '.5rem',
    border: '0.0625rem solid transparent',
    minHeight: 'unset',
    alignItems: 'center',
    gap: '1rem',
    '&:hover': {
      backgroundColor: palette.background.surface.interactive.default,
    },
    // concept: ⚙ «Model settings» under the pointer only, as on every other row (approved.html › `.mi.ag .acts`)
    '& .concept-hover-act': { display: 'none' },
    '&:hover .concept-hover-act, &:focus-within .concept-hover-act': { display: 'inline-flex' },
    '@media (hover: none)': { '& .concept-hover-act': { display: 'inline-flex' } },
    '&.Mui-selected, &.Mui-selected:hover, &.Mui-selected.Mui-focusVisible': {
      backgroundColor: palette.background.interactiveItem.active,
      borderColor: palette.components.split.border.hover,
    },
  }),
  // concept: the row whose list is open beside it gets the same frame (approved.html › .menu.dparts .mi.act)
  open: ({ palette }) => ({
    borderColor: palette.components.split.border.hover,
  }),
  // concept: as the agent rows' icon (ParticipantNormalCard › entityIcon); the name stands .5rem after it, as theirs
  entityIcon: {
    width: '1.5rem',
    height: '1.5rem',
    minWidth: '1.5rem',
    marginRight: '-.5rem',
  },
  itemContent: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
    gap: '0.25rem',
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    minWidth: 0,
  },
  name: ({ palette }) => ({
    flexShrink: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: palette.text.secondary,
  }),
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    minWidth: 0,
    overflow: 'hidden',
  },
  description: ({ palette }) => ({
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flexShrink: 1,
    color: palette.text.primary,
  }),
  divider: ({ palette }) => ({
    flexShrink: 0,
    width: '0.0625rem',
    height: '0.625rem',
    backgroundColor: palette.border.lines,
  }),
  capabilityIconWrapper: {
    flexShrink: 0,
    display: 'inline-flex',
    width: '0.75rem',
    height: '0.75rem',
  },
  capabilityIcon: ({ palette }) => ({
    width: '0.75rem',
    height: '0.75rem',
    fontSize: '0.75rem',
    color: palette.icon.default,
  }),
  end: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '.25rem',
    marginRight: '-.5rem',
  },
  checkIconWrapper: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
  },
  checkIcon: ({ palette }) => ({
    width: '1rem',
    height: '1rem',
    flexShrink: 0,
    color: palette.text.secondary,
    marginLeft: '1rem',
  }),
};

export default ConceptModelRow;
