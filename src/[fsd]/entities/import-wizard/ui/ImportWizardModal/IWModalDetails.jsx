import { memo, useCallback, useMemo } from 'react';

import { useFormikContext } from 'formik';

import { Box, Typography } from '@mui/material';

import IWModalEntityCard from '@/[fsd]/entities/import-wizard/ui/ImportWizardModal/IWModalEntityCard';

const IWModalDetails = memo(props => {
  const { isForking } = props;

  const { values } = useFormikContext();

  const styles = iWModalDetailsStyles();

  const prepareApplicationEntity = useCallback(
    entity => {
      if (!isForking) return entity ? { ...entity, details: entity.versions[0] } : null;

      const validVersion = entity?.versions?.[0];

      const baseVersionWithToolkits = {
        ...validVersion,
        tools: (validVersion?.tools || [])
          .map(toolItem =>
            values?.importItems?.find(
              importedItem =>
                importedItem.entity === 'toolkits' && importedItem.import_uuid === toolItem.import_uuid,
            ),
          )
          .filter(Boolean),
      };

      const serializedForkedItems = entity
        ? {
            ...entity,
            details: baseVersionWithToolkits,
            versions: [baseVersionWithToolkits],
            version_details: baseVersionWithToolkits,
          }
        : null;

      return serializedForkedItems;
    },
    [isForking, values?.importItems],
  );

  const prepareNestedApplications = useCallback(
    nestedEntities => {
      if (!isForking)
        return nestedEntities ? nestedEntities.map(item => ({ ...item, details: item.versions[0] })) : [];

      return nestedEntities
        .filter(item => item.entity === 'agents')
        .map(agent => prepareApplicationEntity(agent));
    },
    [isForking, prepareApplicationEntity],
  );

  const { mainEntity, nestedEntities } = useMemo(() => {
    const mainItem = values?.importItems?.[0];
    const nestedItems = values?.importItems?.slice(1);

    return {
      mainEntity: prepareApplicationEntity(mainItem),
      nestedEntities: prepareNestedApplications(nestedItems),
    };
  }, [prepareApplicationEntity, prepareNestedApplications, values?.importItems]);

  return (
    <Box sx={styles.root}>
      <Box sx={styles.entityBlock}>
        <Typography sx={styles.label}>Main entity</Typography>
        <IWModalEntityCard entity={mainEntity} />
      </Box>

      {nestedEntities.length > 0 && (
        <Box sx={styles.entityBlock}>
          <Typography sx={styles.label}>Nested entities</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {nestedEntities.map((entity, index) => (
              <IWModalEntityCard
                key={index}
                entity={entity}
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
});

IWModalDetails.displayName = 'IWModalDetails';

/** @type {MuiSx} */
const iWModalDetailsStyles = () => ({
  root: {
    padding: '.15rem 0rem',
  },
  entityBlock: {
    margin: '1rem 0',
  },
  label: {
    fontWeight: 500,
    fontSize: '.75rem',
    lineHeight: '1rem',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    marginBottom: '1rem',
  },
});

export default IWModalDetails;
