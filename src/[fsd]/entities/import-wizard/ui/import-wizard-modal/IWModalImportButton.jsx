import React, { memo, useCallback, useMemo } from 'react';

import { useFormikContext } from 'formik';

import { Box } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { useImportWizardMutation } from '@/[fsd]/entities/import-wizard/api';
import {
  filterSelected,
  getErrorImportUUID,
  getImportedUUIDMap,
  updateValidationStatus,
} from '@/[fsd]/entities/import-wizard/lib/helpers';
import { Button } from '@/[fsd]/shared/ui';
import { buildErrorMessage } from '@/common/utils';
import { StyledCircleProgress } from '@/components/Chat/StyledComponents';
import useToast from '@/hooks/useToast.jsx';

const IWModalImportButton = memo(props => {
  const { selectedProject, onSuccess, isDisabled, canImport } = props;
  const { toastError } = useToast();

  const { values, setFieldValue } = useFormikContext();

  const [importWizard, { isLoading }] = useImportWizardMutation();

  const selectedProjectId = useMemo(() => selectedProject?.id, [selectedProject?.id]);
  const importedData = useMemo(() => values?.importItems, [values?.importItems]);
  const selectedData = useMemo(() => filterSelected(importedData), [importedData]);
  const isNewApplication = useMemo(
    () => values?.importItems.find(item => item.entity === 'toolkits'),
    [values?.importItems],
  );

  const generateValidationPromises = useCallback(
    ({ errorImportUUID, importedUUIDMap }) =>
      importedData.map(async (item, index) => {
        if (!item.isSelected) return true;

        const isValid = !errorImportUUID.includes(item.import_uuid);

        if (isValid) {
          await updateValidationStatus({
            data: importedData,
            index,
            validationStatus: 'success',
            setFieldValue,
          });
          await setFieldValue(`importItems[${index}].isSelected`, false);

          importedData[index].versions?.map(async (_, versionItemIndex) => {
            await setFieldValue(`importItems[${index}].versions[${versionItemIndex}].isSelected`, false);
          });
        } else {
          await updateValidationStatus({
            data: importedData,
            index,
            validationStatus: 'error',
            setFieldValue,
          });
        }
        if (item.entity === 'agents' && !isNewApplication) {
          for (let vIndex = 0; vIndex < item.versions.length; vIndex++) {
            const { tools } = item.versions[vIndex];

            for (let tIndex = 0; tIndex < tools.length; tIndex++) {
              const {
                settings: { import_uuid, import_version_uuid },
              } = tools[tIndex];

              if (import_uuid && importedUUIDMap[import_uuid]) {
                const { id, versions } = importedUUIDMap[import_uuid];

                await setFieldValue(
                  `importItems[${index}].versions[${vIndex}].tools[${tIndex}].settings.import_uuid`,
                  undefined,
                );
                await setFieldValue(
                  `importItems[${index}].versions[${vIndex}].tools[${tIndex}].settings.application_id`,
                  id,
                );

                {
                  await setFieldValue(
                    `importItems[${index}].versions[${vIndex}].tools[${tIndex}].settings.import_version_uuid`,
                    undefined,
                  );
                  await setFieldValue(
                    `importItems[${index}].versions[${vIndex}].tools[${tIndex}].settings.application_version_id`,
                    versions[import_version_uuid],
                  );
                }
              }
            }
          }
        }

        return isValid;
      }),
    [importedData, isNewApplication, setFieldValue],
  );

  const handleClickOnImport = useCallback(async () => {
    const response = await importWizard({ projectId: selectedProjectId, body: selectedData });
    const isValidResponse = !!response?.data || !!response?.error?.data?.errors;

    if (isValidResponse) {
      const { errors, result } = response.data || response?.error?.data || { errors: {} };

      const errorImportUUID = getErrorImportUUID(errors, selectedData);
      const importedUUIDMap = getImportedUUIDMap(result, selectedData);

      const validationPromises = generateValidationPromises({ errorImportUUID, importedUUIDMap });

      Promise.all(validationPromises).then(() => {
        if (errorImportUUID.length) {
          toastError('Some fields have missing or invalid data!');
        } else {
          onSuccess && onSuccess(result, errors);
        }
      });
    } else {
      if (response.error?.status === 403) {
        toastError('Importing is not allowed on the selected project');
      } else {
        toastError(buildErrorMessage(response.error));
      }
    }
  }, [importWizard, selectedProjectId, selectedData, generateValidationPromises, toastError, onSuccess]);

  return (
    <Tooltip
      title={!canImport ? 'Insufficient permissions to import in this project.' : ''}
      placement="top"
    >
      <Box component="span">
        <Button.BaseBtn
          disabled={isDisabled || isLoading}
          variant="elitea"
          onClick={handleClickOnImport}
          data-testid="agent-import-confirm-button"
        >
          Import
          {isLoading && <StyledCircleProgress size={18} />}
        </Button.BaseBtn>
      </Box>
    </Tooltip>
  );
});

IWModalImportButton.displayName = 'IWModalImportButton';

export default IWModalImportButton;
