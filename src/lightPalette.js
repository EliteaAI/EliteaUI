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
const orange = '#E97912';
const orange8 = '#e9791214';
const orange40 = '#e9791266';

const warningStatusText = '#D37015';

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

const blue8 = '#6ae8fa14';
const blueFill8 = '#29b8f514';
const blue12 = '#6390fe1f'; // conversation selected light
const gray30 = '#3B3E46';
const white15 = '#ffffff26';
const lightGrey = '#d9d9d9';
const blue01 = '#f8fcff';
const blue02 = '#6eb1ff';
const irisBlue = '#6390fe';
const blue = '#29B8F5';
const darkBlue = '#006DD1';
const darkBlueLowOpacity = '#006dd166';
const darkBlue70 = '#006dd1b3';
const completedBlue = '#036ED033';
const hoverBlue = '#2783D8';
const magenta08 = '#c428dd14';
const semiTransparentBlack = '#ffffff80';

const purpleLight = '#f551f9';
const purpleDark = '#feb4ff';
const purpleShadow = '#f12bff33';
const lightPurpleBgr = '#F0EDF7';
const lightOrangeBgr = '#FFF1E4';
const lightPurple = '#A48EE3';
const lightOrange = '#FFB380';
const greenOutline40 = '#2ab37a66';

