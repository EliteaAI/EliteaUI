import { memo, useCallback, useMemo, useState } from 'react';

import { Box } from '@mui/material';

import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { Modal } from '@/[fsd]/shared/ui';

import CaseContentColumn from './CaseContentColumn';
import CaseContentPreviewModal from './CaseContentPreviewModal';

const WIDE_COLUMN_COUNT = 4;

const CaseDetailsModal = memo(props => {
  const { open, caseData, onClose } = props;

  const [fullScreenColumn, setFullScreenColumn] = useState(null);

  const handleOpenFullScreen = useCallback(column => {
    setFullScreenColumn(column);
  }, []);

  const handleCloseFullScreen = useCallback(() => {
    setFullScreenColumn(null);
  }, []);

  const caseItem = caseData?.case;
  const caseId = caseData?.id;

  const columns = useMemo(() => {
    const base = [
      { key: 'input', label: 'Input', content: caseItem?.input },
      { key: 'actualOutput', label: 'Actual Output', content: caseItem?.output },
      { key: 'expectedOutput', label: 'Expected Output', content: caseItem?.expected_output },
    ];
    if (caseItem?.structure != null && caseItem.structure !== '') {
      base.push({ key: 'instructions', label: 'Instructions', content: caseItem.structure });
    }
    return base;
  }, [caseItem]);

  const styles = caseDetailsModalStyles(columns.length);

  return (
    <>
      <Modal.BaseModal
        open={open}
        onClose={onClose}
        variant={ModalConstants.MODAL_VARIANT.complex}
        title={`Case #${caseId} details`}
        data-testid="case-details-modal"
        sx={styles.dialogPaper}
        dialogSx={styles.dialogContent}
        content={
          <Box sx={styles.columnsContainer}>
            {columns.map(column => (
              <CaseContentColumn
                key={column.key}
                column={column}
                onFullScreen={handleOpenFullScreen}
              />
            ))}
          </Box>
        }
      />

      <CaseContentPreviewModal
        open={fullScreenColumn != null}
        label={fullScreenColumn?.label}
        content={fullScreenColumn?.content}
        onClose={handleCloseFullScreen}
      />
    </>
  );
});

CaseDetailsModal.displayName = 'CaseDetailsModal';

/** @type {MuiSx} */
const caseDetailsModalStyles = columnCount => ({
  dialogPaper: {
    width: columnCount === WIDE_COLUMN_COUNT ? '70rem' : '56rem',
    maxWidth: '95vw',
    height: '80vh',
  },
  dialogContent: ({ palette }) => ({
    padding: 0,
    borderTop: `0.0625rem solid ${palette.border.lines}`,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  }),
  columnsContainer: {
    display: 'flex',
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
});

export default CaseDetailsModal;
