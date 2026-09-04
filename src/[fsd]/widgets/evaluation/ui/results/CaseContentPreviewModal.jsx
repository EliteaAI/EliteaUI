import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { Modal } from '@/[fsd]/shared/ui';

import { formatCaseContent } from '../../lib/helpers';

const CaseContentPreviewModal = memo(props => {
  const { open, label, content, onClose } = props;

  const styles = caseContentPreviewModalStyles();

  return (
    <Modal.BaseModal
      open={open}
      onClose={onClose}
      variant={ModalConstants.MODAL_VARIANT.complex}
      fullscreen
      title={label}
      data-testid="case-content-preview-modal"
      dialogSx={styles.content}
      content={
        <Box sx={styles.contentWrapper}>
          <Typography
            variant="bodySmall"
            sx={styles.contentText}
            component="pre"
          >
            {formatCaseContent(content)}
          </Typography>
        </Box>
      }
    />
  );
});

CaseContentPreviewModal.displayName = 'CaseContentPreviewModal';

/** @type {MuiSx} */
const caseContentPreviewModalStyles = () => ({
  content: ({ palette }) => ({
    padding: 0,
    borderTop: `0.0625rem solid ${palette.border.lines}`,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  }),
  contentWrapper: {
    flex: 1,
    padding: '1.5rem',
    overflow: 'auto',
  },
  contentText: ({ palette }) => ({
    color: palette.text.default,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    margin: 0,
    fontFamily: 'inherit',
    fontSize: '0.875rem',
    lineHeight: 1.7,
  }),
});

export default CaseContentPreviewModal;
