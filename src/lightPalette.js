// const white14 = '#ffffff24';
// const veryLightBlue = '#C7EBFF';
const white = '#FFFFFF';
const blueFill08 = '#29b8f514';
const skyBlue20 = ' #50a1ff33';
const skyBlue40 = ' #50a1ff66';
const grey003 = '#41475708';
const grey007 = '#41475712';
const light00 = '#5B5E69';
const gray60 = '#0E131D';
const darkMagenta16 = '#f551f929';
const darkMagenta24 = '#f551f93d';
const grey500 = '#ABB3B9';
const dangerRed = '#D71616';
const hoverRed = '#E74444';
const pressedRed = '#C51111';
const red8 = '#d7161614';
const red15 = '#d7161626';
const red40 = '#d7161666';
const red = '#d71616';
const orange = '#F2994A';
const orange8 = '#e9791214';
const orange40 = '#e9791266';

const warning = '#E97912';
const warningStatusText = '#D37015';
const warning8 = '#e9791214';
const warning40 = '#e9791266';

const warningOrange = '#ED6C02';
const warningYellow = '#FFC124';
const orangeFill5 = '#e979120d';
const orangeOutline40 = '#e9791266';
const green40 = '#2bd48d66';
const green20 = '#2bd48d33';
const green8 = '#2bd48d14';
const green = '#2AB37A';
const greenDefaultBtn = '#108D22';
const greenHoverBtn = '#15A42A';
const magenta = '#f47cff';
const magenta24 = '#f47cff3d';
const magentaDefault = '#c428dd';
const magentaHover = '#f47cff';
const magentaDisabled = '#CB93D4';
const darkMagenta30 = '#f551f94d';
const darkMagenta20 = '#f551f933';
const darkMagenta10 = '#f551f91a';
const gradient = 'linear-gradient(270deg, #EBF1F8 0%, #FFF9FF 100%)';
const white01 = '#fafafa';
const light10 = '#777A83';
const light20 = '#adafb7';
const light30 = '#cbced6';
const light40 = '#e1e5e9';
const light53 = '#F4F5F5';
const lightStepBorder = '#bdbdbd';
const dark20 = '#3d445633';
const dark10 = '#3d44561a';
const dark5 = '#3d44560d';
const dark6 = '#3d44560f'; // conversation hover light
const dark8 = '#3d445614';

// const dark8 = '#3d445614'; // general hover fallback
const blue8 = '#6ae8fa14';
const blueFill8 = '#29b8f514';
const blue12 = '#6390fe1f'; // conversation selected light
const gray30 = '#3B3E46';
const white15 = '#ffffff26';
const lightGrey = '#d9d9d9';
export const blue01 = '#f8fcff';
const blue02 = '#6eb1ff';
const blue03 = '#6390fe';
const blue04 = '#93b2ff';
const blue = '#29B8F5';
const darkBlue = '#006DD1';
const darkBlueLowOpacity = '#006dd166';
const darkBlue70 = '#006dd1b3';
const completedBlue = '#036ED033';
const hoverBlue = '#2783D8';
const almostWhite = '#FAFAFA';
const magenta08 = '#c428dd14';
const dark15 = '#3d445626';
const semiTransparentBlack = '#ffffff80';

const purpleLight = '#f551f9';
const purpleDark = '#feb4ff';
const purpleShadow = '#f12bff33';
const lightPurpleBgr = '#F0EDF7';
const lightOrangeBgr = '#FFF1E4';
const lightPurple = '#A48EE3';
const lightOrange = '#FFB380';
const yellow = '#FEBD17';
const greenOutline40 = '#2ab37a66';

