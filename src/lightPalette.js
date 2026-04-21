import { white } from './darkPalette';

// const white14 = 'rgba(255, 255, 255, 0.14)';
// const veryLightBlue = '#C7EBFF';
const blueFill08 = 'rgba(41, 184, 245, 0.08)';
const skyBlue20 = ' rgba(80, 161, 255, 0.2)';
const skyBlue40 = ' rgba(80, 161, 255, 0.4)';
const light00 = '#5B5E69';
const gray60 = '#0E131D';
const darkMagenta16 = 'rgba(245, 81, 249, 0.16)';
const darkMagenta24 = 'rgba(245, 81, 249, 0.24)';
const grey500 = '#ABB3B9';
const dangerRed = '#D71616';
const hoverRed = '#E74444';
const pressedRed = '#C51111';
const red8 = 'rgba(215, 22, 22, 0.08)';
const red15 = 'rgba(215, 22, 22, 0.15)';
const red20 = 'rgba(215, 22, 22, 0.20)';
const red40 = 'rgba(215, 22, 22, 0.4)';
const red = 'rgba(215, 22, 22, 1)';
const orange = '#F2994A';
const orange8 = 'rgba(233, 121, 18, 0.08)';
const orange40 = 'rgba(233, 121, 18, 0.4)';

const warning = 'rgba(233, 121, 18, 1)';
const warning8 = 'rgba(233, 121, 18, 0.08)';
const warning40 = 'rgba(233, 121, 18, 0.4)';

const warningOrange = '#ED6C02';
const warningYellow = '#FFC124';
const orange10 = 'rgba(211, 112, 21, 1)';
const orangeFill5 = 'rgba(233, 121, 18, 0.05)';
const orangeOutline40 = 'rgba(233, 121, 18, 0.4)';
const green40 = 'rgba(43, 212, 141, 0.40)';
const green20 = 'rgba(43, 212, 141, 0.20)';
const green8 = 'rgba(43, 212, 141, 0.08)';
const green = '#2AB37A';
const greenDefaultBtn = '#108D22';
const greenHoverBtn = '#15A42A';
const magenta = 'rgba(244, 124, 255, 1)';
const magenta24 = 'rgba(244, 124, 255, 0.24)';
const magentaDefault = 'rgba(196, 40, 221, 1)';
const magentaHover = 'rgba(244, 124, 255, 1)';
const magentaDisabled = '#CB93D4';
const darkMagenta30 = 'rgba(245, 81, 249, 0.3)';
const darkMagenta20 = 'rgba(245, 81, 249, 0.2)';
const darkMagenta10 = 'rgba(245, 81, 249, 0.1)';
const gradient = 'linear-gradient(270deg, #EBF1F8 0%, #FFF9FF 100%)';
const white01 = 'rgba(250, 250, 250, 1)';
const light10 = '#777A83';
const light20 = 'rgba(173, 175, 183, 1)';
const light30 = 'rgba(203, 206, 214, 1)';
const light40 = 'rgba(225, 229, 233, 1)';
const dark20 = 'rgba(61, 68, 86, 0.2)';
const dark10 = 'rgba(61, 68, 86, 0.1)';
const dark5 = 'rgba(61, 68, 86, 0.05)';
const dark6 = 'rgba(61, 68, 86, 0.06)'; // conversation hover light
const dark8 = 'rgba(61, 68, 86, 0.08)';

// const dark8 = 'rgba(61, 68, 86, 0.08)'; // general hover fallback
const blue8 = 'rgba(106, 232, 250, 0.08)';
const blue12 = 'rgba(99, 144, 254, 0.12)'; // conversation selected light
const gray30 = '#3B3E46';
const lightGrey = 'rgba(217, 217, 217, 1)';
export const blue01 = 'rgba(248, 252, 255, 1)';
const blue02 = 'rgba(110, 177, 255, 1)';
const blue03 = 'rgba(99, 144, 254, 1)';
const blue = 'rgba(41, 184, 245, 1)';
const darkBlue = '#006DD1';
const hoverBlue = '#2783D8';
const almostWhite = '#FAFAFA';
const magenta08 = 'rgba(196, 40, 221, 0.08)';
const semiTransparentBlack = 'rgba(255, 255, 255, 0.5)';

const purpleLight = 'rgba(245, 81, 249, 1)';
const purpleDark = 'rgba(254, 180, 255, 1)';
const purpleShadow = 'rgba(241, 43, 255, 0.2)';
const lightPurpleBgr = '#F0EDF7';
const lightOrangeBgr = '#FFF1E4';
const lightPurple = '#A48EE3';
const lightOrange = '#FFB380';

