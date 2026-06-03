import { memo } from 'react';

import { Box } from '@mui/material';

import BriefcaseIcon from '@/components/Icons/BriefcaseIcon.jsx';
import Person from '@/components/Icons/Person';

const CredentialCreateLabel = memo(props => {
  const { isPrivate, type } = props;

  return (
    <Box
      component="span"
      sx={styles.container}
    >
      {isPrivate ? <Person fontSize="1rem" /> : <BriefcaseIcon fontSize="1rem" />}
      {`New ${isPrivate ? 'private' : 'project'} ${type ? type + ' ' : ''}credentials`}
    </Box>
  );
});

CredentialCreateLabel.displayName = 'CredentialCreateLabel';

/** @type {MuiSx} */
const styles = {
  container: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
};

export default CredentialCreateLabel;
