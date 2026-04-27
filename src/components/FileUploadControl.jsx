import { useCallback, useRef } from 'react';

import { Box, Button, FormHelperText, Typography, useTheme } from '@mui/material';

import { StyledRemoveIcon } from './SearchBarComponents';

export default function FileUploadControl({
  id = 'file-upload-input' + Math.random().toString(36).substring(2, 11),
  file = {},
  onChangeFile,
  accept,
  disabled = false,
  label,
  placeholder,
  error = false,
  helperText = '',
  onClick,
  formikId,
  formikName,
}) {
  const theme = useTheme();
  const myRef = useRef(null);
  const fileInput = useRef(null);

  const handleFileChange = useCallback(
    event => {
      const { files } = event.target;
      if (files.length > 0) {
        onChangeFile(files[0]);
      } else {
        onChangeFile(undefined);
      }
      event.target.value = null;
    },
    [onChangeFile],
  );

  const removeFile = useCallback(() => {
    onChangeFile(undefined);
  }, [onChangeFile]);

  const handleClick = useCallback(() => {
    fileInput.current && fileInput.current.click();
  }, []);

  const handleControlClick = useCallback(
    event => {
      event.target = myRef.current || event.target;
      onClick(event);
    },
    [onClick],
  );

  return (
    <>
      <Box
        ref={myRef}
        onClick={handleControlClick}
        id={formikId}
        name={formikName}
        sx={{
          display: 'flex',
          gap: '8px',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
          padding: '14px 12px',
          borderBottom: `1px solid ${error ? theme.palette.error.main : theme.palette.border.lines}`,
        }}
      >
        {label && (
          <Typography
            variant="labelMedium"
            component="div"
            sx={{
              lineHeight: 1,
            }}
          >
            {label}
          </Typography>
        )}
        <Box
          sx={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <input
            ref={fileInput}
            hidden
            type="file"
            id={id}
            onChange={handleFileChange}
            accept={accept}
          />

          <Button
            variant="alita"
            color="secondary"
            onClick={handleClick}
            disabled={disabled}
          >
            Choose file
          </Button>

          {placeholder && !file.name ? (
            <Typography
              variant="bodyMedium"
              component="div"
              color={theme.palette.text.input.disabled}
              sx={{ flexGrow: 1 }}
            >
              {placeholder}
            </Typography>
          ) : (
            <Typography
              variant="bodyMedium"
              component="div"
              color={disabled ? theme.palette.text.input.disabled : theme.palette.text.secondary}
              sx={{ flexGrow: 1 }}
            >
              {file?.original_name || file?.name}
            </Typography>
          )}
          {!disabled && file?.name && <StyledRemoveIcon onClick={removeFile} />}
        </Box>
      </Box>
      {!!error && (
        <FormHelperText
          sx={{ paddingLeft: '12px' }}
          error
        >
          {helperText}
        </FormHelperText>
      )}
    </>
  );
}
