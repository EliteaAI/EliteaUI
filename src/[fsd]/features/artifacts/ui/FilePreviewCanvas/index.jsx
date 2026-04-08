import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Box } from '@mui/material';

import { useTrackEvent } from '@/GA';
import { FilePreviewCanvasConstants } from '@/[fsd]/features/artifacts/lib/constants';
import { ArtifactParserHelpers } from '@/[fsd]/features/artifacts/lib/helpers';
import { useArtifactContentFetch } from '@/[fsd]/features/artifacts/lib/hooks';
import { PreviewContent, PreviewHeader, PreviewUnavailable } from '@/[fsd]/features/artifacts/ui';
import { GA_EVENT_NAMES, GA_EVENT_PARAMS } from '@/[fsd]/shared/lib/constants/analytic.constants';
import { Modal } from '@/[fsd]/shared/ui';
import { useCreateArtifactMutation, useDeleteArtifactMutation } from '@/api/artifacts';
import { downloadFileFromArtifact } from '@/common/utils';
import AlertDialog from '@/components/AlertDialog';
import { getExtensionsByLang } from '@/hooks/useCodeMirrorLanguageExtensions';
import { useIsFrom } from '@/hooks/useIsFromSpecificPageHooks';
import useIsSmallWindow from '@/hooks/useIsSmallWindow';
import useToast from '@/hooks/useToast';
import RouteDefinitions from '@/routes';
import {
  canPreviewFile,
  formatFileSize,
  getLanguageFromFilename,
  getPreviewSizeLimit,
  isFileSizePreviewableFlexible,
} from '@/utils/filePreview';

const { AvailableFormatsEnum, AvailableLanguagesEnum, RenderModeOptionsEnum } = FilePreviewCanvasConstants;

