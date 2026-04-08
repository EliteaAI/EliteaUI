import {
  Suspense,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

import YAML from 'js-yaml';
import { ErrorBoundary } from 'react-error-boundary';
import { useDispatch, useSelector } from 'react-redux';

import { Box, Button, IconButton, Typography } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip.jsx';
import {
  DumpYamlHelpers,
  ParsePipelineHelpers,
} from '@/[fsd]/features/pipelines/flow-editor/lib/helpers/index.js';
import YamlCodeEditor from '@/[fsd]/features/pipelines/yaml-editor/ui/YamlCodeEditor.jsx';
import { FunctionHelpers } from '@/[fsd]/shared/lib/helpers/index.js';
import RefreshIcon from '@/assets/refresh-icon.svg?react';
import { PipelineEditorMode } from '@/common/constants.js';
import { handleCopy } from '@/common/utils.jsx';
import GroupedButton from '@/components/GroupedButton';
import CopyIcon from '@/components/Icons/CopyIcon.jsx';
import { useIsFrom } from '@/hooks/useIsFromSpecificPageHooks';
import useIsSmallWindow from '@/hooks/useIsSmallWindow';
import useToast from '@/hooks/useToast.jsx';
import { ContentContainer } from '@/pages/Common/index.js';
import RouteDefinitions from '@/routes.js';
import { actions } from '@/slices/pipeline.js';
import { lazyWithRetry } from '@/utils/lazyWithRetry';
import { useTheme } from '@emotion/react';

import useIsPipelineYamlCodeDirty from '../useIsPipelineYamlCodeDirty.js';
import PipelineAddNodeMenu from './AddNodeMenu.jsx';

const FlowWrapper = lazyWithRetry(() => import('./FlowWrapper.jsx'));

// Optimized comparison for yamlJsonObject to prevent unnecessary updates during drag operations
const areYamlObjectsEqual = (obj1, obj2) => {
  // Quick reference check
  if (obj1 === obj2) return true;

  // Basic checks
  if (!obj1 || !obj2) return obj1 === obj2;
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return obj1 === obj2;

  // For performance during drag operations, use JSON.stringify for deep comparison
  // This is acceptable since yamlJsonObject structure is typically not too large
  return JSON.stringify(obj1) === JSON.stringify(obj2);
};

const EditorPanel = forwardRef(({ setYamlDirty, stopRun, display, sx, disabled }, ref) => {
  const dispatch = useDispatch();
  const { toastInfo } = useToast();
  const { isSmallWindow } = useIsSmallWindow();
  const theme = useTheme();
  const isFromChat = useIsFrom(RouteDefinitions.Chat);
  const [mode, setMode] = useState(PipelineEditorMode.Flow);
  const flowEditorRef = useRef();
  const isYamlCodeDirty = useIsPipelineYamlCodeDirty();
  useEffect(() => {
    setYamlDirty(isYamlCodeDirty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isYamlCodeDirty]);

  const { yamlJsonObject, yamlCode } = useSelector(state => state.pipeline);
  const setYamlCode = useCallback(
    code => {
      dispatch(actions.setYamlCode(code));
    },
    [dispatch],
  );

  const setYamlJsonObject = useCallback(
    param => {
      const newYamlJsonObject = FunctionHelpers.isFunction(param) ? param(yamlJsonObject) : param;
      // Use optimized comparison to prevent unnecessary Redux updates
      if (areYamlObjectsEqual(newYamlJsonObject, yamlJsonObject)) {
        return; // No change detected, skip update
      }
      dispatch(actions.setYamlJsonObject({ yamlJsonObject: newYamlJsonObject }));

      const yamlString = DumpYamlHelpers.dumpYaml(newYamlJsonObject);

      if (Object.keys(newYamlJsonObject).length && yamlString !== yamlCode) {
        setYamlCode(yamlString);
      }
    },
    [dispatch, setYamlCode, yamlCode, yamlJsonObject],
  );

  const onParseCodeToJson = useCallback(
    code => {
      let parsedYamlJson = undefined;
      try {
        parsedYamlJson = YAML.load(code || '') || {};
        const { yamlJson } = ParsePipelineHelpers.migerateLegacyNodes(parsedYamlJson);
        parsedYamlJson = yamlJson;
      } catch {
        // YAML parsing failed, parsedYamlJson remains undefined
      }
      if (parsedYamlJson && !areYamlObjectsEqual(parsedYamlJson, yamlJsonObject)) {
        setYamlJsonObject(parsedYamlJson);
        const currentExpandState = flowEditorRef.current?.getCurrentExpandState?.();
        flowEditorRef.current?.calculateLayoutNodes?.(parsedYamlJson, true, true, currentExpandState);
      }
    },
    [setYamlJsonObject, yamlJsonObject],
  );

  const onChangeCode = useCallback(
    code => {
      setYamlCode(code);
    },
    [setYamlCode],
  );

  const onRcvAgentEvent = useCallback(event => {
    flowEditorRef.current?.onRcvAgentEvent?.(event);
  }, []);

  const deleteAllRunNodes = useCallback(() => {
    flowEditorRef.current?.deleteAllRunNodes?.();
  }, []);

  const fitView = useCallback(() => {
    flowEditorRef.current?.fitView?.();
  }, []);

  useImperativeHandle(ref, () => ({
    onRcvAgentEvent,
    deleteAllRunNodes,
    fitView,
    onStopRun: (...args) => flowEditorRef.current?.stopCurrentRun?.(...args),
    hasRunsInProgress: () => flowEditorRef.current?.hasRunsInProgress?.(),
  }));

  const buttonItems = useMemo(
    () => Object.entries(PipelineEditorMode).map(([label, value]) => ({ label, value })),
    [],
  );

  const onSelectChatMode = useCallback(
    e => {
      const newMode = e?.target?.value;
      if (mode !== newMode) {
        setMode(newMode);
        if (newMode === PipelineEditorMode.Flow) {
          onParseCodeToJson(yamlCode);
        } else {
          const yamlString = DumpYamlHelpers.dumpYaml(yamlJsonObject);
          if (Object.keys(yamlJsonObject).length && yamlString !== yamlCode) {
            setYamlCode(yamlString);
          }
        }
      }
    },
    [mode, onParseCodeToJson, setYamlCode, yamlCode, yamlJsonObject],
  );

  const onAddNode = useCallback(type => {
    flowEditorRef.current?.onAddNode?.(type);
  }, []);

  const onCopy = useCallback(() => {
    handleCopy(yamlCode);
    toastInfo('The code is copied to clipboard');
  }, [toastInfo, yamlCode]);

  useEffect(() => {
    if (yamlJsonObject.nodes?.find(node => node.decision)) {
      onParseCodeToJson(DumpYamlHelpers.dumpYaml(yamlJsonObject));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yamlJsonObject]);

  return (
    <ContentContainer
      flex={1}
      display={display || 'flex'}
      flexDirection="column"
      height="100% !important"
      sx={sx}
    >
      <Box sx={styles.headerContainer(isFromChat)}>
        <GroupedButton
          value={mode}
          onChange={onSelectChatMode}
          buttonItems={buttonItems}
        />
        <Box sx={styles.actionButtonsContainer}>
          {mode === PipelineEditorMode.Flow && (
            <PipelineAddNodeMenu
              onAddNode={onAddNode}
              disabled={disabled}
            />
          )}
          {mode === PipelineEditorMode.Yaml && (
            <StyledTooltip
              title={'Copy yaml code to clipboard'}
              placement="top"
            >
              <IconButton
                sx={styles.copyIconButton}
                variant="elitea"
                color="tertiary"
                onClick={onCopy}
              >
                <CopyIcon sx={styles.copyIcon} />
              </IconButton>
            </StyledTooltip>
          )}
        </Box>
      </Box>
      <Box sx={styles.editorContainer}>
        {
          <ErrorBoundary
            style={{ display: mode === PipelineEditorMode.Flow ? undefined : 'none' }}
            fallback={
              <Box sx={styles.errorFallback(mode, theme)}>
                <Typography
                  variant="headingSmall"
                  color={theme.palette.text.warningText}
                  sx={styles.errorTitle}
                >
                  Failed to load the flow editor
                </Typography>
                <Typography
                  variant="bodyMedium"
                  color="text.primary"
                  sx={styles.errorMessage}
                >
                  The visual flow editor may have been updated or encountered an error and could not be
                  loaded. Please try reloading the page or switch to YAML mode.
                </Typography>
                <Box sx={styles.errorActionsContainer}>
                  <StyledTooltip
                    title="Reload page"
                    placement="top"
                  >
                    <Button
                      variant="elitea"
                      color="secondary"
                      onClick={() => window.location.reload()}
                    >
                      <RefreshIcon sx={styles.refreshIcon} />
                      <Typography
                        variant="labelSmall"
                        color="text.secondary"
                      >
                        Reload the page
                      </Typography>
                    </Button>
                  </StyledTooltip>
                </Box>
              </Box>
            }
          >
            <Suspense fallback={<Box flex={1}>Preparing the flow editor...</Box>}>
              <FlowWrapper
                stopRun={stopRun}
                mode={mode}
                ref={flowEditorRef}
                setYamlJsonObject={setYamlJsonObject}
                noBorder={isFromChat}
                disabled={disabled}
              />
            </Suspense>
          </ErrorBoundary>
        }
        {mode === PipelineEditorMode.Yaml && (
          <Box sx={styles.yamlEditorContainer(isFromChat, theme, isSmallWindow)}>
            <YamlCodeEditor
              code={yamlCode || ''}
              onChangeCode={onChangeCode}
              isDarkMode={theme.palette.mode === 'dark'}
              disabled={disabled}
            />
          </Box>
        )}
      </Box>
    </ContentContainer>
  );
});

EditorPanel.displayName = 'EditorPanel';
/** @type {MuiSx} */
const styles = {
  headerContainer: isFromChat => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '0.25rem',
    marginBottom: '1rem',
    paddingRight: isFromChat ? '0.5rem' : undefined,
    paddingLeft: isFromChat ? '0.5rem' : undefined,
  }),

  actionButtonsContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },

  editorContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
  },

  errorFallback: (mode, theme) => ({
    display: mode === PipelineEditorMode.Flow ? 'flex' : 'none',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    padding: '2rem',
    backgroundColor: theme.palette.background.paper,
    border: `0.0625rem solid ${theme.palette.border.lines}`,
    borderRadius: '0.5rem',
    gap: '1rem',
  }),

  errorTitle: {
    textAlign: 'center',
  },

  errorMessage: {
    textAlign: 'center',
    maxWidth: '25rem',
  },

  errorActionsContainer: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
  },

  refreshIcon: {
    fontSize: '1rem',
  },

  copyIconButton: {
    marginLeft: '0',
  },

  copyIcon: {
    fontSize: '1rem',
  },

  yamlEditorContainer: (isFromChat, theme, isSmallWindow) => ({
    width: '100%',
    padding: '0.125rem',
    boxSizing: 'border-box',
    flex: 1,
    border: isFromChat ? 'none' : `0.0625rem  solid ${theme.palette.border.lines}`,
    borderTop: isFromChat ? `0.0625rem  solid ${theme.palette.border.lines}` : undefined,
    borderRadius: isFromChat ? '0' : '0.5rem',
    height: 'calc(100% - 2.5rem)',
    minHeight: isSmallWindow ? 'calc(100vh - 13.75rem)' : undefined,
  }),
};

export default EditorPanel;
