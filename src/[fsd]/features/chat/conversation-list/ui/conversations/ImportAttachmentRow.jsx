import { memo, useCallback } from 'react';

import { Box, Typography } from '@mui/material';

import { Checkbox } from '@/[fsd]/shared/ui';
import { formatFileSize } from '@/common/attachmentValidationUtils';

const ImportAttachmentRow = memo(props => {
  const { attachment, checked, onToggle } = props;
  const { export_path: exportPath, name, size, kind, available, too_large: tooLarge, max_size_mb } = attachment;

  const disabled = !available || tooLarge;
  let status = kind === 'generated' ? 'Generated' : 'Uploaded';
  if (!available) status = 'Not available in archive';
  else if (tooLarge) status = `Exceeds max size ${max_size_mb} MB`;

  const handleChange = useCallback(() => onToggle(exportPath), [exportPath, onToggle]);

  const styles = importAttachmentRowStyles();

  return (
    <Box
      sx={styles.row}
      data-testid="import-chat-modal-attachment-row"
    >
      <Checkbox.BaseCheckbox
        size="small"
        checked={!disabled && checked}
        disabled={disabled}
        onChange={handleChange}
        inputProps={{ 'aria-label': name }}
      />
      <Typography
        variant="bodySmall"
        sx={styles.name(disabled)}
        title={name}
      >
        {name}
      </Typography>
      <Typography
        variant="bodySmall"
        sx={styles.meta}
      >
        {size ? `${formatFileSize(size)} · ${status}` : status}
      </Typography>
    </Box>
  );
});

ImportAttachmentRow.displayName = 'ImportAttachmentRow';

/** @type {MuiSx} */
const importAttachmentRowStyles = () => ({
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    minWidth: 0,
  },
  name: disabled => ({ palette }) => ({
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: disabled ? palette.text.button.disabled : palette.text.primary,
  }),
  meta: ({ palette }) => ({
    flexShrink: 0,
    color: palette.text.secondary,
  }),
});

export default ImportAttachmentRow;
