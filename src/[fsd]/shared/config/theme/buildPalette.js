import { ThemeEffectsHelpers } from '@/[fsd]/shared/lib/helpers';

import { RESOURCE_CARD_COLORS, RESOURCE_CARD_EFFECTS } from './resourceCard.constants';

const {
  createBoxShadow,
  createGradientOrNone,
  createGradientOrSolid,
  createLinearGradient,
  createResourceCard,
} = ThemeEffectsHelpers;

// eslint-disable-next-line no-unused-vars
const applyCustomTheme = (cs, customTheme) => cs;

const buildResolvedPalette = (cs, effects, nodeColors) => ({
  mode: effects.mode,
  primary: {
    main: cs.primaryMain,
    pressed: cs.primaryPressed,
  },
  secondary: {
    main: cs.secondaryMain,
  },
  info: {
    main: cs.infoMain,
    secondary: cs.infoSecondary,
  },
  background: {
    info: cs.backgroundInfo,
    default: cs.backgroundPage,
    secondary: cs.backgroundSecondary,
    tabPanel: cs.backgroundTabPanel,
    pageSection: cs.backgroundPageSection,
    section: cs.backgroundSection,
    modal: {
      simple: cs.backgroundModal,
    },
    chatBkg: cs.backgroundChat,
    dragging: cs.backgroundDragging,
    userInputBackground: cs.backgroundUserInput,
    userInputBackgroundActive: cs.backgroundUserInputActive,
    userInputBorderLight: cs.backgroundUserInputBorderLight,
    userInputBorderDark: cs.backgroundUserInputBorderDark,
    userInputBorderShadow: cs.backgroundUserInputBorderShadow,
    warningBkg: cs.backgroundDangerMuted,
    wrongBkg: cs.backgroundDangerStrong,
    errorBkg: cs.backgroundDangerSubtle,
    onboardingBody: cs.backgroundOnboarding,
    warning: cs.backgroundWarning,
    warning40: cs.backgroundWarningStrong,
    warning8: cs.backgroundWarningSubtle,
    codeMirrorEditor: cs.backgroundCodeEditor,
    categoriesButton: {
      selected: {
        active: cs.backgroundCategorySelected,
        hover: cs.backgroundCategorySelectedHover,
      },
    },
    dataGrid: {
      main: cs.backgroundDataGrid,
      secondary: cs.backgroundDataGridSecondary,
      row: {
        selected: cs.backgroundDataGridRowSelected,
      },
    },
    tabButton: {
      default: cs.backgroundTabButtonDefault,
      hover: cs.backgroundTabButtonHover,
      active: cs.backgroundTabButtonActive,
      disabled: cs.backgroundTabButtonDisabled,
    },
    select: {
      hover: cs.backgroundSelectHover,
      selected: {
        default: cs.backgroundSelectSelected,
        hover: cs.backgroundSelectSelectedHover,
      },
    },
    switch: {
      default: {
        on: { thumb: cs.switchThumbOn, track: cs.switchTrackOn },
        off: { thumb: cs.switchThumbOff, track: cs.switchTrackOff },
      },
      disabled: {
        on: { thumb: cs.switchThumbOnDisabled, track: cs.switchTrackOnDisabled },
        off: { thumb: cs.switchThumbOffDisabled, track: cs.switchTrackOffDisabled },
      },
    },
    tabs: {
      default: cs.backgroundTabsActive,
    },
    tab: {
      default: cs.backgroundTabDefault,
      hover: cs.backgroundTabHover,
      active: cs.backgroundTabActive,
      disabled: cs.backgroundTabDisabled,
    },
    tooltip: {
      default: cs.backgroundTooltip,
      code: cs.backgroundTooltipCode,
    },
    card: {
      default: cs.backgroundCard,
      hover: cs.backgroundCardHover,
      gradientDark: createLinearGradient({
        direction: effects.backgroundCardGradientDirection,
        start: cs.backgroundCardGradientStart,
        end: cs.backgroundCardGradientEnd,
      }),
      hoverBorderGradient: createLinearGradient({
        direction: '0deg',
        start: cs.backgroundCardHoverBorderStart,
        end: cs.backgroundCardHoverBorderEnd,
      }),
      hoverShadow: createBoxShadow({
        geometry: effects.backgroundCardHoverShadow,
        color: cs.backgroundCardHoverShadow,
      }),
    },
    interactiveTourPrompt: {
      backdrop: cs.backgroundTourBackdrop,
      card: createLinearGradient({
        direction: effects.backgroundTourCardDirection,
        start: cs.backgroundTourCardStart,
        end: cs.backgroundTourCardEnd,
      }),
      borderGradient: `linear-gradient(186.77deg, ${cs.backgroundTourBorderStart} 5.31%, ${cs.backgroundTourBorderEnd} 94.69%)`,
      dividerGradient: `linear-gradient(90deg, ${cs.backgroundTourDividerEdge} 0%, ${cs.backgroundTourDividerCenter} 49.7%, ${cs.backgroundTourDividerEdge} 100%)`,
      counter: cs.backgroundTourCounter,
    },
    resourceCard: {
      blue: createResourceCard({
        direction: effects.backgroundResourceBlueDirection,
        start: cs.backgroundResourceBlueStart,
        end: cs.backgroundResourceBlueEnd,
        colors: RESOURCE_CARD_COLORS.blue,
        effects: RESOURCE_CARD_EFFECTS,
      }),
      orange: createResourceCard({
        direction: effects.backgroundResourceOrangeDirection,
        start: cs.backgroundResourceOrangeStart,
        end: cs.backgroundResourceOrangeEnd,
        colors: RESOURCE_CARD_COLORS.orange,
        effects: RESOURCE_CARD_EFFECTS,
      }),
      purple: createResourceCard({
        direction: effects.backgroundResourcePurpleDirection,
        start: cs.backgroundResourcePurpleStart,
        end: cs.backgroundResourcePurpleEnd,
        colors: RESOURCE_CARD_COLORS.purple,
        effects: RESOURCE_CARD_EFFECTS,
      }),
      green: createResourceCard({
        direction: effects.backgroundResourceGreenDirection,
        start: cs.backgroundResourceGreenStart,
        end: cs.backgroundResourceGreenEnd,
        colors: RESOURCE_CARD_COLORS.green,
        effects: RESOURCE_CARD_EFFECTS,
      }),
      pink: createResourceCard({
        direction: effects.backgroundResourcePinkDirection,
        start: cs.backgroundResourcePinkStart,
        end: cs.backgroundResourcePinkEnd,
        colors: RESOURCE_CARD_COLORS.pink,
        effects: RESOURCE_CARD_EFFECTS,
      }),
    },
    icon: {
      default: cs.backgroundIconDefault,
      trophy: cs.backgroundIconTrophy,
      checkedBox: cs.backgroundIconChecked,
      entityGradient: `linear-gradient(45.36deg, ${cs.backgroundIconEntityStart} 16.25%, ${cs.backgroundIconEntityEnd} 87.07%)`,
      entityBorderGradient: `linear-gradient(225deg, ${cs.backgroundIconEntityBorderStart} 12.64%, ${cs.backgroundIconEntityBorderEnd} 87.88%)`,
    },
    npsCard: `linear-gradient(to top, ${cs.accentLight}, ${cs.accentMid})`,
    dragHighlight: cs.backgroundDragHighlight,
    button: {
      default: cs.backgroundButtonDefault,
      normal: cs.backgroundButtonDefault,
      danger: cs.backgroundButtonDanger,
      primary: {
        default: cs.backgroundButtonPrimaryDefault,
        hover: cs.backgroundButtonPrimaryHover,
        pressed: cs.backgroundButtonPrimaryPressed,
        disabled: cs.backgroundButtonPrimaryDisabled,
      },
      secondary: {
        default: cs.backgroundButtonSecondaryDefault,
        hover: cs.backgroundButtonSecondaryHover,
        pressed: cs.backgroundButtonSecondaryPressed,
        disabled: cs.backgroundButtonSecondaryDisabled,
      },
      tertiary: {
        hover: cs.backgroundButtonTertiaryHover,
        pressed: cs.backgroundButtonTertiaryPressed,
      },
      alarm: {
        default: cs.backgroundButtonAlarmDefault,
        hover: cs.backgroundButtonAlarmHover,
        pressed: cs.backgroundButtonAlarmPressed,
        disabled: cs.backgroundButtonAlarmDisabled,
      },
      drawerMenu: {
        default: cs.backgroundButtonTransparent,
        hover: cs.backgroundButtonDrawerHover,
        selected: cs.backgroundButtonDrawerSelected,
      },
      agentHub: {
        default: cs.backgroundButtonTransparent,
        hover: cs.backgroundButtonAgentHubHover,
        active: cs.backgroundButtonAgentHubActive,
        shadowDefault: createBoxShadow({
          geometry: effects.backgroundAgentHubShadowDefault,
          color: cs.backgroundButtonAgentHubShadow,
        }),
        shadowHover: createBoxShadow({
          geometry: effects.backgroundAgentHubShadowHover,
          color: cs.backgroundButtonAgentHubShadow,
        }),
        shadowActive: createBoxShadow({
          geometry: effects.backgroundAgentHubShadowActive,
          color: cs.backgroundButtonAgentHubShadow,
          inset: true,
        }),
        textGradient: `linear-gradient(90deg, ${cs.backgroundButtonAgentHubTextStart} 0.7%, ${cs.backgroundButtonAgentHubTextEnd} ${effects.backgroundAgentHubTextGradientEnd})`,
        iconGradient: `linear-gradient(33.96deg, ${cs.backgroundButtonAgentHubIconStart} 0%, ${cs.backgroundButtonAgentHubIconEnd} 80%)`,
      },
      iconLabelButton: {
        default: cs.backgroundButtonTransparent,
        hover: cs.backgroundButtonIconLabelHover,
        selected: cs.backgroundButtonIconLabelSelected,
        disabled: cs.backgroundButtonTransparent,
      },
      neutral: {
        default: cs.backgroundButtonNeutralDefault,
        hover: cs.backgroundButtonNeutralHover,
        pressed: cs.backgroundButtonNeutralPressed,
        disabled: cs.backgroundButtonNeutralDisabled,
      },
      positive: {
        default: cs.backgroundButtonPositiveDefault,
        hover: cs.backgroundButtonPositiveHover,
        pressed: cs.backgroundButtonPositivePressed,
        disabled: cs.backgroundButtonPositiveDisabled,
      },
      magicAssistant: cs.backgroundButtonMagicAssistant,
      accent: {
        default: cs.accentDefault,
        hover: cs.accentHover,
        pressed: cs.accentPressed,
        disabled: cs.accentDisabled,
      },
      outline: {
        default: cs.outlineDefault,
        hover: cs.outlineHover,
        pressed: cs.outlinePressed,
      },
    },
    tips: cs.backgroundTips,
    attention: cs.backgroundAttention,
    text: {
      highlight: cs.backgroundTextHighlight,
    },
    aiAnswerBkg: cs.backgroundAiAnswer,
    aiParticipantIcon: cs.backgroundAiParticipantIcon,
    aiAnswerActions: `linear-gradient(270deg, ${cs.backgroundAiAnswerActionsStart} 82.5%, ${cs.backgroundAiAnswerActionsEnd} 100%)`,
    userMessageActions: `linear-gradient(270deg, ${cs.backgroundUserMessageActionsStart} ${effects.backgroundUserMessageActionsStop}, ${cs.backgroundUserMessageActionsEnd} 100%)`,
    conversationStarters: {
      default: cs.backgroundConversationStarter,
      hover: cs.backgroundConversationStarterHover,
    },
    conversationEditor: cs.backgroundConversationEditor,
    conversationTopCover: createLinearGradient({
      direction: '360deg',
      start: cs.backgroundConversationCoverTransparent,
      end: cs.backgroundConversationCoverOpaque,
    }),
    conversationBottomCover: createLinearGradient({
      start: cs.backgroundConversationCoverTransparent,
      end: cs.backgroundConversationCoverOpaque,
    }),
    avatar: cs.backgroundAvatar,
    categoryHeader: cs.backgroundCategoryHeader,
    tag: {
      default: cs.backgroundTag,
      selected: cs.backgroundTagSelected,
    },
    notificationList: cs.backgroundNotificationList,
    participant: {
      default: cs.backgroundParticipant,
      hover: cs.backgroundParticipantHover,
      active: cs.backgroundParticipantActive,
      cover: cs.backgroundParticipantCover,
    },
    conversation: {
      normal: cs.backgroundConversationNormal,
      hover: cs.backgroundConversationHover,
      selected: cs.backgroundConversationSelected,
    },
    highlightUserMessage: cs.backgroundHighlightUserMessage,
    tagEditor: {
      tag: cs.backgroundTagEditor,
    },
    tagChip: {
      default: cs.backgroundTagChip,
      hover: cs.backgroundTagChipHover,
      active: {
        default: cs.backgroundTagChipActive,
        hover: cs.backgroundTagChipActiveHover,
      },
      disabled: cs.backgroundTagChipDisabled,
    },
    eliteaDefault: createGradientOrSolid({
      direction: '270deg',
      start: cs.backgroundEliteaStart,
      end: cs.backgroundEliteaEnd,
    }),
    showContextDialog: createGradientOrSolid({
      direction: '270deg',
      start: cs.backgroundContextDialogStart,
      end: cs.backgroundContextDialogEnd,
    }),
    sideBar: createLinearGradient({
      start: cs.backgroundSidebarStart,
      end: cs.backgroundSidebarEnd,
    }),
    imageAttachment: createLinearGradient({
      direction: '0deg',
      start: cs.backgroundImageAttachmentStart,
      end: cs.backgroundImageAttachmentEnd,
    }),
    agentModal: {
      border: `linear-gradient(${effects.backgroundAgentModalBorderDirection}, ${cs.backgroundAgentModalBorderStart} 0%, ${cs.backgroundAgentModalBorderEnd} ${effects.backgroundAgentModalBorderEnd})`,
      background: createLinearGradient({
        direction: effects.backgroundAgentModalDirection,
        start: cs.backgroundAgentModalStart,
        end: cs.backgroundAgentModalEnd,
      }),
      content: {
        border: `linear-gradient(${effects.backgroundAgentModalBorderDirection}, ${cs.backgroundAgentModalBorderStart} 0%, ${cs.backgroundAgentModalBorderEnd} ${effects.backgroundAgentModalBorderEnd})`,
        background: cs.backgroundAgentModalContent,
      },
    },
    toolCard: {
      hover: cs.backgroundToolCardHover,
    },
    deprecated: cs.backgroundDeprecated,
    mcp: {
      loginSuccess: cs.backgroundMcpSuccess,
      logout: cs.backgroundMcpLogout,
    },
    onboarding: `linear-gradient(247.51deg, ${cs.backgroundOnboardingStart} 0.02%, ${cs.backgroundOnboardingMiddle} 50.21%, ${cs.backgroundOnboardingEnd} 99.64%)`,
    welcome: {
      outside: `linear-gradient(42.04deg, ${cs.backgroundWelcomeOutsideStart} 8.85%, ${cs.backgroundWelcomeOutsideEnd} 89.62%)`,
      inner: `linear-gradient(63.16deg, ${cs.backgroundWelcomeInnerStart} 16.12%, ${cs.backgroundWelcomeInnerEnd} 85.3%)`,
    },
    banner: {
      default: `linear-gradient(30deg, ${cs.backgroundBannerStart} 8.85%, ${cs.backgroundBannerEnd} 89.62%)`,
      border: `linear-gradient(42.04deg, ${cs.backgroundBannerBorderStart} 8.85%, ${cs.backgroundBannerBorderEnd} 89.62%)`,
    },
    settingsPage: createGradientOrSolid({
      direction: '270deg',
      start: cs.backgroundEliteaStart,
      end: cs.backgroundEliteaEnd,
    }),
    chatContinueBackground: cs.backgroundChatContinue,
    aiProviderAccordion: {
      default: cs.backgroundAiProvider,
      hover: cs.backgroundAiProviderHover,
    },
    emptyState: {
      default: cs.backgroundEmptyState,
    },
    toolkitDetailLeftPanel: cs.backgroundToolkitPanel,
    toolkitDetailRightPanel: cs.backgroundToolkitPanel,
    indexResult: {
      success: cs.backgroundIndexSuccess,
      error: cs.backgroundIndexError,
      warning: cs.backgroundIndexWarning,
      info: cs.backgroundIndexInfo,
    },
    folder: {
      default: cs.backgroundFolder,
      active: cs.backgroundFolderActive,
      borderGradient: createGradientOrNone({
        direction: effects.backgroundFolderBorderDirection,
        start: cs.backgroundFolderBorderStart,
        end: cs.backgroundFolderBorderEnd,
      }),
      borderHover: cs.backgroundFolderBorderHover,
      borderActive: cs.backgroundFolderBorderActive,
      shadow: createBoxShadow({
        geometry: effects.backgroundFolderShadow,
        color: cs.backgroundFolderShadow,
      }),
    },
  },
  border: {
    lines: cs.borderDefault,
    hover: cs.borderHover,
    inputHover: cs.borderInputHover,
    category: {
      selected: cs.borderSelected,
    },
    tips: cs.borderInfo,
    attention: cs.borderWarning,
    table: cs.borderSurface,
    userMessageEditor: cs.borderEditor,
    notificationItem: cs.borderSurfaceStrong,
    cardsOutlines: cs.borderSurface,
    conversationItemDivider: cs.borderDivider,
    highlightUserMessage: cs.borderHighlight,
    error: cs.borderError,
    flowNode: cs.borderInputHover,
    sidebarDivider: cs.borderDivider,
    chatEditPlaceholderBorder: cs.borderChatInput,
    mcp: {
      loginSuccess: cs.borderMcpSuccess,
      logout: cs.borderMcpLogout,
    },
    chatContinue: cs.borderChatContinue,
    reindexInfoContainer: cs.borderReindex,
    indexResult: {
      success: cs.borderSuccess,
      error: cs.borderError,
      warning: cs.borderWarning,
      info: cs.borderResultInfo,
    },
    accent: cs.borderAccent,
    cardsOutlinesGradient: createLinearGradient({
      direction: '0deg',
      start: cs.borderCardOutlineStart,
      end: cs.borderCardOutlineEnd,
    }),
    toolCardGradient: createGradientOrSolid({
      start: cs.borderToolCardStart,
      end: cs.borderToolCardEnd,
    }),
    aiProviderAccordion: createLinearGradient({
      start: cs.borderAiProviderStart,
      end: cs.borderAiProviderEnd,
    }),
  },
  text: {
    default: cs.textPrimary,
    primary: cs.textPrimary,
    secondary: cs.textEmphasis,
    tooltip: cs.textOnTooltip,
    error: cs.textError,
    groupedTitle: {
      default: cs.textPrimary,
    },
    button: {
      primary: cs.textOnButton,
      secondary: cs.textOnButton,
      disabled: cs.textDisabled,
      showMore: cs.textShowMore,
      auxiliary: cs.textAuxiliaryHover,
    },
    tabButton: {
      default: cs.textPrimary,
      hover: cs.textEmphasis,
      active: cs.textEmphasis,
      disabled: cs.textDisabled,
    },
    input: {
      label: cs.textPrimary,
      placeholder: cs.textPlaceholder,
      placeholderSecondary: cs.textDisabled,
      disabled: cs.textInputDisabled,
    },
    select: {
      selected: {
        primary: cs.textEmphasis,
        secondary: cs.textPrimary,
      },
    },
    tag: {
      default: cs.textEmphasis,
      selected: cs.textOnAccent,
    },
    tagChip: {
      default: cs.textEmphasis,
      active: cs.textOnAccent,
      disabled: cs.textDisabled,
    },
    participant: {
      default: cs.textDisabled,
    },
    info: cs.textInfo,
    tips: cs.textTips,
    attention: cs.textAttention,
    metrics: cs.textMetrics,
    warningText: cs.textErrorSubtle,
    deleteAlertEntityName: cs.textLink,
    deleteAlertText: cs.textEmphasis,
    createButton: cs.textCreateButton,
    deprecated: cs.textOnAccent,
    mcp: {
      loginSuccess: cs.textSuccessSubtle,
      logout: cs.textWarningSubtle,
    },
    link: cs.textLink,
    linkSeen: cs.textLinkVisited,
    highlighted: cs.textEmphasis,
    indexResult: {
      success: cs.textSuccessSubtle,
      error: cs.textErrorSubtle,
      warning: cs.textWarningSubtle,
      info: cs.textInfoSubtle,
    },
    onAccent: cs.textOnAccent,
    muted: cs.textMuted,
    inverse: cs.textInverse,
  },
  icon: {
    main: cs.iconDefault,
    fill: {
      default: cs.iconDefault,
      primary: cs.iconPrimary,
      secondary: cs.iconEmphasis,
      send: cs.iconSend,
      trophy: cs.iconTrophy,
      tips: cs.iconTips,
      info: cs.iconInfo,
      successModal: cs.iconSuccessStrong,
      disabled: cs.iconDisabled,
      attention: cs.iconAttention,
      warning: cs.iconWarning,
      is_default: cs.iconSuccessSubtle,
      success: cs.iconSuccess,
      active: cs.iconActive,
      inactive: cs.iconInactive,
      magicAssistant: cs.iconMagicAssistant,
      error: cs.iconError,
      delete: cs.iconDelete,
      stateButton: cs.iconDefault,
      stateButtonHover: cs.iconHover,
      button: cs.iconOnAccent,
    },
    tagChip: {
      default: cs.iconDefault,
      hover: cs.iconEmphasis,
      active: cs.iconOnAccent,
      disabled: cs.iconDisabled,
    },
    indexResult: {
      success: cs.iconSuccessStrong,
      error: cs.iconError,
      warning: cs.iconAttention,
      info: cs.iconResultInfo,
    },
  },
  boxShadow: {
    default: createBoxShadow({ geometry: effects.boxShadowDefault, color: cs.shadowDefault }),
    tagEditorPaper: createBoxShadow({
      geometry: effects.boxShadowTagEditorPaper,
      color: cs.shadowTagEditorPaper,
    }),
    tag: createBoxShadow({ geometry: effects.boxShadowTag, color: cs.shadowTag }),
    onboarding: createBoxShadow({
      geometry: effects.boxShadowOnboarding,
      color: cs.shadowOnboarding,
    }),
    aiAnswer: createBoxShadow({ geometry: effects.boxShadowAiAnswer, color: cs.shadowAiAnswer }),
  },
  checkbox: {
    default: cs.selectionControlDefault,
    hover: {
      on: cs.selectionControlDefault,
      off: cs.selectionControlEmphasis,
    },
    active: cs.selectionControlEmphasis,
    mark: cs.selectionControlMark,
    disabled: cs.selectionControlDisabled,
  },
  radio: {
    default: cs.selectionControlDefault,
    hover: {
      off: cs.selectionControlEmphasis,
    },
    active: cs.selectionControlEmphasis,
    disabled: cs.selectionControlDisabled,
  },
  split: {
    default: cs.splitBackgroundDefault,
    hover: cs.splitBackgroundHover,
    pressed: cs.splitBackgroundPressed,
    disabled: cs.splitBackgroundDisabled,
    text: {
      default: cs.splitTextDefault,
      pressed: cs.splitTextPressed,
      disabled: cs.splitTextDisabled,
    },
  },
  scrollbar: {
    thumb: cs.scrollbarThumb,
    thumbHover: cs.scrollbarThumbHover,
  },
  suggestionChip: {
    border: cs.suggestionChipBorder,
    background: {
      default: cs.suggestionChipBackgroundDefault,
      hover: cs.suggestionChipBackgroundHover,
    },
    text: {
      default: cs.suggestionChipTextDefault,
      hover: cs.suggestionChipTextHover,
    },
  },
  step: {
    default: {
      border: cs.stepDefaultBorder,
      icon: cs.stepDefaultIcon,
    },
    active: cs.stepActive,
    completed: {
      border: cs.stepCompletedBorder,
      background: cs.stepCompletedBackground,
      icon: cs.stepCompletedIcon,
    },
  },
  status: {
    draft: cs.statusDraft,
    onModeration: cs.statusModeration,
    warningText: cs.statusWarningText,
    published: cs.statusPublished,
    publishedIcon: cs.statusPublishedIcon,
    publishedBackground: cs.statusPublishedBackground,
    publishedText: cs.statusPublishedText,
    publishedBorder: cs.statusPublishedBorder,
    rejected: cs.statusRejected,
    rejectedText: cs.statusRejectedText,
    userApproval: cs.statusUserApproval,
  },
  warning: {
    main: cs.warningMain,
    yellow: cs.warningYellow,
    light: cs.warningSurface,
    dark: cs.warningTextStrong,
  },
  diff: {
    removed: cs.diffRemoved,
    added: cs.diffAdded,
  },
  capability: {
    vision: {
      background: cs.capabilityVisionBackground,
      icon: cs.capabilityVisionIcon,
    },
    reasoning: {
      background: cs.capabilityReasoningBackground,
      icon: cs.capabilityReasoningIcon,
    },
  },
  aiAssistant: {
    iconBackground: `linear-gradient(${effects.aiAssistantGradientDirection}, ${cs.aiAssistantBackgroundStart} ${effects.aiAssistantGradientStart}, ${cs.aiAssistantBackgroundEnd} ${effects.aiAssistantGradientEnd})`,
    iconBorder: `linear-gradient(${effects.aiAssistantGradientDirection}, ${cs.aiAssistantBorderStart} ${effects.aiAssistantGradientStart}, ${cs.aiAssistantBorderEnd} ${effects.aiAssistantGradientEnd})`,
    iconGradientStart: cs.aiAssistantIconStart,
    iconGradientEnd: cs.aiAssistantIconEnd,
  },
  nodeColors,
});

export const buildPalette = (cs, effects, nodeColors, customTheme = null) => {
  const resolvedScheme = customTheme ? applyCustomTheme(cs, customTheme) : cs;

  return buildResolvedPalette(resolvedScheme, effects, nodeColors);
};
