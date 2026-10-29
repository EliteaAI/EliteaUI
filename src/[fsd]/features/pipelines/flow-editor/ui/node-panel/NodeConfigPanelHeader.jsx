import { memo, useMemo } from 'react';

import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import { Box, Tooltip, Typography } from '@mui/material';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { NodeDocsHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import NodeTypeIconTile from '@/[fsd]/features/pipelines/flow-editor/ui/add-node/NodeTypeIconTile';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import CloseIcon from '@/components/Icons/CloseIcon';

const NodeConfigPanelHeader = memo(props => {
  const { type, onClose } = props;

  const typeName = FlowEditorConstants.PipelineNodeDisplayNames[type] || type;
  const description = FlowEditorConstants.PipelineNodeDescriptions[type];
  const docsLink = useMemo(() => NodeDocsHelpers.getNodeDocsLink(type), [type]);
  const styles = nodeConfigPanelHeaderStyles();

  return (
    <Box
      sx={styles.root}
      data-testid="pipeline-node-panel-header"
    >
      <NodeTypeIconTile type={type} />
      <Box sx={styles.textSection}>
        <Typography
          variant="bodyMedium"
          color="text.secondary"
          noWrap
          data-testid="pipeline-node-panel-type"
        >
          {typeName}
        </Typography>
        {description && (
          <Tooltip
            title={description}
            placement="bottom-start"
          >
            <Typography
              variant="bodySmall"
              color="text.primary"
              noWrap
              data-testid="pipeline-node-panel-description"
            >
              {description}
            </Typography>
          </Tooltip>
        )}
      </Box>
      <Box sx={styles.actions}>
        {docsLink && (
          <Tooltip
            title={docsLink.tooltip}
            placement="top"
          >
            <Box component="span">
              <Button.BaseBtn
                variant={BUTTON_VARIANTS.tertiary}
                startIcon={<HelpOutlineOutlinedIcon sx={styles.actionIcon} />}
                href={docsLink.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={docsLink.tooltip}
                data-testid="pipeline-node-panel-docs"
              />
            </Box>
          </Tooltip>
        )}
        <Tooltip
          title="Close"
          placement="top"
        >
          <Box component="span">
            <Button.BaseBtn
              variant={BUTTON_VARIANTS.tertiary}
              startIcon={<CloseIcon sx={styles.actionIcon} />}
              onClick={onClose}
              aria-label="Close node panel"
              data-testid="pipeline-node-panel-close"
            />
          </Box>
        </Tooltip>
      </Box>
    </Box>
  );
});

NodeConfigPanelHeader.displayName = 'NodeConfigPanelHeader';

/** @type {MuiSx} */
const nodeConfigPanelHeaderStyles = () => ({
  root: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem 0.75rem 1.5rem',
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
    flexShrink: 0,
  }),
  textSection: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    flexShrink: 0,
  },
  actionIcon: {
    fontSize: '1rem',
  },
});

export default NodeConfigPanelHeader;
