export const getDefaultStorage = (storage, storageOptions) => {
  const { value } = storageOptions?.find(item => item.value === storage) || storageOptions[0] || {};
  return value;
};

export const setDefaultStorageForImportedDatasources = (importedDatasources, storageOptions) => {
  const datasources = [];

  importedDatasources?.forEach(datasource => {
    const newDatasource = {
      ...datasource,
    };
    const storage = getDefaultStorage(newDatasource.storage, storageOptions);
    newDatasource.storage = storage;
    datasources.push(newDatasource);
  });
  return datasources;
};

export const rematchStorage = (importItems, storageOptions) => {
  const rematchedImportItems = importItems?.map(item => {
    if (item.entity === 'datasources')
      return setDefaultStorageForImportedDatasources([item], storageOptions)[0];
    else return item;
  });
  return rematchedImportItems;
};
