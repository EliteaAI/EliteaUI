import { memo, useCallback, useMemo } from 'react';

import { Box, IconButton, Typography } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { useEliteaAssistantRef } from '@/[fsd]/app/providers';
import { useGetSupportAssistantConfigQuery } from '@/[fsd]/features/agent/api';
import { PinButton } from '@/[fsd]/widgets/PinToggler/ui';
import EliteaAssistantIcon from '@/assets/icons/elitea-assistant-icon.svg?react';
import PublishIcon from '@/assets/publish-version.svg?react';
import { isApplicationCard } from '@/common/checkCardType';
import { getEntityTypeByCardType } from '@/common/utils';
import { IconLinkWithToolTip } from '@/components/Fork/IconLinkWithToolTip.jsx';
import HighlightQuery from '@/components/HighlightQuery';
import useCardNavigate from '@/hooks/useCardNavigate';
import useDataViewMode from '@/hooks/useDataViewMode';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

const DataTableNameCell = memo(props => {
  const styles = dataTableNameCellStyles();
  const { row, cardType, viewMode, onPinChange, isRowHovered = false } = props;
  const { id, status, is_pinned: isPinned = false, is_forked: isForked, meta } = row;
  const projectId = useSelectedProjectId();
  const { data: supportAssistantConfig } = useGetSupportAssistantConfigQuery({ enabled: false });
  const assistantRef = useEliteaAssistantRef();
  const dataViewMode = useDataViewMode(viewMode, row);
  const doNavigate = useCardNavigate({
    viewMode: dataViewMode,
    id,
    type: row.cardType || cardType,
    name: row.name,
  });
  const handlePinChange = useCallback(newState => onPinChange?.(id, newState), [onPinChange, id]);

  const handleAssistantClick = useCallback(
    event => {
      event.stopPropagation();
      event.preventDefault();
      assistantRef?.current?.showPopup();
    },
    [assistantRef],
  );

  const isSupportAssistant = useMemo(
    () =>
      isApplicationCard(cardType) &&
      supportAssistantConfig?.values?.support_agent_id === id &&
      supportAssistantConfig?.values?.support_project_id === projectId,
    [supportAssistantConfig, id, projectId, cardType],
  );

  return (
    <Box
      sx={styles.nameContainer}
      onClick={doNavigate}
    >
      <StyledTooltip
        placement="top"
        enterDelay={1000}
        enterNextDelay={1000}
        title={
          <>
            <Typography sx={styles.tooltipTitle}>{row.name || ''}</Typography>
            <Typography sx={styles.tooltipDescription}>{row.description || ''}</Typography>
          </>
        }
      >
        <Box sx={styles.textContainer}>
          <Typography
            variant="headingSmall"
            component="div"
            sx={styles.nameText}
          >
            <HighlightQuery
              color="text.secondary"
              text={row.name}
              variant="headingSmall"
            />
          </Typography>
          <Typography
            variant="bodySmall"
            component="div"
            sx={styles.descriptionText}
          >
            <HighlightQuery
              color="text.primary"
              text={row.description}
              variant="bodySmall"
            />
          </Typography>
        </Box>
      </StyledTooltip>
      {status === 'published' && isApplicationCard(cardType) && (
        <StyledTooltip
          placement="top"
          title="Published"
        >
          <Box
            sx={({ palette }) => ({
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              svg: { path: { fill: `${palette.icon.fill.success} !important` } },
            })}
          >
            <PublishIcon sx={{ fontSize: '1rem' }} />
          </Box>
        </StyledTooltip>
      )}
      {isSupportAssistant && (
        <IconButton
          disableRipple
          onClick={handleAssistantClick}
          sx={styles.supportAssistantContainer}
        >
          <Box
            component={EliteaAssistantIcon}
            sx={{ width: '1.45rem', height: '1.45rem' }}
          />
        </IconButton>
      )}
      {isForked && (
        <IconLinkWithToolTip
          tooltip={row.name}
          meta={meta}
          type={getEntityTypeByCardType(cardType)}
        />
      )}
      <PinButton
        entityId={id}
        entityType={cardType}
        initialPinned={isPinned}
        alwaysVisible={isRowHovered}
        onPinChange={handlePinChange}
      />
    </Box>
  );
});
DataTableNameCell.displayName = 'DataTableNameCell';

/** @type {MuiSx} */
const dataTableNameCellStyles = () => ({
  tooltipTitle: {
    fontWeight: 700,
    fontSize: '0.75rem',
    lineHeight: '1.25rem',
    width: '100%',
    wordWrap: 'wrap',
    overflowWrap: 'break-word',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: '2',
    whiteSpaceCollapse: 'preserve',
  },
  tooltipDescription: {
    fontWeight: 400,
    fontSize: '0.75rem',
    lineHeight: '1.25rem',
    width: '100%',
    wordWrap: 'wrap',
    overflowWrap: 'break-word',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: '4',
    whiteSpaceCollapse: 'preserve',
  },
  nameContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    minWidth: 0,
    overflow: 'hidden',
    width: '100%',
  },
  textContainer: {
    overflow: 'hidden',
    flex: 1,
  },
  nameText: {
    maxWidth: '100%',
    overflow: 'hidden',
    wordWrap: 'break-word',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    whiteSpaceCollapse: 'preserve',
  },
  descriptionText: {
    maxWidth: '100%',
    overflow: 'hidden',
    wordWrap: 'break-word',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  supportAssistantContainer: ({ palette }) => ({
    width: '1.75rem',
    height: '1.75rem',
    minWidth: '1.75rem',
    padding: 0,
    color: palette.icon.fill.default,
    svg: { path: { fill: `${palette.icon.fill.default} !important` } },

    '&:hover': {
      backgroundColor: palette.background.button.secondary.default,
    },
  }),
});

export default DataTableNameCell;
