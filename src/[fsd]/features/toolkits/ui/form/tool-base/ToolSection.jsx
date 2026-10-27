import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Box, Typography, useTheme } from '@mui/material';

import { OAuthAppHelpers } from '@/[fsd]/features/credentials/lib/helpers';
import { useOAuthAppSubsections } from '@/[fsd]/features/credentials/lib/hooks';
import { ToolBaseHelpers } from '@/[fsd]/features/toolkits/lib/helpers';
import { ToolkitForm } from '@/[fsd]/features/toolkits/ui';
import { Checkbox } from '@/[fsd]/shared/ui';
import { capitalizeFirstChar, isNullOrUndefined } from '@/common/utils';

const ToolSection = memo(props => {
  const {
    sectionKey,
    subsections: schemaSubsections,
    required,
    schema = { properties: {} },
    showValidation,
    toolErrors,
    settings,
    editField,
    setDefaultField,
    handleInputChange,
    setToolErrors,
    setEditToolDetail,
    setNotSelectedFields,
    specifiedProjectId,
    showOnlyConfigurationFields = false,
    disableConfigFields = false,
    disabled,
    validationErrorMessages,
    checkboxAsteriskRequired = true,
    onCredentialReload,
    credentialType,
  } = props;

  const styles = sectionStyles();
  const theme = useTheme();
  // Teams/Outlook/SharePoint: which of Default app / Custom app is offered depends on the admin's apps
  const { subsections, isResolving } = useOAuthAppSubsections({
    credentialType,
    subsections: schemaSubsections,
    settings,
  });
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
    // Pick the subsection with the most matching (non-null) fields so that subsections
    // sharing common fields (e.g. OAuth Delegated and OAuth Client Credentials both have
    // client_id/client_secret) resolve to the correct one rather than always the first.
    // When subsections declare key_fields (Default app: oauth_app_id, Custom app: client_id), the
    // one whose key field is set wins; with none set (a new credential) the first one is used.
    if (subsections.some(subsection => subsection.key_fields?.length)) {
      const keyed = subsections.find(subsection =>
        subsection.key_fields?.some(field => !isNullOrUndefined(settings[field]) && settings[field] !== ''),
      );
      return (keyed || subsections[0]).name;
    }
    let best = null;
    let bestCount = 0;
    for (const subsection of subsections) {
      const count = subsection.fields?.filter(field => !isNullOrUndefined(settings[field])).length ?? 0;
      if (count > bestCount) {
        bestCount = count;
        best = subsection;
      }
    }
    return best?.name;
  }, [settings, subsections]);
  const [selectedOption, setSelectedOption] = useState(defaultOption || sectionOptions[0].value);
  const { fields = [] } = useMemo(
    () => subsections.find(subsection => subsection.name === selectedOption) || { fields: [] },
    [selectedOption, subsections],
  );
  // Fields the selected subsection shares with others (e.g. scopes) stay selected
  const notSelectedFields = useMemo(
    () =>
      subsections
        .filter(subsection => subsection.name !== selectedOption)
        .reduce((acc, subsection) => [...acc, ...(subsection.fields || [])], [])
        .filter(field => !fields.includes(field)),
    [fields, selectedOption, subsections],
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

  // Once the admin's apps are known, start on the subsection that matches the credential
  const resolvedOnce = useRef(false);
  useEffect(() => {
    if (isResolving || resolvedOnce.current) return;
    resolvedOnce.current = true;
    if (defaultOption && defaultOption !== selectedOption) setSelectedOption(defaultOption);
  }, [defaultOption, isResolving, selectedOption]);

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
      const leavingAppSection = OAuthAppHelpers.isOAuthAppSection(currentSubsection);
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
      const newFields = subsections.find(subsection => subsection.name === newOption)?.fields || [];
      const unselectedSettings = {};
      subsections
        .filter(subsection => subsection.name !== newOption)
        .reduce((acc, subsection) => [...acc, ...(subsection.fields || [])], [])
        .filter(field => !newFields.includes(field))
        .forEach(field => {
          unselectedSettings[field] = null;
        });
      // The Default app picker's mirrored authority must not prefill the user's own app
      if (leavingAppSection) {
        OAuthAppHelpers.APP_MIRRORED_FIELDS.forEach(field => {
          unselectedSettings[field] = null;
        });
      }

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
      fields.forEach(field => {
        const propSchema = schema?.properties?.[field];
        const isBooleanField =
          propSchema?.type === 'boolean' || propSchema?.anyOf?.some(item => item.type === 'boolean');
        requiredPropertiesError[field] = isBooleanField ? false : !settings[field];
      });
      notSelectedFields.forEach(field => (requiredPropertiesError[field] = false));
      setToolErrors(prevState => ({
        ...prevState,
        ...requiredPropertiesError,
      }));
    }
  }, [setToolErrors, settings, required, fields, notSelectedFields, selectedOption, schema?.properties]);

  if (isResolving) return null;

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
                setDefaultField={setDefaultField}
                handleInputChange={handleInputChange}
                required={false}
                specifiedProjectId={specifiedProjectId}
                disableConfigFields={v.configuration === true} // Only disable configuration fields
                disabled={disabled && v.type !== 'configuration'} // Disable non-configuration fields if overall disabled
                validationErrorMessages={validationErrorMessages}
                onCredentialReload={onCredentialReload}
                credentialType={credentialType}
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
      <Box sx={[styles.header, sectionOptions.length <= 1 && styles.compactHeader]}>
        <Typography
          component="div"
          variant="bodySmall"
        >
          {capitalizeFirstChar(sectionKey)}
        </Typography>
        {sectionOptions.length > 1 && (
          <Checkbox.RadioButtonGroup
            value={selectedOption}
            items={sectionOptions}
            onChange={onChangeOption}
            wrapRow
            testId={`toolkit-field-${sectionKey}-radio`}
          />
        )}
      </Box>
      {sectionProps.map(([k, v]) => {
        const isBooleanField = v?.type === 'boolean' || v?.anyOf?.some(item => item.type === 'boolean');
        const isRequired = showOnlyConfigurationFields
          ? !showOnlyConfigurationFields
          : required && !(isBooleanField && !checkboxAsteriskRequired);
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
            setDefaultField={setDefaultField}
            handleInputChange={handleInputChange}
            required={isRequired}
            specifiedProjectId={specifiedProjectId}
            disableConfigFields={disableConfigFields}
            disabled={disabled && v.type !== 'configuration'}
            validationErrorMessages={validationErrorMessages}
            onCredentialReload={onCredentialReload}
            credentialType={credentialType}
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
  compactHeader: {
    minHeight: 'auto',
    paddingBottom: 0,
  },
});

export default ToolSection;
