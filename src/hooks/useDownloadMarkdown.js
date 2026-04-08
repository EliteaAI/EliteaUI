/***
 * Simplified from react-export-table-to-excel
 */
import { useCallback } from 'react';

export function useDownloadMarkdown({ markdown, filename }) {
  const onDownloadMarkdown = useCallback(() => {
    const element = document.createElement('a');
    const file = new Blob([markdown], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
    document.body.removeChild(element);
  }, [filename, markdown]);

  const onCopyRawTable = useCallback(async () => {
    await navigator.clipboard.writeText(markdown);
  }, [markdown]);

  return {
    onDownloadMarkdown,
    onCopyRawTable,
  };
}
