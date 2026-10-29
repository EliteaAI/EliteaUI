import { useFormikContext } from 'formik';

const LOCKED_VERSION_STATUSES = ['published', 'embedded'];

/** Published and embedded versions can't change their attachments (the backend rejects it) */
export const useIsVersionLocked = () => {
  const { values } = useFormikContext();
  return LOCKED_VERSION_STATUSES.includes(values?.version_details?.status);
};
