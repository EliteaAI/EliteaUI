import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import {
  Autocomplete,
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import { useAgentsWithSkillQuery, useAttachPublicSkillMutation } from '@/[fsd]/features/skill-hub/api';
import { Banner } from '@/[fsd]/shared/ui';
import BaseBtn, { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { useLazyApplicationListQuery } from '@/api/applications';
import { ChatParticipantType, ViewMode } from '@/common/constants';
import EntityIcon from '@/components/EntityIcon';
import ArrowDownMuiSvgIcon from '@/components/Icons/ArrowDownMuiSvgIcon';
import CheckIcon from '@/components/Icons/CheckIcon';
import CloseIcon from '@/components/Icons/CloseIcon';
import RemoveIcon from '@/components/Icons/RemoveIcon';
import useDebounceValue from '@/hooks/useDebounceValue';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';
import RouteDefinitions from '@/routes';
import { actions as chatActions } from '@/slices/chat';

const AGENTS_SEARCH_LIMIT = 50;
const ADD_TEST_DISABLED_TOOLTIP = 'Select one agent to be able to test the skill in chat.';

// The agent's default version is the attach target; the list row carries it on meta.
const getAgentVersionId = agent => agent?.meta?.default_version_id ?? agent?.version_details?.id;

const agentWord = count => (count === 1 ? 'agent' : 'agents');

const AttachToAgentDialog = memo(props => {
  const { open, onClose, skill, versionId } = props;

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const projectId = useSelectedProjectId();
  const { toastSuccess, toastError, toastWarning, toastInfo } = useToast();

  const styles = attachToAgentDialogStyles();

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounceValue(query, 300);
  const [selectedAgents, setSelectedAgents] = useState([]);

  const [fetchAgents, { data: agentsData, isFetching }] = useLazyApplicationListQuery();
  const [attachPublicSkill, { isLoading: isAttaching }] = useAttachPublicSkillMutation();

  // Agent versions in this project that already carry the skill. The mutation
  // invalidates this query's tag, so it re-marks freshly attached agents.
  const { data: agentsWithSkill } = useAgentsWithSkillQuery(
    { projectId, publicSkillId: skill?.id },
    { skip: !open || !projectId || !skill?.id },
  );

  const attachedVersionIds = useMemo(
    () => new Set((agentsWithSkill?.rows || []).map(row => row.entity_version_id)),
    [agentsWithSkill],
  );

  const isAlreadyAttached = useCallback(
    agent => attachedVersionIds.has(getAgentVersionId(agent)),
    [attachedVersionIds],
  );

  const agentOptions = useMemo(() => agentsData?.rows || [], [agentsData]);

  useEffect(() => {
    if (!open || !projectId) return;
    fetchAgents({
      projectId,
      page: 0,
      pageSize: AGENTS_SEARCH_LIMIT,
      params: {
        query: debouncedQuery,
        agents_type: 'classic',
      },
    });
  }, [open, projectId, debouncedQuery, fetchAgents]);

  // Reset local state whenever the dialog is (re)opened.
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedAgents([]);
    }
  }, [open]);

  const canAdd = selectedAgents.length >= 1;
  const canAddAndTest = selectedAgents.length === 1;

  const buildAttachArgs = useCallback(
    agents => ({
      projectId,
      publicSkillId: skill?.id,
      publicVersionId: versionId,
      agentVersionIds: agents.map(getAgentVersionId).filter(Boolean),
    }),
    [projectId, skill?.id, versionId],
  );

  const notifyResult = useCallback(
    (agents, results) => {
      // The backend returns one result per version id actually sent, so this
      // excludes any agent dropped by buildAttachArgs (missing version id).
      const attemptedCount = results.length;
      const byVersionId = new Map(agents.map(a => [getAgentVersionId(a), a]));
      const okResults = results.filter(r => r.ok);
      // 409 means the agent already has the skill — a no-op, not a failure.
      const alreadyResults = results.filter(r => !r.ok && r.http_status === 409);
      const failedResults = results.filter(r => !r.ok && r.http_status !== 409);

      const bulletList = list =>
        list
          .map(r => byVersionId.get(r.agent_version_id)?.name)
          .filter(Boolean)
          .map(name => `• ${name}`)
          .join('\n');

      // No real failures: everything either attached or was already present.
      if (failedResults.length === 0) {
        if (alreadyResults.length === 0) {
          toastSuccess(
            `The skill was successfully added to ${okResults.length} ${agentWord(okResults.length)}.`,
          );
        } else if (okResults.length === 0) {
          toastInfo(
            alreadyResults.length === 1
              ? 'The skill is already added to this agent.'
              : 'The skill is already added to all selected agents.',
          );
        } else {
          toastSuccess(
            `The skill was added to ${okResults.length} ${agentWord(okResults.length)}. ${alreadyResults.length} already had it.`,
          );
        }
        return true;
      }

      // Some genuine failures — nothing usable got through.
      if (okResults.length === 0 && alreadyResults.length === 0) {
        toastError(`The skill was not added to ${attemptedCount} ${agentWord(attemptedCount)}.`);
        return false;
      }

      toastWarning(
        `The skill was added only to ${okResults.length} of ${attemptedCount} ${agentWord(attemptedCount)}.\nFailed to add to:\n${bulletList(failedResults)}`,
      );
      return false;
    },
    [toastSuccess, toastError, toastWarning, toastInfo],
  );

  const handleAdd = useCallback(async () => {
    if (!canAdd || isAttaching) return;
    try {
      const response = await attachPublicSkill(buildAttachArgs(selectedAgents)).unwrap();
      const allOk = notifyResult(selectedAgents, response?.results || []);
      if (allOk) onClose?.();
    } catch {
      toastError(`The skill was not added to ${selectedAgents.length} ${agentWord(selectedAgents.length)}.`);
    }
  }, [
    canAdd,
    isAttaching,
    attachPublicSkill,
    buildAttachArgs,
    selectedAgents,
    notifyResult,
    onClose,
    toastError,
  ]);

  const navigateToChatWithAgent = useCallback(
    agent => {
      dispatch(
        chatActions.setSelectedAgentInfo({
          agent: {
            participantType: ChatParticipantType.Applications,
            ...agent,
            project_id: projectId,
            entity_name: ChatParticipantType.Applications,
            entity_meta: { id: agent.id, project_id: projectId },
          },
          starter: '',
        }),
      );
      setTimeout(() => {
        navigate(
          { pathname: RouteDefinitions.Chat, search: 'create=1' },
          {
            replace: false,
            state: {
              routeStack: [{ breadCrumb: 'Chat', viewMode: ViewMode.Owner, pagePath: RouteDefinitions.Chat }],
            },
          },
        );
      }, 0);
    },
    [dispatch, projectId, navigate],
  );

  const handleAddAndTest = useCallback(async () => {
    if (!canAddAndTest || isAttaching) return;
    const [agent] = selectedAgents;
    try {
      const response = await attachPublicSkill(buildAttachArgs(selectedAgents)).unwrap();
      const allOk = notifyResult(selectedAgents, response?.results || []);
      if (allOk) {
        onClose?.();
        navigateToChatWithAgent(agent);
      }
    } catch {
      toastError(`The skill was not added to ${selectedAgents.length} ${agentWord(selectedAgents.length)}.`);
    }
  }, [
    canAddAndTest,
    isAttaching,
    selectedAgents,
    attachPublicSkill,
    buildAttachArgs,
    notifyResult,
    onClose,
    navigateToChatWithAgent,
    toastError,
  ]);

  const handleSelectionChange = useCallback((event, value) => {
    setSelectedAgents(value);
  }, []);

  const handleInputChange = useCallback((event, value, reason) => {
    if (reason === 'input') setQuery(value);
  }, []);

  const renderOption = useCallback(
    (optionProps, option, { selected }) => {
      const alreadyAttached = isAlreadyAttached(option);
      return (
        <Box
          component="li"
          {...optionProps}
          key={option.id}
          sx={styles.option}
        >
          <EntityIcon
            icon={option.icon_meta}
            entityType={ChatParticipantType.Applications}
            projectId={projectId}
            editable={false}
          />
          <Typography
            variant="bodyMedium"
            sx={styles.optionLabel}
          >
            {option.name}
          </Typography>
          {alreadyAttached ? (
            <Typography
              variant="bodySmall"
              sx={styles.alreadyAddedLabel}
            >
              Already added
            </Typography>
          ) : (
            selected && <CheckIcon sx={styles.checkIcon} />
          )}
        </Box>
      );
    },
    [projectId, styles, isAlreadyAttached],
  );

  const renderTags = useCallback(
    (value, getTagProps) =>
      value.map((option, index) => (
        <Chip
          {...getTagProps({ index })}
          key={option.id}
          label={option.name}
          icon={
            <EntityIcon
              icon={option.icon_meta}
              entityType={ChatParticipantType.Applications}
              projectId={projectId}
              editable={false}
              specifiedFontSize="0.875rem"
              sx={styles.chipAvatar}
              imageStyle={styles.chipAvatarImage}
            />
          }
          deleteIcon={<RemoveIcon />}
          sx={styles.chip}
        />
      )),
    [projectId, styles],
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="attach-skill-dialog-title"
      sx={styles.dialog}
    >
      <DialogTitle sx={styles.dialogTitle}>
        <Typography variant="headingMedium">Add a skill to your agent(s)</Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={styles.closeButton}
        >
          <CloseIcon sx={{ fontSize: '1rem' }} />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={styles.dialogContent}>
        <Typography
          variant="bodyMedium"
          sx={styles.subtitle}
        >
          Select an agent you want to add this skill to. You can select one or more agents.
        </Typography>
        <Banner.BannerMessage
          variant="info"
          message="You can test a skill in Chat only if it is added to one agent."
        />
        <Autocomplete
          multiple
          disableClearable
          disableCloseOnSelect
          popupIcon={<ArrowDownMuiSvgIcon />}
          options={agentOptions}
          value={selectedAgents}
          loading={isFetching}
          filterOptions={x => x}
          getOptionLabel={option => option.name || ''}
          getOptionDisabled={isAlreadyAttached}
          isOptionEqualToValue={(option, val) => option.id === val.id}
          onChange={handleSelectionChange}
          onInputChange={handleInputChange}
          renderOption={renderOption}
          renderTags={renderTags}
          sx={styles.autocomplete}
          renderInput={params => (
            <TextField
              {...params}
              variant="standard"
              label="Agents"
              placeholder={selectedAgents.length ? '' : 'Search for agents'}
            />
          )}
        />
      </DialogContent>
      <DialogActions sx={styles.dialogActions}>
        <BaseBtn
          variant={BUTTON_VARIANTS.elitea}
          color={BUTTON_COLORS.secondary}
          onClick={onClose}
        >
          Cancel
        </BaseBtn>
        <Box sx={styles.actionGroup}>
          <Tooltip
            title={canAddAndTest ? '' : ADD_TEST_DISABLED_TOOLTIP}
            placement="top"
          >
            <Box component="span">
              <BaseBtn
                variant={BUTTON_VARIANTS.elitea}
                color={BUTTON_COLORS.secondary}
                disabled={!canAddAndTest || isAttaching}
                onClick={handleAddAndTest}
              >
                Add &amp; Test
              </BaseBtn>
            </Box>
          </Tooltip>
          <BaseBtn
            variant={BUTTON_VARIANTS.elitea}
            color={BUTTON_COLORS.primary}
            disabled={!canAdd || isAttaching}
            onClick={handleAdd}
          >
            Add
          </BaseBtn>
        </Box>
      </DialogActions>
    </Dialog>
  );
});

