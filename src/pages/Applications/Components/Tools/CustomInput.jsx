import { useCallback, useState } from 'react';

import { Box, FormControl, TextField, Typography } from '@mui/material';
import FormHelperText from '@mui/material/FormHelperText';

import { getFileFormat } from '@/common/utils';
import useToast from '@/hooks/useToast';
import { useTheme } from '@emotion/react';

const CustomInput = ({ containerSX = {}, value, onValueChange, error, helperText }) => {
  const theme = useTheme();
  const [isDragOver, setIsDragOver] = useState(false);
  const { toastError } = useToast();

  const onDragOver = useCallback(event => {
    event.preventDefault();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback(event => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  const parseContent = useCallback(data => {
    let fileData = '';
    try {
      fileData = JSON.parse(data);
    } catch {
      //
    }
    return fileData;
  }, []);

  const handleFile = useCallback(
    isForDragDrop => event => {
      event.preventDefault();
      setIsDragOver(false);
      const reader = new FileReader();
      const file = isForDragDrop ? event.dataTransfer.files[0] : event.target.files[0];

      if (isForDragDrop) {
        const fileName = file?.name;
        const fileFormat = getFileFormat(fileName);
        if (fileFormat.toLowerCase() !== 'json') {
          toastError('Invalid json file format!');
        }
      }

      reader.onload = async e => {
        const parsedData = parseContent(e.target.result);
        const schemaString = parsedData ? JSON.stringify(parsedData, null, 2) : '';
        onValueChange(schemaString);
      };
      reader.readAsText(file);
    },
    [onValueChange, parseContent, toastError],
  );

  const onClickChooseFile = useCallback(() => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/json';

    fileInput.onchange = handleFile(false);
    fileInput.click();
  }, [handleFile]);

  const onChangeSchema = useCallback(
    event => {
      onValueChange(event.target.value);
    },
    [onValueChange],
  );
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', ...containerSX }}>
      <Box
        sx={{ height: '40px', padding: '0px 0px 0px 12px', gap: '10px', display: 'flex', alignItems: 'end' }}
      >
        <Typography
          variant="bodyMedium"
          color={'default'}
        >
          Json
        </Typography>
      </Box>
      <FormControl
        error={!!error}
        sx={{
          width: '100%',
          height: '400px',
          borderRadius: '8px',
          border: `1px solid ${theme.palette.border.lines}`,
          padding: '0px 0px',
          boxSizing: 'border-box',
          '& .MuiTextField-root': {
            padding: '0px 0px',
          },
        }}
      >
        {!value && (
          <Typography
            sx={{ position: 'absolute', top: '12px', left: '12px', zIndex: 100 }}
            variant="bodyMedium"
            color={theme.palette.text.button.disabled}
          >
            Enter or drag&drop your JSON - file here, or &nbsp;
            <Box
              component="span"
              sx={{ textDecoration: 'underline', cursor: 'pointer' }}
              onClick={onClickChooseFile}
            >
              choose file
            </Box>
          </Typography>
        )}
        <TextField
          variant="standard"
          fullWidth
          sx={{
            height: '400px',
            borderRadius: '8px',
            backgroundColor: isDragOver ? theme.palette.text.contextHighLight : '',
            '& .MuiOutlinedInput-root': {
              padding: '12px 12px',
              height: '400px',
              alignItems: 'start',
              boxSizing: 'border-box',
            },
            '& .MuiOutlinedInput-notchedOutline': {
              border: `0px solid ${theme.palette.border.lines};`,
            },
            padding: '8px !important',
          }}
          multiline
          maxRows={16}
          value={value}
          onChange={onChangeSchema}
          onDrop={handleFile(true)}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          InputProps={{
            disableUnderline: true,
          }}
        />
        {error && <FormHelperText>{helperText}</FormHelperText>}
      </FormControl>
    </Box>
  );
};

export default CustomInput;
