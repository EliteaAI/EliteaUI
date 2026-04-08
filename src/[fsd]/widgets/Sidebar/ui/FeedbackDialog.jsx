import { memo, useEffect, useState } from 'react';

import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';

import FavoriteIcon from '@mui/icons-material/Favorite';
import FeedbackIcon from '@mui/icons-material/Feedback';
import { Button, Fab, Rating, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';

import { FeedbackConstants } from '@/[fsd]/widgets/Sidebar/lib/constants';
import { useFeedbackMutation } from '@/api/social.js';
import {
  StyledDialogActions,
  StyledDialogBase,
  StyledDialogContentText,
} from '@/components/StyledDialog.jsx';

const FeedbackDialog = memo(() => {
  const [open, setOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [rating, setRating] = useState(null);
  const [thanks, setThanks] = useState(false);
  const location = useLocation();
  const [sendFeedback, { isSuccess, isError }] = useFeedbackMutation();
  const [ratingError, setRatingError] = useState('');

  const setInitialState = () => {
    setOpen(false);
    setFeedbackText('');
    setRating(null);
    setRatingError('');
  };

  useEffect(() => {
    setInitialState();
  }, [location.pathname]);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    thanks ? setInitialState() : setOpen(false);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    rating === null
      ? setRatingError('Please rate the application')
      : await sendFeedback({ description: feedbackText, rating, location: decodeURI(location.pathname) });
  };
  useEffect(() => {
    isSuccess && setThanks(true);
  }, [isSuccess]);

  const { publicPermissions } = useSelector(state => state.user);
  const styles = feedbackDialogStyles(thanks);

  if (!publicPermissions || !publicPermissions.includes(FeedbackConstants.FEEDBACK_CREATE_PERMISSION)) {
    return;
  }

  return (
    <>
      <Fab
        size="small"
        color="primary"
        aria-label="feedback"
        onClick={handleClickOpen}
        sx={styles.fab}
      >
        <FeedbackIcon />
      </Fab>
      <StyledDialogBase
        onTransitionExited={() => {
          setThanks(false);
        }}
        fullWidth
        maxWidth={'md'}
        open={open}
        onClose={handleClose}
      >
        <Box sx={styles.thanksBox}>
          <Typography
            variant={'h4'}
            sx={styles.thanksText}
          >
            Thank you for feedback!
          </Typography>
          <FavoriteIcon sx={styles.heartIcon} />
        </Box>
        <Box sx={styles.feedbackBox}>
          <DialogTitle>Share your thoughts and ideas!</DialogTitle>
          <DialogContent>
            <StyledDialogContentText>Let us know how we can improve.</StyledDialogContentText>
            <Rating
              name={'feedback-rating'}
              value={rating}
              onChange={(event, newValue) => {
                setRating(newValue);
              }}
            />
            <Typography
              component="legend"
              sx={styles.ratingError}
            >
              {ratingError}
            </Typography>
            <TextField
              autoFocus
              required
              margin="dense"
              label="Feedback"
              type="text"
              fullWidth
              variant={'outlined'}
              multiline
              minRows={5}
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
              error={isError}
              helperText={isError ? 'Feedback submit error, please try again' : ''}
            />
          </DialogContent>
          <StyledDialogActions>
            <Button
              variant="elitea"
              color="secondary"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              variant="elitea"
              color="primary"
              onClick={handleSubmit}
            >
              Send
            </Button>
          </StyledDialogActions>
        </Box>
      </StyledDialogBase>
    </>
  );
});

FeedbackDialog.displayName = 'FeedbackDialog';

/** @type {MuiSx} */
const feedbackDialogStyles = thanks => ({
  fab: {
    position: 'fixed',
    bottom: '0.9375rem',
    right: '0.9375rem',
    opacity: 0.9,
  },
  thanksBox: {
    display: thanks ? 'flex' : 'none',
    minHeight: '21.0625rem',
    textAlign: 'center',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thanksText: {
    mb: 2,
  },
  heartIcon: ({ palette }) => ({
    fontSize: 'large',
    fill: palette.background.secondary,
    filter: 'drop-shadow(0 0 1.4375rem #7CE4DE) drop-shadow(0 0.0625rem 0.5rem rgba(124, 228, 222, 0.70))',
  }),
  feedbackBox: {
    display: !thanks ? 'block' : 'none',
  },
  ratingError: {
    fontSize: 'small',
    color: 'error.main',
  },
});
export default FeedbackDialog;
