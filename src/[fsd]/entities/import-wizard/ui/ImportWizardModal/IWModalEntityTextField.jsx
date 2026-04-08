import { memo } from 'react';

import { Box, IconButton, Tooltip, Typography } from '@mui/material';

import FullScreenIconSvg from '@/assets/full-screen-icon.svg?react';

const IWModalEntityTextField = memo(props => {
  const { title, description, lineClamp, setFullscreenData, type = 'text', height = '4rem' } = props;

  const styles = iWModalEntityTextFieldStyles();

  return (
    <Box>
      <Box sx={styles.titleWrapper}>
        <Typography sx={styles.title}>{`${title}:`}</Typography>
        <Tooltip
          title="Full screen view"
          placement="top"
        >
          <IconButton
            onClick={() => setFullscreenData({ title, content: description })}
            variant="elitea"
            color="tertiary"
          >
            <FullScreenIconSvg />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={[{ height: height ?? '4rem' }, styles.textBlock]}>
        <Typography
          variant="bodySmall"
          sx={[
            styles.descriptionText,
            { WebkitLineClamp: lineClamp, margin: 0, wordBreak: 'break-word' },
            ...(type === 'markdown' ? [{ whiteSpace: 'pre-wrap' }] : []),
          ]}
          component="p"
        >
          {description}
        </Typography>
      </Box>
    </Box>
  );
});

IWModalEntityTextField.displayName = 'IWModalEntityTextField';

/** @type {MuiSx} */
const iWModalEntityTextFieldStyles = () => ({
  titleWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    justifyContent: 'space-between',
    marginBottom: '1rem',
  },
  title: {
    fontWeight: 500,
    fontSize: '.75rem',
    lineHeight: '1rem',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  textBlock: ({ palette }) => ({
    border: `0.0625rem solid ${palette.border.lines}`,
    borderRadius: '0.5rem',
    padding: '.5rem 1rem',
  }),
  descriptionText: ({ palette }) => ({
    color: palette.text.secondary,
    lineHeight: '1rem',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
  }),
});

export default IWModalEntityTextField;
