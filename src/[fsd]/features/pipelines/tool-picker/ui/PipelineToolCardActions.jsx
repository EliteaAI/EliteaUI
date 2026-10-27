import { memo, useCallback } from 'react';

import { Box, Tooltip } from '@mui/material';

import { PIPELINE_TOOL_CARD_ACTION_CLASS } from '@/[fsd]/features/pipelines/tool-picker/lib/constants/toolPicker.constants';
import { getAttachmentPagePath } from '@/[fsd]/features/pipelines/tool-picker/lib/helpers/attachmentTool.helpers';
import { useViewMode } from '@/[fsd]/shared/lib/hooks';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import OpenInNewIcon from '@/assets/open-new-icon.svg?react';
import { SearchParams } from '@/common/constants';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import { getBasename } from '@/routes';

/** Hover actions of a pipeline tool card: open the item in a new tab, and remove it when no node uses it */
const PipelineToolCardActions = memo(props => {
  const { tool, name, entityLabel, onRemove } = props;

  const viewMode = useViewMode();
  const pagePath = getAttachmentPagePath(tool);

  const handleOpen = useCallback(() => {
    if (!pagePath) return;
    const search = new URLSearchParams({ [SearchParams.ViewMode]: viewMode, name: name || '' });
    window.open(`${window.location.origin}${getBasename()}${pagePath}?${search.toString()}`, '_blank');
  }, [name, pagePath, viewMode]);

  const handleRemove = useCallback(() => onRemove?.(tool), [onRemove, tool]);

  const styles = pipelineToolCardActionsStyles();

  return (
    <Box sx={styles.root}>
      {pagePath && (
        <Tooltip
          title={`Open ${entityLabel} in new tab`}
          placement="top"
        >
          <Box
            component="span"
            className={PIPELINE_TOOL_CARD_ACTION_CLASS}
          >
            <Button.BaseBtn
              variant={BUTTON_VARIANTS.tertiary}
              startIcon={<OpenInNewIcon style={styles.icon} />}
              onClick={handleOpen}
              aria-label={`Open ${entityLabel} in new tab`}
              data-testid="pipeline-tool-card-open"
            />
          </Box>
        </Tooltip>
      )}
      {onRemove && (
        <Tooltip
          title={`Remove the ${entityLabel} from the pipeline`}
          placement="top"
        >
          <Box
            component="span"
            className={PIPELINE_TOOL_CARD_ACTION_CLASS}
          >
            <Button.BaseBtn
              variant={BUTTON_VARIANTS.tertiary}
              startIcon={<DeleteIcon sx={styles.icon} />}
              onClick={handleRemove}
              aria-label={`Remove the ${entityLabel} from the pipeline`}
              data-testid="pipeline-tool-card-remove"
            />
          </Box>
        </Tooltip>
      )}
    </Box>
  );
});

PipelineToolCardActions.displayName = 'PipelineToolCardActions';

/** @type {MuiSx} */
const pipelineToolCardActionsStyles = () => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    flexShrink: 0,
  },
  icon: {
    width: '1rem',
    height: '1rem',
    fontSize: '1rem',
  },
});

export default PipelineToolCardActions;
