import React, { memo, useMemo } from 'react';

import { Formik } from 'formik';

import { prepareImportWizardData } from '@/[fsd]/entities/import-wizard/lib/helpers';
import { useStorages } from '@/[fsd]/entities/import-wizard/lib/hooks';
import { useListModelsQuery } from '@/api/configurations.js';
import { useSelectedProject } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast.jsx';

const IWModalFormikWrapper = memo(props => {
  const { data = {}, isForking, onClose, children } = props;

  const selectedGlobalProject = useSelectedProject();

  const { toastError } = useToast();

  const { data: modelsData } = useListModelsQuery(
    { projectId: selectedGlobalProject.id, include_shared: true },
    { skip: !selectedGlobalProject?.id },
  );

  const { data: embeddingModelOptions } = useListModelsQuery(
    { projectId: selectedGlobalProject.id, include_shared: true },
    { skip: !selectedGlobalProject?.id },
  );

  const { storageOptions } = useStorages({
    specifiedProjectId: selectedGlobalProject.id,
    skip: !data['datasources']?.length,
  });

  const preparedData = useMemo(() => {
    try {
      return prepareImportWizardData(data, modelsData, embeddingModelOptions, storageOptions);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Error preparing data for import wizard:', e);

      setTimeout(() => {
        onClose();
        toastError(
          'Invalid JSON: The JSON you provided cannot be parsed. Please check its formatting and try again.',
        );
      }, 0);

      return null;
    }
  }, [data, embeddingModelOptions, modelsData, onClose, storageOptions, toastError]);

  return (
    <>
      {preparedData !== null && preparedData.length > 0 && modelsData && (
        <Formik
          onSubmit={async (parameters, formikHelpers) => {
            // eslint-disable-next-line no-console
            console.debug({ parameters, formikHelpers });
          }}
          initialValues={{
            importItems: preparedData,
            selectedProject: isForking ? undefined : selectedGlobalProject,
            activeItemId: undefined,
            modelOptions: modelsData,
            embeddingModelOptions,
            storageOptions,
            version: data?._metadata?.version,
          }}
        >
          {children}
        </Formik>
      )}
    </>
  );
});

IWModalFormikWrapper.displayName = 'IWModalFormikWrapper';

export default IWModalFormikWrapper;
