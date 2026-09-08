import { memo, useCallback, useMemo, useState } from 'react';

import { Box } from '@mui/material';

import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { Modal } from '@/[fsd]/shared/ui';

import { buildCaseContentColumns } from '../../lib/helpers';
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

  const columns = useMemo(() => buildCaseContentColumns(caseItem), [caseItem]);

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
  // BaseModal pads its content with `!important` and caps its height against the viewport. The
  // table is the whole modal here, so both are undone and the paper's height is what it fills.
  dialogContent: {
    padding: '0 !important',
    maxHeight: 'none',
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  columnsContainer: {
    display: 'flex',
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
});

export default CaseDetailsModal;
