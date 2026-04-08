import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { ToolBaseHelpers } from '@/[fsd]/features/toolkits/lib/helpers';
import { ToolkitForm } from '@/[fsd]/features/toolkits/ui';
import { capitalizeFirstChar, isNullOrUndefined } from '@/common/utils';
import RadioButtonGroup from '@/components/RadioButtonGroup';
import { useTheme } from '@emotion/react';

const ToolSection = memo(props => {
  const {
    sectionKey,
    subsections,
    required,
    schema = { properties: {} },
    showValidation,
    toolErrors,
    settings,
    editField,
    handleInputChange,
    setToolErrors,
    setEditToolDetail,
    setNotSelectedFields,
    specifiedProjectId,
    showOnlyConfigurationFields = false,
    disableConfigFields = false,
    disabled,
    validationErrorMessages,
  } = props;

  const styles = sectionStyles();
  const theme = useTheme();
  const sectionOptions = useMemo(
    () =>
      (subsections || []).reduce(
        (acc, subsection) => {
          return [
            ...acc,
            {
              label: subsection.name,
              value: subsection.name,
            },
          ];
        },
        sectionKey === 'auth' && !required
          ? [
              {
                label: 'Anonymous',
                value: 'none',
              },
            ]
          : [],
      ),
    [required, sectionKey, subsections],
  );
  const defaultOption = useMemo(() => {
    return subsections.find(subsection => {
      return !!subsection.fields?.find(field => !isNullOrUndefined(settings[field]));
    })?.name;
  }, [settings, subsections]);
  const [selectedOption, setSelectedOption] = useState(defaultOption || sectionOptions[0].value);
  const { fields = [] } = useMemo(
    () => subsections.find(subsection => subsection.name === selectedOption) || { fields: [] },
    [selectedOption, subsections],
  );
  const notSelectedFields = useMemo(
    () =>
      subsections
        .filter(subsection => subsection.name !== selectedOption)
        .reduce((acc, subsection) => [...acc, ...(subsection.fields || [])], []),
    [selectedOption, subsections],
  );

  useEffect(() => {
    if (typeof setNotSelectedFields === 'function') {
      setNotSelectedFields(notSelectedFields);
    }
  }, [notSelectedFields, setNotSelectedFields]);

  useEffect(() => {
    if (
      sectionOptions.length > 0 &&
      (!selectedOption || !sectionOptions.find(option => option.value === selectedOption))
    ) {
      setSelectedOption(sectionOptions[0].value);
    }
  }, [sectionOptions, selectedOption]);

  const sectionProps = useMemo(() => {
    // When in disabled configuration mode, only include fields marked with configuration=true
    const filteredFields = showOnlyConfigurationFields
      ? fields.filter(field => {
          const prop = Object.entries(schema.properties || {}).find(([key]) => key === field);
          return prop && prop[1] && prop[1].configuration === true;
        })
      : fields;

    return filteredFields
      .map(field => Object.entries(schema.properties || {}).find(([key]) => key === field))
      .filter(it => !!it)
      .sort((a, b) => {
        if (
          ToolBaseHelpers.isSecretField(a[0], a[1].format, a[1].secret, a[1]) &&
          !ToolBaseHelpers.isSecretField(b[0], b[1].format, b[1].secret, b[1])
        ) {
          return -1;
        }
        if (
          !ToolBaseHelpers.isSecretField(a[0], a[1].format, a[1].secret, a[1]) &&
          ToolBaseHelpers.isSecretField(b[0], b[1].format, b[1].secret, b[1])
        ) {
          return 1;
        }
        // Secondary rule: Sort alphabetically by key
        return a[0].localeCompare(b[0]);
      });
  }, [fields, schema.properties, showOnlyConfigurationFields]);

  // Cache of user-entered field values per subsection name, keyed by subsection name.
  // Allows restoring values when the user switches back to a previously visited subsection.
  const sectionValuesCache = useRef({});

  const onChangeOption = useCallback(
    newOption => {
      // 1. Snapshot current (deselected) subsection field values into the cache
      //    before they are nullified so they can be restored later.
      const currentSubsection = subsections.find(sub => sub.name === selectedOption);
      if (currentSubsection && selectedOption !== 'none') {
        const snapshot = {};
        (currentSubsection.fields || []).forEach(field => {
          const value = settings[field];
          if (value !== null && value !== undefined) {
            snapshot[field] = value;
          }
        });
        if (Object.keys(snapshot).length > 0) {
          sectionValuesCache.current = {
            ...sectionValuesCache.current,
            [selectedOption]: {
              ...(sectionValuesCache.current[selectedOption] || {}),
              ...snapshot,
            },
          };
        }
      }

      setSelectedOption(newOption);

      // 2. Build the update: nullify all fields from deselected subsections,
      //    then overlay any cached values for the newly selected subsection.
      const unselectedSettings = {};
      subsections
        .filter(subsection => subsection.name !== newOption)
        .reduce((acc, subsection) => [...acc, ...(subsection.fields || [])], [])
        .forEach(field => {
          unselectedSettings[field] = null;
        });

      const restoredSettings = sectionValuesCache.current[newOption] || {};

      setEditToolDetail(prevState => {
        return {
          ...prevState,
          settings: {
            ...prevState.settings,
            ...unselectedSettings,
            ...restoredSettings,
          },
        };
      });

      // 3. Sync restored values back to Formik so the dirty state is recalculated
      //    and the Save button becomes active when there are pending changes.
      if (typeof editField === 'function') {
        // Nullified fields: notify Formik they are cleared
        Object.keys(unselectedSettings).forEach(field => {
          editField(`settings.${field}`, null);
        });
        // Restored fields: notify Formik of the restored values
        Object.entries(restoredSettings).forEach(([field, value]) => {
          editField(`settings.${field}`, value);
        });
      }
    },
    [editField, selectedOption, setEditToolDetail, settings, subsections],
  );

  useEffect(() => {
    if (required) {
      const requiredPropertiesError = {};
      fields.forEach(field => (requiredPropertiesError[field] = !settings[field]));
      notSelectedFields.forEach(field => (requiredPropertiesError[field] = false));
      setToolErrors(prevState => ({
        ...prevState,
        ...requiredPropertiesError,
      }));
    }
  }, [setToolErrors, settings, required, fields, notSelectedFields, selectedOption]);

  // For disabled fields (especially for auth section), handle differently
  if (disableConfigFields) {
    // Filter fields into configuration and regular fields
    const configFields = sectionProps.filter(([, v]) => v.configuration === true);
    const regularFields = sectionProps.filter(([, v]) => v.configuration !== true);

    // Only show configuration fields that have values
    const configFieldsWithValues = configFields.filter(([k]) => {
      const value = settings[k];
      return value !== undefined && value !== null && value !== '';
    });

    // Show all regular fields regardless of value
    const fieldsToShow = [...configFieldsWithValues, ...regularFields];

    // If no fields to show, return nothing
    if (fieldsToShow.length === 0) {
      return null;
    }

    // For auth section with disabled fields, don't show the radio buttons
    if (sectionKey === 'auth') {
      return (
        <>
          <Box sx={styles.disabledAuthHeader}>
            <Typography
              component="div"
              variant="bodySmall"
            >
              {capitalizeFirstChar(sectionKey)}
            </Typography>
          </Box>
          {fieldsToShow.map(([k, v]) => {
            return (
              <ToolkitForm.ToolBaseProperty
                key={k}
                k={k}
                v={v}
                theme={theme}
                showValidation={showValidation}
                toolErrors={toolErrors}
                settings={settings}
                editField={editField}
                handleInputChange={handleInputChange}
                required={false}
                specifiedProjectId={specifiedProjectId}
                disableConfigFields={v.configuration === true} // Only disable configuration fields
                disabled={disabled && v.type !== 'configuration'} // Disable non-configuration fields if overall disabled
                validationErrorMessages={validationErrorMessages}
              />
            );
          })}
        </>
      );
    }
  }

  // Normal rendering for editable fields
  return (
    <>
      <Box sx={styles.header}>
        <Typography
          component="div"
          variant="bodySmall"
        >
          {capitalizeFirstChar(sectionKey)}
        </Typography>
        <RadioButtonGroup
          value={selectedOption}
          items={sectionOptions}
          onChange={onChangeOption}
          wrapRow
        />
      </Box>
      {sectionProps.map(([k, v]) => {
        const isRequired = showOnlyConfigurationFields ? !showOnlyConfigurationFields : required;
        return (
          <ToolkitForm.ToolBaseProperty
            key={k}
            k={k}
            v={v}
            theme={theme}
            showValidation={showValidation}
            toolErrors={toolErrors}
            settings={settings}
            editField={editField}
            handleInputChange={handleInputChange}
            required={isRequired}
            specifiedProjectId={specifiedProjectId}
            disableConfigFields={disableConfigFields}
            disabled={disabled && v.type !== 'configuration'}
            validationErrorMessages={validationErrorMessages}
          />
        );
      })}
    </>
  );
});

ToolSection.displayName = 'ToolSection';

/** @type {MuiSx} */
const sectionStyles = () => ({
  disabledAuthHeader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingTop: '0.5rem',
    paddingLeft: '0.75rem',
    marginBottom: '1rem',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingTop: '0.5rem',
    paddingLeft: '0.75rem',
    minHeight: '4rem',
  },
});

export default ToolSection;
