import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import BriefcaseIcon from '@/components/Icons/BriefcaseIcon.jsx';
import Person from '@/components/Icons/Person';

const CredentialNotFoundValue = memo(props => {
  const { eliteaTitle, isPrivate } = props;
  const styles = credentialNotFoundValueStyles();

  return (
    <Box sx={styles.container}>
      {isPrivate ? (
        <Person
          key="person-icon"
          fontSize="1rem"
        />
      ) : (
        <BriefcaseIcon
          key="briefcase-icon"
          fontSize="1rem"
        />
      )}
      <Typography
        variant="labelMedium"
        sx={styles.text}
      >
        {eliteaTitle}
      </Typography>
    </Box>
  );
});

CredentialNotFoundValue.displayName = 'CredentialNotFoundValue';

/** @type {MuiSx} */
const credentialNotFoundValueStyles = () => ({
  container: ({ palette }) => ({
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: palette.text.secondary,
  }),
  text: ({ palette }) => ({
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: palette.text.secondary,
  }),
  attentionIconBox: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
    width: '1rem',
    height: '1rem',
    color: palette.icon.attention,
    '& svg': {
      width: '0.875rem',
      height: '0.875rem',
    },
  }),
});

export default CredentialNotFoundValue;
