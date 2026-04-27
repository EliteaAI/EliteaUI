import { useCallback } from 'react';

import Papa from 'papaparse';
import { PropTypes } from 'prop-types';

import { IconButton } from '@mui/material';

import ImportIcon from '@/assets/import-icon.svg?react';
import useToast from '@/hooks/useToast';
import { useTheme } from '@emotion/react';

import StyledTooltip from '../ComponentsLib/Tooltip';

// Function to convert 2D array to Markdown table
const convertToMarkdown = data => {
  if (!data || data.length === 0) return '';

  const headers = data[0]; // First row as headers
  const rows = data.slice(1); // Remaining rows

  // Create Markdown headers
  const headerRow = `| ${headers.join(' | ')} |`;
  const separatorRow = `| ${headers.map(() => '---').join(' | ')} |`;

  // Create Markdown rows
  const markdownRows = rows
    .map(row => `| ${row.map(cell => (cell || '').replace(/\|/g, '\\|')).join(' | ')} |`)
    .join('\n');

  return { markdown: `${headerRow}\n${separatorRow}\n${markdownRows}`, headers, rows };
};

export default function ImportTableButton({ onImported, disabled }) {
  const theme = useTheme();
  const { toastError } = useToast();

  const handleFileUpload = useCallback(
    event => {
      const file = event.target.files[0];

      // Parse the CSV file
      Papa.parse(file, {
        complete: result => {
          const data = result.data; // 2D array of CSV data
          const markdown = convertToMarkdown(data);
          onImported?.(markdown);
        },
        error: error => {
          toastError('Error parsing CSV file:', error);
        },
      });
    },
    [onImported, toastError],
  );

  const onClickImport = useCallback(() => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv';

    fileInput.onchange = handleFileUpload;
    fileInput.click();
  }, [handleFileUpload]);

  return (
    <StyledTooltip
      placement="right"
      title={disabled ? '' : 'Import table(only support csv file)'}
      enterDelay={500}
      enterNextDelay={500}
    >
      <span>
        <IconButton
          onClick={onClickImport}
          aria-label="import table"
          variant="alita"
          color="tertiary"
          disabled={disabled}
          sx={{ marginLeft: '0px' }}
        >
          <ImportIcon
            style={{
              fontSize: '1rem',
              color: !disabled ? theme.palette.icon.fill.default : theme.palette.text.button.disabled,
            }}
          />
        </IconButton>
      </span>
    </StyledTooltip>
  );
}

ImportTableButton.propTypes = {
  onImported: PropTypes.func,
};
