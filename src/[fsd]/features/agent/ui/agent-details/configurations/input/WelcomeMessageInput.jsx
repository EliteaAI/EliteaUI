import { memo, useCallback } from 'react';

import { useFormikContext } from 'formik';

import WelcomeMessage from '@/components/WelcomeMessage';

const WelcomeMessageInput = memo(({ style, disabled }) => {
  const {
    values: { version_details },
    setFieldValue,
  } = useFormikContext();
  const styles = getStyles();
  const handleChange = useCallback(
    event => setFieldValue('version_details.welcome_message', event.target.value),
    [setFieldValue],
  );

  return (
    <WelcomeMessage
      key={`${version_details?.id}_welcome`}
      welcome_message={version_details?.welcome_message || ''}
      onChangeWelcomeMessage={handleChange}
      style={style || styles.container}
      disabled={disabled}
    />
  );
});

const getStyles = () => ({
  container: {
    marginTop: '1rem',
  },
});

WelcomeMessageInput.displayName = 'WelcomeMessageInput';

export default WelcomeMessageInput;
