const primaryDefault = '#6ae8fa';
const primaryDisabled = '#267985';
export const white = '#FFFFFF';
const white5 = 'rgba(255, 255, 255, 0.05)';
const white6 = 'rgba(255, 255, 255, 0.06)'; // conversation hover dark
const white8 = 'rgba(255, 255, 255, 0.08)'; // tool card hover light

const warning = 'rgba(233, 121, 18, 1)';
const warning8 = 'rgba(233, 121, 18, 0.08)';
const warning40 = 'rgba(233, 121, 18, 0.4)';

const white10 = 'rgba(255, 255, 255, 0.10)';
const white14 = 'rgba(255, 255, 255, 0.14)';
const white20 = 'rgba(255, 255, 255, 0.20)';
const white50 = 'rgba(255, 255, 255, 0.50)';
const blue15 = 'rgba(41, 184, 245, 0.15)'; // conversation selected dark
const veryLightBlue = '#C7EBFF';
const skyBlue = '#29B8F5';
const gray00 = '#CAD0D8';
const gray10 = '#A9B7C1';
const gray20 = '#686C76';
const gray30 = '#3B3E46';
const gray40 = '#262b34';
const gray50 = '#181F2A';
const gray55 = '#101721';
const gray58 = 'rgba(12, 17, 25, 1)';
const gray60 = '#0E131D';
const blue5 = 'rgba(41, 184, 245, 0.05)';
const blue8 = 'rgba(106, 232, 250, 0.08)';
const blue10 = 'rgba(106, 232, 250, 0.10)';
const blue16 = 'rgba(106, 232, 250, 0.16)';
const blue20 = 'rgba(106, 232, 250, 0.20)';
const blue24 = 'rgba(106, 232, 250, 0.24)';
const blue30 = 'rgba(106, 232, 250, 0.30)';
const blue40 = 'rgba(41, 184, 245, 0.40)';
const skyBlue20 = 'rgba(41, 184, 245, 0.20)';
export const darkBlue = '#006DD1';
const hoverBlue = '#2783D8';
const darkBlue40 = '#29B8F566';
const grey500 = '#ABB3B9';
const dangerRed = '#D71616';
const hoverRed = '#E74444';
const pressedRed = '#C51111';
const red8 = 'rgba(215, 22, 22, 0.08)';
const red15 = 'rgba(215, 22, 22, 0.15)';
const red20 = 'rgba(215, 22, 22, 0.20)';
const red40 = 'rgba(215, 22, 22, 0.4)';
const lightRed = 'rgba(255, 223, 223, 1)';
const primaryHover = '#83EFFF';
const primaryPressed = 'rgba(42, 189, 210, 1)';
const blue = 'rgba(41, 184, 245, 1)';
const orange = '#F2994A';
const orange10 = 'rgba(211, 112, 21, 1)';
const orange8 = 'rgba(233, 121, 18, 0.08)';
const orange40 = 'rgba(233, 121, 18, 0.4)';
const warningOrange = '#ED6C02';
const warningYellow = '#E8B747';
const lightOrange = 'rgba(255, 235, 211, 1)';
const orangeFill5 = 'rgba(233, 121, 18, 0.05)';
const orangeOutline40 = 'rgba(233, 121, 18, 0.4)';
const green40 = 'rgba(43, 212, 141, 0.40)';
const green20 = 'rgba(43, 212, 141, 0.20)';
const green8 = 'rgba(43, 212, 141, 0.08)';
const green = '#2BD48D';
const greenDefaultBtn = '#108D22';
const greenHoverBtn = '#15A42A';
const greenLight = 'rgba(30, 209, 222, 1)';
const greenDark = 'rgba(15, 81, 96, 1)';
const greenShadow = 'rgba(21, 255, 247, 0.2)';
const lightGreen = 'rgba(220, 255, 233, 1)';
const magenta40 = 'rgba(222, 126, 218, 0.4)';
const magenta20 = 'rgba(222, 126, 218, 0.2)';
const magenta = 'rgba(244, 124, 255, 1)';
const magenta24 = 'rgba(244, 124, 255, 0.24)';
const deepGrey = '#1a1f28';
const semiTransparentBlack = 'rgba(16, 23, 33, 0.5)';

