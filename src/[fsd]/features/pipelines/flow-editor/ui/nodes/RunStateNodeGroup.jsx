import { memo, useMemo, useState } from 'react';

import { Box, Menu, MenuItem } from '@mui/material';

import { FlowEditorNodes } from '@/[fsd]/features/pipelines/flow-editor/ui';
import ClockIcon from '@/assets/clock_icon.svg?react';

const RunStateNodeGroup = memo(props => {
  const { nodes, deleteRunNode, handleStopRun, yamlJsonObject, editorHeight, editorWidth } = props;

  const styles = flowEditorStyles();

  const [anchorEl, setAnchorEl] = useState(null);

  const { onlyNode, last, history } = useMemo(
    () => ({ onlyNode: nodes[0], last: nodes[nodes.length - 1], history: nodes.slice(0, -1) }),
    [nodes],
  );

  const toggleHistory = target => {
    setAnchorEl(target);
  };

  if (!nodes.length) return null;

  if (nodes.length === 1)
    return (
      <FlowEditorNodes.RunStateNode
        key={onlyNode.id}
        deleteRunNode={deleteRunNode}
        onStopRun={handleStopRun}
        yamlJsonObject={yamlJsonObject}
        editorHeight={editorHeight}
        editorWidth={editorWidth}
        {...onlyNode}
      />
    );

  return (
    <Box sx={styles.wrapper}>
      <Box
        sx={styles.historyWrapper}
        onClick={e => toggleHistory(e.currentTarget)}
      >
        <ClockIcon />
      </Box>
      <Menu
        id="runNodes-history-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => toggleHistory(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        slotProps={{
          list: {
            sx: styles.historyList,
          },
          paper: {
            sx: styles.historyMenu,
          },
        }}
      >
        {history.map(run => (
          <MenuItem key={run.id}>
            <FlowEditorNodes.RunStateNode
              avoidTooltip
              deleteRunNode={deleteRunNode}
              onStopRun={handleStopRun}
              yamlJsonObject={yamlJsonObject}
              editorHeight={editorHeight}
              editorWidth={editorWidth}
              {...run}
            />
          </MenuItem>
        ))}
      </Menu>
      <FlowEditorNodes.RunStateNode
        key={last.id}
        deleteRunNode={deleteRunNode}
        onStopRun={handleStopRun}
        yamlJsonObject={yamlJsonObject}
        editorHeight={editorHeight}
        editorWidth={editorWidth}
        {...last}
      />
    </Box>
  );
});

RunStateNodeGroup.displayName = 'RunStateNodeGroup';

const flowEditorStyles = () => ({
  wrapper: {
    display: 'flex',
    justifyContent: 'flext-start',
    alignItems: 'center',
    gap: '0.5rem',
  },

  historyWrapper: ({ palette }) => ({
    borderRadius: '.5rem',
    border: `.0625rem solid ${palette.border.lines}`,
    background: palette.background.tabPanel,
    height: '2.25rem',
    width: '2.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',

    '&:hover': {
      cursor: 'pointer',
      border: `.0625rem solid ${palette.background.button.primary.disabled}`,
      background: palette.background.dataGrid.main,

      svg: {
        path: {
          fill: palette.text.secondary,
        },
      },
    },
  }),
  historyMenu: ({ palette }) => ({
    borderRadius: '.5rem',
    border: `.0625rem solid ${palette.border.lines}`,
    background: palette.background.secondary,
    marginTop: '0.5rem',
    minWidth: '13.75rem',
  }),

  historyList: {
    paddingTop: 0,
    paddingBottom: 0,

    li: {
      padding: 0,
      minHeight: '2.5rem',

      div: {
        width: '100%',
        height: '100%',
        border: 'none !important',
        padding: '.5rem !important',
        borderRadius: '0 !important',
      },
    },
  },
});

export default RunStateNodeGroup;
