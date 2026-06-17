import { Box, Typography } from '@mui/material';

const DuplicateDialogContent = props => {
  const { duplicateFilenames = [] } = props;

  if (!duplicateFilenames.length) {
    return null;
  }

  const isMultiple = duplicateFilenames.length > 1;
  const styles = duplicateDialogContentStyles();

  return (
    <Box sx={styles.wrapper}>
      <Typography
        variant="bodyMedium"
        color="text.secondary"
      >
        {`${isMultiple ? 'Files' : 'A file'} with the same name already exist${isMultiple ? '' : 's'} in the
        bucket.`}
      </Typography>
      {duplicateFilenames.map((filename, index) => (
        <Typography
          key={`${index}-${filename}`}
          variant="headingSmall"
          sx={styles.filename}
        >
          {filename}
        </Typography>
      ))}
      <Typography
        variant="bodyMedium"
        color="text.secondary"
      >
        Uploading {isMultiple ? 'these files' : 'this file'} will override the existing{' '}
        {isMultiple ? 'files' : 'file'}. Do you want to proceed?
      </Typography>
    </Box>
  );
};

export default DuplicateDialogContent;

/** @type {MuiSx} */
const duplicateDialogContentStyles = () => ({
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  filename: ({ palette }) => ({
    color: palette.text.deleteAlertEntityName,
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
  }),
});
