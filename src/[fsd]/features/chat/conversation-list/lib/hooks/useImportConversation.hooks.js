import { useCallback, useEffect, useRef, useState } from 'react';

import { v4 as uuidv4 } from 'uuid';

import {
  useConversationImportCancelMutation,
  useConversationImportCommitMutation,
} from '@/[fsd]/features/chat/api';
import {
  IMPORT_CHUNK_SIZE,
  IMPORT_MESSAGES,
  IMPORT_STEPS,
} from '@/[fsd]/features/chat/conversation-list/lib/constants';
import {
  getConversationImportPath,
  getSelectableAttachments,
  isImportFileSupported,
} from '@/[fsd]/features/chat/conversation-list/lib/helpers';
import { useToast } from '@/[fsd]/shared/lib/hooks';
import { formatFileSize } from '@/common/attachmentValidationUtils';
import { DEV, VITE_DEV_TOKEN, VITE_SERVER_URL } from '@/common/constants';
import { clearBaseUrlPrefix } from '@/common/utils';
import { useChatConfig } from '@/hooks/useChatConfig';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

const sendChunk = ({ url, formData, onProgress, xhrRef }) =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;

    xhr.upload.addEventListener('progress', event => {
      if (event.lengthComputable) onProgress(event.loaded);
    });
    xhr.addEventListener('load', () => {
      let body = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        body = null;
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(body);
      else reject(new Error(body?.error || IMPORT_MESSAGES.checkFailed));
    });
    xhr.addEventListener('error', () => reject(new Error(IMPORT_MESSAGES.checkFailed)));
    xhr.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));

    xhr.open('POST', url);
    if (DEV) {
      if (VITE_DEV_TOKEN) xhr.setRequestHeader('Authorization', `Bearer ${VITE_DEV_TOKEN}`);
      xhr.setRequestHeader('Cache-Control', 'no-cache');
    }
    xhr.send(formData);
  });

const uploadImportFile = async ({ projectId, file, onProgress, xhrRef }) => {
  const url = `${clearBaseUrlPrefix(VITE_SERVER_URL)}${getConversationImportPath(projectId)}`;
  const totalChunks = Math.max(1, Math.ceil(file.size / IMPORT_CHUNK_SIZE));
  const fileId = uuidv4();
  let response = null;

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * IMPORT_CHUNK_SIZE;
    const chunk = file.slice(start, Math.min(start + IMPORT_CHUNK_SIZE, file.size));
    const formData = new FormData();
    formData.append('file', chunk, file.name);
    formData.append('chunk_index', chunkIndex);
    formData.append('total_chunks', totalChunks);
    formData.append('file_id', fileId);
    formData.append('file_name', file.name);

    response = await sendChunk({
      url,
      formData,
      xhrRef,
      onProgress: loaded => onProgress(Math.min(100, Math.round(((start + loaded) / (file.size || 1)) * 100))),
    });
  }
  return response;
};

export const useImportConversation = props => {
  const { onImported } = props;
  const projectId = useSelectedProjectId();
  const { limits } = useChatConfig();
  const { toastError, toastSuccess, toastWarning } = useToast();

  const [commitImport] = useConversationImportCommitMutation();
  const [cancelImport] = useConversationImportCancelMutation();

  const [step, setStep] = useState(IMPORT_STEPS.select);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [selectedPaths, setSelectedPaths] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const xhrRef = useRef(null);
  const importIdRef = useRef(null);

  const discardPreview = useCallback(() => {
    const importId = importIdRef.current;
    importIdRef.current = null;
    if (importId) cancelImport({ projectId, importId });
  }, [cancelImport, projectId]);

  useEffect(
    () => () => {
      xhrRef.current?.abort();
      discardPreview();
    },
    [discardPreview],
  );

  const resetToSelect = useCallback(() => {
    setFile(null);
    setPreview(null);
    setSelectedPaths([]);
    setUploadProgress(0);
    setStep(IMPORT_STEPS.select);
  }, []);

  const selectFile = useCallback(
    async newFile => {
      if (!newFile) return;
      xhrRef.current?.abort();
      discardPreview();

      if (!isImportFileSupported(newFile.name)) {
        resetToSelect();
        toastError(IMPORT_MESSAGES.unsupportedType);
        return;
      }
      if (newFile.size > limits.MAX_TOTAL_SIZE) {
        resetToSelect();
        toastError(IMPORT_MESSAGES.tooLarge(formatFileSize(limits.MAX_TOTAL_SIZE)));
        return;
      }

      setFile(newFile);
      setPreview(null);
      setUploadProgress(0);
      setStep(IMPORT_STEPS.checking);
      try {
        const result = await uploadImportFile({
          projectId,
          file: newFile,
          xhrRef,
          onProgress: setUploadProgress,
        });
        importIdRef.current = result.import_id;
        setPreview(result);
        setSelectedPaths(getSelectableAttachments(result.attachments).map(item => item.export_path));
        setStep(IMPORT_STEPS.ready);
      } catch (error) {
        if (error.name === 'AbortError') return;
        resetToSelect();
        toastError(error.message || IMPORT_MESSAGES.checkFailed);
      } finally {
        xhrRef.current = null;
      }
    },
    [discardPreview, limits.MAX_TOTAL_SIZE, projectId, resetToSelect, toastError],
  );

  const toggleAttachment = useCallback(exportPath => {
    setSelectedPaths(prev =>
      prev.includes(exportPath) ? prev.filter(path => path !== exportPath) : [...prev, exportPath],
    );
  }, []);

  const toggleAll = useCallback(() => {
    const selectable = getSelectableAttachments(preview?.attachments).map(item => item.export_path);
    setSelectedPaths(prev => (prev.length === selectable.length ? [] : selectable));
  }, [preview]);

  const startImport = useCallback(async () => {
    const importId = importIdRef.current;
    if (!importId) return false;

    setStep(IMPORT_STEPS.importing);
    const result = await commitImport({ projectId, importId, selectedAttachments: selectedPaths });
    // The server discards the staging on commit, success or failure
    importIdRef.current = null;

    if (result.error) {
      resetToSelect();
      toastError(result.error?.data?.error || IMPORT_MESSAGES.failed);
      return false;
    }

    const { conversation, failed_attachments: failedAttachments = [] } = result.data;
    await onImported?.(conversation);
    if (failedAttachments.length) toastWarning(IMPORT_MESSAGES.partial(failedAttachments.length));
    else toastSuccess(IMPORT_MESSAGES.success(conversation.name));
    return true;
  }, [
    commitImport,
    onImported,
    projectId,
    resetToSelect,
    selectedPaths,
    toastError,
    toastSuccess,
    toastWarning,
  ]);

  const cancel = useCallback(() => {
    xhrRef.current?.abort();
    discardPreview();
  }, [discardPreview]);

  return {
    step,
    file,
    preview,
    selectedPaths,
    uploadProgress,
    selectFile,
    toggleAttachment,
    toggleAll,
    startImport,
    cancel,
  };
};
