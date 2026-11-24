// Piece 3 of the chat concept: «who answers» — one button under the field and its list, the new place of the right
// Participants panel. Reference: tag chat-prototype-approved-2026-11-18, default view (approved.html › composerHTML
// `#modelBtn` / `#ansSwitch`, chatWithHTML, kindGroupsHTML, agentRowHTML, dPartsTools, tsubHTML, gearHTML,
// agentGearHTML, pulseWho). It replaces three things under the field on dev: the model selector (LLMModelSelector), the
// agent / pipeline panel (AgentEditorPanel) and the skill panel (SkillChatPanel).
// The button (a team tertiary button, as ConceptModelButton of piece 1):
// - the model answers: the model's icon and name, «Switch to model»; an agent, a pipeline or a skill answers: its icon,
//   name and «· <version>» when it is not latest, «Switch agent / pipeline / skill»; no × on it (owner 2026-11-17: one
//   is removed only inside the list);
// - an orange dot when anything in the chat needs attention (the same status the panel's rows read,
//   ParticipantDetailsContext › hasParticipantError), also while the list is closed;
// - it flashes once after an agent, pipeline or skill is picked in «+» (pulseKey; approved.html › whopulse).
// The list (24rem, over the button, one scroll):
// - only the model in the chat → «Model» and the models themselves (Auto first, as LLMModelsMenu), ⚙ on the current;
// - otherwise → «Model» and one row of the current model (⚙ and a chevron; framed while the model answers); a click
//   opens the team's LLMModelsMenu beside it; then the team's sections Agents, Pipelines, Skills (ParticipantSection,
//   rows ParticipantItem as in the panel, but no Catalog tag (owner 2026-11-24): version, Edit and Remove under the
//   pointer, a click makes one answer,
//   a second click gives the answer back to the model); then «Toolkits & MCP · N» with a dot when some need setup —
//   a click opens their rows beside it. No people: they stay as on dev (owner 2026-11-23, Katya's task #7489);
// - a row's ⚙ (ConceptParticipantActions) opens «<name> · version» with the versions and «Variables» next to it;
//   a misconfigured row has «Fix» instead of the link «Check the <kind>» (swaps in .storybook/main.js).
// Picking a model: selectSavedOrDefaultModel (clears the one who answers, as SwitchToModelButton on dev), then
// onSelectModel. The host passes onEditParticipant (as NewChat.jsx › onEditParticipant) and, in the product,
// onChangeParticipantSettings for the version and variables of one who does not answer now — ChatBox has it and does not
// pass it to the field yet; the stories keep those changes in the list.
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Box, Divider, Fade, IconButton, MenuItem, Popover, Tooltip, Typography } from '@mui/material';

