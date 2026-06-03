import { memo } from 'react';

import { Box, Tooltip, Typography } from '@mui/material';

import AttentionIcon from '@/assets/attention-icon.svg?react';
import BriefcaseIcon from '@/components/Icons/BriefcaseIcon.jsx';
import Person from '@/components/Icons/Person';

const CredentialNotFoundValue = memo(props => {
  const { eliteaTitle, isPrivate, hasFetchedData } = props;

  return (
    <Box sx={styles.container(hasFetchedData)}>
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
        sx={styles.text(hasFetchedData)}
      >
        {eliteaTitle}
      </Typography>
      {hasFetchedData && (
        <Tooltip
          key="not-found-tooltip"
          title="Credential not found"
          placement="top"
        >
          <Box sx={styles.attentionIconBox}>
            <AttentionIcon />
          </Box>
        </Tooltip>
      )}
    </Box>
  );
});

CredentialNotFoundValue.displayName = 'CredentialNotFoundValue';

/** @type {MuiSx} */
const styles = {
  container: mismatch => ({
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: ({ palette }) => (mismatch ? palette.status.rejected : palette.text.secondary),
  }),
  text: mismatch => ({
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: ({ palette }) => (mismatch ? palette.status.rejected : palette.text.disabled),
  }),
  attentionIconBox: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
    width: '1rem',
    height: '1rem',
    color: palette.icon.fill.attention,
    '& svg': {
      width: '0.875rem',
      height: '0.875rem',
    },
  }),
};

export default CredentialNotFoundValue;
