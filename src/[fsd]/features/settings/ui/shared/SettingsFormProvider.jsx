import { memo, useCallback, useMemo } from 'react';

import { Form, Formik } from 'formik';

import { ProfileHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { useQueryAuthor } from '@/[fsd]/features/settings/lib/hooks';
import { useDefaultModel } from '@/[fsd]/shared/lib/hooks';
import {
  useAuthorDescriptionMutation,
  useAuthorDetailsQuery,
  useAuthorModuleSettingsQuery,
  useUpdateAuthorModuleSettingsMutation,
} from '@/api/social';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

const SettingsFormProvider = memo(props => {
  const { FormContent } = props;

  useQueryAuthor();
  const selectedProjectId = useSelectedProjectId();
  const { toastError, toastSuccess } = useToast();

  const { data: authorData } = useAuthorDetailsQuery();
  // #6285: module toggles (Default Modules tab) are scoped per project, unlike authorData.
  const { data: moduleSettingsData } = useAuthorModuleSettingsQuery(selectedProjectId, {
    skip: !selectedProjectId,
  });
  const [updateAuthor] = useAuthorDescriptionMutation();
  const [updateModuleSettings] = useUpdateAuthorModuleSettingsMutation();

  const { modelList, defaultModel } = useDefaultModel();

  const initialValues = useMemo(
    () =>
      ProfileHelpers.serializeProfileFormData(
        authorData,
        moduleSettingsData,
        defaultModel,
        selectedProjectId,
      ),
    [authorData, moduleSettingsData, defaultModel, selectedProjectId],
  );

  const handleSubmit = useCallback(
    async (values, { setSubmitting, resetForm }) => {
      try {
        const payload = ProfileHelpers.deserializeProfileFormData(values);
        const moduleSettingsPayload = ProfileHelpers.deserializeModuleSettingsFormData(values);
        await Promise.all([
          updateAuthor(payload).unwrap(),
          selectedProjectId
            ? updateModuleSettings({ projectId: selectedProjectId, ...moduleSettingsPayload }).unwrap()
            : Promise.resolve(),
        ]);
        resetForm({ values });
        toastSuccess('Settings saved successfully');
      } catch {
        toastError('Failed to save settings');
      } finally {
        setSubmitting(false);
      }
    },
    [updateAuthor, updateModuleSettings, selectedProjectId, toastSuccess, toastError],
  );

  return (
    <Formik
      enableReinitialize
      initialValues={initialValues}
      validationSchema={ProfileHelpers.profileValidationSchema}
      onSubmit={handleSubmit}
    >
      <Form>
        <FormContent modelList={modelList} />
      </Form>
    </Formik>
  );
});

SettingsFormProvider.displayName = 'SettingsFormProvider';

export default SettingsFormProvider;
