import { CircularProgress, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Box } from '@mui/system';

const StyledCircleProgress = styled(CircularProgress)(
  () => `
  position: absolute;
  z-index: 999;
  margin-left: 0px;
  margin-top: 1px;
`,
);

const CircularProgressWrapper = props => {
  const { progress, ...otherProps } = props;

  const styles = circularProgressStyles();

  if (typeof progress === 'number') {
    return (
      <Box
        component="span"
        sx={styles.wrapper}
      >
        <StyledCircleProgress
          variant="determinate"
          value={progress}
          {...otherProps}
        />
        <Typography sx={styles.progress}>{Math.round(progress)}%</Typography>
      </Box>
    );
  }

  return <StyledCircleProgress {...otherProps} />;
};

/** @type {MuiSx} */
const circularProgressStyles = () => ({
  wrapper: {
    position: 'absolute',
    zIndex: 999,
    marginLeft: 0,
    marginTop: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progress: ({ palette }) => ({
    position: 'absolute',
    fontSize: '0.625rem',
    fontWeight: 600,
    color: 'primary.main',
    lineHeight: 1,
    backgroundColor: palette.background.aiAnswerBkg,
    borderRadius: '50%',
    width: '2rem',
    height: '2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  }),
});

export default CircularProgressWrapper;
