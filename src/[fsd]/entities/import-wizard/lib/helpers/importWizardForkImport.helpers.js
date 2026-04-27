import { isNullOrUndefined } from '@/common/utils';

export const getErrorImportUUID = (errors, selectedData) => {
  // Look through each key in the errors object
  const errorIndex = [];

  for (const key in errors) {
    // eslint-disable-next-line no-prototype-builtins
    if (errors.hasOwnProperty(key)) {
      errors[key].forEach(item => {
        errorIndex.push(selectedData[item.index].import_uuid);
      });
    }
  }

  return errorIndex.sort((a, b) => a - b);
};

export const getImportedUUIDMap = (result, selectedData) => {
  // Look through each key in the errors object
  const uuidToIdMap = {};

  try {
    for (const key in result) {
      // eslint-disable-next-line no-prototype-builtins
      if (result.hasOwnProperty(key)) {
        result[key]?.forEach(item => {
          if (selectedData[item.index].import_uuid) {
            uuidToIdMap[selectedData[item.index].import_uuid] = { id: item.id, versions: {} };

            selectedData[item.index].versions?.forEach(version => {
              const { import_version_uuid, name } = version;

              if (import_version_uuid) {
                const foundCreatedVersion = item.versions.find(it => it.name === name);

                if (foundCreatedVersion) {
                  uuidToIdMap[selectedData[item.index].import_uuid].versions[import_version_uuid] =
                    foundCreatedVersion.id;
                }
              }
            });
          }
        });
      }
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    //
  }

  return uuidToIdMap;
};

export const updateValidationStatus = async params => {
  const { data, index, validationStatus, setFieldValue, entityLink } = params;

  if (
    data[index].versions?.length &&
    data[index].entity !== 'datasources' &&
    data[index].entity !== 'toolkits'
  ) {
    data[index].versions.map(async (_, versionItemIndex) => {
      await setFieldValue(
        `importItems[${index}].versions[${versionItemIndex}].validationStatus`,
        validationStatus,
      );

      if (entityLink)
        await setFieldValue(`importItems[${index}].versions[${versionItemIndex}].entityLink`, entityLink);
    });
  } else {
    await setFieldValue(`importItems[${index}].validationStatus`, validationStatus);

    if (entityLink) await setFieldValue(`importItems[${index}].entityLink`, entityLink);
  }
};

export const getExistingUUIDMap = (already_exists, selectedData) => {
  // Look through each key in the errors object
  const uuidToIdMap = {};

  try {
    for (const key in already_exists) {
      // eslint-disable-next-line no-prototype-builtins
      if (already_exists.hasOwnProperty(key)) {
        already_exists[key]?.forEach(item => {
          const { index, import_uuid } = item;
          const foundSelectedItem = isNullOrUndefined(index)
            ? selectedData.find(it => import_uuid && it.import_uuid === import_uuid)
            : selectedData[index];

          if (foundSelectedItem) {
            uuidToIdMap[foundSelectedItem.import_uuid] = { id: item.id, versions: {} };
            foundSelectedItem.versions?.forEach(version => {
              const { import_version_uuid, name } = version;

              if (import_version_uuid) {
                const foundCreatedVersion = item.versions.find(it => it.name === name);

                if (foundCreatedVersion) {
                  uuidToIdMap[foundSelectedItem.import_uuid].versions[import_version_uuid] =
                    foundCreatedVersion.id;
                }
              }
            });
          }
        });
      }
    }
  } catch {
    //
  }

  return uuidToIdMap;
};

export const updateAgentToolImportUUIDs = async params => {
  const { type, index, vIndex, tIndex, import_version_uuid, uuidMap, setFieldValue } = params;

  if (uuidMap) {
    const { id, versions } = uuidMap;
    const idFieldName = type === 'application' ? 'application_id' : 'datasource_id';
    const versionFieldName = type === 'application' ? 'application_version_id' : '';
    await setFieldValue(
      `importItems[${index}].versions[${vIndex}].tools[${tIndex}].settings.import_uuid`,
      undefined,
    );
    await setFieldValue(
      `importItems[${index}].versions[${vIndex}].tools[${tIndex}].settings.${idFieldName}`,
      id,
    );
    if (type !== 'datasource' && versions[import_version_uuid]) {
      await setFieldValue(
        `importItems[${index}].versions[${vIndex}].tools[${tIndex}].settings.import_version_uuid`,
        undefined,
      );
      await setFieldValue(
        `importItems[${index}].versions[${vIndex}].tools[${tIndex}].settings.${versionFieldName}`,
        versions[import_version_uuid],
      );
    }
  }
};