const FilePreviewCanvas = memo(props => {
  const { file, projectId, bucket, onClose, onUnsavedChangesUpdate } = props;

  const documentReaderRef = useRef(null);

  const trackEvent = useTrackEvent();

  const [showUnsavedChangesAlert, setShowUnsavedChangesAlert] = useState(false);

  const isVisible = Boolean(file);
  const { isSmallWindow } = useIsSmallWindow();
  const isChatPage = useIsFrom(RouteDefinitions.Chat);
  const styles = filePreviewCanvasStyles(isChatPage, isSmallWindow, isVisible);

  const { toastInfo, toastError } = useToast();
  const [deleteArtifact] = useDeleteArtifactMutation();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [createArtifact] = useCreateArtifactMutation();

  const {
    fileContent,
    isLoading,
    loadError,
    imageBlobUrl,
    fetchFileContent,
    resetContent,
    setFileContent,
    documentBuffer,
  } = useArtifactContentFetch({
    bucket,
    file,
    projectId,
    hasRequiredParams: Boolean(file && projectId && bucket),
    canPreview: useMemo(() => {
      const fileAvailable = file;
      const typeSupported = canPreviewFile(file?.name);
      const typeSupportedFromPath = canPreviewFile(file?.filepath);
      const sizeOk = isFileSizePreviewableFlexible(file);
      return fileAvailable && (typeSupported || typeSupportedFromPath) && sizeOk;
    }, [file]),
    onError: toastError,
  });

  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [renderMode, setRenderMode] = useState(RenderModeOptionsEnum.CODE);

  const [editedContent, setEditedContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isRenderLoading, setIsRenderLoading] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [docxResetKey, setDocxResetKey] = useState(0);

  const hasChanges = useMemo(
    () => editedContent && editedContent !== fileContent,
    [editedContent, fileContent],
  );

  useEffect(() => {
    onUnsavedChangesUpdate?.(hasChanges);
  }, [hasChanges, onUnsavedChangesUpdate]);

  const hasRequiredParams = useMemo(() => file && projectId && bucket, [file, projectId, bucket]);

  const canPreview = useMemo(() => {
    const fileAvailable = file;
    const typeSupported = canPreviewFile(file.name);
    const typeSupportedFromPath = canPreviewFile(file.filepath);
    const sizeOk = isFileSizePreviewableFlexible(file);

    if (!fileAvailable || (!typeSupported && !typeSupportedFromPath) || !sizeOk) return false;

    return true;
  }, [file]);

  const detectedLanguage = useMemo(() => {
    if (!file) return AvailableLanguagesEnum.PLAIN_TEXT;

    const languageFromFilename = getLanguageFromFilename(file.name);

    return languageFromFilename === AvailableLanguagesEnum.CPP ? 'c++' : languageFromFilename;
  }, [file]);

  const currentLanguage = useMemo(
    () => selectedLanguage || detectedLanguage,
    [selectedLanguage, detectedLanguage],
  );

  const { isMarkdownFile, isDataFile, isMermaidFile, isImageFileType, dataFileType, isDocxFile } =
    useMemo(() => {
      const checkIfType = (lang, format) =>
        file &&
        (lang.some(l => currentLanguage === l) ||
          format.some(f => file.name.toLowerCase().endsWith(`.${f}`)));

      const isMarkdown = checkIfType([AvailableLanguagesEnum.MARKDOWN], [AvailableFormatsEnum.MARKDOWN]);
      const isData = checkIfType(
        [AvailableLanguagesEnum.CSV, AvailableLanguagesEnum.TSV],
        [AvailableFormatsEnum.CSV, AvailableFormatsEnum.TSV],
      );
      const isMermaid = checkIfType(
        [AvailableLanguagesEnum.MERMAID],
        [AvailableFormatsEnum.MERMAID_LONG, AvailableFormatsEnum.MERMAID_SHORT],
      );
      const imageType = checkIfType([AvailableLanguagesEnum.IMAGE], []);
      const dataType = !isData
        ? null
        : checkIfType([AvailableLanguagesEnum.CSV], [AvailableFormatsEnum.CSV])
          ? AvailableFormatsEnum.CSV
          : checkIfType([AvailableLanguagesEnum.TSV], [AvailableFormatsEnum.TSV])
            ? AvailableFormatsEnum.TSV
            : AvailableFormatsEnum.CSV;
      const isDocx = checkIfType([AvailableLanguagesEnum.DOCX], [AvailableFormatsEnum.DOCX]);

      return {
        isMarkdownFile: isMarkdown,
        isDataFile: isData,
        isMermaidFile: isMermaid,
        isImageFileType: imageType,
        dataFileType: dataType,
        isDocxFile: isDocx,
      };
    }, [file, currentLanguage]);

  // Deferred parsing for data files - show loading state while parsing
  useEffect(() => {
    if (!isDataFile || !fileContent || renderMode !== RenderModeOptionsEnum.RENDERED) {
      setParsedData(null);
      return;
    }

    const isLargeFile = file?.size > 50000; // 50KB threshold

    if (isLargeFile) {
      setIsRenderLoading(true);
      // Defer parsing to next frame to allow loading spinner to paint
      const timeoutId = setTimeout(() => {
        const data = ArtifactParserHelpers.parseDataFile(dataFileType, fileContent, AvailableFormatsEnum);
        setParsedData(data);
        setIsRenderLoading(false);
      }, 50);

      return () => clearTimeout(timeoutId);
    } else {
      // Small files - parse immediately
      const data = ArtifactParserHelpers.parseDataFile(dataFileType, fileContent, AvailableFormatsEnum);
      setParsedData(data);
    }
  }, [isDataFile, fileContent, renderMode, dataFileType, file?.size]);

  const isTableLoading = useMemo(
    () =>
      isRenderLoading ||
      (isDataFile &&
        renderMode === RenderModeOptionsEnum.RENDERED &&
        fileContent &&
        !parsedData &&
        !loadError),
    [isRenderLoading, isDataFile, renderMode, fileContent, parsedData, loadError],
  );

  const codeMirrorExtension = useMemo(() => {
    if (!fileContent) return [];

    const extensions = getExtensionsByLang(currentLanguage);
    return extensions.extensionWithLinter || extensions.extensionWithoutLinter || [];
  }, [fileContent, currentLanguage]);

  const fileTooLarge = useMemo(() => (!file ? false : !isFileSizePreviewableFlexible(file)), [file]);

  const sizeLimitMessage = useMemo(() => {
    const limit = getPreviewSizeLimit();

    return `Files larger than ${formatFileSize(limit)} cannot be previewed.`;
  }, []);

  const canEdit = useMemo(
    () => renderMode === RenderModeOptionsEnum.CODE && !isImageFileType && fileContent,
    [renderMode, isImageFileType, fileContent],
  );

  const hasUnsavedChanges = useMemo(
    () => editedContent && editedContent !== fileContent,
    [editedContent, fileContent],
  );

  const contentToDisplay = useMemo(
    () => (editedContent ? editedContent : fileContent),
    [editedContent, fileContent],
  );

  const filePath = useMemo(() => file?.key || file?.name || '', [file?.key, file?.name]);

  const handleImageError = useCallback(event => {
    event.target.style.display = 'none';
  }, []);

  const handleLanguageChange = useCallback(event => {
    setSelectedLanguage(event.target.value);
  }, []);

  const handleRenderModeChange = useCallback((_, newMode) => {
    if (newMode !== null) {
      setRenderMode(newMode);
    }
  }, []);

  const handleContentChange = useCallback(newContent => {
    setEditedContent(newContent);
  }, []);

  const handleDiscard = useCallback(() => {
    setEditedContent('');

    if (isDocxFile) setDocxResetKey(prev => prev + 1);
  }, [isDocxFile]);

  const handleSaveChanges = useCallback(async () => {
    if (!hasUnsavedChanges || !hasRequiredParams) return;

    setIsSaving(true);
    try {
      let blob = null;

      if (isDocxFile) {
        blob = await documentReaderRef.current.getFileBlob();
      } else blob = new Blob([editedContent], { type: 'text/plain' });

      const editedFile = new File([blob], filePath, { type: blob.type });

      await createArtifact({
        projectId,
        bucket,
        files: [editedFile],
        withOverwrite: true,
      }).unwrap();

      if (isMermaidFile)
        trackEvent(GA_EVENT_NAMES.CANVAS_DIAGRAM_MODIFIED, {
          [GA_EVENT_PARAMS.DIAGRAM_TYPE]: 'mermaid',
          [GA_EVENT_PARAMS.FILE_TYPE]: currentLanguage,
          [GA_EVENT_PARAMS.TIMESTAMP]: new Date().toISOString(),
        });
      else if (isDataFile)
        trackEvent(GA_EVENT_NAMES.CANVAS_TABLE_MODIFIED, {
          [GA_EVENT_PARAMS.FILE_TYPE]: dataFileType,
          [GA_EVENT_PARAMS.TIMESTAMP]: new Date().toISOString(),
        });
      else
        trackEvent(GA_EVENT_NAMES.CANVAS_FILE_MODIFIED, {
          [GA_EVENT_PARAMS.FILE_TYPE]: currentLanguage,
          [GA_EVENT_PARAMS.TIMESTAMP]: new Date().toISOString(),
        });

      if (!isDocxFile) setFileContent(editedContent);

      setEditedContent('');
      toastInfo('File saved successfully');
      onClose();
    } catch (error) {
      toastError('Failed to save file: ' + (error?.data?.error || error?.data?.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  }, [
    hasUnsavedChanges,
    hasRequiredParams,
    isDocxFile,
    editedContent,
    filePath,
    createArtifact,
    projectId,
    bucket,
    isMermaidFile,
    trackEvent,
    currentLanguage,
    isDataFile,
    dataFileType,
    setFileContent,
    toastInfo,
    onClose,
    toastError,
  ]);

  useEffect(() => {
    // Cleanup previous image URL
    return () => {
      if (imageBlobUrl) URL.revokeObjectURL(imageBlobUrl);
    };
  }, [imageBlobUrl]);

  useEffect(() => {
    const needToFetch = file && canPreview && bucket;

    if (needToFetch) {
      fetchFileContent();
      setRenderMode(
        isMarkdownFile || isDataFile || isMermaidFile || isImageFileType
          ? RenderModeOptionsEnum.RENDERED
          : RenderModeOptionsEnum.CODE,
      );

      return;
    }

    // Reset state when file is cleared or bucket is not available
    resetContent();
    setSelectedLanguage('');
    setRenderMode('code');
    setEditedContent('');
  }, [
    file,
    canPreview,
    fetchFileContent,
    resetContent,
    isMarkdownFile,
    isDataFile,
    isMermaidFile,
    isImageFileType,
    bucket,
  ]);

  useEffect(() => {
    setSelectedLanguage('');
    setEditedContent('');
  }, [file]);

  const handleDownload = useCallback(() => {
    if (!hasRequiredParams) return;

    trackEvent(GA_EVENT_NAMES.CANVAS_CONTENT_DOWNLOADED, {
      [GA_EVENT_PARAMS.CONTENT_TYPE]: isMermaidFile ? 'diagram' : isDataFile ? 'table' : 'file',
      [GA_EVENT_PARAMS.FILE_TYPE]: currentLanguage,
      [GA_EVENT_PARAMS.TIMESTAMP]: new Date().toISOString(),
    });

    downloadFileFromArtifact({
      projectId,
      bucket,
      filename: filePath,
      handleError: err => {
        toastError('Download file error: ' + (err?.message || err));
      },
    });
  }, [
    hasRequiredParams,
    trackEvent,
    isMermaidFile,
    isDataFile,
    currentLanguage,
    projectId,
    bucket,
    filePath,
    toastError,
  ]);

  const handleDelete = useCallback(() => {
    if (!hasRequiredParams) return;
    setDeleteModalOpen(true);
  }, [hasRequiredParams]);

  const handleConfirmDelete = useCallback(() => {
    if (!hasRequiredParams) return;

    deleteArtifact({
      projectId,
      bucket,
      artifact: filePath,
      integration_id: undefined,
      is_local: undefined,
    })
      .unwrap()
      .then(() => {
        toastInfo('File deleted successfully');
        setDeleteModalOpen(false);
        onClose?.();
      })
      .catch(error => {
        setDeleteModalOpen(false);
        toastError(
          'Failed to delete file: ' +
            (error?.data?.error || error?.data?.message || error?.message || 'Unknown error'),
        );
      });
  }, [bucket, filePath, projectId, hasRequiredParams, deleteArtifact, toastInfo, toastError, onClose]);

  const handleCancelDelete = useCallback(() => {
    setDeleteModalOpen(false);
  }, []);

  const handleClose = useCallback(() => {
    if (hasChanges) setShowUnsavedChangesAlert(true);
    else onClose?.();
  }, [hasChanges, onClose]);

  const handleUnsavedChangesConfirm = useCallback(() => {
    setShowUnsavedChangesAlert(false);
    onClose?.();
  }, [onClose]);

  const handleUnsavedChangesCancel = useCallback(() => {
    setShowUnsavedChangesAlert(false);
  }, []);

  if (!file) return null;

  return (
    <Box sx={styles.canvasWrapper}>
      <PreviewHeader
        file={file}
        bucket={bucket}
        currentLanguage={currentLanguage}
        handleLanguageChange={handleLanguageChange}
        detectedLanguage={detectedLanguage}
        renderMode={renderMode}
        handleRenderModeChange={handleRenderModeChange}
        isMarkdownFile={isMarkdownFile}
        isDataFile={isDataFile}
        isMermaidFile={isMermaidFile}
        isDocxFile={isDocxFile}
        handleSaveChanges={handleSaveChanges}
        hasUnsavedChanges={hasUnsavedChanges}
        fileContent={fileContent}
        isSaving={isSaving}
        isImageFileType={isImageFileType}
        onClose={handleClose}
        onDownload={handleDownload}
        onDelete={handleDelete}
        onDiscard={handleDiscard}
        contentToDisplay={contentToDisplay}
        isChatPage={isChatPage}
        canPreview={canPreview}
      />

      <Box sx={styles.contentWrapper}>
        {!canPreview ? (
          <PreviewUnavailable
            message={fileTooLarge ? sizeLimitMessage : `Preview is not supported for this file type.`}
            onDownload={handleDownload}
          />
        ) : (
          <PreviewContent
            ref={documentReaderRef}
            isLoading={isLoading}
            isRenderLoading={isTableLoading}
            loadError={loadError}
            isMarkdownFile={isMarkdownFile}
            renderMode={renderMode}
            fileContent={contentToDisplay}
            isDataFile={isDataFile}
            parsedData={parsedData}
            dataFileType={dataFileType}
            codeMirrorExtensions={codeMirrorExtension}
            isMermaidFile={isMermaidFile}
            isImageFileType={isImageFileType}
            imageBlobUrl={imageBlobUrl}
            documentBuffer={documentBuffer}
            isDocxFile={isDocxFile}
            docxResetKey={docxResetKey}
            file={file}
            bucket={bucket}
            handleImageError={handleImageError}
            onContentChange={handleContentChange}
            canEdit={canEdit}
          />
        )}
      </Box>
      <Modal.DeleteEntityModal
        name={file?.name}
        open={deleteModalOpen}
        onClose={handleCancelDelete}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        shouldRequestInputName={false}
      />
      <AlertDialog
        alarm
        title="Warning"
        alertContent="You are editing now. Do you want to discard current changes and continue?"
        open={showUnsavedChangesAlert}
        onClose={handleUnsavedChangesCancel}
        onCancel={handleUnsavedChangesCancel}
        onConfirm={handleUnsavedChangesConfirm}
      />
    </Box>
  );
});

FilePreviewCanvas.displayName = 'FilePreviewCanvas';

/** @type {MuiSx} */
const filePreviewCanvasStyles = (applyWrapper = false, isSmallWindow = false, isVisible = true) => ({
  canvasWrapper: ({ palette }) => ({
    display: isVisible ? 'flex' : 'none',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
    ...(applyWrapper
      ? {
          maxHeight: '100%',
          minHeight: '100%',
          justifyContent: 'flex-start',
          minWidth: isSmallWindow ? '100%' : '15rem',
          background: palette.background.tabPanel,
          border: `0.0625rem solid ${palette.border?.lines}`,
          borderRadius: '1rem',
          position: 'relative',
        }
      : {}),
  }),

  contentWrapper: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
});

export default FilePreviewCanvas;