AttachToAgentDialog.displayName = 'AttachToAgentDialog';

/** @type {MuiSx} */
const attachToAgentDialogStyles = () => ({
  dialog: {
    '& .MuiDialog-paper': ({ palette }) => ({
      width: '37.5rem',
      maxWidth: '37.5rem',
      borderRadius: '1rem',
      backgroundColor: palette.background.tabPanel,
      backgroundImage: 'none',
      border: `.0625rem solid ${palette.border.lines}`,
      boxShadow: '0 0 1.475rem 0 rgba(255, 255, 255, 0.05)',
    }),
  },
  dialogTitle: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '3.75rem',
    padding: '0 1.5rem',
    backgroundColor: palette.background.tabPanel,
  }),
  closeButton: ({ palette }) => ({
    padding: 0,
    margin: 0,
    color: palette.icon.fill.default,
    '&:hover': { backgroundColor: 'transparent' },
  }),
  dialogContent: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    padding: '1.5rem !important',
    borderTop: `.0625rem solid ${palette.border.lines}`,
    borderBottom: `.0625rem solid ${palette.border.lines}`,
    background: palette.background.secondary,
  }),
  subtitle: ({ palette }) => ({
    color: palette.text.default,
  }),
  autocomplete: ({ palette }) => ({
    marginTop: '0.5rem',
    '& .MuiInputLabel-root': {
      color: palette.text.secondary,
      '&.Mui-focused': { color: palette.primary.main },
    },
    '& .MuiInput-underline:before': {
      borderBottomColor: palette.border.lines,
    },
    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
      borderBottomColor: palette.border.lines,
    },
    '& .MuiInput-underline:after': {
      borderBottomColor: palette.primary.main,
    },
    '& .MuiAutocomplete-inputRoot': {
      columnGap: '0.375rem',
      rowGap: '0.5rem',
      paddingLeft: '0.5rem',
      paddingTop: '0.5rem !important',
      paddingBottom: '0.5rem !important',
    },
    '& .MuiAutocomplete-input': {
      height: '1.75rem',
      padding: '0 !important',
      margin: '0 !important',
      alignSelf: 'center',
    },
    '& .MuiAutocomplete-inputRoot .MuiAutocomplete-tag': {
      margin: 0,
    },
    '& .MuiAutocomplete-popupIndicator': {
      '& svg': { fontSize: '1rem' },
      '&:hover': { backgroundColor: 'transparent' },
    },
  }),
  chip: ({ palette, typography }) => ({
    height: '1.75rem',
    borderRadius: '1rem',
    margin: 0,
    paddingLeft: '0.5rem',
    backgroundColor: palette.background.notificationList,
    '& .MuiChip-label': {
      ...typography.labelSmall,
      color: palette.text.secondary,
      paddingLeft: '0.5rem',
      paddingRight: '0.5rem',
    },
    '& .MuiChip-deleteIcon': {
      width: '1.125rem',
      height: '1.125rem',
      marginLeft: 0,
      marginRight: '0.5rem',
      '& path': { fill: palette.icon.fill.default },
      '&:hover path': { fill: palette.text.secondary },
    },
  }),
  chipAvatar: {
    minWidth: '1.25rem',
    width: '1.25rem',
    height: '1.25rem',
    marginRight: '0.375rem',
  },
  chipAvatarImage: {
    width: '1.25rem',
    height: '1.25rem',
  },
  option: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  optionLabel: ({ palette }) => ({
    flex: 1,
    color: palette.text.secondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  checkIcon: ({ palette }) => ({
    fontSize: '1rem',
    color: palette.icon.fill.default,
  }),
  alreadyAddedLabel: ({ palette }) => ({
    color: palette.text.disabled,
    whiteSpace: 'nowrap',
  }),
  dialogActions: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 1.5rem',
    backgroundColor: palette.background.tabPanel,
  }),
  actionGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
});

export default AttachToAgentDialog;
