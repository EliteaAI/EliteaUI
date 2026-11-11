import { memo, useCallback, useMemo } from 'react';

import { useFormikContext } from 'formik';

import { Box, Typography } from '@mui/material';

import { useImportSkillLimit } from '@/[fsd]/entities/import-wizard/lib/hooks';
import IWModalEntityCard from '@/[fsd]/entities/import-wizard/ui/import-wizard-modal/IWModalEntityCard';

// A skill that already imported stays in the dialog after a partial failure: the import flow marks it
// as not selected, so it is shown as checked and locked instead of as an unchecked, re-importable item.
const isImportedSkill = entity => entity.versions?.[0]?.validationStatus === 'success';

const isSkillIncluded = entity => isImportedSkill(entity) || entity.isSelected !== false;

const IWModalDetails = memo(props => {
  const { isForking } = props;

  const { values, setFieldValue } = useFormikContext();

  const styles = iWModalDetailsStyles();

  const { maxSkillsPerAgent, skillLimitErrors } = useImportSkillLimit(
    values?.importItems,
    values?.selectedProject?.id,
  );

  const handleSkillSelectionChange = useCallback(
    (importUUID, checked) => {
      const itemIndex = values?.importItems?.findIndex(item => item.import_uuid === importUUID);

      if (itemIndex >= 0) setFieldValue(`importItems[${itemIndex}].isSelected`, checked);
    },
    [setFieldValue, values?.importItems],
  );

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
        .filter(item => item.entity === 'agents' || item.entity === 'skills')
        .map(item => prepareApplicationEntity(item));
    },
    [isForking, prepareApplicationEntity],
  );

  const withSkillLimitErrors = useCallback(
    entity =>
      entity && skillLimitErrors[entity.import_uuid]
        ? {
            ...entity,
            errorMessages: [...(entity.errorMessages ?? []), ...skillLimitErrors[entity.import_uuid]],
          }
        : entity,
    [skillLimitErrors],
  );

  const { mainEntity, nestedEntities, skillEntities } = useMemo(() => {
    const mainItem = values?.importItems?.[0];
    const nestedItems = values?.importItems?.slice(1);
    const prepared = prepareNestedApplications(nestedItems).map(withSkillLimitErrors);

    return {
      mainEntity: withSkillLimitErrors(prepareApplicationEntity(mainItem)),
      nestedEntities: prepared.filter(item => item?.entity !== 'skills'),
      skillEntities: prepared.filter(item => item?.entity === 'skills'),
    };
  }, [prepareApplicationEntity, prepareNestedApplications, values?.importItems, withSkillLimitErrors]);

  const selectedSkillsCount = useMemo(() => skillEntities.filter(isSkillIncluded).length, [skillEntities]);

  return (
    <Box sx={styles.root}>
      <Box sx={styles.entityBlock}>
        <Typography sx={styles.label}>Main entity</Typography>
        <IWModalEntityCard
          entity={mainEntity}
          titleTestId="agent-import-preview-name"
          toggleTestId="agent-import-preview-card-toggle"
        />
      </Box>

      {nestedEntities.length > 0 && (
        <Box sx={styles.entityBlock}>
          <Typography sx={styles.label}>Nested entities</Typography>
          <Box sx={styles.column}>
            {nestedEntities.map((entity, index) => (
              <IWModalEntityCard
                key={index}
                entity={entity}
                titleTestId="agent-import-preview-nested-agent-name"
                toggleTestId="agent-import-preview-card-toggle"
                instructionsTestId="agent-import-preview-nested-agent-instructions"
              />
            ))}
          </Box>
        </Box>
      )}

      {skillEntities.length > 0 && (
        <Box sx={styles.entityBlock}>
          <Typography sx={styles.label}>Skills</Typography>
          <Typography
            variant="bodySmall"
            sx={styles.skillsSummary}
            data-testid="agent-import-skills-summary"
          >
            {`${selectedSkillsCount} of ${skillEntities.length} skills selected`}
            {maxSkillsPerAgent ? ` (the target project allows at most ${maxSkillsPerAgent} per agent)` : ''}
          </Typography>
          <Box sx={styles.column}>
            {skillEntities.map(entity => (
              <IWModalEntityCard
                key={entity.import_uuid}
                entity={entity}
                selection={{
                  checked: isSkillIncluded(entity),
                  disabled: isImportedSkill(entity),
                  onChange: checked => handleSkillSelectionChange(entity.import_uuid, checked),
                  testId: 'agent-import-skill-select-checkbox',
                }}
                titleTestId="agent-import-preview-skill-name"
                toggleTestId="agent-import-preview-card-toggle"
                instructionsTestId="agent-import-preview-skill-instructions"
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
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  root: {
    padding: '.15rem 0rem',
  },
  skillsSummary: ({ palette }) => ({
    display: 'block',
    marginBottom: '0.75rem',
    color: palette.text.secondary,
  }),
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
