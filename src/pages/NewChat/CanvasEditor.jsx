import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';

import { useSelector } from 'react-redux';
import Split from 'react-split';

import { Typography } from '@mui/material';
import { Box, useTheme } from '@mui/system';

import { useTrackEvent } from '@/GA';
import { GA_EVENT_NAMES, GA_EVENT_PARAMS } from '@/[fsd]/shared/lib/constants/analytic.constants';
import { Field } from '@/[fsd]/shared/ui';
import { useEditCanvasMutation } from '@/api/chat';
import { useListModelsQuery } from '@/api/configurations.js';
import { useGenerateContentBlockingMutation } from '@/api/llm.js';
import { CANVAS_ADMIN_USER, CANVAS_SYSTEM_USER, PUBLIC_PROJECT_ID } from '@/common/constants';
import { buildErrorMessage, handleCopy, isNullOrUndefined } from '@/common/utils';
import { extraCodeFromBlock } from '@/components/Canvas';
import MarkdownTableEditor, { parseMarkdownTable } from '@/components/MarkdownTableEditor';
import MermaidDiagramOutput from '@/components/MermaidDiagramOutput/DiagramOutput';
import { getMermaidQuickFixModelInfo } from '@/components/MermaidDiagramOutput/mermaidQuickFixModel.helpers';
import { buildMermaidQuickFixPrompt } from '@/components/MermaidDiagramOutput/mermaidQuickFixPrompt';
import {
  useCanvasDetailSocket,
  useCanvasEditSocket,
  useCanvasEditorsChangeSocket,
  useCanvasErrorSocket,
  useCanvasSyncSocket,
  useJoinCanvasSocket,
  useLeaveCanvasRoomSocket,
} from '@/hooks/chat/useCanvasSocket';
import { useLanguageLinter } from '@/hooks/useCodeMirrorLanguageExtensions';
import useIsSmallWindow from '@/hooks/useIsSmallWindow';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import { SERVICE_PROMPT_KEYS, useServicePromptByKey } from '@/hooks/useServicePromptByKey';
import useToast from '@/hooks/useToast';

import CanvasEditHeader from './CanvasEditHeader';

// Component styles
const componentStyles = (theme, isSmallWindow) => ({
  mainContainer: {
    flexDirection: 'column',
    height: '100%',
    maxHeight: '100%',
    minHeight: '100%',
    overflow: 'scroll',
    width: '100%',
    gap: '8px',
    justifyContent: 'flex-start',
    minWidth: isSmallWindow ? '100%' : '240px',
    '& .gutter': {
      backgroundRepeat: 'no-repeat',
      backgroundPosition: '50%',
      width: isSmallWindow ? '100% !important' : undefined,
      '&.gutter-vertical': {
        minHeight: '24px;',
        backgroundImage:
          "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAFAQMAAABo7865AAAABlBMVEVHcEzMzMzyAv2sAAAAAXRSTlMAQObYZgAAABBJREFUeF5jOAMEEAIEEFwAn3kMwcB6I2AAAAAASUVORK5CYII=');",
        cursor: 'row-resize;',
      },
    },
  },
  loadingContainer: {
    background: `${theme.palette.background.alitaDefault};`,
  },
  errorContainer: {
    background: `${theme.palette.background.alitaDefault};`,
  },
  codeEditorContainer: {
    [theme.breakpoints.down('lg')]: {
      height: '500px',
    },
    overflow: 'scroll',
    minWidth: '100%',
    width: '100%',
    flex: 1,
    borderRadius: '8px',
    border: `1px solid ${theme.palette.border.lines};`,
    background: `${theme.palette.background.alitaDefault};`,
    boxSizing: 'border-box;',
  },
  mermaidCodeEditorContainer: {
    [theme.breakpoints.down('lg')]: {
      minHeight: '500px',
    },
    overflow: 'scroll',
    minWidth: '100%',
    width: '100%',
    flex: 1,
    borderRadius: '8px',
    border: `1px solid ${theme.palette.border.lines};`,
    background: `${theme.palette.background.alitaDefault};`,
    boxSizing: 'border-box;',
  },
});

