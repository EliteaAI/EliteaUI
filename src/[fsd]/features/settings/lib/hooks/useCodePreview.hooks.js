import { useCallback, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';

import { VITE_SERVER_URL } from '@/common/constants';
import useToast from '@/hooks/useToast';

import { CodeExamplesConstants } from '../constants';
import { CodeExamplesHelpers } from '../helpers';

const { CODE_EXAMPLE_TYPES } = CodeExamplesConstants;
const { generateCanvasTitle, generateCodeExample, getEditorLanguage, getFileNameForLanguage } =
  CodeExamplesHelpers;

export const useCodePreview = (model, token) => {
  const [selectedLanguage, setSelectedLanguage] = useState(CODE_EXAMPLE_TYPES.PYTHON);
  const { toastSuccess, toastError } = useToast();
  const user = useSelector(state => state.user);

  const baseApiUrl = useMemo(() => {
    const baseUrl = user.api_url || VITE_SERVER_URL?.replace('/api/v2', '') || window.location.origin;
    return `${baseUrl}/llm/v1`;
  }, [user.api_url]);

  const codeExample = useMemo(() => {
    const modelName = model.model_name || 'gpt-4o-mini';
    const authToken = token || 'your_api_key_here';
    const apiUrl = baseApiUrl;
    const projectId = model.project_id;

    return generateCodeExample(selectedLanguage, apiUrl, modelName, authToken, projectId);
  }, [selectedLanguage, model, token, baseApiUrl]);

  const canvasTitle = useMemo(() => {
    return generateCanvasTitle(model.integration_name, model.model_name);
  }, [model.integration_name, model.model_name]);

  const editorLanguage = useMemo(() => {
    return getEditorLanguage(selectedLanguage);
  }, [selectedLanguage]);

  const handleLanguageChange = useCallback(value => {
    setSelectedLanguage(value);
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(codeExample);
      toastSuccess('Code copied to clipboard');
    } catch {
      toastError('Failed to copy code');
    }
  }, [codeExample, toastSuccess, toastError]);

  const handleDownload = useCallback(() => {
    try {
      const fileName = getFileNameForLanguage(selectedLanguage);
      const element = document.createElement('a');
      const file = new Blob([codeExample], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = fileName;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      URL.revokeObjectURL(element.href);

      toastSuccess(`Downloaded ${fileName}`);
    } catch {
      toastError('Failed to download file');
    }
  }, [codeExample, selectedLanguage, toastSuccess, toastError]);

  return {
    selectedLanguage,
    codeExample,
    canvasTitle,
    editorLanguage,
    handleLanguageChange,
    handleCopy,
    handleDownload,
  };
};
