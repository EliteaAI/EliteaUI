import { memo, useCallback, useMemo, useState } from 'react';

import { Box, FormControlLabel, Tooltip, Typography } from '@mui/material';

import ListInfiniteMoreLoader from '@/ComponentsLib/ListInfiniteMoreLoader';
import { Button, Checkbox, Input, Select } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import OpenEyeIcon from '@/assets/open-eye-icon.svg?react';
import CloseEyeIcon from '@/components/Icons/CloseEyeIcon';
import CopyIcon from '@/components/Icons/CopyIcon';

import { EXPIRY_OPTIONS } from '../../lib/constants';
import { SHARE_MESSAGES, WHICH_MESSAGES } from '../../lib/constants/shareChat.constants';
import { formatShareTime, getMessagePreview, getPasswordError } from '../../lib/helpers/shareChat.helpers';
import { useCopyToClipboard } from '../../lib/hooks/useCopyToClipboard.hooks';

const PREVIEW_LENGTH = 80;

const ShareLinkForm = memo(props => {
  const {
    form,
    messages,
    messagesTotal,
    totalFiles,
    isFilesLoaded,
    isMessagesFetching,
    onLoadMoreMessages,
    onChange,
  } = props;

  const [showPassword, setShowPassword] = useState(false);

  const isSelected = form.whichMessages === WHICH_MESSAGES.selected;
  const hasNoFiles = isFilesLoaded && totalFiles === 0;
  const checkedCount = form.selectedIds.length;
  const checkedFiles = useMemo(
    () =>
      messages.filter(item => form.selectedIds.includes(item.id)).reduce((sum, item) => sum + item.files, 0),
    [messages, form.selectedIds],
  );
  const passwordError = getPasswordError(form.password);
  const styles = shareLinkFormStyles(!!passwordError);

  const update = useCallback(patch => onChange({ ...form, ...patch }), [form, onChange]);

  const handleMessages = useCallback(event => update({ includeMessages: event.target.checked }), [update]);
  const handleAttachments = useCallback(
    event => update({ includeAttachments: event.target.checked }),
    [update],
  );
  const handleWhich = useCallback(value => update({ whichMessages: value }), [update]);
  const handleExpiry = useCallback(value => update({ expiry: value }), [update]);
  const handlePassword = useCallback(event => update({ password: event.target.value }), [update]);
  const handleToggleShow = useCallback(() => setShowPassword(prev => !prev), []);
  const copyToClipboard = useCopyToClipboard();
  const hasPassword = form.password.length > 0;
  // The server stores the trimmed password, so the copy must match it
  const handleCopyPassword = useCallback(
    () => copyToClipboard(form.password.trim(), SHARE_MESSAGES.passwordCopied),
    [copyToClipboard, form.password],
  );
  const handleToggleMessage = useCallback(
    id =>
      update({
        selectedIds: form.selectedIds.includes(id)
          ? form.selectedIds.filter(item => item !== id)
          : [...form.selectedIds, id],
      }),
    [form.selectedIds, update],
  );

  const total = messagesTotal;
  const messagesLabel = isSelected ? `${checkedCount} of ${total}` : `${total}`;
  const filesLabel = isSelected ? `${checkedFiles} of ${totalFiles} files` : `${totalFiles} files`;

  const radioItems = useMemo(
    () => [
      { value: WHICH_MESSAGES.all, label: 'All messages' },
      { value: WHICH_MESSAGES.selected, label: 'Selected messages' },
    ],
    [],
  );

  return (
    <Box sx={styles.root}>
      <Typography
        variant="labelMedium"
        color="text.secondary"
        sx={styles.formTitle}
      >
        Create link
      </Typography>

      <Box sx={styles.group}>
        <Typography
          variant="bodySmall"
          color="text.primary"
        >
          What to include
        </Typography>
        <Box sx={styles.checkGroup}>
          <FormControlLabel
            sx={styles.checkLine}
            control={
              <Checkbox.BaseCheckbox
                checked={isSelected || form.includeMessages}
                disabled={isSelected}
                onChange={handleMessages}
              />
            }
            label={
              <Typography variant="bodyMedium">
                Messages
                <Box
                  component="span"
                  sx={styles.count}
                >{` – ${messagesLabel}`}</Box>
              </Typography>
            }
          />
          <FormControlLabel
            sx={styles.checkLine}
            control={
              <Checkbox.BaseCheckbox
                checked={!hasNoFiles && (isSelected || form.includeAttachments)}
                disabled={isSelected || hasNoFiles}
                onChange={handleAttachments}
              />
            }
            label={
              <Typography variant="bodyMedium">
                Attachments
                <Box
                  component="span"
                  sx={styles.count}
                >{` – ${filesLabel}`}</Box>
              </Typography>
            }
          />
        </Box>
      </Box>

      <Box sx={styles.group}>
        <Typography
          variant="bodySmall"
          color="text.primary"
        >
          Which messages
        </Typography>
        <Checkbox.RadioButtonGroup
          value={form.whichMessages}
          onChange={handleWhich}
          items={radioItems}
          columnGap="1.5rem"
        />
      </Box>

      {isSelected && (
        <Box sx={styles.messageList}>
          {messages.map(item => {
            const preview = getMessagePreview(item);
            return (
              <Box
                key={item.id}
                data-testid="message-row"
                component="label"
                sx={styles.messageRow}
              >
                <Checkbox.BaseCheckbox
                  checked={form.selectedIds.includes(item.id)}
                  onChange={() => handleToggleMessage(item.id)}
                  inputProps={{ 'aria-label': `${item.author} ${formatShareTime(item.created_at)}` }}
                  sx={styles.rowCheckbox}
                />
                <Box sx={styles.messageText}>
                  <Box sx={styles.messageHead}>
                    <Typography
                      variant="bodyMedium"
                      color="text.secondary"
                      sx={styles.author}
                    >
                      {item.author}
                    </Typography>
                    <Typography
                      variant="bodySmall"
                      color="text.primary"
                    >
                      {formatShareTime(item.created_at)}
                    </Typography>
                  </Box>
                  <Typography
                    variant="bodySmall"
                    color="text.primary"
                    noWrap
                  >
                    {preview.length > PREVIEW_LENGTH ? `${preview.slice(0, PREVIEW_LENGTH)}…` : preview}
                  </Typography>
                </Box>
              </Box>
            );
          })}
          <ListInfiniteMoreLoader
            listCurrentSize={messages.length}
            totalAvailableCount={messagesTotal}
            onLoadMore={onLoadMoreMessages}
            isLoading={isMessagesFetching}
          />
        </Box>
      )}

      <Select.SingleSelect
        label="Link expiration"
        infoIconDescription={SHARE_MESSAGES.expirationInfo}
        value={form.expiry}
        options={EXPIRY_OPTIONS}
        onValueChange={handleExpiry}
        showBorder
        sx={styles.expiry}
        labelSX={styles.expiryLabel}
      />

      <Box sx={styles.passwordField}>
        <Input.InputBase
          label="Password (optional)"
          type={showPassword ? 'text' : 'password'}
          value={form.password}
          onChange={handlePassword}
          error={!!passwordError}
          fullWidth
          inputProps={{
            'data-testid': 'password-input',
            autoComplete: 'new-password',
            style: { paddingRight: hasPassword ? '4.5rem' : '2.5rem' },
          }}
        />
        {/* InputBase overrides endAdornment, so the buttons sit over the field */}
        <Box sx={styles.eyeSlot}>
          {hasPassword && (
            <Tooltip
              title="Copy password"
              placement="top"
            >
              <Button.BaseBtn
                data-testid="password-copy"
                aria-label="Copy password"
                variant={BUTTON_VARIANTS.tertiary}
                size="small"
                sx={styles.eyeButton}
                startIcon={<CopyIcon sx={styles.eye} />}
                onClick={handleCopyPassword}
              />
            </Tooltip>
          )}
          <Tooltip
            title={showPassword ? 'Hide password' : 'Show password'}
            placement="top"
          >
            <Button.BaseBtn
              data-testid="password-toggle"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              variant={BUTTON_VARIANTS.tertiary}
              size="small"
              sx={styles.eyeButton}
              startIcon={showPassword ? <CloseEyeIcon sx={styles.eye} /> : <OpenEyeIcon />}
              onClick={handleToggleShow}
            />
          </Tooltip>
        </Box>
        {passwordError && (
          <Typography
            variant="bodySmall"
            sx={styles.error}
          >
            {passwordError}
          </Typography>
        )}
      </Box>
    </Box>
  );
});

