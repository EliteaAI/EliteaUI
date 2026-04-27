import { useCallback } from 'react';

import { useFormikContext } from 'formik';

import WelcomeMessage from '@/components/WelcomeMessage';

const ApplicationWelcomeMessage = ({ style = { marginTop: '16px' }, disabled }) => {
  const {
    values: { version_details },
    setFieldValue,
  } = useFormikContext();
  const handleChange = useCallback(
    event => setFieldValue('version_details.welcome_message', event.target.value),
    [setFieldValue],
  );

  return (
    <WelcomeMessage
      key={`${version_details?.id}_welcome`}
      welcome_message={version_details?.welcome_message || ''}
      onChangeWelcomeMessage={handleChange}
      style={style}
      disabled={disabled}
    />
  );
};

export default ApplicationWelcomeMessage;
