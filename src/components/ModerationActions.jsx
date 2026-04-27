import React from 'react';

import { useSelector } from 'react-redux';

import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import { Box, Button, IconButton, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

import { PERMISSIONS } from '@/common/constants';
import AlertDialogV2 from '@/components/AlertDialogV2';
import HeaderContainer from '@/components/HeaderContainer';
import { StyledTipsContainer } from '@/pages/Common/Components/InputVersionDialog';
import { useTheme } from '@emotion/react';

import { StyledTextField } from './Chat/StyledComponents';
import FrameIcon from './Icons/FrameIcon';

const StyledUnfoldLessIcon = styled(UnfoldLessIcon)(({ theme }) => ({
  color: theme.palette.icon.fill.default,
}));

const StyledUnfoldMoreIcon = styled(UnfoldMoreIcon)(({ theme }) => ({
  color: theme.palette.icon.fill.default,
}));

const MAX_ROWS = 15;
const MIN_ROWS = 3;
const MIN_HEIGHT = 70;

export default function ModerationActions({
  approveWarningMessage,
  rejectWarningMessage,
  onApprove,
  onReject,
  disabled,
  showComments = false,
}) {
  const theme = useTheme();
  const { permissions = [] } = useSelector(state => state.user);

  const [openApproveDialog, setOpenApproveDialog] = React.useState(false);
  const [openRejectDialog, setOpenRejectDialog] = React.useState(false);
  const [comments, setComments] = React.useState('');
  const [rows, setRows] = React.useState(MAX_ROWS);
  const [showExpandIcon, setShowExpandIcon] = React.useState(false);

  const onClickApprove = React.useCallback(() => {
    setOpenApproveDialog(true);
  }, []);
  const onClickReject = React.useCallback(() => {
    setOpenRejectDialog(true);
  }, []);

  const onConfirmApprove = React.useCallback(async () => {
    await onApprove();
  }, [onApprove]);

  const onConfirmReject = React.useCallback(async () => {
    await onReject(comments);
  }, [comments, onReject]);

  const onClickExpander = React.useCallback(() => {
    setRows(prevRows => (prevRows === MAX_ROWS ? MIN_ROWS : MAX_ROWS));
  }, []);

  const onInputComments = React.useCallback(event => {
    setComments(event.target.value.length > 600 ? event.target.value.slice(0, 600) : event.target.value);
    setTimeout(() => {
      setShowExpandIcon(event.target.offsetHeight > MIN_HEIGHT);
    }, 0);
  }, []);

  return (
    <HeaderContainer>
      {permissions.includes(PERMISSIONS.moderation.reject) && (
        <>
          <Button
            variant="alita"
            color="secondary"
            disabled={disabled}
            onClick={onClickReject}
          >
            {'Decline'}
          </Button>
          <AlertDialogV2
            open={openRejectDialog}
            setOpen={setOpenRejectDialog}
            alarm
            title="Publish decline"
            sx={{
              '&.MuiDialog-paper': {
                width: '600px !important',
              },
            }}
            confirmButtonSX={{
              marginLeft: '0px',
              marginRight: '0px',
            }}
            confirmButtonTitle="Decline"
            onConfirm={onConfirmReject}
            disabledConfirm={showComments && !comments}
            extraContent={
              <>
                <StyledTipsContainer
                  sx={{
                    boxSizing: 'border-box',
                    marginTop: '0px',
                    width: '552px',
                    flexDirection: 'column',
                    display: 'flex',
                    padding: '8px 16px',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: `${theme.palette.border.attention}`,
                    borderRadius: '8px',
                    backgroundColor: `${theme.palette.background.attention}`,
                    gap: '8px',
                  }}
                >
                  <FrameIcon
                    width={16}
                    height={16}
                  />
                  <Typography
                    variant="bodySmall"
                    color="text.tips"
                  >
                    {rejectWarningMessage}
                  </Typography>
                </StyledTipsContainer>
                <Box
                  display={showComments ? 'flex' : 'none'}
                  flexDirection="column"
                  gap="8px"
                  marginTop="16px"
                  maxHeight="232px"
                >
                  <Typography
                    variant="bodySmall"
                    color="text.default"
                  >
                    Comment for author *
                  </Typography>
                  <StyledTextField
                    value={comments}
                    fullWidth
                    id="standard-multiline-static"
                    label=""
                    multiline
                    maxRows={rows}
                    variant="standard"
                    onChange={onInputComments}
                    placeholder={'Comment here'}
                    sx={{
                      borderBottom: `1px solid ${theme.palette.border.lines} `,
                      '& .MuiInputBase-input': {
                        maxHeight: '216px !important',
                      },
                    }}
                    InputProps={{
                      disableUnderline: true,
                      endAdornment: showExpandIcon ? (
                        <IconButton
                          size="small"
                          variant="alita"
                          color="tertiary"
                          onClick={onClickExpander}
                        >
                          {rows === MAX_ROWS ? (
                            <StyledUnfoldLessIcon sx={{ fontSize: '16px' }} />
                          ) : (
                            <StyledUnfoldMoreIcon sx={{ fontSize: '16px' }} />
                          )}
                        </IconButton>
                      ) : null,
                    }}
                  />
                </Box>
              </>
            }
          />
        </>
      )}

      {permissions.includes(PERMISSIONS.moderation.approve) && (
        <>
          <Button
            variant="alita"
            color="secondary"
            disabled={disabled}
            onClick={onClickApprove}
          >
            {'Approve'}
          </Button>
          <AlertDialogV2
            open={openApproveDialog}
            setOpen={setOpenApproveDialog}
            title="Warning"
            content={approveWarningMessage}
            onConfirm={onConfirmApprove}
          />
        </>
      )}
    </HeaderContainer>
  );
}