const CanvasEditor = forwardRef(
  (
    {
      selectedCodeBlockInfo,
      onCloseCanvasEditor,
      onRegenerate,
      onDelete,
      interaction_uuid,
      conversation_uuid,
      viewOnly = false,
    },
    ref,
  ) => {
    const trackEvent = useTrackEvent();

    const { name: userName } = useSelector(state => state.user);
    const { isSmallWindow } = useIsSmallWindow();
    const { toastInfo, toastError } = useToast();
    const theme = useTheme();
    const styles = useMemo(() => componentStyles(theme, isSmallWindow), [theme, isSmallWindow]);
    const editorRef = useRef();
    const projectId = useSelectedProjectId();
    const [editCanvas, { isError, error }] = useEditCanvasMutation();
    const [tableId, setTableId] = useState();
    const [canUndo, setCanUndo] = useState(false); // State for Undo button
    const [canRedo, setCanRedo] = useState(false); // State for Redo button
    const [readOnly, setReadOnly] = useState(viewOnly);
    const [hasSelectedRowsColumns, setHasSelectedRowsColumns] = useState({
      hasSelectedRows: false,
      hasSelectedColumns: false,
    });
    const [code, setCode] = useState(selectedCodeBlockInfo?.codeBlock);
    const [generateContentBlocking, { isLoading: isQuickFixLoading }] = useGenerateContentBlockingMutation();
    const { joinTheCanvasRoom } = useJoinCanvasSocket();
    const { leaveTheCanvasRoom } = useLeaveCanvasRoomSocket();
    const { sendChangeToRemote } = useCanvasEditSocket();
    const hasJoinedTheCanvas = useRef(false);

    const { data: modelsData = {} } = useListModelsQuery(
      { projectId, include_shared: projectId != PUBLIC_PROJECT_ID, section: 'llm' },
      { skip: !projectId },
    );

    const { prompt: quickFixBasePrompt, isLoading: isServicePromptLoading } = useServicePromptByKey(
      projectId,
      SERVICE_PROMPT_KEYS.MERMAID_QUICK_FIX,
    );

    const quickFixModelInfo = useMemo(() => {
      return getMermaidQuickFixModelInfo(modelsData);
    }, [modelsData]);

    const extractMermaidCode = useCallback(text => {
      if (!text) return '';
      const raw = String(text).trim();

      const fencedMermaid = raw.match(/```mermaid\s*([\s\S]*?)```/i);
      if (fencedMermaid?.[1]) {
        return fencedMermaid[1].trim();
      }

      const fencedAny = raw.match(/```\s*([\s\S]*?)```/);
      if (fencedAny?.[1]) {
        return fencedAny[1].trim();
      }

      return raw;
    }, []);

    const extractPredictText = useCallback(response => {
      const result = response?.result ?? response;

      if (typeof result === 'string') return result;
      if (!result) return '';

      const coerceContentToText = value => {
        if (typeof value === 'string') return value;
        if (Array.isArray(value)) {
          return value.map(part => part?.text || part?.content || '').join('');
        }
        return '';
      };

      const extractLastChatHistoryText = chatHistory => {
        if (!Array.isArray(chatHistory) || chatHistory.length === 0) return '';

        for (let index = chatHistory.length - 1; index >= 0; index -= 1) {
          const msg = chatHistory[index];
          const role = msg?.role || msg?.type;
          const contentText = coerceContentToText(msg?.content ?? msg);

          if (!contentText) continue;

          if (role === 'assistant' || role === 'ai') {
            return contentText;
          }
        }

        const fallback = chatHistory[chatHistory.length - 1];
        return coerceContentToText(fallback?.content ?? fallback);
      };

      if (typeof result.elitea_response === 'string') return result.elitea_response;
      if (typeof result.output === 'string') return result.output;

      const chatHistoryText = extractLastChatHistoryText(result.chat_history);
      if (chatHistoryText) return chatHistoryText;

      const messages = result.messages;
      if (Array.isArray(messages) && messages.length > 0) {
        const last = messages[messages.length - 1];
        if (typeof last === 'string') return last;
        if (typeof last?.content === 'string') return last.content;
        if (Array.isArray(last?.content)) {
          return last.content.map(part => part?.text || '').join('');
        }
      }

      try {
        return JSON.stringify(result);
      } catch {
        return String(result);
      }
    }, []);

    const onCopy = useCallback(() => {
      handleCopy(editorRef.current?.getCode?.());

      const contentType =
        selectedCodeBlockInfo?.language === 'mermaid'
          ? 'diagram'
          : selectedCodeBlockInfo?.language === 'markdownTable'
            ? 'table'
            : 'code_block';
      trackEvent(GA_EVENT_NAMES.CANVAS_CONTENT_COPIED, {
        [GA_EVENT_PARAMS.CONTENT_TYPE]: contentType,
        [GA_EVENT_PARAMS.FILE_TYPE]: selectedCodeBlockInfo?.language || 'text',
        [GA_EVENT_PARAMS.TIMESTAMP]: new Date().toISOString(),
      });

      toastInfo('The code is copied to clipboard');
    }, [selectedCodeBlockInfo?.language, trackEvent, toastInfo]);

    const onUndo = useCallback(() => {
      editorRef.current?.undo?.();
    }, []);

    const onRedo = useCallback(() => {
      editorRef.current?.redo?.();
    }, []);

    const onImportTableData = useCallback(tableInfo => {
      editorRef.current?.resetTable?.(tableInfo);
    }, []);

    const onClickAddColumn = useCallback(() => {
      editorRef.current?.addColumn?.();
    }, []);

    const onClickAddRow = useCallback(() => {
      editorRef.current?.addRow?.();
    }, []);

    const onDeleteSelectedRowsOrColumns = useCallback(() => {
      editorRef.current?.delete?.();
    }, []);

    const onCanvasSync = useCallback(
      content => {
        const extractedCode = extraCodeFromBlock(content);
        if (code !== extractedCode) {
          setCode(extractedCode);
          editorRef.current?.setCode?.(extractedCode);
          if (selectedCodeBlockInfo?.language === 'markdownTable') {
            onImportTableData(parseMarkdownTable(extractedCode));
          }
        }
      },
      [code, onImportTableData, selectedCodeBlockInfo?.language],
    );

    const { listenCanvasSyncEvent, stopListenCanvasSyncEvent } = useCanvasSyncSocket({ onCanvasSync });

    const { listenCanvasDetailEvent, stopListenCanvasDetailEvent } = useCanvasDetailSocket({
      onCanvasDetail: onCanvasSync,
    });
    const onCanvasError = useCallback(
      message => {
        toastError(message.error);
      },
      [toastError],
    );
    const { listenCanvasErrorEvent, stopListenCanvasErrorEvent } = useCanvasErrorSocket({ onCanvasError });
    const onCanvasEditorsChange = useCallback(
      message => {
        const { editors, canvas_uuid, message_group_uuid } = message;
        if (
          (selectedCodeBlockInfo?.canvasId === canvas_uuid &&
            selectedCodeBlockInfo?.selectedMessage?.id === message_group_uuid) ||
          (!canvas_uuid && !message_group_uuid)
        ) {
          const realEditors = editors.filter(
            editor => editor.user_name !== CANVAS_ADMIN_USER && editor.user_name !== CANVAS_SYSTEM_USER,
          );
          if (!realEditors.length) {
            setReadOnly(false);
          } else {
            if (!realEditors.find(editor => editor.user_name == userName)) {
              setReadOnly(true);
            } else {
              setReadOnly(false);
            }
          }
        }
      },
      [selectedCodeBlockInfo?.canvasId, selectedCodeBlockInfo?.selectedMessage?.id, userName],
    );
    const { listenCanvasEditorsChangeEvent, stopListenCanvasEditorsChangeEvent } =
      useCanvasEditorsChangeSocket({ onCanvasEditorsChange });

    // console.log('codeBlock=====>\n', selectedCodeBlockInfo)

    const notifyChange = useCallback(
      newCode => {
        if (code !== newCode) {
          setCode(newCode);
          sendChangeToRemote(selectedCodeBlockInfo?.canvasId, newCode);
        }
      },
      [code, selectedCodeBlockInfo?.canvasId, sendChangeToRemote],
    );

    const handleQuickFix = useCallback(
      async ({ error: mermaidError, code: mermaidCode }) => {
        if (readOnly) {
          toastError('Diagram is read-only right now');
          return;
        }

        if (!projectId) {
          toastError('Select a project to use Quick Fix');
          return;
        }

        if (!quickFixModelInfo?.modelName || !quickFixModelInfo?.modelProjectId) {
          toastError('No model is available for Quick Fix');
          return;
        }

        if (isServicePromptLoading) {
          toastInfo('Loading Service Prompt…');
          return;
        }

        if (!quickFixBasePrompt) {
          toastError('Service Prompt is not configured');
          return;
        }

        const prompt = buildMermaidQuickFixPrompt({
          basePrompt: quickFixBasePrompt,
          error: mermaidError,
          code: mermaidCode,
        });

        try {
          const response = await generateContentBlocking({
            projectId,
            user_input: prompt,
            chat_history: [],
            tools: [],
            instructions: null,
            llm_settings: {
              model_name: quickFixModelInfo.modelName,
              model_project_id: quickFixModelInfo.modelProjectId,
              temperature: 0.1,
            },
            await_task_timeout: 60,
          }).unwrap();

          if (response?.task_id) {
            toastError('Quick Fix is taking longer than expected. Please try again.');
            return;
          }

          const text = extractPredictText(response);
          const newCode = extractMermaidCode(text);

          if (!newCode) {
            toastError('Quick Fix did not return Mermaid code');
            return;
          }

          editorRef.current?.setCode?.(newCode);
          notifyChange(newCode);
        } catch (e) {
          toastError(e?.data?.error || e?.message || 'Quick Fix failed');
        }
      },
      [
        extractMermaidCode,
        extractPredictText,
        generateContentBlocking,
        isServicePromptLoading,
        quickFixModelInfo,
        notifyChange,
        projectId,
        quickFixBasePrompt,
        readOnly,
        toastError,
        toastInfo,
      ],
    );

    const { extensions, onChangeLanguage, language } = useLanguageLinter(
      selectedCodeBlockInfo?.language !== 'markdownTable'
        ? selectedCodeBlockInfo?.language || 'markdown'
        : 'markdown',
      editorRef.current?.view,
    );
    const title = useMemo(
      () =>
        !selectedCodeBlockInfo?.isBlock
          ? 'Edit response'
          : selectedCodeBlockInfo?.language === 'markdownTable'
            ? 'Edit table'
            : selectedCodeBlockInfo?.language === 'mermaid'
              ? 'Edit diagram'
              : 'Edit code',
      [selectedCodeBlockInfo?.isBlock, selectedCodeBlockInfo?.language],
    );
    const handlerChangeLanguage = newLanguage => {
      editCanvas({
        projectId,
        canvasUUID: selectedCodeBlockInfo?.canvasId,
        code_language: newLanguage,
        canvas_type: 'code',
        name: title,
      });
      onChangeLanguage(newLanguage);
    };

    useEffect(() => {
      if (isError) {
        toastError(buildErrorMessage(error));
      }
    }, [error, isError, toastError]);

    const doLeaveCanvasRoom = useCallback(() => {
      if (selectedCodeBlockInfo?.canvasId) {
        leaveTheCanvasRoom({
          canvas_uuid: selectedCodeBlockInfo?.canvasId,
          project_id: projectId,
          canvas_content: code,
          code_language: selectedCodeBlockInfo?.language === 'markdownTable' ? 'markdown' : language,
        });
      }
    }, [
      code,
      language,
      leaveTheCanvasRoom,
      projectId,
      selectedCodeBlockInfo?.canvasId,
      selectedCodeBlockInfo?.language,
    ]);
    const doLeaveCanvasRoomRef = useRef(doLeaveCanvasRoom);

    useEffect(() => {
      doLeaveCanvasRoomRef.current = doLeaveCanvasRoom;
    }, [doLeaveCanvasRoom]);

    useEffect(() => {
      return () => {
        doLeaveCanvasRoomRef?.current();
      };
    }, []);

    const onCloseEditor = () => {
      if (canUndo) {
        const contentLanguage = selectedCodeBlockInfo?.language;
        if (contentLanguage === 'mermaid')
          trackEvent(GA_EVENT_NAMES.CANVAS_DIAGRAM_MODIFIED, {
            [GA_EVENT_PARAMS.DIAGRAM_TYPE]: 'mermaid',
            [GA_EVENT_PARAMS.FILE_TYPE]: contentLanguage,
            [GA_EVENT_PARAMS.TIMESTAMP]: new Date().toISOString(),
          });
        else if (contentLanguage === 'markdownTable')
          trackEvent(GA_EVENT_NAMES.CANVAS_TABLE_MODIFIED, {
            [GA_EVENT_PARAMS.FILE_TYPE]: 'markdown',
            [GA_EVENT_PARAMS.TIMESTAMP]: new Date().toISOString(),
          });
        else
          trackEvent(GA_EVENT_NAMES.CANVAS_FILE_MODIFIED, {
            [GA_EVENT_PARAMS.FILE_TYPE]: contentLanguage || 'text',
            [GA_EVENT_PARAMS.TIMESTAMP]: new Date().toISOString(),
          });
      }

      hasJoinedTheCanvas.current = false;
      onCloseCanvasEditor(canUndo, code, language);
      setCanUndo(false);
      setCanRedo(false);
      stopListenCanvasSyncEvent();
      stopListenCanvasDetailEvent();
      stopListenCanvasErrorEvent();
      stopListenCanvasEditorsChangeEvent();
    };

    useImperativeHandle(ref, () => ({
      save: () => onCloseEditor(),
    }));

    useEffect(() => {
      editorRef.current?.setCode?.(selectedCodeBlockInfo?.codeBlock);
      setCode(selectedCodeBlockInfo?.codeBlock);
      setTableId(`table-${new Date().getTime()}`);
    }, [selectedCodeBlockInfo?.codeBlock]);

    useEffect(() => {
      setReadOnly(selectedCodeBlockInfo?.viewOnly);
    }, [selectedCodeBlockInfo?.viewOnly]);

    useEffect(() => {
      if (selectedCodeBlockInfo?.canvasId && !hasJoinedTheCanvas.current) {
        hasJoinedTheCanvas.current = true;
        joinTheCanvasRoom(selectedCodeBlockInfo?.canvasId);
        setTimeout(() => {
          listenCanvasDetailEvent();
          listenCanvasSyncEvent();
          listenCanvasErrorEvent();
          listenCanvasEditorsChangeEvent();
        }, 0);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCodeBlockInfo?.canvasId]);

    return (
      <Box
        sx={{
          display: !isNullOrUndefined(selectedCodeBlockInfo?.codeBlock) ? 'flex' : 'none',
          ...styles.mainContainer,
        }}
      >
        <CanvasEditHeader
          onClose={onCloseEditor}
          onCopy={onCopy}
          onRegenerate={onRegenerate}
          onDelete={onDelete}
          onRedo={onRedo}
          disableRedo={!canRedo}
          onUndo={onUndo}
          disableUndo={!canUndo}
          title={title}
          showLangSelect={selectedCodeBlockInfo?.language !== 'markdownTable'}
          onChangeLanguage={handlerChangeLanguage}
          language={language}
          disableLanguageSelect={selectedCodeBlockInfo?.language === 'mermaid'}
          isThisWholeMessage={!selectedCodeBlockInfo?.isBlock}
          isTableEditing={selectedCodeBlockInfo?.language === 'markdownTable'}
          onImportTableData={onImportTableData}
          onClickAddColumn={onClickAddColumn}
          onClickAddRow={onClickAddRow}
          hasSelectedRowsColumns={hasSelectedRowsColumns}
          onDeleteSelectedRowsOrColumns={onDeleteSelectedRowsOrColumns}
          disabledAll={
            readOnly || selectedCodeBlockInfo?.isCreatingCanvas || selectedCodeBlockInfo?.createCanvasError
          }
        />
        {selectedCodeBlockInfo?.isCreatingCanvas ? (
          <Box
            flex={1}
            width={'100%'}
            display={'flex'}
            justifyContent={'center'}
            alignItems={'center'}
            borderRadius="8px"
            border={`1px solid ${theme.palette.border.lines};`}
            sx={styles.loadingContainer}
            boxSizing="border-box;"
          >
            <Typography variant="labelMedium">Loading the canvas...</Typography>
          </Box>
        ) : selectedCodeBlockInfo?.createCanvasError ? (
          <Box
            flex={1}
            width={'100%'}
            display={'flex'}
            justifyContent={'center'}
            alignItems={'center'}
            borderRadius="8px"
            paddingInline={'20px'}
            border={`1px solid ${theme.palette.border.lines};`}
            sx={styles.errorContainer}
            boxSizing="border-box;"
          >
            <Typography
              variant="labelMedium"
              color={theme.palette.status.rejected}
            >
              {buildErrorMessage(selectedCodeBlockInfo?.createCanvasError)}
            </Typography>
          </Box>
        ) : selectedCodeBlockInfo ? (
          selectedCodeBlockInfo?.language !== 'mermaid' ? (
            selectedCodeBlockInfo?.language !== 'markdownTable' ? (
              <Box sx={styles.codeEditorContainer}>
                <Field.CodeMirrorEditor
                  height="100%"
                  minHeight="100%"
                  width="100%"
                  ref={editorRef}
                  value={selectedCodeBlockInfo?.codeBlock}
                  extensions={extensions}
                  notifyChange={notifyChange}
                  onCanUndo={setCanUndo}
                  onCanRedo={setCanRedo}
                  readOnly={readOnly}
                />
              </Box>
            ) : (
              <MarkdownTableEditor
                initialMarkdown={selectedCodeBlockInfo?.codeBlock}
                onChange={notifyChange}
                onCanUndo={setCanUndo}
                onCanRedo={setCanRedo}
                onRowsColumnsSelected={setHasSelectedRowsColumns}
                tableId={tableId}
                interaction_uuid={interaction_uuid}
                conversation_uuid={conversation_uuid}
                ref={editorRef}
                readOnly={readOnly}
              />
            )
          ) : (
            <Split
              sizes={[30, 70]}
              minSize={100}
              // expandToMin={true}
              gutterSize={24}
              gutterAlign="center"
              snapOffset={30}
              dragInterval={1}
              direction={'vertical'}
              style={{
                flex: 1,
                height: isSmallWindow ? 'max-content' : '100%',
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
              }}
            >
              <Box sx={styles.mermaidCodeEditorContainer}>
                <Field.CodeMirrorEditor
                  height="100%"
                  minHeight="100%"
                  width="100%"
                  ref={editorRef}
                  value={selectedCodeBlockInfo?.codeBlock}
                  extensions={extensions}
                  notifyChange={notifyChange}
                  onCanUndo={setCanUndo}
                  onCanRedo={setCanRedo}
                  readOnly={readOnly}
                />
              </Box>
              <MermaidDiagramOutput
                code={code}
                onQuickFix={readOnly ? undefined : handleQuickFix}
                isQuickFixLoading={isQuickFixLoading}
                quickFixTooltip={quickFixModelInfo?.tooltip || ''}
              />
            </Split>
          )
        ) : null}
      </Box>
    );
  },
);

CanvasEditor.displayName = 'CanvasEditor';

export default CanvasEditor;