const oldLightPalette = {
  mode: 'light',
  primary: {
    main: magentaDefault,
    pressed: magentaDefault,
  },
  secondary: {
    main: light10,
  },
  info: {
    main: blue03,
    secondary: blue02,
  },
  step: {
    default: { border: lightStepBorder, icon: dark10 },
    active: darkBlueLowOpacity,
    completed: {
      border: darkBlue,
      background: completedBlue,
      icon: darkBlue,
    },
  },
  background: {
    info: blue8,
    default: blue01,
    eliteaDefault: gradient,
    secondary: white,
    tabPanel: white01,
    pageSection: white01,
    section: grey003,
    modal: {
      simple: white,
    },
    chatBkg: almostWhite,
    dragging: blue12,
    userInputBorderLight: purpleLight,
    userInputBorderDark: purpleDark,
    userInputBackground: dark5,
    userInputBackgroundActive: dark10,
    userInputBorderShadow: purpleShadow,
    warningBkg: red15,
    wrongBkg: red40,
    errorBkg: red8,
    onboardingBody: white01,
    warning,
    warning40,
    warning8,
    codeMirrorEditor: almostWhite,
    dark10,
    dark15,
    dark20,
    card: {
      default: white,
      hover: white,
      gradientDark: 'linear-gradient(180deg, #FFFFFF 0%, #ffffff00 100%)',
      hoverBorderGradient: 'linear-gradient(0deg, #f7aeff 0%, #F37DFF 100%)',
      hoverShadow: '0px -3px 0.9375rem 0px #e138ff4d',
    },
    interactiveTourPrompt: {
      backdrop: 'rgba(59, 62, 70, 0.5)',
      card: 'linear-gradient(180deg, #EFF8FF 0%, #BAD1FF 100%)',
      borderGradient: 'linear-gradient(186.77deg, #5194FF 5.31%, #A6DAFF 94.69%)',
      dividerGradient: 'linear-gradient(90deg, #f68eff00 0%, #8DACFF 49.7%, #f68eff00 100%)',
      counter: '#5c82bf',
    },
    resourceCard: {
      blue: {
        card: 'linear-gradient(0deg, #d6ebff66 0%, #D6EBFF 100%)',
        icon: 'linear-gradient(45.36deg, #0094ff4d 16.25%, #0094ff17 87.07%)',
        iconColor: '#0094FF',
        iconBorderGradient: 'linear-gradient(180deg, #0094ff00 0%, #0094ff66 100%)',
        divider: '#0094ff26',
        borderGradient: 'linear-gradient(180deg, #0094ff33 0%, #0094ff00 100%)',
      },
      orange: {
        card: 'linear-gradient(180deg, #ffcf8d4d 0%, #ffcf8d1f 100%)',
        icon: 'linear-gradient(45.36deg, #f5ad494d 16.25%, #f5ad4917 87.07%)',
        iconColor: '#F5AD49',
        iconBorderGradient: 'linear-gradient(180deg, #f5ad4900 0%, #f5ad4966 100%)',
        divider: '#f5ad4926',
        borderGradient: 'linear-gradient(180deg, #f5ad4933 0%, #f5ad4900 100%)',
      },
      purple: {
        card: 'linear-gradient(180deg, #F0E7FF 0%, #f0e7ff66 100%)',
        icon: 'linear-gradient(45.36deg, #a473ff4d 16.25%, #a473ff17 87.07%)',
        iconColor: '#A473FF',
        iconBorderGradient: 'linear-gradient(180deg, #a473ff00 0%, #a473ff66 100%)',
        divider: '#a473ff26',
        borderGradient: 'linear-gradient(180deg, #a473ff33 0%, #a473ff00 100%)',
      },
      green: {
        card: 'linear-gradient(0deg, #d3fbdb66 0%, #d3fbdb 100%)',
        icon: 'linear-gradient(45.36deg, #4bba884d 16.25%, #4bba8817 87.07%)',
        iconColor: '#4BBA88',
        iconBorderGradient: 'linear-gradient(180deg, #4bba8800 0%, #4bba8866 100%)',
        divider: '#4bba8826',
        borderGradient: 'linear-gradient(180deg, #4bba8833 0%, #4bba8800 100%)',
      },
      pink: {
        card: 'linear-gradient(180deg, #FFE8F1 0%, #ffe8f166 100%)',
        icon: 'linear-gradient(45.36deg, #ff73b04d 16.25%, #ff73b017 87.07%)',
        iconColor: '#FF73B0',
        iconBorderGradient: 'linear-gradient(180deg, #ff73b000 0%, #ff73b066 100%)',
        divider: '#ff73b026',
        borderGradient: 'linear-gradient(180deg, #ff73b033 0%, #ff73b000 100%)',
      },
    },
    categoriesButton: {
      selected: {
        active: blue03,
        hover: blue02,
      },
    },
    dataGrid: {
      main: light40,
      secondary: white01,
      row: {
        selected: magenta08,
      },
    },
    tabButton: {
      default: dark5,
      hover: dark10,
      active: dark20,
      disabled: dark5,
    },
    icon: {
      default: dark10,
      trophy: '#48433F',
      checkedBox: light10,
      entityGradient: 'linear-gradient(45.36deg, #777a7c4d 16.25%, #e2e2e24d 87.07%)',
      entityBorderGradient: 'linear-gradient(225deg, #3b42461a 12.64%, #3b424659 87.88%)',
    },
    select: {
      hover: dark10,
      selected: {
        default: darkMagenta16,
        hover: darkMagenta24,
      },
    },
    button: {
      default: dark10,
      normal: dark10,
      danger: dangerRed,
      primary: {
        default: magentaDefault,
        hover: magentaHover,
        pressed: magentaHover,
        disabled: light20,
      },
      secondary: {
        default: dark10,
        hover: dark20,
        pressed: dark20,
        disabled: light20,
      },
      tertiary: {
        hover: dark10,
        pressed: dark10,
      },
      alarm: {
        default: dangerRed,
        hover: hoverRed,
        pressed: pressedRed,
        disabled: light20,
      },
      drawerMenu: {
        default: 'transparent',
        hover: dark5,
        selected: dark10,
      },
      agentHub: {
        default: 'transparent',
        hover: '#C6B8FF33',
        active: '#C6B8FF33',
        shadowDefault: 'none',
        shadowHover: 'none',
        shadowActive: '0px 0px 15px 0px #A754FF33 inset',
        textGradient: 'linear-gradient(90deg, #DD32FF 0.7%, #8147FF 30%)',
        iconGradient: 'linear-gradient(33.96deg, #E345FF 0%, #A274FF 80%)',
      },
      iconLabelButton: {
        default: 'transparent',
        hover: dark5,
        selected: dark10,
        disabled: 'transparent',
      },
      neutral: {
        default: darkBlue,
        hover: hoverBlue,
        pressed: darkBlue,
        disabled: light20,
      },
      positive: {
        default: greenDefaultBtn,
        hover: greenHoverBtn,
        pressed: greenDefaultBtn,
        disabled: light20,
      },
      magicAssistant: magenta24,
    },
    switch: {
      default: {
        on: { thumb: magentaDefault, track: darkMagenta30 },
        off: { thumb: light10, track: dark20 },
      },
      disabled: {
        on: { thumb: magentaDisabled, track: darkMagenta30 },
        off: { thumb: light20, track: dark20 },
      },
    },
    tabs: {
      default: magentaDefault,
    },
    tab: {
      default: light10,
      hover: magentaHover,
      active: magentaDefault,
      disabled: light20,
    },
    tooltip: {
      default: gray30,
      code: white15,
    },
    tips: blueFill08,
    attention: orangeFill5,
    text: {
      highlight: orange,
    },
    aiAnswerBkg: white,
    aiParticipantIcon: skyBlue20,
    aiAnswerActions: 'linear-gradient(270deg, #FFFFFF 82.5%, #ffffff00 100%)',
    userMessageActions: 'linear-gradient(270deg, #EFF3FA 85.36%, #ecf1f900 100%)',
    conversationStarters: {
      default: skyBlue20,
      hover: skyBlue40,
    },
    conversationEditor: light40,
    conversationTopCover: 'linear-gradient(360deg, #ffffff00 0%, #FFFFFF 100%)',
    conversationBottomCover: 'linear-gradient(180deg, #ffffff00 0%, #FFFFFF 100%)',
    avatar: lightGrey,
    categoryHeader: blue01,
    tag: {
      default: white,
      selected: blue03,
    },
    notificationList: white,
    participant: {
      default: dark5,
      hover: dark10,
      active: darkMagenta10,
      cover: semiTransparentBlack,
    },
    conversation: {
      normal: 'transparent',
      hover: dark6, // defined conversation hover color
      selected: blue12, // defined conversation selected color
    },
    highlightUserMessage: skyBlue20,
    tagEditor: {
      tag: light40,
    },
    tagChip: {
      default: white01,
      hover: dark20,
      active: {
        default: blue03,
        hover: blue02,
      },
      disabled: dark10,
    },
    showContextDialog: gradient,
    sideBar: 'linear-gradient(180deg, #E4F0FF 0%, #FDEAFF 100%);',
    imageAttachment: `linear-gradient(0deg, #FFFFFF 0%, #ffffff00 100%)`,
    agentModal: {
      border: 'linear-gradient(224.66deg, #8BC9FF 0%, #FDA3FF 99.46%)',
      background: 'linear-gradient(224.97deg, #DEEDFF 0%, #F9DFFE 100%)',
      content: {
        border: 'linear-gradient(224.66deg, #8BC9FF 0%, #FDA3FF 99.46%)',
        background: blue01,
      },
    },
    toolCard: {
      hover: dark8,
    },
    deprecated: warningStatusText,
    mcp: {
      loginSuccess: green8,
      logout: orange8,
    },
    onboarding: 'linear-gradient(247.51deg, #a1c5ff99 0.02%, #a1c5ff1f 50.21%, #a1d6ff99 99.64%)',
    welcome: {
      outside: 'linear-gradient(42.04deg, #61ede966 8.85%, #fb42ff66 89.62%)',
      inner: 'linear-gradient(63.16deg, #29a9a524 16.12%, #e72feb24 85.3%)',
    },
    banner: {
      default: 'linear-gradient(30deg, #ffd6c1 8.85%, #e5d7ff 89.62%)',
      border: 'linear-gradient(42.04deg, #f6ac66 8.85%, #d780ff 89.62%)',
    },
    settingsPage: gradient,
    chatContinueBackground: dark10,
    aiProviderAccordion: {
      default: grey003,
      hover: grey007,
    },
    emptyState: {
      default: grey003,
    },
    toolkitDetailLeftPanel: light53,
    toolkitDetailRightPanel: light53,
    indexResult: {
      success: green8,
      error: red8,
      warning: orange8,
      info: blueFill8,
    },
    folder: {
      default: '#ffffff99',
      active: '#6390fe1a',
      borderHover: blue03,
      borderActive: blue03,
      shadow: '0 0.125rem 0.25rem #0000001f',
    },
  },
  border: {
    lines: light30,
    hover: light10,
    inputHover: light20,
    category: {
      selected: dark20,
    },
    tips: blue02,
    attention: orangeOutline40,
    table: light40,
    userMessageEditor: magentaDefault,
    notificationItem: light40,
    cardsOutlines: light40,
    cardsOutlinesGradient: 'linear-gradient(0deg, #d0d5da99 0%, #D0D5DA 100%)',
    toolCardGradient: light40,
    blue04,
    conversationItemDivider: dark10,
    highlightUserMessage: skyBlue40,
    error: red40,
    flowNode: light20,
    sidebarDivider: dark10,
    chatEditPlaceholderBorder: blue03,
    mcp: {
      loginSuccess: green40,
      logout: orange40,
    },
    chatContinue: darkMagenta30,
    aiProviderAccordion: 'linear-gradient(0deg, #41475700 0%, #41475714 100%)',
    reindexInfoContainer: yellow,
    indexResult: {
      success: greenOutline40,
      error: red40,
      warning: orangeOutline40,
      info: skyBlue40,
    },
  },
  boxShadow: {
    default: `0px 2px 10px 0px #64778833`,
    tagEditorPaper: '0px 2px 10px 0px #64778833',
    tag: '0px 2px 4px 0px #0000000f',
    onboarding: `0rem 3.975rem 4.2625rem -3.8125rem ${skyBlue20}`,
    aiAnswer: '0px 2px 7px 0px #0000001f',
  },
  text: {
    default: light10,
    primary: light10,
    secondary: gray60,
    tooltip: white,

    groupedTitle: {
      default: light10,
    },
    error: dangerRed,
    button: {
      primary: blue01,
      secondary: blue01,
      disabled: light20,
      showMore: magentaDefault,
      auxiliary: magentaHover,
    },
    tabButton: { default: light10, hover: gray60, active: gray60, disabled: light20 },
    input: {
      label: light10,
      primary: gradient,
      placeholder: light30,
      placeholderSecondary: light20,
      disabled: light10,
    },
    select: {
      selected: {
        primary: gray60,
        secondary: light10,
      },
    },
    tag: {
      default: gray60,
      selected: white,
    },
    tagChip: {
      default: gray60,
      active: white,
      disabled: light20,
    },
    participant: {
      default: light20,
    },
    info: blue03,
    tips: darkBlue,
    attention: warningStatusText,
    metrics: light00,
    contextHighLight: '#3d3d3d',
    warningText: red,
    deleteAlertEntityName: darkBlue,
    deleteAlertText: gray60,
    createButton: gray60,
    deprecated: white,
    mcp: {
      loginSuccess: green,
      logout: orange,
    },
    link: darkBlue,
    linkSeen: darkBlue70,
    highlighted: gray60, //magenta,
    indexResult: {
      success: green,
      error: red,
      warning: orange,
      info: darkBlue,
    },
  },
  icon: {
    main: light10,
    fill: {
      default: light10,
      primary: grey500,
      secondary: gray60,
      send: white,
      trophy: '#FFD3A0',
      tips: darkBlue,
      disabled: light20,
      attention: orange,
      warning,
      info: blue,
      successModal: greenHoverBtn,
      is_default: green20,
      success: green,
      active: magentaDefault,
      inactive: blue,
      magicAssistant: magenta,
      error: dangerRed,
      delete: white,
      stateButton: light10,
      stateButtonHover: light00,
      button: white,
    },
    tagChip: {
      default: light10,
      hover: gray60,
      active: white,
      disabled: light20,
    },
    indexResult: {
      success: greenHoverBtn,
      error: dangerRed,
      warning: orange,
      info: darkBlue,
    },
  },
  checkbox: {
    default: light10,
    hover: { on: light10, off: gray60 },
    active: gray60,
    mark: white,
    disabled: light20,
  },
  radio: { default: light10, hover: { off: gray60 }, active: gray60, disabled: light20 },
  aiAssistant: {
    iconBackground: 'linear-gradient(222.04deg, #68b1ff61 10.38%, #fda1ff61 91.15%)',
    iconBorder: 'linear-gradient(222.04deg, #299bff21 10.38%, #fb37ffa3 91.15%)',
    iconGradientStart: '#F534FF',
    iconGradientEnd: '#5CA0FE',
  },
  split: {
    default: darkMagenta20,
    hover: darkMagenta30,
    pressed: darkMagenta10,
    disabled: dark10,
    text: {
      default: gray60,
      pressed: gray60,
      disabled: light10,
    },
  },
  status: {
    draft: blue03,
    onModeration: warning,
    warningText: warningStatusText,
    published: green,
    publishedIcon: greenDefaultBtn,
    publishedBackground: green8,
    publishedText: greenHoverBtn,
    publishedBorder: green,
    rejected: dangerRed,
    rejectedText: dangerRed,
    userApproval: magenta,
  },
  warning: {
    main: warningOrange,
    yellow: warningYellow,
  },
  nodeColors: {
    // pipeline node colors
    toolkit: '#C0C4FF', // Toolkit - dark blue
    mcp: '#F0A4FF',
    tool: '#E0E4FF', // Tool - light blue
    agent: '#D5FCD9', // Agent - light green
    pipeline: '#EAD3FE', // Pipeline - light purple
    function: '#EFE3FB', // Function - light purple
    llm: '#D2EDFF', // LLM - light blue
    decision: '#FFD2E6', // Decision - light pink
    condition: '#F8FCD5', // Condition - light yellow/green
    loop: '#FFEDD4', // Loop - light orange
    loop_from_tool: '#FFE0D4', // Loop from tool - light peach
    router: '#C7FFEF', // Router - light teal
    state_modifier: '#E2FFBD', // State modifier - light green
    code: '#F5E6FF', // Code - light lavender
    printer: '#63EF9FFF', // Printer - 50 shades of green
    hitl: '#FFE0B6', // HITL - light amber
    custom: '#FFD5D5', // Custom - light red
  },
  scrollbar: {
    thumb: dark10,
    thumbHover: light10,
  },
  diff: {
    removed: '#d716164d',
    added: '#2ab37a4d',
  },
  capability: {
    vision: {
      background: lightPurpleBgr,
      icon: lightPurple,
    },
    reasoning: {
      background: lightOrangeBgr,
      icon: lightOrange,
    },
  },
  suggestionChip: {
    border: light30,
    background: {
      default: 'transparent',
      hover: dark10,
    },
    text: {
      default: light00,
      hover: gray60,
    },
  },
};

