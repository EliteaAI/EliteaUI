import React from 'react';

import { Typography } from '@mui/material';

const DuplicateDialogContent = ({ duplicateFilenames = [] }) => {
  if (!duplicateFilenames.length) {
    return null;
  }

  const isMultiple = duplicateFilenames.length > 1;

  return (
    <Typography
      variant="bodyMedium"
      color="text.secondary"
    >
      A file with the same name already exists in the bucket{isMultiple ? 's' : ''}:{' '}
      {duplicateFilenames.map((filename, index) => (
        <React.Fragment key={filename}>
          <Typography
            component="span"
            variant="headingSmall"
            sx={({ palette }) => ({
              color: palette.text.deleteAlertEntityName,
            })}
          >
            {filename}
          </Typography>
          {index < duplicateFilenames.length - 1 && ', '}
        </React.Fragment>
      ))}
      . Uploading {isMultiple ? 'these files' : 'this file'} will override the existing{' '}
      {isMultiple ? 'files' : 'file'}. Do you want to proceed?
    </Typography>
  );
};

export default DuplicateDialogContent;
