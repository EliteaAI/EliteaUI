import { memo, useCallback, useMemo } from 'react';

import { Form, Formik } from 'formik';
import { useSelector } from 'react-redux';

import { useDefaultModel } from '@/[fsd]/shared/lib/hooks';
import { useAuthorDescriptionMutation, useAuthorDetailsQuery } from '@/api/social';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

import ProfileFormContent from './ProfileFormContent';
import { deserializeProfileFormData, serializeProfileFormData } from './profileUtils';
import { profileValidationSchema } from './profileValidation';
import useQueryAuthor from './useQueryAuthor';

const Profile = memo(() => {
  const { isFetching } = useQueryAuthor();
  const { name, avatar, email } = useSelector(state => state.trendingAuthor.authorDetails);
  const selectedProjectId = useSelectedProjectId();
  const { toastError, toastSuccess } = useToast();

  // Fetch author details with personalization settings
  const { data: authorData } = useAuthorDetailsQuery();
  const [updateAuthor] = useAuthorDescriptionMutation();

  const { modelList, defaultModel } = useDefaultModel();

  // Compute initial values from API data
  const initialValues = useMemo(
    () => serializeProfileFormData(authorData, defaultModel, selectedProjectId),
    [authorData, defaultModel, selectedProjectId],
  );

  // Form submit handler
  const handleSubmit = useCallback(
    async (values, { setSubmitting, resetForm }) => {
      try {
        const payload = deserializeProfileFormData(values);
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
      validationSchema={profileValidationSchema}
      onSubmit={handleSubmit}
    >
      <Form>
        <ProfileFormContent
          name={name}
          avatar={avatar}
          email={email}
          isFetching={isFetching}
          modelList={modelList}
        />
      </Form>
    </Formik>
  );
});

Profile.displayName = 'Profile';

export default Profile;