ShareLinkForm.displayName = 'ShareLinkForm';

/** @type {MuiSx} */
const shareLinkFormStyles = hasError => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  checkLine: {
    marginLeft: '-0.5rem',
    marginRight: 0,
    gap: '0.1875rem',
  },
  checkGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },
  formTitle: {
    '&&&': { fontWeight: 600 },
  },
  expiry: {
    paddingTop: '0.375rem',
  },
  expiryLabel: {
    alignItems: 'center',
    '& svg': { display: 'block' },
  },
  passwordField: {
    position: 'relative',
    marginTop: '-0.75rem',
  },
  eyeSlot: {
    position: 'absolute',
    right: '0.25rem',
    top: '1.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  count: ({ palette }) => ({
    color: palette.text.primary,
  }),
  messageList: ({ palette }) => ({
    marginTop: '-1rem',
    backgroundColor: palette.background.default.tertiary,
    maxHeight: '18rem',
    overflowX: 'hidden',
    overflowY: 'auto',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.lines}`,
  }),
  // The row is the checkbox's label, so a click anywhere on it picks the message
  messageRow: ({ palette }) => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    '&:hover': { backgroundColor: palette.background.interactiveItem.hover },
    '&:not(:last-of-type)': { borderBottom: `0.0625rem solid ${palette.border.default}` },
  }),
  rowCheckbox: {
    marginTop: '-0.25rem',
  },
  messageText: {
    minWidth: 0,
    flex: 1,
    overflow: 'hidden',
  },
  messageHead: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.5rem',
  },
  author: {
    '&&&': { fontWeight: 600 },
  },
  eye: {
    fontSize: '1rem',
  },
  eyeButton: ({ palette }) => ({
    color: palette.icon.default,
  }),
  error: ({ palette }) => ({
    display: 'block',
    marginTop: '0.25rem',
    padding: '0.25rem 0.5rem',
    borderRadius: '0.25rem',
    color: palette.text.error,
    backgroundColor: hasError ? palette.background.error : 'transparent',
    border: `0.0625rem solid ${palette.border.error}`,
  }),
});

export default ShareLinkForm;