import { LATEST_VERSION_NAME } from '@/[fsd]/entities/version';
import { ParticipantConstants } from '@/[fsd]/features/chat/participants/lib/constants';
import {
  ParticipantDetailsProvider,
  useParticipantDetailsContext,
} from '@/[fsd]/features/chat/participants/lib/context/ParticipantDetailsContext';
import { getChatParticipantUniqueId } from '@/[fsd]/features/chat/participants/lib/helpers';
import { useParticipantEntityIcon } from '@/[fsd]/features/chat/participants/lib/hooks';
import ParticipantItem from '@/[fsd]/features/chat/participants/ui/expanded-participants/ParticipantItem';
import ParticipantSection from '@/[fsd]/features/chat/participants/ui/expanded-participants/ParticipantSection';
import { CHAT_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours';
import { AUTO_MODEL_ID } from '@/[fsd]/shared/lib/constants/autoRouting.constants';
import { isRemoteMcpToolkitType } from '@/[fsd]/shared/lib/helpers';
import { useIsMcpVisible } from '@/[fsd]/shared/lib/hooks';
import { Button } from '@/[fsd]/shared/ui';
import { EntityIcon } from '@/[fsd]/shared/ui/icon';
import { compareModels } from '@/[fsd]/widgets/llm-model-selector/lib';
import { normalizeLlmSettings } from '@/[fsd]/widgets/llm-model-selector/lib/helpers';
import LLMModelsMenu from '@/[fsd]/widgets/llm-model-selector/ui/LLMModelsMenu';
import CheckedIcon from '@/assets/checked-icon.svg?react';
import ShareIcon from '@/assets/share-icon.svg?react';
import ToolIcon from '@/assets/tool-icon.svg?react';
import { ChatParticipantType } from '@/common/constants';
import ArrowDownIcon from '@/components/Icons/ArrowDownIcon';
import ArrowRightIcon from '@/components/Icons/ArrowRightIcon';
import BriefcaseIcon from '@/components/Icons/BriefcaseIcon.jsx';
import SettingIcon from '@/components/Icons/SettingIcon';
import VariableDialog from '@/components/VariableDialog.jsx';
import useNavBlocker from '@/hooks/useNavBlocker';

import ConceptModelRow from './ConceptModelRow';
import ConceptModelSettingsDialog from './ConceptModelSettingsDialog';
import { WhoAnswersProvider } from './whoAnswersContext';

const isPipeline = p =>
  p.entity_name === ChatParticipantType.Pipelines ||
  (p.entity_name === ChatParticipantType.Applications && p.entity_settings?.agent_type === 'pipeline');
const isMcp = p => p.meta?.mcp === true || isRemoteMcpToolkitType(p.entity_settings?.toolkit_type);

// the kinds that answer, in the order of «+» and of the panel on dev (ExpandedParticipantsList › ENTITY_SECTIONS)
const SECTIONS = [
  {
    key: 'agents',
    entityType: 'Agent',
    test: p => p.entity_name === ChatParticipantType.Applications && !isPipeline(p),
  },
  { key: 'pipelines', entityType: 'Pipeline', test: isPipeline },
  { key: 'skills', entityType: 'Skill', test: p => p.entity_name === ChatParticipantType.Skills },
];

// dev SkillChatPanel › UNAVAILABLE_MESSAGES: on the button, when the skill that answers is gone (dev-check IN-169)
const UNAVAILABLE_MESSAGES = {
  [ParticipantConstants.SkillUnavailableReason.Skill]:
    'This skill is no longer available. Switch to a model or remove it from the chat.',
  [ParticipantConstants.SkillUnavailableReason.Version]:
    'This skill version is no longer available. Select another version or switch to a model.',
};

const kindOf = p =>
  isPipeline(p) ? 'pipeline' : p.entity_name === ChatParticipantType.Skills ? 'skill' : 'agent';

// A list beside the main one, on its left: placed by the main list's left edge minus the list's own width. Layout
// offsets, not getBoundingClientRect: the main list grows in (scale from its bottom right), and a row clicked during
// that animation measured ~80 px to the right of where the list ends up
const SIDE_WIDTH = 352;
const SETTINGS_WIDTH = 256;
const besideLeft = (anchor, width, edge) => {
  if (!anchor) return undefined;
  const paper = anchor.closest('.MuiPopover-paper');
  if (!paper) {
    const rect = anchor.getBoundingClientRect();
    return { top: edge === 'bottom' ? rect.bottom : rect.top, left: Math.max(8, rect.left - width - 4) };
  }
  let top = 0;
  for (let el = anchor; el && el !== paper; el = el.offsetParent) top += el.offsetTop;
  top += paper.offsetTop - paper.scrollTop + (edge === 'bottom' ? anchor.offsetHeight : 0);
  return { top, left: Math.max(8, paper.offsetLeft - width - 4) };
};

const sortModels = models => {
  const auto = models.find(m => m.id === AUTO_MODEL_ID);
  const rest = models.filter(m => m.id !== AUTO_MODEL_ID).sort(compareModels);
  return auto ? [auto, ...rest] : rest;
};

const ConceptWhoAnswers = memo(props => {
  const { participants = [] } = props;
  return (
    <ParticipantDetailsProvider participants={participants}>
      <WhoAnswers {...props} />
    </ParticipantDetailsProvider>
  );
});

ConceptWhoAnswers.displayName = 'ConceptWhoAnswers';

const WhoAnswers = memo(props => {
  const {
    conversationId,
    participants = [],
    activeParticipant,
    activeParticipantDetails,
    selectedVersionId,
    onSelectVersion,
    variables = [],
    onChangeVariables,
    modelList = [],
    selectedModel,
    onSelectModel,
    selectSavedOrDefaultModel,
    onSelectParticipant,
    onDeleteParticipant,
    onEditParticipant,
    llmSettings,
    onSetLLMSettings,
    showWebhookSecret = false,
    showStepsLimit = false,
    internal_tools = [],
    onInternalToolsConfigChange,
    disabled = false,
    pulseKey = 0,
    // as dev's VersionSelector: a version change with an editor open asks first when the editor has changes
    isEditorDirty,
    onShowVersionChangeAlert,
    onCloseAgentEditor,
    onClosePipelineEditor,
    onCloseSkillEditor,
    activeSkillUnavailableReason,
  } = props;

  const styles = whoAnswersStyles();
  const isMcpVisible = useIsMcpVisible();
  const { getDetails, hasParticipantError } = useParticipantDetailsContext();

  const buttonRef = useRef(null);
  const [listAnchor, setListAnchor] = useState(null);
  const [modelsAnchor, setModelsAnchor] = useState(null);
  const [toolsAnchor, setToolsAnchor] = useState(null);
  const [settingsOf, setSettingsOf] = useState(null); // { participant, anchor }
  const [variablesOf, setVariablesOf] = useState(null); // participant
  const [showModelSettings, setShowModelSettings] = useState(false);
  // the version and variables of one who does not answer now (in the product: onChangeParticipantSettings)
  const [localSettings, setLocalSettings] = useState({});

  const closeAll = useCallback(() => {
    setListAnchor(null);
    setModelsAnchor(null);
    setToolsAnchor(null);
    setSettingsOf(null);
  }, []);

  // the list is closed whenever another chat opens
  useEffect(() => closeAll(), [conversationId, closeAll]);

  const others = useMemo(
    () => participants.filter(p => p.entity_name !== ChatParticipantType.Users && p.entity_meta?.id),
    [participants],
  );
  const sections = useMemo(
    () => SECTIONS.map(s => ({ ...s, rows: others.filter(s.test) })).filter(s => s.rows.length),
    [others],
  );
  const tools = useMemo(() => {
    const all = others.filter(p => p.entity_name === ChatParticipantType.Toolkits);
    // toolkits first, then MCPs (one list, owner 2026-11-17)
    return [...all.filter(p => !isMcp(p)), ...(isMcpVisible ? all.filter(isMcp) : [])];
  }, [others, isMcpVisible]);
  const onlyModel = !sections.length && !tools.length;

  const hasError = p => hasParticipantError(p.entity_name, p.entity_meta?.id, p.entity_meta?.project_id);
  const anyError = others.some(hasError);
  const toolsNeedingSetup = tools.filter(hasError).length;

  const activeId = getChatParticipantUniqueId(activeParticipant);
  const answersEntity =
    activeParticipant && activeParticipant.entity_name !== ChatParticipantType.Users
      ? activeParticipant
      : null;

  // the button
  const entityIcon = useParticipantEntityIcon(answersEntity || {});
  const activeVersionName = useMemo(() => {
    const versions = activeParticipantDetails?.versions || [];
    return versions.find(v => v.id === selectedVersionId)?.name || '';
  }, [activeParticipantDetails?.versions, selectedVersionId]);
  const name = answersEntity
    ? activeParticipantDetails?.name || answersEntity.meta?.name || answersEntity.entity_meta?.name || ''
    : selectedModel?.display_name || selectedModel?.name || 'None';
  const ModelIcon = selectedModel?.shared ? ShareIcon : BriefcaseIcon;

  // one flash after a pick in «+» (approved.html › pulseWho)
  const [pulsing, setPulsing] = useState(false);
  const firstPulse = useRef(pulseKey);
  useEffect(() => {
    if (pulseKey === firstPulse.current) return undefined;
    setPulsing(true);
    const timer = setTimeout(() => setPulsing(false), 800);
    return () => clearTimeout(timer);
  }, [pulseKey]);

  const sortedModels = useMemo(() => sortModels(modelList), [modelList]);

  const pickModel = useCallback(
    model => {
      // the model answers again: the one who answered steps back (dev: SwitchToModelButton), then the pick
      if (answersEntity) selectSavedOrDefaultModel?.();
      onSelectModel?.(model);
      closeAll();
    },
    [answersEntity, selectSavedOrDefaultModel, onSelectModel, closeAll],
  );

  const pickParticipant = useCallback(
    participant => {
      // a second click on the one who answers gives the answer back to the model (useParticipantItem › onClickHandler)
      if (participant) onSelectParticipant?.(participant);
      else selectSavedOrDefaultModel?.();
      closeAll();
    },
    [onSelectParticipant, selectSavedOrDefaultModel, closeAll],
  );

  const editParticipant = useCallback(
    participant => {
      onEditParticipant?.(participant);
      closeAll();
    },
    [onEditParticipant, closeAll],
  );

  const openModelSettings = useCallback(
    event => {
      event.stopPropagation();
      setShowModelSettings(true);
      closeAll();
    },
    [closeAll],
  );

  // a row's ⚙: version and variables of that participant in this chat
  const isActive = p => p && getChatParticipantUniqueId(p) === activeId;
  const versionIdOf = p =>
    isActive(p) ? selectedVersionId : (localSettings[p.id]?.version_id ?? p.entity_settings?.version_id);
  const variablesOfParticipant = p => {
    if (isActive(p)) return variables;
    if (localSettings[p.id]?.variables) return localSettings[p.id].variables;
    const details = getDetails(p.entity_name, p.entity_meta?.id, p.entity_meta?.project_id);
    return p.entity_settings?.variables || details?.version_details?.variables || [];
  };
  const { isEditingAgent, isEditingPipeline, isEditingSkill } = useNavBlocker();
  const pickVersion = (p, version) => {
    setSettingsOf(null);
    if (!isActive(p)) {
      setLocalSettings(prev => ({ ...prev, [p.id]: { ...prev[p.id], version_id: version.id } }));
      return;
    }
    // dev VersionSelector › handleVersionSelect: close the open editor; with unsaved changes ask first
    const closeEditor =
      kindOf(p) === 'skill'
        ? onCloseSkillEditor
        : kindOf(p) === 'pipeline'
          ? onClosePipelineEditor
          : onCloseAgentEditor;
    const change = () => {
      closeEditor?.();
      onSelectVersion?.(version);
    };
    if (
      (isEditingAgent || isEditingPipeline || isEditingSkill) &&
      isEditorDirty &&
      onShowVersionChangeAlert
    ) {
      onShowVersionChangeAlert(change);
      return;
    }
    change();
  };
  const saveVariables = (p, newVariables) => {
    if (isActive(p)) onChangeVariables?.(newVariables);
    else setLocalSettings(prev => ({ ...prev, [p.id]: { ...prev[p.id], variables: newVariables } }));
    setVariablesOf(null);
  };

  const whoAnswersContext = useMemo(
    () => ({
      inList: true,
      onOpenSettings: (participant, anchor) => setSettingsOf({ participant, anchor }),
    }),
    [],
  );

  const settingsParticipant = settingsOf?.participant;
  const settingsDetails = settingsParticipant
    ? getDetails(
        settingsParticipant.entity_name,
        settingsParticipant.entity_meta?.id,
        settingsParticipant.entity_meta?.project_id,
      )
    : null;

  // concept: under the pointer only, as the ⚙ of every other row (approved.html › `.mi.ag .acts`; owner 2026-11-24)
  const gear = (
    <Box
      component="span"
      className="concept-hover-act"
    >
      <Tooltip
        title="Model settings"
        placement="top"
      >
        <IconButton
          variant="elitea"
          color="tertiary"
          onClick={openModelSettings}
          disabled={!onSetLLMSettings}
          aria-label="Model settings"
          data-testid="who-answers-model-settings"
          sx={styles.iconButton}
        >
          <SettingIcon sx={styles.smallIcon} />
        </IconButton>
      </Tooltip>
    </Box>
  );

  const modelSettings = useMemo(
    () => normalizeLlmSettings(llmSettings || {}, selectedModel, { showStepsLimit }),
    [llmSettings, selectedModel, showStepsLimit],
  );

  return (
    <Box
      sx={styles.wrapper}
      data-tour={CHAT_TOUR_TARGET_IDS.participants}
    >
      <Tooltip
        placement="top"
        title={
          UNAVAILABLE_MESSAGES[answersEntity && activeSkillUnavailableReason] ||
          (answersEntity ? `Switch ${kindOf(answersEntity)}` : 'Switch to model')
        }
      >
        <Box
          component="span"
          sx={styles.buttonWrapper}
        >
          <Button.BaseBtn
            ref={buttonRef}
            id="model-selector-button"
            variant={Button.BUTTON_VARIANTS.tertiary}
            disabled={disabled}
            onClick={() => setListAnchor(buttonRef.current)}
            aria-haspopup="dialog"
            aria-expanded={Boolean(listAnchor)}
            aria-label={`Answers: ${name}`}
            data-testid="who-answers-button"
            data-tour={CHAT_TOUR_TARGET_IDS.modelSettings}
            data-pulse={pulsing ? 'on' : undefined}
            startIcon={
              answersEntity ? (
                <EntityIcon
                  icon={entityIcon}
                  entityType={
                    kindOf(answersEntity) === 'agent' ? answersEntity.entity_name : kindOf(answersEntity)
                  }
                  editable={false}
                  sx={styles.entityIcon}
                  imageStyle={{ width: '1.25rem', height: '1.25rem' }}
                  specifiedFontSize="0.75rem"
                />
              ) : selectedModel ? (
                <ModelIcon sx={styles.smallIcon} />
              ) : undefined
            }
            endIcon={<ArrowDownIcon sx={styles.chevron} />}
            sx={[styles.button, pulsing && styles.pulse]}
          >
            <Typography
              variant="inherit"
              noWrap
              sx={styles.name}
            >
              {name}
            </Typography>
            {answersEntity && activeVersionName && activeVersionName !== LATEST_VERSION_NAME && (
              <Typography
                variant="inherit"
                noWrap
                sx={styles.version}
                data-testid="who-answers-version"
              >
                {`· ${activeVersionName}`}
              </Typography>
            )}
            {(anyError || (answersEntity && activeSkillUnavailableReason)) && (
              <Box
                component="i"
                sx={styles.dot}
                data-testid="who-answers-attention-dot"
              />
            )}
          </Button.BaseBtn>
        </Box>
      </Tooltip>

      <Popover
        open={Boolean(listAnchor)}
        anchorEl={listAnchor}
        onClose={closeAll}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        slotProps={{ paper: { sx: styles.paper, 'data-testid': 'who-answers-list' } }}
      >
        <WhoAnswersProvider value={whoAnswersContext}>
          <Typography
            variant="labelSmall"
            color="text.primary"
            sx={styles.heading}
          >
            Model
          </Typography>
          {onlyModel ? (
            // only the model in the chat: the models themselves, ⚙ on the current one
            <Box
              role="listbox"
              aria-label="Models"
            >
              {sortedModels.map((model, index) => {
                const current = model.id === selectedModel?.id;
                return (
                  <ConceptModelRow
                    key={model.id ?? model.name}
                    model={model}
                    isSelected={current}
                    isFirstRow={index === 0}
                    onClick={() => pickModel(model)}
                    end={current ? gear : null}
                  />
                );
              })}
            </Box>
          ) : (
            <>
              {selectedModel && (
                <ConceptModelRow
                  model={selectedModel}
                  isSelected={!answersEntity}
                  isOpen={Boolean(modelsAnchor)}
                  isFirstRow
                  icon={<ModelIcon sx={styles.modelIcon} />}
                  onClick={event => setModelsAnchor(event.currentTarget)}
                  rowProps={{
                    role: 'menuitem',
                    'aria-selected': undefined,
                    'aria-haspopup': 'listbox',
                    'aria-expanded': Boolean(modelsAnchor),
                    'data-testid': 'who-answers-model-row',
                  }}
                  end={
                    <>
                      {gear}
                      <ArrowRightIcon sx={styles.chevron} />
                    </>
                  }
                />
              )}
              {/* concept: a line under «Model», as the one over «Toolkits & MCP» (owner 2026-11-24) */}
              {sections.length > 0 && <Divider sx={styles.divider} />}
              <Box sx={styles.sections}>
                {sections.map(section => (
                  <ParticipantSection
                    key={section.key}
                    participants={section.rows}
                    collapsed={false}
                    disabledEdit={disabled}
                    activeParticipantId={activeId}
                    onSelectParticipant={pickParticipant}
                    onDeleteParticipant={onDeleteParticipant}
                    onEditParticipant={editParticipant}
                    entityType={section.entityType}
                  />
                ))}
              </Box>
              {tools.length > 0 && (
                // pinned to the list's bottom: on a short window the list scrolls under it, and this row is the one that
                // explains the button's orange dot (a 630 px window cut it off)
                <Box sx={styles.toolsFoot}>
                  <Divider sx={styles.divider} />
                  <MenuItem
                    onClick={event => setToolsAnchor(event.currentTarget)}
                    aria-haspopup="menu"
                    aria-expanded={Boolean(toolsAnchor)}
                    data-testid="who-answers-tools-row"
                    sx={[styles.toolsRow, Boolean(toolsAnchor) && styles.rowOpen]}
                  >
                    <Box
                      component={ToolIcon}
                      sx={styles.toolIcon}
                    />
                    {/* concept: the count right after the name, grey (approved.html › `.mi.fold .n`; owner 2026-11-24) */}
                    <Typography
                      variant="bodyMedium"
                      color="text.secondary"
                      sx={styles.toolsName}
                    >
                      Toolkits & MCP
                      <Box
                        component="span"
                        sx={styles.toolsCount}
                      >
                        {tools.length}
                      </Box>
                    </Typography>
                    {toolsNeedingSetup > 0 && (
                      <Tooltip
                        title={`${toolsNeedingSetup} need${toolsNeedingSetup > 1 ? '' : 's'} setup`}
                        placement="top"
                      >
                        <Box
                          component="i"
                          sx={styles.inlineDot}
                          data-testid="who-answers-tools-dot"
                        />
                      </Tooltip>
                    )}
                    <ArrowRightIcon sx={[styles.chevron, styles.toolsChevron]} />
                  </MenuItem>
                </Box>
              )}
            </>
          )}
        </WhoAnswersProvider>
      </Popover>

      {/* the models, beside the «Model» row */}
      <LLMModelsMenu
        anchorEl={modelsAnchor}
        onClose={() => setModelsAnchor(null)}
        models={modelList}
        selectedModel={answersEntity ? null : selectedModel}
        onSelectModel={pickModel}
        menuProps={{
          anchorOrigin: { vertical: 'top', horizontal: 'left' },
          transformOrigin: { vertical: 'top', horizontal: 'right' },
          paperSx: { marginTop: 0, marginLeft: '-.25rem' },
        }}
      />

      {/* toolkits and MCPs, beside their row */}
      <Popover
        open={Boolean(toolsAnchor)}
        onClose={() => setToolsAnchor(null)}
        anchorReference="anchorPosition"
        anchorPosition={besideLeft(toolsAnchor, SIDE_WIDTH, 'bottom')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slots={{ transition: Fade }}
        slotProps={{ paper: { sx: styles.sidePaper, 'data-testid': 'who-answers-tools-list' } }}
      >
        <WhoAnswersProvider value={whoAnswersContext}>
          <Typography
            variant="labelSmall"
            color="text.primary"
            sx={styles.heading}
          >
            Toolkits & MCP
          </Typography>
          <Box sx={styles.toolRows}>
            {tools.map(tool => (
              <ParticipantItem
                key={tool.id}
                participant={tool}
                collapsed={false}
                disabledEdit={disabled}
                isActive={false}
                onClickItem={pickParticipant}
                onDelete={onDeleteParticipant}
                onEdit={editParticipant}
              />
            ))}
          </Box>
        </WhoAnswersProvider>
      </Popover>

      {/* ⚙ of an agent, pipeline or skill: «<name> · version», then Variables */}
      <Popover
        open={Boolean(settingsOf)}
        anchorReference="anchorPosition"
        anchorPosition={besideLeft(settingsOf?.anchor, SETTINGS_WIDTH, 'top')}
        onClose={() => setSettingsOf(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slots={{ transition: Fade }}
        slotProps={{
          paper: { sx: styles.settingsPaper, 'data-testid': 'who-answers-participant-settings-list' },
        }}
      >
        {settingsParticipant && (
          <>
            <Typography
              variant="labelSmall"
              color="text.primary"
              sx={styles.heading}
              noWrap
            >
              {`${settingsDetails?.name || settingsParticipant.meta?.name} · version`}
            </Typography>
            {(settingsDetails?.versions || []).map(version => (
              <MenuItem
                key={version.id}
                selected={version.id === versionIdOf(settingsParticipant)}
                onClick={() => pickVersion(settingsParticipant, version)}
                data-testid={`who-answers-version-${version.name}`}
                sx={styles.versionRow}
              >
                <Typography
                  variant="bodyMedium"
                  color="text.secondary"
                  noWrap
                  sx={styles.versionName}
                >
                  {version.name}
                </Typography>
                {version.id === versionIdOf(settingsParticipant) && (
                  <Box
                    component={CheckedIcon}
                    sx={styles.check}
                  />
                )}
              </MenuItem>
            ))}
            {settingsParticipant.entity_name !== ChatParticipantType.Skills && (
              <>
                <Divider sx={styles.divider} />
                <MenuItem
                  onClick={() => {
                    setVariablesOf(settingsParticipant);
                    setSettingsOf(null);
                  }}
                  data-testid="who-answers-variables"
                  sx={styles.versionRow}
                >
                  <Typography
                    variant="bodyMedium"
                    color="text.secondary"
                    sx={styles.versionName}
                  >
                    Variables
                  </Typography>
                  <Typography
                    variant="bodyMedium"
                    color="text.primary"
                  >
                    {variablesOfParticipant(settingsParticipant).length}
                  </Typography>
                </MenuItem>
              </>
            )}
          </>
        )}
      </Popover>

      <VariableDialog
        variables={variablesOf ? variablesOfParticipant(variablesOf) : []}
        open={Boolean(variablesOf)}
        onOK={newVariables => saveVariables(variablesOf, newVariables)}
        onCancel={() => setVariablesOf(null)}
      />

      {onSetLLMSettings && (
        <ConceptModelSettingsDialog
          open={showModelSettings}
          selectedModel={selectedModel}
          llmSettings={modelSettings}
          onApply={newSettings => {
            onSetLLMSettings(newSettings);
            setShowModelSettings(false);
          }}
          onCancel={() => setShowModelSettings(false)}
          showWebhookSecret={showWebhookSecret}
          showStepsLimit={showStepsLimit}
          internal_tools={internal_tools}
          onInternalToolsConfigChange={onInternalToolsConfigChange}
        />
      )}
    </Box>
  );
});

WhoAnswers.displayName = 'WhoAnswers';

/** @type {MuiSx} */
const whoAnswersStyles = () => ({
  wrapper: {
    display: 'inline-flex',
    minWidth: 0,
    maxWidth: '100%',
  },
  buttonWrapper: {
    display: 'inline-flex',
    minWidth: 0,
    maxWidth: '100%',
  },
  button: {
    position: 'relative',
    minWidth: 0,
    maxWidth: '100%',
    gap: '.5rem',
    padding: '.375rem .5rem',
    '& .MuiButton-startIcon, & .MuiButton-endIcon': { margin: 0 },
    '&[aria-expanded="true"]': {
      background: ({ palette }) => palette.components.button.background.tertiary.hover,
      '& .MuiButton-endIcon': { transform: 'rotate(180deg)' },
    },
    '@keyframes whopulse': {
      '0%': { boxShadow: '0 0 0 0 rgba(106, 232, 250, .6)' },
      '25%': { backgroundColor: 'rgba(106, 232, 250, .16)' },
      '100%': { boxShadow: '0 0 0 .625rem rgba(106, 232, 250, 0)' },
    },
  },
  // the flash after a pick in «+» (approved.html › `.below .pulse`)
  pulse: {
    animation: 'whopulse .8s ease-out',
  },
  name: {
    minWidth: 0,
  },
  version: ({ palette }) => ({
    flexShrink: 0,
    marginLeft: '-.25rem',
    color: palette.text.primary,
  }),
  entityIcon: {
    width: '1.25rem',
    height: '1.25rem',
    minWidth: '1.25rem',
  },
  modelIcon: {
    width: '.875rem',
    height: '.875rem',
    fontSize: '.875rem',
  },
  smallIcon: {
    width: '1rem',
    height: '1rem',
    fontSize: '1rem',
  },
  chevron: {
    fontSize: '1rem',
    color: 'icon.default',
  },
  // approved.html › `.rdot`: 8 px, dev palette.icon.attention
  dot: ({ palette }) => ({
    position: 'absolute',
    top: '.125rem',
    right: '.125rem',
    width: '.5rem',
    height: '.5rem',
    borderRadius: '50%',
    background: palette.icon.attention,
  }),
  inlineDot: ({ palette }) => ({
    flexShrink: 0,
    width: '.5rem',
    height: '.5rem',
    borderRadius: '50%',
    background: palette.icon.attention,
  }),
  paper: {
    width: '24rem',
    maxWidth: 'calc(100vw - 1rem)',
    maxHeight: 'calc(100vh - 7rem)',
    overflowY: 'auto',
    marginTop: '-.25rem',
    // the field's right edge stands 3 px past the button's: the list, aligned to the button, left the field's rounded
    // border peeking out at its right (owner 2026-11-24); shifted so its right edge covers the field's
    marginLeft: '.1875rem',
    padding: '.25rem 0 .5rem',
  },
  sidePaper: {
    width: `${SIDE_WIDTH / 16}rem`,
    maxHeight: 'calc(100vh - 2rem)',
    overflowY: 'auto',
    padding: '.25rem 0 .5rem',
  },
  settingsPaper: {
    width: `${SETTINGS_WIDTH / 16}rem`,
    padding: '.25rem 0',
  },
  // as the sections' heads (ParticipantsAccordion › title)
  heading: {
    display: 'block',
    textTransform: 'uppercase',
    fontSize: '.75rem',
    padding: '.75rem 1.25rem .5rem',
  },
  sections: {
    padding: '0 .5rem',
    '&:not(:empty)': { marginTop: '.5rem' },
    // the list is wider than the panel: the version shows whole («v3-strict-review», also with Edit, ⚙ and Remove in
    // view under the pointer) and the name gives way; past 70% of the row «…» with its tooltip (the class comes from a
    // CONCEPT_PATCHES line in .storybook/main.js); a size smaller than the name, as approved.html › `.ver` (12 px, the
    // team's bodySmall; owner 2026-11-24: «меньшим шрифтом сделать название версии»)
    '& .concept-version-label': { maxWidth: '70%', fontSize: '.75rem', lineHeight: '1rem' },
    // no «Catalog» tag on a row: it tells where an item came from, which matters when adding it (the «+» list keeps
    // it), not when picking who answers; approved.html shows it only in «+» and «#» (owner 2026-11-24). Dev already
    // gives a Catalog skill no Edit (useParticipantItem › showEditButton), so nothing on the row depends on the tag
    '& [data-testid="chat-participant-catalog-tag"]': { display: 'none' },
  },
  toolRows: {
    display: 'flex',
    flexDirection: 'column',
    gap: '.5rem',
    padding: '0 .5rem',
  },
  divider: {
    margin: '.25rem 0',
  },
  toolsFoot: {
    position: 'sticky',
    bottom: '-.5rem',
    marginBottom: '-.5rem',
    paddingBottom: '.5rem',
    backgroundColor: 'inherit',
    zIndex: 1,
  },
  // inset with a radius as the rows above, so its frame matches theirs when its list is open
  toolsRow: {
    gap: '.5rem',
    margin: '0 .5rem',
    padding: '.5rem .75rem',
    borderRadius: '.5rem',
    border: '0.0625rem solid transparent',
    minHeight: '2.5rem',
  },
  rowOpen: ({ palette }) => ({
    borderColor: palette.components.split.border.hover,
  }),
  toolIcon: ({ palette }) => ({
    width: '1rem',
    height: '1rem',
    flexShrink: 0,
    '& path': { fill: palette.icon.default },
  }),
  toolsName: {
    flex: 1,
    minWidth: 0,
  },
  toolsCount: ({ palette }) => ({
    marginLeft: '.5rem',
    color: palette.text.muted,
  }),
  toolsChevron: {
    marginLeft: '.25rem',
  },
  iconButton: {
    width: '1.75rem',
    height: '1.75rem',
  },
  versionRow: {
    gap: '.5rem',
    padding: '.5rem 1.25rem',
  },
  versionName: {
    flex: 1,
    minWidth: 0,
  },
  check: ({ palette }) => ({
    width: '1rem',
    height: '1rem',
    flexShrink: 0,
    color: palette.text.secondary,
  }),
});

export default ConceptWhoAnswers;