const lightPalette = {
  mode: 'light',
  primary: {
    main: magentaDefault,
  },
  secondary: {
    main: light10,
  },
  background: {
    wrong: red40,
    error: red8,
    warning: orange8,
    attention: orangeFill5,
    avatar: lightGrey,
    default: {
      primary: gradient,
      secondary: white,
      tertiary: white01,
    },
    panel: grey003,
    surface: {
      interactive: {
        default: dark5,
        active: dark10,
        selected: dark20,
        dragging: blue12,
      },
    },
    interactiveItem: {
      hover: dark10,
      rowHover: dark6,
      active: darkMagenta10,
    },
    selectedItem: {
      default: darkMagenta16,
      hover: darkMagenta24,
    },
    tooltip: gray30,
    aiAnswer: white,
    badge: dark20,
  },
  border: {
    default: light40,
    lines: light30,
    hover: light10,
    inputHover: light20,
    tips: blue02,
    attention: orangeOutline40,
    error: red40,
  },
  boxShadow: {
    default: `0 0.125rem 0.625rem 0 #64778833`,
    onboarding: `0rem 3.975rem 4.2625rem -3.8125rem ${skyBlue20}`,
    aiAnswer: '0 0.125rem 0.4375rem 0 #0000001f',
    listbox: `0 0.25rem 1.875rem ${white}`,
    dialog: '0 0 1.475rem 0 #FFFFFF0D',
  },
  text: {
    primary: light10,
    secondary: gray60,
    error: dangerRed,
    info: irisBlue,
    tips: darkBlue,
    attention: warningStatusText,
    metrics: light00,
    warning: red,
    accent: magentaDefault,
    disabled: light20,
    link: darkBlue,
    visitedLink: darkBlue70,
    alwaysWhite: white,
    alwaysDark: '#0E131D',
    showMore: magentaDefault,
    tooltip: white,
  },
  alert: {
    info: { icon: irisBlue, background: blueFill8, border: skyBlue40, text: darkBlue },
    success: { icon: greenHoverBtn, background: green8, border: greenOutline40, text: green },
    warning: { icon: orange, background: orange8, border: orangeOutline40, text: orange },
    error: { icon: dangerRed, background: red8, border: red40, text: red },
    secondary: { background: blue8 },
  },
  icon: {
    default: light10,
    primary: grey500,
    secondary: gray60,
    send: white,
    trophy: '#FFD3A0',
    tips: darkBlue,
    disabled: light20,
    attention: orange,
    warning: orange,
    successModal: greenHoverBtn,
    highTier: green20,
    success: green,
    active: magentaDefault,
    inactive: blue,
    magicAssistant: magenta,
    error: dangerRed,
    delete: white,
    info: irisBlue,
    warningHigh: warningYellow,
    accent: magentaDefault,
    onPrimary: blue01,
    indexResult: {
      success: greenHoverBtn,
      error: dangerRed,
      warning: orange,
      info: darkBlue,
    },
  },
  status: {
    draft: irisBlue,
    onModeration: orange,
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
    high: warningYellow,
  },
  diff: {
    removed: '#d716164d',
    added: '#2ab37a4d',
  },
  scrollbar: { thumb: dark10, thumbHover: light10 },
  components: {
    toast: {
      success: { background: 'green', color: 'white' },
      error: { background: 'red', color: 'white' },
      info: { background: darkBlue, color: 'white' },
      warning: { background: '#F2994A', color: 'white' },
    },
    card: {
      background: {
        default: white,
        hover: white,
        gradient: 'linear-gradient(180deg, #FFFFFF 0%, #ffffff00 100%)',
      },
      border: {
        hoverGradient: 'linear-gradient(0deg, #f7aeff 0%, #F37DFF 100%)',
        borderGradient: 'linear-gradient(0deg, #d0d5da99 0%, #D0D5DA 100%)',
      },
      shadow: {
        hover: '0 -0.1875rem 0.9375rem 0 #e138ff4d',
      },
    },
    button: {
      background: {
        default: dark10,
        normal: dark10,
        danger: dangerRed,
        primary: { default: magentaDefault, hover: magentaHover, pressed: magentaHover, disabled: light20 },
        secondary: { default: dark10, hover: dark20, pressed: dark20, disabled: light20 },
        tertiary: { hover: dark10, pressed: dark10 },
        alarm: { default: dangerRed, hover: hoverRed, pressed: pressedRed, disabled: light20 },
        drawerMenu: { default: 'transparent', hover: dark5, selected: dark10 },
        iconLabelButton: { default: 'transparent', hover: dark5, selected: dark10, disabled: 'transparent' },
        neutral: { default: darkBlue, hover: hoverBlue, pressed: darkBlue, disabled: light20 },
        positive: {
          default: greenDefaultBtn,
          hover: greenHoverBtn,
          pressed: greenDefaultBtn,
          disabled: light20,
        },
        magicAssistant: magenta24,
        split: { default: darkMagenta20, hover: darkMagenta30, pressed: darkMagenta10 },
      },
      text: {
        primary: blue01,
        secondary: blue01,
        disabled: light20,
        showMore: magentaDefault,
        auxiliary: magentaHover,
        create: gray60,
      },
      icon: { default: white, stateButton: { default: light10, hover: light00 } },
    },
    tabGroupButton: {
      background: { default: dark5, hover: dark10, active: dark20, disabled: dark5 },
      text: { default: light10, hover: gray60, active: gray60, disabled: light20 },
    },
    tab: { background: { default: light10, hover: magentaHover, active: magentaDefault, disabled: light20 } },
    categoryTag: {
      background: { default: white, selected: irisBlue },
      text: { default: gray60, selected: white },
      shadow: '0 0.125rem 0.25rem 0 #0000000f',
    },
    styledChip: {
      background: {
        default: white01,
        hover: dark20,
        active: { default: irisBlue, hover: blue02 },
        disabled: dark10,
      },
      text: { default: gray60, active: white, disabled: light20 },
      icon: { default: light10, hover: gray60, active: white, disabled: light20 },
    },
    participant: {
      background: { default: dark5, hover: dark10, active: darkMagenta10, cover: semiTransparentBlack },
      text: { default: light20 },
    },
    conversation: {
      background: {
        normal: 'transparent',
        hover: dark6,
        selected: blue12,
        editor: light40,
        topCover: 'linear-gradient(360deg, #ffffff00 0%, #FFFFFF 100%)',
        bottomCover: 'linear-gradient(180deg, #ffffff00 0%, #FFFFFF 100%)',
        starter: { strong: '#6390fe66', subtle: '#6390fe33' },
        highlightUserMessage: skyBlue20,
      },
      border: { itemDivider: dark10, highlightUserMessage: skyBlue40 },
    },
    folder: {
      background: { default: '#ffffff99', active: '#6390fe1a' },
      border: { gradient: 'none', hover: irisBlue, active: irisBlue },
      shadow: '0 0.125rem 0.25rem #0000001f',
    },
    switch: {
      background: {
        default: {
          on: { thumb: magentaDefault, track: darkMagenta30 },
          off: { thumb: light10, track: dark20 },
        },
        disabled: {
          on: { thumb: magentaDisabled, track: darkMagenta30 },
          off: { thumb: light20, track: dark20 },
        },
      },
    },
    dataGrid: { background: { main: light40, secondary: white01, row: { selected: magenta08 } } },
    input: {
      text: {
        label: light10,
        primary: gradient,
        placeholder: light30,
        placeholderSecondary: light20,
        disabled: light10,
      },
      border: white01,
    },
    select: {
      hover: dark10,
      selected: { default: darkMagenta16, hover: darkMagenta24 },
      text: { selected: { primary: gray60, secondary: light10 } },
    },
    publishWizardStep: {
      default: { background: 'transparent', border: lightStepBorder, icon: dark10 },
      active: { background: 'transparent', border: darkBlueLowOpacity, icon: darkBlueLowOpacity },
      completed: { background: completedBlue, border: darkBlue, icon: darkBlue },
    },
    checkbox: {
      default: light10,
      hover: { on: light10, off: gray60 },
      active: gray60,
      mark: white,
      disabled: light20,
      radio: { default: light10, hover: { off: gray60 }, active: gray60, disabled: light20 },
    },
    capability: {
      vision: { background: lightPurpleBgr, icon: lightPurple },
      reasoning: { background: lightOrangeBgr, icon: lightOrange },
    },
    suggestionChip: {
      border: light30,
      background: { default: 'transparent', hover: dark10 },
      text: { default: light00, hover: gray60 },
    },
    aiAssistant: {
      iconBackground: 'linear-gradient(222.04deg, #68b1ff61 10.38%, #fda1ff61 91.15%)',
      iconBorder: 'linear-gradient(222.04deg, #299bff21 10.38%, #fb37ffa3 91.15%)',
      iconGradientStart: '#F534FF',
      iconGradientEnd: '#5CA0FE',
    },
    categoriesButton: {
      background: { selected: { active: irisBlue, hover: blue02 } },
    },
    tagEditor: {
      background: { tag: light40 },
      shadow: '0 0.125rem 0.625rem 0 #64778833',
    },
    toolCard: {
      background: { hover: dark8, gradient: light40 },
    },
    chatContinue: { background: dark10, border: darkMagenta30 },
    aiProviderAccordion: {
      background: { default: grey003, hover: grey007 },
      border: 'linear-gradient(0deg, #41475700 0%, #41475714 100%)',
    },
    accordion: {
      background: { default: grey003, hover: grey007 },
      border: 'linear-gradient(0deg, #41475700 0%, #41475714 100%)',
    },
    listItem: { background: { default: white } },
    chatStarter: { background: { strong: '#6390fe66', subtle: '#6390fe33' } },
    npsSurvey: {
      background: 'linear-gradient(to top, #f7d9ff, #d5e3fe)',
      border: '#93b2ff',
      text: { label: '#777A83', placeholder: '#777A83' },
      button: {
        primary: { default: '#c428dd', hover: '#c428ddd9', pressed: '#c428ddb3', disabled: '#c428dd66' },
        secondary: { default: '#3d44561a', hover: '#3d445726', pressed: '#3d445733' },
      },
    },
    agentHubButton: {
      background: {
        default: 'transparent',
        hover: '#C6B8FF33',
        active: '#C6B8FF33',
      },
      shadow: {
        default: 'none',
        hover: 'none',
        active: '0 0 0.9375rem 0 #A754FF33 inset',
      },
      textGradient: 'linear-gradient(90deg, #DD32FF 0.7%, #8147FF 30%)',
      iconGradient: 'linear-gradient(33.96deg, #E345FF 0%, #A274FF 80%)',
    },
    userMessageEditor: { border: magentaDefault },
    notificationItem: { border: light40 },
    editingPlaceholder: { border: irisBlue },
    editInline: { border: white },
    userInput: {
      border: { base: purpleDark, glow: purpleLight },
      shadow: {
        default: `0 -0.3125rem 1.25rem 0 ${purpleShadow}`,
        recording: `0 0 0.75rem 0 ${magentaDefault}40`,
      },
    },
    tabs: { default: magentaDefault },
    tableRow: { background: { default: white, hover: light40 } },
    slider: { track: dark10 },
    aiAnswer: {
      background: white,
      actionsGradient: 'linear-gradient(270deg, #FFFFFF 82.5%, #ffffff00 100%)',
    },
    userMessage: {
      actionsGradient: 'linear-gradient(270deg, #EFF3FA 85.36%, #ecf1f900 100%)',
      highlightBackground: skyBlue20,
      highlightBorder: skyBlue40,
    },
    contextBudget: { trackBackground: dark10 },
    usageMeter: { trackBackground: dark10 },
    autocompleteChip: {
      background: { default: white01, hover: dark20, disabled: dark10 },
      text: { default: gray60, disabled: light20 },
      icon: { default: light10, hover: gray60, disabled: light20 },
    },
    notificationList: { background: white },
    sidebar: {
      background: 'linear-gradient(180deg, #E4F0FF 0%, #FDEAFF 100%)',
      divider: dark10,
      menuItem: { default: 'transparent', hover: dark5, selected: dark10 },
    },
    imageAttachment: { background: `linear-gradient(0deg, #FFFFFF 0%, #ffffff00 100%)` },
    contextDialog: { background: gradient },
    agentModal: {
      border: 'linear-gradient(224.66deg, #8BC9FF 0%, #FDA3FF 99.46%)',
      background: 'linear-gradient(224.97deg, #DEEDFF 0%, #F9DFFE 100%)',
      content: {
        border: 'linear-gradient(224.66deg, #8BC9FF 0%, #FDA3FF 99.46%)',
        background: blue01,
      },
    },
    skillHubModal: {
      border: 'linear-gradient(224.66deg, #8BC9FF 0%, #FDA3FF 99.46%)',
      background: 'linear-gradient(224.97deg, #DEEDFF 0%, #F9DFFE 100%)',
    },
    aiAssistantModal: {
      background: { panel: white, editor: white },
    },
    deprecated: { background: warningStatusText, text: white },
    settingsPage: { background: gradient },
    indexDetail: { background: { left: light53, right: light53 } },
    codePreview: { background: light53 },
    flowEditor: {
      background: white,
      node: { border: light20 },
      nodeColors: {
        toolkit: '#C0C4FF',
        mcp: '#F0A4FF',
        tool: '#E0E4FF',
        agent: '#D5FCD9',
        pipeline: '#EAD3FE',
        function: '#EFE3FB',
        llm: '#D2EDFF',
        decision: '#FFD2E6',
        condition: '#F8FCD5',
        loop: '#FFEDD4',
        loop_from_tool: '#FFE0D4',
        router: '#C7FFEF',
        state_modifier: '#E2FFBD',
        code: '#F5E6FF',
        printer: '#63EF9FFF',
        hitl: '#FFE0B6',
        custom: '#FFD5D5',
      },
    },
    contextHighlight: { background: '#3d3d3d' },
    aiParticipantIcon: { background: skyBlue20 },
    chatSubmenu: { dividerBackground: light30 },
    mcp: {
      background: { loginSuccess: green8, logout: orange8 },
      border: { loginSuccess: green40, logout: orange40 },
      text: { loginSuccess: green, logout: orange },
    },
    oauthStatus: {
      background: { loginSuccess: green8, logout: orange8 },
      border: { loginSuccess: green40, logout: orange40 },
      text: { loginSuccess: green, logout: orange },
    },
    onboarding: {
      background: 'linear-gradient(247.51deg, #a1c5ff99 0.02%, #a1c5ff1f 50.21%, #a1d6ff99 99.64%)',
      bodyBackground: white01,
    },
    welcome: {
      background: {
        outside: 'linear-gradient(42.04deg, #61ede966 8.85%, #fb42ff66 89.62%)',
        inner: 'linear-gradient(63.16deg, #29a9a524 16.12%, #e72feb24 85.3%)',
      },
    },
    banner: {
      default: 'linear-gradient(30deg, #ffd6c1 8.85%, #e5d7ff 89.62%)',
      border: 'linear-gradient(42.04deg, #f6ac66 8.85%, #d780ff 89.62%)',
    },
    interactiveTour: {
      backdrop: 'rgba(59, 62, 70, 0.5)',
      card: 'linear-gradient(180deg, #EFF8FF 0%, #BAD1FF 100%)',
      borderGradient: 'linear-gradient(186.77deg, #5194FF 5.31%, #A6DAFF 94.69%)',
      dividerGradient: 'linear-gradient(90deg, #f68eff00 0%, #8DACFF 49.7%, #f68eff00 100%)',
      text: '#5c82bf',
    },
    resourceCard: {
      background: {
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
    },
    entityIcon: {
      background: {
        default: dark10,
        trophy: '#48433F',
        checkedBox: light10,
        entityGradient: 'linear-gradient(45.36deg, #777a7c4d 16.25%, #e2e2e24d 87.07%)',
        entityBorderGradient: 'linear-gradient(225deg, #3b42461a 12.64%, #3b424659 87.88%)',
      },
    },
    configurationCard: { background: { highTier: green20 } },
    highlightQuery: { background: orange },
    runIndexBanner: {
      background: { success: green8, error: red8, warning: orange8, info: blueFill8 },
      border: { success: greenOutline40, error: red40, warning: orangeOutline40, info: skyBlue40 },
      text: { success: green, error: red, warning: orange, info: darkBlue },
    },
    tips: { background: { main: blueFill08, secondary: blue8 } },
    table: { border: light40 },
    tooltip: {
      background: { default: gray30, code: white15 },
      text: { default: white },
    },
    categorySection: { text: { title: light10 } },
    split: {
      background: { default: darkMagenta20, hover: darkMagenta30, pressed: darkMagenta10, disabled: dark10 },
      text: { default: gray60, pressed: gray60, disabled: light10 },
      border: { categorySelected: dark20 },
    },
    accentButton: {
      background: { default: darkMagenta20, hover: darkMagenta30, pressed: darkMagenta10, disabled: dark10 },
      text: { default: gray60, pressed: gray60, disabled: light10 },
    },
    deleteAlert: { text: { entityName: darkBlue, body: gray60 } },
    chip: {
      background: { warning: red15, selected: darkMagenta16, default: dark5 },
    },
    chipWithCheckIcon: {
      background: {
        default: dark5,
        selected: darkMagenta16,
        warning: red15,
      },
      border: {
        warning: warningOrange,
      },
      text: {
        default: gray60,
        disabled: light20,
      },
    },
  },
};

export default lightPalette;
