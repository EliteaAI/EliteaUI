import React, { memo } from 'react';

import { Box, Button } from '@mui/material';

import IWModalForkButton from '@/[fsd]/entities/import-wizard/ui/ImportWizardModal/IWModalForkButton';
import IWModalImportButton from '@/[fsd]/entities/import-wizard/ui/ImportWizardModal/IWModalImportButton';

const IWModalActions = memo(props => {
  const {
    importSucceedData,
    onCloseHandler,
    onSucceedImportAgree,
    isForking,
    setImportSucceedData,
    setForkedData,
    forkedData,
    values,
    canImport,
  } = props;

  if (importSucceedData || forkedData)
    return (
      <Button
        disableRipple
        variant="alita"
        color="primary"
        onClick={onSucceedImportAgree}
      >
        Got it
      </Button>
    );

  return (
    <Box sx={{ display: 'flex', gap: '1rem' }}>
      <Button
        disableRipple
        variant="alita"
        color="secondary"
        onClick={onCloseHandler}
      >
        Cancel
      </Button>
      {isForking ? (
        <IWModalForkButton
          selectedProject={values.selectedProject}
          onSuccess={data => setForkedData(data)}
        />
      ) : (
        <IWModalImportButton
          selectedProject={values.selectedProject}
          onSuccess={data => setImportSucceedData(data)}
          isDisabled={!canImport}
          canImport={canImport}
        />
      )}
    </Box>
  );
});

IWModalActions.displayName = 'IWModalActions';

export default IWModalActions;
