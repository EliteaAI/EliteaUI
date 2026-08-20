import { memo, useCallback, useMemo, useState } from 'react';

import { useSearchParams } from 'react-router-dom';

import { Box, Tooltip, Typography } from '@mui/material';

import { getEntityIcon } from '@/[fsd]/features/chat/lib/helpers';
import { Button, Modal } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import TypographyWithConditionalTooltip from '@/[fsd]/shared/ui/tooltip/TypographyWithConditionalTooltip';
import { SearchParams } from '@/common/constants';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import EditIcon from '@/components/Icons/EditIcon';
import useNavBlocker from '@/hooks/useNavBlocker';

const GeneratedEntityChip = memo(props => {
  const { entityType, entityId, isMcp, label, onOpen, onDelete } = props;

  const Icon = getEntityIcon({ entity_type: entityType, is_mcp: isMcp });

  const [isHovering, setIsHovering] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const { isEditingAgent, isEditingPipeline, isEditingSkill, isEditingProjectContext, isEditingToolkit } =
    useNavBlocker();
  const [searchParams] = useSearchParams();

  const isBeingEdited = useMemo(() => {
    if (entityType === 'agent') {
      const editedId = searchParams.get(SearchParams.EditedParticipantId);
      return isEditingAgent && editedId && String(editedId) === String(entityId);
    }
    if (entityType === 'pipeline') {
      const editedId = searchParams.get(SearchParams.EditedParticipantId);
      return isEditingPipeline && editedId && String(editedId) === String(entityId);
    }
    if (entityType === 'skill') return isEditingSkill;
    if (entityType === 'project_context') return isEditingProjectContext;
    if (entityType === 'toolkit') return isEditingToolkit;
    return false;
  }, [
    entityType,
    entityId,
    searchParams,
    isEditingAgent,
    isEditingPipeline,
    isEditingSkill,
    isEditingProjectContext,
    isEditingToolkit,
  ]);

  const handleMouseEnter = useCallback(() => setIsHovering(true), []);
  const handleMouseLeave = useCallback(() => setIsHovering(false), []);

  const handleDeleteClick = useCallback(() => setIsConfirmOpen(true), []);
  const handleConfirmClose = useCallback(() => setIsConfirmOpen(false), []);
  const handleConfirmDelete = useCallback(() => {
    setIsConfirmOpen(false);
    onDelete?.();
  }, [onDelete]);

  const styles = generatedEntityChipStyles();

  return (
    <>
      <Box
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        sx={styles.mainContainer}
        data-testid="generated-entity-chip"
      >
        <Box sx={styles.iconWrapper}>
          <Icon sx={styles.entityIcon} />
        </Box>

        <Box sx={styles.contentContainer}>
          <TypographyWithConditionalTooltip
            title={label}
            placement="top"
            variant="bodyMedium"
            color="text.secondary"
            sx={styles.label}
          >
            {label}
          </TypographyWithConditionalTooltip>
        </Box>

        {isBeingEdited ? (
          <Typography
            variant="bodyMedium"
            color="primary.main"
            sx={styles.editingLabel}
          >
            Editing...
          </Typography>
        ) : (
          <Box sx={isHovering ? styles.actionsVisible : styles.actionsHidden}>
            <Tooltip
              title="Edit entity"
              placement="top"
            >
              <Button.BaseBtn
                variant={BUTTON_VARIANTS.tertiary}
                onClick={onOpen}
                sx={styles.iconButton}
                startIcon={<EditIcon sx={styles.icon} />}
                aria-label="Open entity"
              />
            </Tooltip>
            {onDelete && (
              <Tooltip
                title="Delete entity"
                placement="top"
              >
                <Button.BaseBtn
                  variant={BUTTON_VARIANTS.tertiary}
                  onClick={handleDeleteClick}
                  sx={styles.iconButton}
                  startIcon={<DeleteIcon sx={styles.icon} />}
                  aria-label="Delete entity"
                />
              </Tooltip>
            )}
          </Box>
        )}
      </Box>

      {onDelete && (
        <Modal.DeleteEntityModal
          open={isConfirmOpen}
          onClose={handleConfirmClose}
          onConfirm={handleConfirmDelete}
          name={label}
          inlineExtraContent="? It can't be restored."
        />
      )}
    </>
  );
});

GeneratedEntityChip.displayName = 'GeneratedEntityChip';

/** @type {MuiSx} */
const generatedEntityChipStyles = () => ({
  mainContainer: ({ palette }) => ({
    display: 'flex',
    width: '12.125rem',
    height: '2.25rem',
    borderRadius: '.5rem',
    overflow: 'hidden',
    position: 'relative',
    gap: '.75rem',
    padding: '.375rem .75rem',
    alignItems: 'center',
    background: palette.background.button.default,
    cursor: 'default',
  }),
  contentContainer: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  label: {
    width: '100%',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    lineHeight: 'normal',
  },
  editingLabel: {
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },
  iconWrapper: {
    width: '1rem',
    height: '1rem',
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
    color: ({ palette }) => palette.icon.fill.default,
  },
  entityIcon: ({ palette }) => ({
    fontSize: '1rem',
    color: palette.icon.fill.default,
  }),
  actionsVisible: {
    display: 'flex',
    alignItems: 'center',
    gap: '.15rem',
  },
  actionsHidden: {
    display: 'none',
  },
  iconButton: {
    marginLeft: '0',
    minWidth: '1rem',
    width: '1rem',
    height: '1.75rem',
    padding: '0',
  },
  icon: {
    fontSize: '1rem',
  },
});

export default GeneratedEntityChip;
