import { useEffect } from 'react';

import { getDefaultVersionId } from '@/[fsd]/entities/version';
import { useApplicationDetailsQuery } from '@/api/applications';

import { getEntityLock } from '../helpers';

const getEntityType = details => (details?.version_details?.agent_type === 'pipeline' ? 'pipeline' : 'agent');

/**
 * Loads the chosen entity and keeps the form in step with it: a locked entity that is not available
 * clears the form entity, and a chosen entity without a version gets the default one.
 * Returns `{ details, lockActive }`; `lockFailed` is the caller's state because the page shows it.
 */
export const useScheduleEntityDetails = ({
  projectId,
  formik,
  initialValues,
  lockedEntity,
  lockFailed,
  setLockFailed,
}) => {
  const { values, resetForm, setValues, setFieldValue } = formik;
  const { currentData: details, isFetching: isDetailsFetching } = useApplicationDetailsQuery(
    { projectId, applicationId: values.application_id },
    { skip: !values.application_id },
  );

  const lockActive = !!lockedEntity && !lockFailed;
  const lock = getEntityLock(lockedEntity, details && { type: getEntityType(details) });
  const lockRejected = lockActive && lock.unavailable;

  useEffect(() => {
    if (lockActive && !isDetailsFetching && lock.unavailable) {
      setLockFailed(true);
      // Clear the entity in the baseline too, so only the user's own edits make the form dirty
      resetForm({ values: { ...initialValues, application_id: '' } });
      setValues(prev => ({ ...prev, application_id: '' }), false);
    }
  }, [lockActive, isDetailsFetching, lock.unavailable, initialValues, resetForm, setValues, setLockFailed]);

  useEffect(() => {
    if (
      details &&
      !lockRejected &&
      String(details.id) === String(values.application_id) &&
      !values.version_id
    ) {
      // A form nested in an editor keeps the editor's version
      const versionId = lockedEntity?.versionId ?? getDefaultVersionId(details);
      // The preset for the URL entity belongs to the baseline: opening and leaving asks nothing
      if (!formik.dirty && String(values.application_id) === String(initialValues.application_id))
        resetForm({ values: { ...values, version_id: versionId } });
      else setFieldValue('version_id', versionId);
    }
  }, [
    details,
    lockRejected,
    lockedEntity?.versionId,
    values,
    initialValues.application_id,
    formik.dirty,
    resetForm,
    setFieldValue,
  ]);

  return { details, lockActive };
};
