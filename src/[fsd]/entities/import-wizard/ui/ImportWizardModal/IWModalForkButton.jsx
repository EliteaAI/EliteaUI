import React, { memo, useCallback, useMemo } from 'react';

import { useFormikContext } from 'formik';

import { Button } from '@mui/material';

import { useForkAgentMutation, useForkDatasourceMutation } from '@/[fsd]/entities/import-wizard/api';
import {
  filterSelected,
  getErrorImportUUID,
  getExistingUUIDMap,
  getImportedUUIDMap,
  updateAgentToolImportUUIDs,
  updateValidationStatus,
} from '@/[fsd]/entities/import-wizard/lib/helpers';
import { useToolkitForkMutation } from '@/api/toolkits.js';
import { buildErrorMessage, genForkedEntityLink } from '@/common/utils';
import { StyledCircleProgress } from '@/components/Chat/StyledComponents';
import useToast from '@/hooks/useToast.jsx';

const IWModalForkButton = memo(({ selectedProject, onSuccess }) => {
  const selectedProjectId = selectedProject?.id;

  const { toastError, toastWarning } = useToast();

  const { values, setFieldValue } = useFormikContext();

  const [forkDatasource, { isLoading: isForkingDatasource }] = useForkDatasourceMutation();
  const [forkAgent, { isLoading: isForkingAgent }] = useForkAgentMutation();
  const [forkToolkit, { isLoading: isForkingToolkit }] = useToolkitForkMutation();

  const importedData = useMemo(() => values?.importItems, [values?.importItems]);
  const selectedData = useMemo(() => {
    const inputData = filterSelected(importedData);

    const applications = inputData.filter(item => item.entity === 'agents');
    const toolkits = inputData.filter(item => item.entity === 'toolkits');

    return applications.map(app => ({
      ...app,
      versions: app.versions.map(version => ({
        ...version,
        tools: version.tools
          .map(t => {
            const toolData = toolkits.find(toolkit => toolkit.import_uuid === t.import_uuid);

            if (!toolData) return null;

            return {
              type: toolData.type,
              name: toolData.name,
              toolkit_name: toolData.name,
              settings: toolData.settings,
              selected_tools: toolData.selected_tools || [],
              meta: toolData.meta || {},
            };
          })
          .filter(Boolean),
      })),
    }));
  }, [importedData]);

  const { import_uuid: mainItemImportUUID, entity: mainEntityName } = useMemo(
    () => importedData[0] || {},
    [importedData],
  );

  const isNewApplication = useMemo(
    () => values?.importItems.find(item => item.entity === 'toolkits'),
    [values?.importItems],
  );

  const generateValidationPromises = useCallback(
    async ({ errorImportUUID, importedUUIDMap, existingUUIDMap, result, already_exists }) =>
      importedData.map(async (item, index) => {
        if (!item.isSelected) {
          return true;
        }
        const isValid = !errorImportUUID.includes(item.import_uuid);
        if (isValid) {
          const foundInResult = result[item.entity].find(it => it.index === index);
          if (foundInResult) {
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
            const foundInAlreadyExists = already_exists[item.entity].find(
              it => it.index === index || it.import_uuid === item.import_uuid,
            );

            if (foundInAlreadyExists) {
              const entityLink = genForkedEntityLink({
                entity_project_id: foundInAlreadyExists.owner_id,
                entity_name:
                  item.entity === 'agents' && foundInAlreadyExists.version_details?.agent_type === 'pipeline'
                    ? 'pipelines'
                    : item.entity,
                entity_id: foundInAlreadyExists.id,
                name: foundInAlreadyExists.name,
              });

              if (item.entity !== 'datasources' && item.entity !== 'toolkits') {
                importedData[index].versions.map(async (versionItem, versionItemIndex) => {
                  const foundVersion = foundInAlreadyExists.versions.find(
                    version => version.name === versionItem.name,
                  );

                  if (foundVersion) {
                    await setFieldValue(
                      `importItems[${index}].versions[${versionItemIndex}].validationStatus`,
                      'already_exists',
                    );
                    await setFieldValue(
                      `importItems[${index}].versions[${versionItemIndex}].entityLink`,
                      entityLink,
                    );
                  }
                });
              } else {
                await updateValidationStatus({
                  data: importedData,
                  index,
                  validationStatus: 'already_exists',
                  setFieldValue,
                  entityLink,
                });
              }
            }
          }
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
                type,
              } = tools[tIndex];
              if (import_uuid) {
                await updateAgentToolImportUUIDs({
                  type,
                  index,
                  vIndex,
                  tIndex,
                  import_version_uuid,
                  uuidMap: importedUUIDMap[import_uuid],
                  setFieldValue,
                });
                await updateAgentToolImportUUIDs({
                  type,
                  index,
                  vIndex,
                  tIndex,
                  import_version_uuid,
                  uuidMap: existingUUIDMap[import_uuid],
                  setFieldValue,
                });
              }
            }
          }
        }

        return isValid;
      }),
    [importedData, isNewApplication, setFieldValue],
  );

  const onClickFork = useCallback(async () => {
    const forkFuncMap = {
      toolkits: forkToolkit,
      datasources: forkDatasource,
      agents: forkAgent,
    };

    const forkFunc = forkFuncMap[mainEntityName] ?? (() => {});

    let response;

    switch (mainEntityName) {
      case 'toolkits':
        response = await forkFunc({ projectId: selectedProjectId, data: selectedData });
        break;
      default:
        response = await forkFunc({
          projectId: selectedProjectId,
          body: { [mainEntityName === 'agents' ? 'applications' : mainEntityName]: selectedData },
        });
    }

    const isValidResponse = !!response?.data || !!response?.error?.data?.errors;

    if (isValidResponse) {
      const {
        errors = { agents: [], datasources: [], toolkits: [] },
        result = { agents: [], datasources: [], toolkits: [] },
        already_exists = { agents: [], datasources: [], toolkits: [] },
      } = response.data || response?.error?.data || { errors: {} };
      const errorImportUUID = getErrorImportUUID(errors, selectedData);
      const importedUUIDMap = getImportedUUIDMap(result, selectedData);
      const existingUUIDMap = getExistingUUIDMap(already_exists, selectedData);

      const validationPromises = await generateValidationPromises({
        errorImportUUID,
        importedUUIDMap,
        existingUUIDMap,
        result,
        already_exists,
      });

      Promise.all(validationPromises).then(() => {
        if (errorImportUUID.length) {
          toastError('Some fields have missing or invalid data!');
        } else {
          const mainItemInResult = result[mainEntityName].find(item => !item.index);
          const mainItemInExisting = already_exists[mainEntityName].find(
            item => !item.index || item.import_uuid === mainItemImportUUID,
          );

          if (mainItemInResult) {
            onSuccess && onSuccess(result);
          } else if (mainItemInExisting) {
            toastWarning('Some items have already existed!');
          } else {
            toastError('Something went wrong!!!');
          }
        }
      });
    } else {
      if (response?.error?.status === 403) {
        toastError('Forking is not allowed on the selected project');
      } else {
        toastError(buildErrorMessage(response?.error));
      }
    }
  }, [
    forkToolkit,
    forkDatasource,
    forkAgent,
    mainEntityName,
    selectedProjectId,
    selectedData,
    generateValidationPromises,
    toastError,
    mainItemImportUUID,
    onSuccess,
    toastWarning,
  ]);

  return (
    <Button
      disabled={
        !selectedProjectId ||
        !selectedData?.length ||
        isForkingDatasource ||
        isForkingAgent ||
        isForkingToolkit ||
        mainItemImportUUID !== selectedData[0]?.import_uuid
      }
      variant="alita"
      onClick={onClickFork}
      sx={{ marginRight: '0rem' }}
    >
      Fork
      {(isForkingDatasource || isForkingAgent || isForkingToolkit) && <StyledCircleProgress size={18} />}
    </Button>
  );
});

IWModalForkButton.displayName = 'IWModalForkButton';

export default IWModalForkButton;