const lightPalette = {
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
  background: {
    info: blue8,
    default: blue01,
    eliteaDefault: gradient,
    secondary: white,
    tabPanel: white01,
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
    card: {
      default: white,
      hover: white,
      gradientDark: 'linear-gradient(180deg, #FFFFFF 0%, rgba(255, 255, 255, 0) 100%)',
      hoverBorderGradient: 'linear-gradient(0deg, #F7AEFF 0%, #F37DFF 100%)',
      hoverShadow: '0px -3px 0.9375rem 0px rgba(225, 56, 255, 0.3)',
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
      entityGradient:
        'linear-gradient(45.36deg, rgba(119, 122, 124, 0.3) 16.25%, rgba(226, 226, 226, 0.3) 87.07%)',
      entityBorderGradient:
        'linear-gradient(225deg, rgba(59, 66, 70, 0.1) 12.64%, rgba(59, 66, 70, 0.35) 87.88%)',
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
    },
    tips: blueFill08,
    attention: orangeFill5,
    text: {
      highlight: orange,
    },
    aiAnswerBkg: white,
    aiParticipantIcon: skyBlue20,
    aiAnswerActions: 'linear-gradient(270deg, #FFFFFF 82.5%, rgba(255, 255, 255, 0) 100%)',
    userMessageActions: 'linear-gradient(270deg, #EFF3FA 85.36%, rgba(236, 241, 249, 0) 100%)',
    conversationStarters: {
      default: skyBlue20,
      hover: skyBlue40,
    },
    conversationEditor: light40,
    conversationTopCover: 'linear-gradient(360deg, rgba(255, 255, 255, 0) 0%, #FFFFFF 100%)',
    conversationBottomCover: 'linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, #FFFFFF 100%)',
    moderator: red20,
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
    imageAttachment: `linear-gradient(0deg, #FFFFFF 0%, rgba(255, 255, 255, 0) 100%)`,
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
      default: 'linear-gradient(30deg, rgba(255, 214, 193, 1) 8.85%, rgba(229, 215, 255, 1) 89.62%)',
      border: 'linear-gradient(42.04deg, rgba(246, 172, 102, 1) 8.85%, rgba(215, 128, 255, 1) 89.62%)',
    },
    settingsPage: 'linear-gradient(270deg, #EBF1F8 0%, #FFF9FF 100%)',
    chatContinueBackground: dark10,
  },
  border: {
    lines: light30,
    hover: light10,
    category: {
      selected: dark20,
    },
    tips: blue02,
    attention: orangeOutline40,
    table: light40,
    userMessageEditor: magentaDefault,
    notificationItem: light40,
    cardsOutlines: light40,
    cardsOutlinesGradient: 'linear-gradient(0deg, rgba(208, 213, 218, 0.6) 0%, #D0D5DA 100%)',
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
  },
  boxShadow: {
    default: `0px 2px 10px 0px rgba(100, 119, 136, 0.2)`,
    tagEditorPaper: '0px 2px 10px 0px rgba(100, 119, 136, 0.2)',
    tag: '0px 2px 4px 0px rgba(0, 0, 0, 0.06)',
    onboarding: `0rem 3.975rem 4.2625rem -3.8125rem ${skyBlue20}`,
    aiAnswer: '0px 2px 7px 0px rgba(0, 0, 0, 0.12)',
  },
  text: {
    default: light10,
    primary: light10,
    secondary: gray60,
    tooltip: white,
    groupedTitle: {
      default: light10,
    },
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
    attention: orange10,
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
    link: blue,
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
      is_default: green20,
      success: green,
      active: magentaDefault,
      inactive: blue,
      magicAssistant: magenta,
      error: dangerRed,
      delete: white,
      stateButton: '#777A83',
      stateButtonHover: light00,
      button: white,
    },
    tagChip: {
      default: light10,
      hover: gray60,
      active: white,
      disabled: light20,
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
    iconBackground:
      'linear-gradient(222.04deg, rgba(104, 177, 255, 0.38) 10.38%, rgba(253, 161, 255, 0.38) 91.15%)',
    iconBorder:
      'linear-gradient(222.04deg, rgba(41, 155, 255, 0.128) 10.38%, rgba(251, 55, 255, 0.64) 91.15%)',
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
};

export default lightPalette;