// Color variables for customizable themes
const lightColorScheme = {
  // NPS Card accents
  accentLight: '#f7d9ff',
  accentMid: '#d5e3fe',
  accentDark: '#93b2ff',

  // Button states
  accentDefault: '#c428dd',
  accentHover: '#c428ddd9',
  accentPressed: '#c428ddb3',
  accentDisabled: '#c428dd66',
  outlineDefault: '#3d44561a',
  outlineHover: '#3d445626',
  outlinePressed: '#3d445633',

  // Text
  textWhite: '#FFFFFF',
  textLight: '#777A83',
  textDarker: '#0E131D',
};

const lightPalette = {
  ...oldLightPalette,
  background: {
    ...oldLightPalette.background,
    npsCard: `linear-gradient(to top, ${lightColorScheme.accentLight}, ${lightColorScheme.accentMid})`,
    button: {
      ...oldLightPalette.background.button,
      npsCard: {
        primary: {
          default: lightColorScheme.accentDefault,
          hover: lightColorScheme.accentHover,
          pressed: lightColorScheme.accentPressed,
          disabled: lightColorScheme.accentDisabled,
        },
        secondary: {
          default: lightColorScheme.outlineDefault,
          hover: lightColorScheme.outlineHover,
          pressed: lightColorScheme.outlinePressed,
        },
      },
    },
  },
  border: {
    ...oldLightPalette.border,
    npsCard: lightColorScheme.accentDark,
  },
  text: {
    ...oldLightPalette.text,
    white: lightColorScheme.textWhite,
    light: lightColorScheme.textLight,
    darker: lightColorScheme.textDarker,
  },
};

export default lightPalette;
