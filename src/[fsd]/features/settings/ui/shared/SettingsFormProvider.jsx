import { memo, useCallback, useMemo } from 'react';

import { Form, Formik } from 'formik';

import { ProfileHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { useQueryAuthor } from '@/[fsd]/features/settings/lib/hooks';
import { useDefaultModel } from '@/[fsd]/shared/lib/hooks';
import { useAuthorDescriptionMutation, useAuthorDetailsQuery } from '@/api/social';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

const SettingsFormProvider = memo(props => {
  const { FormContent } = props;

  useQueryAuthor();
  const selectedProjectId = useSelectedProjectId();
  const { toastError, toastSuccess } = useToast();

  const { data: authorData } = useAuthorDetailsQuery();
  const [updateAuthor] = useAuthorDescriptionMutation();

  const { modelList, defaultModel } = useDefaultModel();

  const initialValues = useMemo(
    () => ProfileHelpers.serializeProfileFormData(authorData, defaultModel, selectedProjectId),
    [authorData, defaultModel, selectedProjectId],
  );

  const handleSubmit = useCallback(
    async (values, { setSubmitting, resetForm }) => {
      try {
        const payload = ProfileHelpers.deserializeProfileFormData(values);
        await updateAuthor(payload).unwrap();
        resetForm({ values });
        toastSuccess('Settings saved successfully');
      } catch {
        toastError('Failed to save settings');
      } finally {
        setSubmitting(false);
      }
    },
    [updateAuthor, toastSuccess, toastError],
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
