import { memo, useCallback, useMemo, useState } from 'react';

import { Box } from '@mui/material';

import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { Modal } from '@/[fsd]/shared/ui';
import { BaseTab, BaseTabs } from '@/[fsd]/shared/ui/tabs';

import { buildCaseContentColumns } from '../../lib/helpers';
import CaseContentColumn from './CaseContentColumn';
import CaseContentPreviewModal from './CaseContentPreviewModal';
import CaseTrajectoryPanel from './CaseTrajectoryPanel';

const WIDE_COLUMN_COUNT = 4;

const CASE_DETAILS_TAB = {
  content: 0,
  trajectory: 1,
};

const CaseDetailsModal = memo(props => {
  const { open, caseData, onClose, projectId, runId } = props;

  const [fullScreenColumn, setFullScreenColumn] = useState(null);
  const [activeTab, setActiveTab] = useState(CASE_DETAILS_TAB.content);
  // Each case opens on its content; the trajectory is one click away.
  const [tabCaseId, setTabCaseId] = useState(null);
  if (open && tabCaseId !== caseData?.id) {
    setTabCaseId(caseData?.id);
    setActiveTab(CASE_DETAILS_TAB.content);
  }

  const handleTabChange = useCallback((_event, value) => {
    setActiveTab(value);
  }, []);

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
          <Box sx={styles.body}>
            {runId != null && (
              <Box sx={styles.tabs}>
                <BaseTabs
                  value={activeTab}
                  onChange={handleTabChange}
                >
                  <BaseTab
                    label="Content"
                    data-testid="case-details-tab-content"
                  />
                  <BaseTab
                    label="Trajectory"
                    data-testid="case-details-tab-trajectory"
                  />
                </BaseTabs>
              </Box>
            )}
            {activeTab === CASE_DETAILS_TAB.trajectory && runId != null ? (
              <CaseTrajectoryPanel
                projectId={projectId}
                runId={runId}
                datasetCaseId={caseId}
                expectedTrajectory={caseItem?.expected_trajectory}
              />
            ) : (
              <Box sx={styles.columnsContainer}>
                {columns.map(column => (
                  <CaseContentColumn
                    key={column.key}
                    column={column}
                    onFullScreen={handleOpenFullScreen}
                  />
                ))}
              </Box>
            )}
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
  body: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
  },
  tabs: ({ palette }) => ({
    padding: '0 1.5rem',
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
  }),
  columnsContainer: {
    display: 'flex',
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
});

export default CaseDetailsModal;
