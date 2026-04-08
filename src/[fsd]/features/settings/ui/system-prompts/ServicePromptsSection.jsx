import { memo, useCallback, useMemo, useRef, useState } from 'react';

import RestoreOutlinedIcon from '@mui/icons-material/RestoreOutlined';
import { Box, Button, IconButton, MenuItem, TextField, Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { DrawerPageHeader } from '@/[fsd]/features/settings/ui/drawer-page';
import { Field, Modal } from '@/[fsd]/shared/ui';
import {
  useCreateConfigurationMutation,
  useGetAvailableConfigurationsTypeQuery,
  useGetConfigurationsListQuery,
  useUpdateConfigurationMutation,
} from '@/api/configurations.js';
import EditIcon from '@/assets/edit.svg?react';
import { PERMISSIONS, PUBLIC_PROJECT_ID } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';
import { useLanguageLinter } from '@/hooks/useCodeMirrorLanguageExtensions';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

const RestoreButton = memo(({ onClick, disabled, title, itemKey, sx }) => (
  <Tooltip
    title={title}
    placement="top"
  >
    <Box
      sx={sx}
      component="span"
    >
      <IconButton
        variant="elitea"
        color="tertiary"
        onClick={onClick}
        disabled={disabled}
        aria-label={`restore-service-prompt-default-${itemKey || ''}`}
      >
        <RestoreOutlinedIcon fontSize="small" />
      </IconButton>
    </Box>
  </Tooltip>
));

RestoreButton.displayName = 'RestoreButton';

const ServicePromptsSection = memo(() => {
  const projectId = useSelectedProjectId();
  const { checkPermission } = useCheckPermission();
  const canEdit = useMemo(() => checkPermission(PERMISSIONS.configuration.update), [checkPermission]);
  const isPublicProject = projectId == PUBLIC_PROJECT_ID;

  const { toastError, toastSuccess } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState(/** @type {'create'|'edit'|null} */ (null));
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [draftKey, setDraftKey] = useState('');
  const [draftPrompt, setDraftPrompt] = useState('');
  const editorRef = useRef(null);

  const { extensions, language, onChangeLanguage } = useLanguageLinter('markdown', editorRef.current?.view);

  const styles = servicePromptsSectionStyles();

  const { data, isLoading, isFetching } = useGetConfigurationsListQuery(
    {
      projectId,
      section: 'service_prompts',
      includeShared: false,
      pageSize: 100,
    },
    { skip: !projectId || !isPublicProject },
  );

  const { data: availableTypes } = useGetAvailableConfigurationsTypeQuery(
    { section: 'service_prompts' },
    { skip: !isPublicProject },
  );

  const [createConfiguration, { isLoading: isCreating }] = useCreateConfigurationMutation();
  const [updateConfiguration, { isLoading: isUpdating }] = useUpdateConfigurationMutation();

  const prompts = useMemo(() => {
    const items = data?.items || [];
    return items
      .filter(item => item?.section === 'service_prompts')
      .slice()
      .sort((a, b) => {
        const aKey = String(a?.data?.key || a?.elitea_title || '').toLowerCase();
        const bKey = String(b?.data?.key || b?.elitea_title || '').toLowerCase();
        return aKey.localeCompare(bKey);
      });
  }, [data?.items]);

  const allowedKeys = useMemo(() => {
    const schema = (availableTypes || []).find(item => item?.type === 'service_prompt')?.config_schema;
    const keys = schema?.properties?.data?.properties?.key?.enum;
    if (Array.isArray(keys) && keys.length) {
      return Array.from(new Set(keys.map(value => String(value).trim().toLowerCase()).filter(Boolean)));
    }

    // Defensive fallback: keep UI usable even if schema isn't available yet.
    return ['mermaid_quick_fix'];
  }, [availableTypes]);

  const defaultPromptsByKey = useMemo(() => {
    const schema = (availableTypes || []).find(item => item?.type === 'service_prompt')?.config_schema;
    const defaults = schema?.properties?.data?.properties?.prompt?.default_by_key;
    if (defaults && typeof defaults === 'object') {
      return defaults;
    }
    return {};
  }, [availableTypes]);

  const usedKeys = useMemo(() => {
    return new Set(
      prompts
        .map(item =>
          String(item?.data?.key || item?.elitea_title || '')
            .trim()
            .toLowerCase(),
        )
        .filter(Boolean),
    );
  }, [prompts]);

  const availableKeys = useMemo(() => {
    return allowedKeys.filter(key => !usedKeys.has(key));
  }, [allowedKeys, usedKeys]);

  const isBusy = isLoading || isFetching || isCreating || isUpdating;

  const hasChanges = useMemo(() => {
    if (mode === 'create') {
      return draftPrompt.trim().length > 0;
    }

    if (mode === 'edit' && selectedConfig) {
      const originalKey = String(selectedConfig?.data?.key || selectedConfig?.elitea_title || '');
      const originalPrompt = String(selectedConfig?.data?.prompt || '');

      return draftKey !== originalKey || draftPrompt !== originalPrompt;
    }

    return false;
  }, [mode, draftKey, draftPrompt, selectedConfig]);

  const buildPreview = useCallback(promptText => {
    if (!promptText) return 'Not configured';

    const lines = String(promptText)
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

    if (!lines.length) return 'Not configured';

    const previewText = lines.slice(0, 2).join(' ');
    return previewText.length > 140 ? `${previewText.slice(0, 140)}…` : previewText;
  }, []);

  const deriveLabelFromKey = useCallback(key => {
    const safe = String(key || '').trim();
    if (!safe) return 'Service prompt';
    return safe
      .split(/[_-]+/)
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }, []);

  const getDefaultPrompt = useCallback(
    key => {
      if (!key) return null;
      const keyStr = String(key);
      const trimmedKey = keyStr.trim();
      const normalizedKey = trimmedKey.toLowerCase();
      return (
        defaultPromptsByKey?.[normalizedKey] ||
        defaultPromptsByKey?.[trimmedKey] ||
        defaultPromptsByKey?.[keyStr] ||
        defaultPromptsByKey?.[keyStr.toLowerCase()] ||
        null
      );
    },
    [defaultPromptsByKey],
  );

  const hasDefaultPrompt = useCallback(key => Boolean(getDefaultPrompt(key)), [getDefaultPrompt]);

  const handleOpenCreate = useCallback(() => {
    if (!canEdit || !isPublicProject) return;
    setMode('create');
    setSelectedConfig(null);
    setDraftKey(availableKeys[0] || '');
    setDraftPrompt('');
    setIsOpen(true);
  }, [availableKeys, canEdit, isPublicProject]);

  const handleOpenEdit = useCallback(config => {
    setMode('edit');
    setSelectedConfig(config);
    setDraftKey(String(config?.data?.key || config?.elitea_title || ''));
    setDraftPrompt(String(config?.data?.prompt || ''));
    setIsOpen(true);
  }, []);

  const handleDiscard = useCallback(() => {
    setIsOpen(false);
    setMode(null);
    setSelectedConfig(null);
    setDraftKey('');
    setDraftPrompt('');
  }, []);

  const validateKey = useCallback(
    (key, { disallowUsed = false } = {}) => {
      const normalized = String(key || '').trim();
      if (!normalized) return { ok: false, message: 'Key cannot be empty' };
      if (normalized.length > 128) return { ok: false, message: 'Key must not exceed 128 characters' };
      if (!/^[a-zA-Z0-9_-]+$/.test(normalized)) {
        return { ok: false, message: 'Key must contain only letters, numbers, underscores, or dashes' };
      }

      const lowered = normalized.toLowerCase();
      if (allowedKeys.length && !allowedKeys.includes(lowered)) {
        return { ok: false, message: 'Key must be selected from the predefined list' };
      }

      if (disallowUsed && usedKeys.has(lowered)) {
        return { ok: false, message: 'This key is already configured' };
      }

      return { ok: true, key: lowered };
    },
    [allowedKeys, usedKeys],
  );

  const handleSave = useCallback(async () => {
    if (!canEdit) return;

    const promptText = String(draftPrompt || '').trim();
    if (!promptText) {
      toastError('Prompt cannot be empty');
      return;
    }

    const keyValidation = validateKey(draftKey);
    if (!keyValidation.ok) {
      toastError(keyValidation.message);
      return;
    }

    const key = keyValidation.key;

    try {
      if (mode === 'edit' && selectedConfig?.id) {
        await updateConfiguration({
          projectId,
          configId: selectedConfig.id,
          body: {
            label: selectedConfig?.label || deriveLabelFromKey(key),
            shared: true,
            data: {
              key,
              prompt: promptText,
            },
          },
        }).unwrap();
      } else {
        const createKeyValidation = validateKey(draftKey, { disallowUsed: true });
        if (!createKeyValidation.ok) {
          toastError(createKeyValidation.message);
          return;
        }

        const createKey = createKeyValidation.key;
        await createConfiguration({
          projectId,
          body: {
            elitea_title: createKey,
            label: deriveLabelFromKey(createKey),
            type: 'service_prompt',
            shared: true,
            data: {
              key: createKey,
              prompt: promptText,
            },
          },
        }).unwrap();
      }

      toastSuccess('Service prompt saved');
      handleDiscard();
    } catch (e) {
      toastError(e?.data?.error || e?.data?.message || e?.message || 'Failed to save prompt');
    }
  }, [
    canEdit,
    createConfiguration,
    deriveLabelFromKey,
    draftKey,
    draftPrompt,
    handleDiscard,
    mode,
    projectId,
    selectedConfig?.id,
    selectedConfig?.label,
    toastError,
    toastSuccess,
    updateConfiguration,
    validateKey,
  ]);

  const handleRestoreToDefault = useCallback(
    async (config, { updateDraft = false } = {}) => {
      if (!canEdit || !config?.id) return;

      const rawKey = String(config?.data?.key || config?.elitea_title || '').trim();
      const normalizedKey = rawKey.toLowerCase();
      const defaultPrompt = getDefaultPrompt(rawKey);

      if (!defaultPrompt) {
        toastError('No default prompt is available for this key');
        return;
      }

      try {
        await updateConfiguration({
          projectId,
          configId: config.id,
          body: {
            label: config?.label || deriveLabelFromKey(rawKey),
            shared: true,
            data: {
              key: normalizedKey,
              prompt: defaultPrompt,
            },
          },
        }).unwrap();

        if (updateDraft) {
          setDraftPrompt(defaultPrompt);
        }

        toastSuccess('Service prompt restored to default');
      } catch (e) {
        toastError(e?.data?.error || e?.data?.message || e?.message || 'Failed to restore prompt');
      }
    },
    [canEdit, deriveLabelFromKey, getDefaultPrompt, projectId, toastError, toastSuccess, updateConfiguration],
  );

  const handleRestoreInModal = useCallback(
    () => handleRestoreToDefault(selectedConfig, { updateDraft: true }),
    [handleRestoreToDefault, selectedConfig],
  );

  if (!isPublicProject) return null;

  const hasAvailableKeys = availableKeys.length > 0;
  let createTooltipTitle = 'Create service prompt';
  if (!hasAvailableKeys) {
    createTooltipTitle = 'All service prompt keys are already configured';
  }

  return (
    <>
      <DrawerPageHeader
        title="Service Prompts"
        showAddButton
        onBack
        slotProps={{
          addButton: {
            onAdd: handleOpenCreate,
            disabled: !canEdit || !hasAvailableKeys || isBusy,
            tooltip: createTooltipTitle,
          },
        }}
      />
      <Box sx={styles.wrapper}>
        <Box sx={styles.cards}>
          {prompts.map(item => {
            const key = String(item?.data?.key || item?.elitea_title || '');
            const label = item?.label || deriveLabelFromKey(key);
            const preview = buildPreview(item?.data?.prompt);

            const isEditable = canEdit;
            const hasDefault = hasDefaultPrompt(key);

            return (
              <Box
                key={item?.id || key}
                sx={styles.card}
              >
                <Box sx={styles.cardContent}>
                  <Box sx={styles.cardText}>
                    <Typography
                      variant="bodyMedium"
                      color="text.secondary"
                      sx={styles.cardHeading}
                    >
                      {label}
                    </Typography>
                    <Typography
                      variant="bodySmall"
                      color="text.secondary"
                      sx={styles.cardSubheading}
                    >
                      {key}
                    </Typography>
                    <Typography
                      variant="bodySmall"
                      color="text.default"
                      sx={styles.cardPreview}
                    >
                      {preview}
                    </Typography>
                  </Box>

                  <Box sx={styles.cardActions}>
                    <Tooltip
                      title="Edit"
                      placement="top"
                    >
                      <Box component="span">
                        <IconButton
                          variant="elitea"
                          color="tertiary"
                          onClick={() => handleOpenEdit(item)}
                          disabled={!isEditable || isBusy}
                          aria-label={`edit-service-prompt-${key}`}
                          sx={styles.editButton}
                        >
                          <EditIcon sx={styles.editIcon} />
                        </IconButton>
                      </Box>
                    </Tooltip>
                    <RestoreButton
                      title={hasDefault ? 'Restore to default' : 'No default available'}
                      onClick={() => handleRestoreToDefault(item)}
                      disabled={!canEdit || !hasDefault || isBusy}
                      itemIndex={key}
                    />
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>

        {isOpen && (
          <Modal.StyledInputModalBase
            open={isOpen}
            onClose={handleDiscard}
            title={
              mode === 'create'
                ? 'New Service Prompt'
                : selectedConfig?.label || draftKey || 'Edit Service Prompt'
            }
            value={draftPrompt}
            specifiedLanguage="markdown"
            language={language}
            onLanguageChange={onChangeLanguage}
            customButtons={
              <RestoreButton
                title={hasDefaultPrompt(draftKey) ? 'Restore to default' : 'No default available'}
                onClick={handleRestoreInModal}
                disabled={!canEdit || !hasDefaultPrompt(draftKey) || isBusy}
                sx={styles.restoreButton}
                itemKey={draftKey}
              />
            }
          >
            <Box sx={styles.modalBody}>
              <Box sx={styles.keyRow}>
                <TextField
                  select
                  label="Key"
                  size="small"
                  value={draftKey}
                  onChange={event => setDraftKey(event.target.value)}
                  disabled={mode !== 'create'}
                  helperText={mode === 'create' ? 'Select a predefined key' : 'Key is immutable'}
                  fullWidth
                >
                  {allowedKeys.map(key => (
                    <MenuItem
                      key={key}
                      value={key}
                      disabled={mode === 'create' && usedKeys.has(key)}
                    >
                      {key}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              <Box sx={styles.editorContainer}>
                <Box sx={styles.editorWrapper}>
                  <Field.CodeMirrorEditor
                    ref={editorRef}
                    readOnly={!canEdit}
                    value={draftPrompt}
                    notifyChange={setDraftPrompt}
                    variant="bodyMedium"
                    extensions={extensions}
                    height="100%"
                    minHeight="100%"
                  />
                </Box>
              </Box>

              <Box sx={styles.modalFooter}>
                <Button
                  variant="elitea"
                  color="secondary"
                  onClick={handleDiscard}
                  disabled={isBusy}
                >
                  Discard
                </Button>
                <Button
                  variant="elitea"
                  color="primary"
                  onClick={handleSave}
                  disabled={isBusy || !canEdit || !hasChanges}
                >
                  Save
                </Button>
              </Box>
            </Box>
          </Modal.StyledInputModalBase>
        )}
      </Box>
    </>
  );
});

ServicePromptsSection.displayName = 'ServicePromptsSection';

/** @type {MuiSx} */
const servicePromptsSectionStyles = () => ({
  wrapper: ({ spacing }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: spacing(1),
    padding: '0rem 1.5rem',
    width: '100%',
  }),
  header: ({ spacing }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing(2),
  }),
  title: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 600,
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
  }),
  addButton: ({ palette }) => ({
    minWidth: '1.75rem',
    width: '1.75rem',
    height: '1.75rem',
    padding: '0.5rem',
    '& svg': {
      width: '1rem',
      height: '1rem',
      fill: palette.icon?.fill?.send || palette.text.primary,
    },
  }),
  cards: ({ spacing }) => ({
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(1.5),
  }),
  card: ({ palette, breakpoints }) => ({
    border: `0.0625rem solid ${palette.border.table}`,
    backgroundColor: palette.background.secondary,
    borderRadius: '0.75rem',
    flex: '0 0 calc((100% - 1.5rem) / 3)',
    maxWidth: 'calc((100% - 1.5rem) / 3)',
    [breakpoints.down('lg')]: {
      flex: '0 0 calc((100% - 1.5rem) / 2)',
      maxWidth: 'calc((100% - 1.5rem) / 2)',
    },
    [breakpoints.down('tablet')]: {
      flex: '0 0 100%',
      maxWidth: '100%',
    },
  }),
  cardContent: ({ spacing }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing(2),
    padding: spacing(2),
    minWidth: 0,
  }),
  cardText: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    flex: 1,
  },
  cardHeading: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontWeight: 500,
  },
  cardSubheading: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    opacity: 0.7,
  },
  cardPreview: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    opacity: 0.8,
  },
  cardActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    flexShrink: 0,
  },
  deleteButton: {
    '& svg': {
      fontSize: '1rem',
    },
  },
  modalBody: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: 0,
  },
  keyRow: ({ spacing }) => ({
    padding: spacing(2),
  }),
  editorContainer: ({ palette }) => ({
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    display: 'flex',
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
  }),
  editorWrapper: ({ palette }) => ({
    flex: 1,
    minHeight: 0,
    height: '100%',
    position: 'relative',
    '& .cm-editor': { backgroundColor: palette.background.default },
    '& .cm-scroller': { backgroundColor: palette.background.default },
    '& .cm-gutters': {
      backgroundColor: palette.background.tabPanel,
      borderRight: 'none',
    },
  }),
  modalFooter: ({ spacing }) => ({
    display: 'flex',
    justifyContent: 'flex-end',
    gap: spacing(1.5),
    padding: spacing(2),
  }),
  editButton: ({ palette }) => ({
    '& svg': {
      fill: palette.icon?.fill?.send || palette.text.primary,
    },
  }),
  editIcon: {
    fontSize: '1rem',
  },
  restoreButton: ({ spacing }) => ({
    marginLeft: spacing(2),
  }),
});

export default ServicePromptsSection;
