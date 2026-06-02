import React, { memo } from 'react';

import { Box } from '@mui/material';

import IWModalForkButton from '@/[fsd]/entities/import-wizard/ui/ImportWizardModal/IWModalForkButton';
import IWModalImportButton from '@/[fsd]/entities/import-wizard/ui/ImportWizardModal/IWModalImportButton';
import { Button } from '@/[fsd]/shared/ui';

const IWModalActions = memo(props => {
  const {
    importSucceedData,
    onCloseHandler,
    onSucceedImportAgree,
    isForking,
    setImportSucceedData,
    setImportErrorData,
    setForkedData,
    forkedData,
    values,
    canImport,
  } = props;

  if (importSucceedData || forkedData)
    return (
      <Button.BaseBtn
        variant="elitea"
        color="primary"
        onClick={onSucceedImportAgree}
      >
        Got it
      </Button.BaseBtn>
    );

  return (
    <Box sx={{ display: 'flex', gap: '1rem' }}>
      <Button.BaseBtn
        variant="elitea"
        color="secondary"
        onClick={onCloseHandler}
      >
        Cancel
      </Button.BaseBtn>
      {isForking ? (
        <IWModalForkButton
          selectedProject={values.selectedProject}
          onSuccess={data => setForkedData(data)}
        />
      ) : (
        <IWModalImportButton
          selectedProject={values.selectedProject}
          onSuccess={(data, errors) => {
            setImportSucceedData(data);
            setImportErrorData(errors);
          }}
          isDisabled={!canImport}
          canImport={canImport}
        />
      )}
    </Box>
  );
});

IWModalActions.displayName = 'IWModalActions';

export default IWModalActions;