const darkPalette = {
  mode: 'dark',
  primary: {
    main: primaryDefault,
    hover: primaryHover,
    pressed: primaryPressed,
  },
  secondary: {
    main: gray10,
  },
  info: {
    main: darkBlue,
    secondary: darkBlue40,
  },
  background: {
    info: blue8,
    default: gray60,
    alitaDefault: gray60,
    secondary: gray50,
    tabPanel: gray55,
    chatBkg: gray55,
    dragging: blue10,
    userInputBackground: white5,
    userInputBorderLight: greenLight,
    userInputBorderDark: greenDark,
    userInputBorderShadow: greenShadow,
    userInputBackgroundActive: white10,
    warningBkg: red15,
    wrongBkg: red40,
    errorBkg: red8,
    onboardingBody: gray58,
    warning,
    warning40,
    warning8,
    card: {
      default: gray50,
      hover: gray58,
    },
    categoriesButton: {
      selected: {
        active: darkBlue,
        hover: darkBlue40,
      },
    },
    dataGrid: {
      main: gray40,
      secondary: gray55,
      row: {
        selected: blue16,
      },
    },
    tabButton: {
      default: white5,
      hover: white10,
      active: white20,
      disabled: white5,
    },
    icon: {
      default: white10,
      trophy: '#48433F',
      checkedBox: gray10,
    },
    select: {
      hover: white10,
      selected: {
        default: blue16,
        hover: blue24,
      },
    },
    button: {
      default: white10,
      normal: white10,
      danger: dangerRed,
      primary: {
        default: primaryDefault,
        hover: primaryHover,
        pressed: primaryPressed,
        disabled: gray20,
      },
      secondary: {
        default: white10,
        hover: white20,
        pressed: gray60,
        disabled: gray20,
      },
      tertiary: {
        hover: white10,
        pressed: white20,
      },
      alarm: {
        default: dangerRed,
        hover: hoverRed,
        pressed: pressedRed,
        disabled: gray20,
      },
      drawerMenu: {
        default: 'transparent',
        hover: white5,
        selected: white10,
      },
      iconLabelButton: {
        default: 'transparent',
        hover: white5,
        selected: white10,
        disabled: 'transparent',
      },
      neutral: {
        default: darkBlue,
        hover: hoverBlue,
        pressed: darkBlue,
        disabled: gray20,
      },
      positive: {
        default: greenDefaultBtn,
        hover: greenHoverBtn,
        pressed: greenDefaultBtn,
        disabled: gray20,
      },
      magicAssistant: magenta24,
    },
    switch: {
      default: {
        on: { thumb: primaryDefault, track: blue30 },
        off: { thumb: gray10, track: white20 },
      },
      disabled: {
        on: { thumb: primaryDisabled, track: blue30 },
        off: { thumb: gray20, track: white20 },
      },
    },
    tabs: {
      default: primaryDefault,
    },
    tab: {
      default: gray10,
      hover: primaryPressed,
      active: primaryDefault,
      disabled: gray20,
    },
    tooltip: {
      default: gray00,
    },
    tips: blue5,
    attention: orangeFill5,
    text: {
      highlight: orange,
    },
    aiAnswerBkg: gray40,
    aiParticipantIcon: skyBlue20,
    aiAnswerActions: 'linear-gradient(270deg, #262B34 82.5%, rgba(38, 43, 52, 0.00) 100%)',
    userMessageActions: 'linear-gradient(270deg, #0E131D 82.5%, rgba(14, 19, 29, 0.00) 100%)',
    conversationStarters: {
      default: magenta20,
      hover: magenta40,
    },
    conversationEditor: gray40,
    conversationTopCover: 'linear-gradient(360deg, rgba(16, 23, 33, 0) 0%, #0E131D 100%)',
    conversationBottomCover: 'linear-gradient(180deg, rgba(16, 23, 33, 0) 0%, #0E131D 100%)',
    moderator: red20,
    avatar: deepGrey,
    categoryHeader: gray60,
    tag: {
      default: gray50,
      selected: darkBlue,
    },
    notificationList: gray40,
    participant: {
      default: white5,
      hover: white10,
      active: blue10,
      cover: semiTransparentBlack,
    },
    conversation: {
      normal: 'transparent',
      hover: white6, // defined conversation hover color
      selected: blue15, // defined conversation selected color
    },
    highlightUserMessage: magenta20,
    tagEditor: {
      tag: gray40,
    },
    tagChip: {
      default: gray50,
      hover: white20,
      active: {
        default: darkBlue,
        hover: blue40,
      },
      disabled: white10,
    },
    showContextDialog: gray50,
    sideBar: 'linear-gradient(180deg, #0F1E33 0%, #1B172C 100%);',
    imageAttachment: `linear-gradient(0deg, #262B34 0%, rgba(59, 62, 70, 0) 100%)`,
    agentModal: {
      border: 'linear-gradient(224.97deg, #256B6D 0%, #7E2988 100%)',
      background: 'linear-gradient(199.39deg, #122830 0%, #2C173A 100%)',
      content: {
        border: 'linear-gradient(224.97deg, #256B6D 0%, #7E2988 100%)',
        background: gray60,
      },
    },
    toolCard: {
      hover: white8,
    },
    deprecated: orange10,
    mcp: {
      loginSuccess: green8,
      logout: orange8,
    },
    onboarding:
      'linear-gradient(247.51deg, rgba(161, 197, 255, 0.6) 0.02%, rgba(161, 197, 255, 0.12) 50.21%, rgba(161, 214, 255, 0.6) 99.64%)',
    welcome: {
      outside: 'linear-gradient(42.04deg, rgba(97, 237, 233, 0.4) 8.85%, rgba(251, 66, 255, 0.4) 89.62%)',
      inner: 'linear-gradient(63.16deg, rgba(41, 169, 165, 0.14) 16.12%, rgba(231, 47, 235, 0.14) 85.3%)',
    },
    banner: {
      default: 'linear-gradient(30deg, rgba(61, 37, 25, 1) 8.85%, rgba(36, 15, 60, 1) 89.62%)',
      border: 'linear-gradient(42.04deg, rgba(160, 87, 20, 1) 8.85%, rgba(117, 19, 170, 1) 89.62%)',
    },
    settingsPage: gray60,
    chatContinueBackground: white10,
  },
  border: {
    lines: gray30,
    hover: gray10,
    category: {
      selected: white20,
    },
    tips: blue40,
    attention: orangeOutline40,
    table: gray40,
    userMessageEditor: primaryPressed,
    notificationItem: gray60,
    cardsOutlines: gray40,
    conversationItemDivider: white10,
    highlightUserMessage: magenta40,
    error: dangerRed,
    flowNode: gray20,
    sidebarDivider: white10,
    chatEditPlaceholderBorder: darkBlue,
    mcp: {
      loginSuccess: green40,
      logout: orange40,
    },
    chatContinue: blue30,
  },
  boxShadow: {
    default: `0px 0px 8px 0px ${white14}`,
    tagEditorPaper: '0px 8px 12px 0px rgba(0, 0, 0, 0.3)',
    tag: 'none',
    onboarding: `0rem 3.975rem 4.2625rem -3.8125rem ${skyBlue20}`,
  },
  text: {
    default: gray10,
    primary: gray10,
    secondary: white,
    tooltip: gray60,
    groupedTitle: {
      default: gray10,
    },
    button: {
      primary: gray60,
      secondary: gray60,
      disabled: gray20,
      showMore: primaryPressed,
    },
    tabButton: { default: gray10, hover: white, active: white, disabled: gray20 },
    input: {
      label: gray10,
      primary: gray60,
      placeholder: gray30,
      disabled: white50,
    },
    select: {
      selected: {
        primary: white,
        secondary: gray10,
      },
    },
    tag: {
      default: white,
      selected: white,
    },
    tagChip: {
      default: white,
      active: white,
      disabled: gray20,
    },
    participant: {
      default: gray20,
    },
    info: skyBlue,
    tips: veryLightBlue,
    attention: lightOrange,
    metrics: gray00,
    contextHighLight: '#3d3d3d',
    warningText: lightRed,
    deleteAlertEntityName: skyBlue,
    deleteAlertText: white,
    createButton: primaryDefault,
    deprecated: white,
    mcp: {
      loginSuccess: lightGreen,
      logout: lightOrange,
    },
    link: blue,
  },
  icon: {
    main: gray10,
    fill: {
      default: gray10,
      primary: grey500,
      secondary: white,
      send: gray60,
      trophy: '#FFD3A0',
      tips: skyBlue,
      disabled: gray20,
      attention: orange,
      is_default: green20,
      success: green,
      active: primaryPressed,
      inactive: blue,
      magicAssistant: magenta,
      error: dangerRed,
      delete: gray50,
      stateButton: gray10,
      stateButtonHover: gray00,
      button: white,
    },
    tagChip: {
      default: gray10,
      active: white,
      disabled: gray20,
    },
  },
  checkbox: {
    default: gray10,
    hover: { on: gray10, off: white },
    active: white,
    mark: gray60,
    disabled: gray20,
  },
  radio: { default: gray10, hover: { off: white }, active: white, disabled: gray20 },
  aiAssistant: {
    iconBackground:
      'linear-gradient(to top right, rgba(41, 169, 165, 0.38) 8.85%, rgba(231, 47, 235, 0.38) 89.62%)',
    iconBorder:
      'linear-gradient(to top right, rgba(41, 255, 248, 0.64) 8.85%, rgba(251, 72, 255, 0.096) 89.62%)',
    iconGradientStart: '#50D2CE',
    iconGradientEnd: '#FA00FF',
  },
  split: {
    default: blue20,
    hover: blue30,
    pressed: blue10,
    disabled: white10,
    text: {
      default: primaryDefault,
      pressed: primaryPressed,
      disabled: gray10,
    },
  },
  status: {
    draft: skyBlue,
    onModeration: '#E97912',
    published: green,
    rejected: dangerRed,
    userApproval: magenta,
  },
  warning: {
    main: warningOrange,
    yellow: warningYellow,
  },
  nodeColors: {
    toolkit: '#11264C', // Toolkit - dark blue
    mcp: '#2B006F',
    tool: '#22264C', // Tool - dark blue
    agent: '#21372D', // Agent - dark green
    pipeline: '#2A173C', // Pipeline - dark purple
    function: '#352340', // Function - dark purple
    llm: '#183150', // LLM - dark blue
    decision: '#331531', // Decision - dark purple
    condition: '#2C2E1C', // Condition - dark green/brown
    loop: '#32281A', // Loop - dark brown
    loop_from_tool: '#3D2418', // Loop from tool - dark brown
    router: '#0F342E', // Router - dark teal
    state_modifier: '#233509', // State modifier - dark green
    code: '#2D1A3A', // Code - dark lavender/purple
    printer: '#075164', // Printer - 50 shades of green
    hitl: '#5A3D23', // HITL - dark amber

    custom: '#351C1C', // Custom - dark red
  },
};

export default darkPalette;
