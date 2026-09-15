const cyanDefault = '#6ae8fa';
const cyanDisabled = '#267985';
const white = '#FFFFFF';
const white2 = '#ffffff05';
const white3 = '#ffffff08';
const white5 = '#ffffff0d';
const white6 = '#ffffff0f'; // conversation hover dark
const white8 = '#ffffff14'; // tool card hover light

const white10 = '#ffffff1a';
const white14 = '#ffffff24';
const dark20 = '#3d445633';
const white20 = '#ffffff33';
const white50 = '#ffffff80';
const whiteStepBorder = '#757575';
const veryLightBlue = '#C7EBFF';
const skyBlue = '#29B8F5';
const gray00 = '#CAD0D8';
const gray10 = '#A9B7C1';
const gray20 = '#686C76';
const gray30 = '#3B3E46';
const gray40 = '#262b34';
const gray50 = '#181F2A';
const gray53 = '#151C25';
const gray55 = '#101721';
const gray58 = '#0c1119';
const gray60 = '#0E131D';
const blue5 = '#29b8f50d';
const blue8 = '#6ae8fa14';
const blueFill8 = '#29b8f514';
const blue10 = '#6ae8fa1a';
const blue16 = '#6ae8fa29';
const blue20 = '#6ae8fa33';
const blue24 = '#6ae8fa3d';
const blue30 = '#6ae8fa4d';
const blue40 = '#29b8f566';
const blue70 = '#29b8f5b3';
const skyBlue20 = '#29b8f533';
const darkBlue = '#006DD1';
const darkBlueLowOpacity = '#006dd166';
const completedBlue = '#036ED033';
const hoverBlue = '#2783D8';
const grey500 = '#ABB3B9';
const dangerRed = '#D71616';
const hoverRed = '#E74444';
const pressedRed = '#C51111';
const red8 = '#d7161614';
const red15 = '#d7161626';
const red40 = '#d7161666';
const lightRed = '#ffdfdf';
const cyanHover = '#FFFFFF';
const cyanPressed = '#2abdd2';
const blue = '#29b8f5';
const orange10 = '#d37015';
const orange8 = '#e9791214';
const orange40 = '#e9791166';
const warningOrange = '#ED6C02';
const orange = '#E97912';
const warningYellow = '#E8B747';
const lightOrange = '#ffebd3';
const orangeFill5 = '#e979120d';
const orangeOutline40 = '#e9791266';
const green40 = '#2bd48d66';
const green20 = '#2bd48d33';
const green8 = '#2bd48d14';
const green = '#2BD48D';
const greenDefaultBtn = '#108D22';
const greenHoverBtn = '#15A42A';
const greenBorder = '#2AB37A';
const greenLight = '#1ed1de';
const greenDark = '#0f5160';
const greenShadow = '#15fff733';
const lightGreen = '#dcffe9';
const magenta40 = '#de7eda66';
const magenta20 = '#de7eda33';
const magenta = '#f47cff';
const magenta24 = '#f47cff3d';
const deepGrey = '#1a1f28';
const semiTransparentBlack = '#10172180';
const darkPurpleBgr = '#2A2F46';
const darkOrangeBgr = '#362F2E';
const darkPurple = '#7C69B4';
const darkOrange = '#A5695C';
const greenOutline40 = '#2ab37a66';
const lightBlue = '#d7f1ff';

const darkPalette = {
  mode: 'dark',
  primary: {
    main: cyanDefault,
  },
  secondary: {
    main: gray10,
  },
  background: {
    wrong: red40,
    error: red8,
    warning: orange8,
    attention: orangeFill5,
    avatar: deepGrey,
    default: {
      primary: gray60,
      secondary: gray50,
      tertiary: gray55,
    },
    panel: white3,
    surface: {
      interactive: {
        default: white5,
        active: white10,
        selected: white20,
        dragging: blue10,
      },
    },
    interactiveItem: {
      hover: white10,
      rowHover: white6,
      active: blue10,
    },
    selectedItem: {
      default: blue16,
      hover: blue24,
    },
    tooltip: gray00,
    aiAnswer: gray40,
    badge: white20,
  },
  border: {
    default: gray40,
    lines: gray30,
    hover: gray10,
    inputHover: gray20,
    tips: blue40,
    attention: orangeOutline40,
    error: red40,
  },
  boxShadow: {
    default: `0 0 0.5rem 0 ${white14}`,
    onboarding: `0rem 3.975rem 4.2625rem -3.8125rem ${skyBlue20}`,
    listbox: `0 0.25rem 1.875rem ${gray50}`,
    aiAnswer: '0 0.125rem 0.4375rem 0 #0000001f',
    dialog: '0 0 1.475rem 0 #FFFFFF0D',
  },
  text: {
    primary: gray10,
    secondary: white,
    error: dangerRed,
    info: skyBlue,
    tips: veryLightBlue,
    attention: lightOrange,
    metrics: gray00,
    warning: lightRed,
    accent: cyanDefault,
    disabled: gray20,
    link: blue,
    visitedLink: blue70,
    alwaysWhite: white,
    alwaysDark: '#0E131D',
    showMore: cyanPressed,
    tooltip: gray60,
  },
  alert: {
    info: { icon: darkBlue, background: blueFill8, border: blue40, text: lightBlue },
    success: { icon: greenHoverBtn, background: green8, border: greenOutline40, text: lightGreen },
    warning: { icon: orange, background: orange8, border: orangeOutline40, text: lightOrange },
    error: { icon: dangerRed, background: red8, border: red40, text: lightRed },
    secondary: { background: blue8 },
  },
  icon: {
    default: gray10,
    primary: grey500,
    secondary: white,
    send: gray60,
    trophy: '#FFD3A0',
    tips: skyBlue,
    successModal: greenHoverBtn,
    disabled: gray20,
    attention: orange,
    warning: orange,
    highTier: green20,
    success: green,
    active: cyanPressed,
    inactive: blue,
    magicAssistant: magenta,
    error: dangerRed,
    delete: gray50,
    info: darkBlue,
    warningHigh: warningYellow,
    accent: cyanDefault,
    onPrimary: gray60,
    indexResult: {
      success: greenHoverBtn,
      error: dangerRed,
      warning: orange,
      info: blue,
    },
  },
  status: {
    draft: skyBlue,
    onModeration: orange,
    warningText: lightOrange,
    published: green,
    publishedIcon: greenDefaultBtn,
    publishedBackground: green,
    publishedText: white,
    publishedBorder: greenBorder,
    rejected: dangerRed,
    rejectedText: lightRed,
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
  scrollbar: { thumb: white10, thumbHover: gray10 },
  components: {
    toast: {
      success: { background: 'green', color: 'white' },
      error: { background: 'red', color: 'white' },
      info: { background: darkBlue, color: 'white' },
      warning: { background: '#F2994A', color: 'white' },
    },
    card: {
      background: {
        default: gray50,
        hover: gray58,
        gradient: 'linear-gradient(0deg, #121820 0%, #1D232C 100%)',
      },
      border: {
        hoverGradient: 'linear-gradient(0deg, #53b0bf66 0%, #53B0BF 100%)',
        borderGradient: 'linear-gradient(0deg, #262B34 0%, #313A48 100%)',
      },
      shadow: {
        hover: '0 -0.1875rem 0.9375rem 0 #78e6ff4d',
      },
    },
    button: {
      background: {
        default: white10,
        normal: white10,
        danger: dangerRed,
        primary: { default: cyanDefault, hover: cyanHover, pressed: cyanPressed, disabled: gray20 },
        secondary: { default: white10, hover: white20, pressed: gray60, disabled: gray20 },
        tertiary: { hover: white10, pressed: white20 },
        alarm: { default: dangerRed, hover: hoverRed, pressed: pressedRed, disabled: gray20 },
        drawerMenu: { default: 'transparent', hover: white5, selected: white10 },
        iconLabelButton: {
          default: 'transparent',
          hover: white5,
          selected: white10,
          disabled: 'transparent',
        },
        neutral: { default: darkBlue, hover: hoverBlue, pressed: darkBlue, disabled: gray20 },
        positive: {
          default: greenDefaultBtn,
          hover: greenHoverBtn,
          pressed: greenDefaultBtn,
          disabled: gray20,
        },
        magicAssistant: magenta24,
        split: { default: blue20, hover: blue30, pressed: blue10 },
      },
      text: {
        primary: gray60,
        secondary: gray60,
        disabled: gray20,
        showMore: cyanPressed,
        auxiliary: cyanHover,
        create: cyanDefault,
      },
      icon: { default: white, stateButton: { default: gray10, hover: gray00 } },
    },
    tabGroupButton: {
      background: { default: white5, hover: white10, active: white20, disabled: white5 },
      text: { default: gray10, hover: white, active: white, disabled: gray20 },
    },
    tab: { background: { default: gray10, hover: cyanPressed, active: cyanDefault, disabled: gray20 } },
    categoryTag: {
      background: { default: gray50, selected: darkBlue },
      text: { default: white, selected: white },
      shadow: 'none',
    },
    styledChip: {
      background: {
        default: gray50,
        hover: white20,
        active: { default: '#f551f94d', hover: '#f551f933' },
        disabled: white10,
      },
      text: { default: white, active: white, disabled: gray20 },
      icon: { default: gray10, hover: white, active: white, disabled: gray20 },
    },
    participant: {
      background: { default: white5, hover: white10, active: blue10, cover: semiTransparentBlack },
      text: { default: gray20 },
    },
    conversation: {
      background: {
        normal: 'transparent',
        hover: white6,
        selected: blue10,
        editor: gray40,
        topCover: 'linear-gradient(360deg, #10172100 0%, #0E131D 100%)',
        bottomCover: 'linear-gradient(180deg, #10172100 0%, #0E131D 100%)',
        starter: { strong: magenta20, subtle: '#f551f91a' },
        highlightUserMessage: magenta20,
      },
      border: { itemDivider: white10, highlightUserMessage: magenta40 },
    },
    folder: {
      background: { default: white2, active: '#f551f91a' },
      border: {
        gradient: 'linear-gradient(180deg, #ffffff12 0%, #ffffff00 100%)',
        hover: '#f551f94d',
        active: '#f551f94d',
      },
      shadow: 'none',
    },
    switch: {
      background: {
        default: { on: { thumb: cyanDefault, track: blue30 }, off: { thumb: gray10, track: white20 } },
        disabled: { on: { thumb: cyanDisabled, track: blue30 }, off: { thumb: gray20, track: white20 } },
      },
    },
    dataGrid: { background: { main: gray40, secondary: gray55, row: { selected: blue16 } } },
    input: {
      text: {
        label: gray10,
        primary: gray60,
        placeholder: gray30,
        placeholderSecondary: gray20,
        disabled: white50,
      },
      border: gray55,
    },
    select: {
      hover: white10,
      selected: { default: blue16, hover: blue24 },
      text: { selected: { primary: white, secondary: gray10 } },
    },
    publishWizardStep: {
      default: { background: 'transparent', border: whiteStepBorder, icon: white10 },
      active: { background: 'transparent', border: darkBlueLowOpacity, icon: darkBlueLowOpacity },
      completed: { background: completedBlue, border: darkBlueLowOpacity, icon: darkBlue },
    },
    checkbox: {
      default: gray10,
      hover: { on: gray10, off: white },
      active: white,
      mark: gray60,
      disabled: gray20,
      radio: { default: gray10, hover: { off: white }, active: white, disabled: gray20 },
    },
    split: {
      background: { default: blue20, hover: blue30, pressed: blue10, disabled: white10 },
      text: { default: cyanDefault, pressed: cyanPressed, disabled: gray10 },
      border: { categorySelected: white20 },
    },
    accentButton: {
      background: { default: blue20, hover: blue30, pressed: blue10, disabled: white10 },
      text: { default: cyanDefault, pressed: cyanPressed, disabled: gray10 },
    },
    capability: {
      vision: { background: darkPurpleBgr, icon: darkPurple },
      reasoning: { background: darkOrangeBgr, icon: darkOrange },
    },
    suggestionChip: {
      border: gray30,
      background: { default: 'transparent', hover: white10 },
      text: { default: gray00, hover: white },
    },
    aiAssistant: {
      iconBackground: 'linear-gradient(to top right, #29a9a561 8.85%, #e72feb61 89.62%)',
      iconBorder: 'linear-gradient(to top right, #29fff8a3 8.85%, #fb48ff18 89.62%)',
      iconGradientStart: '#50D2CE',
      iconGradientEnd: '#FA00FF',
    },
    categoriesButton: {
      background: { selected: { active: darkBlue, hover: blue40 } },
    },
    tagEditor: {
      background: { tag: gray40 },
      shadow: '0 0.5rem 0.75rem 0 #0000004d',
    },
    toolCard: {
      background: { hover: white8, gradient: 'linear-gradient(180deg, #ffffff12 0%, #ffffff00 100%)' },
    },
    chatContinue: {
      background: white10,
      border: blue30,
    },
    aiProviderAccordion: {
      background: { default: white2, hover: white5 },
      border: 'linear-gradient(180deg, #ffffff12 0%, #ffffff00 100%)',
    },
    accordion: {
      background: { default: white2, hover: white5 },
      border: 'linear-gradient(180deg, #ffffff12 0%, #ffffff00 100%)',
    },
    listItem: {
      background: { default: gray50 },
    },
    chatStarter: {
      background: { strong: magenta20, subtle: '#f551f91a' },
    },
    npsSurvey: {
      background: 'linear-gradient(to top, #f7d9ff, #d5e3fe)',
      border: '#93b2ff',
      text: { label: '#777A83', placeholder: '#777A83' },
      button: {
        primary: { default: '#c428dd', hover: '#c428ddd9', pressed: '#c428ddb3', disabled: '#c428dd66' },
        secondary: { default: '#3d44561a', hover: '#3d455726', pressed: '#3d445633' },
      },
    },
    agentHubButton: {
      background: {
        default: 'transparent',
        hover: '#60339F33',
        active: '#60339F33',
      },
      shadow: {
        default: 'none',
        hover: 'none',
        active: '0 0 0.75rem 0 #66D1FF1A inset',
      },
      textGradient: 'linear-gradient(90deg, #58CDEA 0.7%, #AF64FF 25%)',
      iconGradient: 'linear-gradient(33.96deg, #58CDEA 0%, #AF64FF 80%)',
    },
    userMessageEditor: {
      border: cyanPressed,
    },
    notificationItem: {
      border: gray60,
    },
    editingPlaceholder: {
      border: darkBlue,
    },
    editInline: {
      border: gray50,
    },
    userInput: {
      border: { base: greenDark, glow: greenLight },
      shadow: {
        default: `0 -0.3125rem 1.25rem 0 ${greenShadow}`,
        recording: `0 0 0.75rem 0 ${cyanDefault}40`,
      },
    },
    tabs: { default: cyanDefault },
    tableRow: { background: { default: gray50, hover: gray40 } },
    slider: { track: white10 },
    aiAnswer: {
      background: gray40,
      actionsGradient: 'linear-gradient(270deg, #262B34 82.5%, #262b3400 100%)',
    },
    userMessage: {
      actionsGradient: 'linear-gradient(270deg, #262B34 82.5%, #262b3400 100%)',
      highlightBackground: magenta20,
      highlightBorder: magenta40,
    },
    contextBudget: { trackBackground: white10 },
    usageMeter: { trackBackground: white10 },
    autocompleteChip: {
      background: { default: gray50, hover: white20, disabled: white10 },
      text: { default: white, disabled: gray20 },
      icon: { default: gray10, hover: white, disabled: gray20 },
    },
    notificationList: { background: gray40 },
    sidebar: {
      background: 'linear-gradient(180deg, #0F1E33 0%, #1B172C 100%)',
      divider: white10,
      menuItem: { default: 'transparent', hover: white5, selected: white10 },
    },
    imageAttachment: { background: `linear-gradient(0deg, #262B34 0%, #262b3400 100%)` },
    contextDialog: { background: gray50 },
    agentModal: {
      border: 'linear-gradient(224.97deg, #256B6D 0%, #7E2988 100%)',
      background: 'linear-gradient(199.39deg, #122830 0%, #2C173A 100%)',
      content: {
        border: 'linear-gradient(224.97deg, #256B6D 0%, #7E2988 100%)',
        background: gray60,
      },
    },
    skillHubModal: {
      border: 'linear-gradient(224.97deg, #256B6D 0%, #7E2988 100%)',
      background: 'linear-gradient(199.39deg, #122830 0%, #2C173A 100%)',
    },
    aiAssistantModal: {
      background: { panel: gray50, editor: gray58 },
    },
    deprecated: { background: orange10, text: white },
    settingsPage: { background: gray60 },
    indexDetail: { background: { left: gray53, right: gray53 } },
    codePreview: { background: gray53 },
    flowEditor: {
      background: gray60,
      node: { border: gray20 },
      nodeColors: {
        toolkit: '#11264C',
        mcp: '#2B006F',
        tool: '#22264C',
        agent: '#21372D',
        pipeline: '#2A173C',
        function: '#352340',
        llm: '#183150',
        decision: '#331531',
        condition: '#2C2E1C',
        loop: '#32281A',
        loop_from_tool: '#3D2418',
        router: '#0F342E',
        state_modifier: '#233509',
        code: '#2D1A3A',
        printer: '#075164',
        hitl: '#5A3D23',
        custom: '#351C1C',
      },
    },
    contextHighlight: { background: '#3d3d3d' },
    aiParticipantIcon: { background: skyBlue20 },
    chatSubmenu: { dividerBackground: gray30 },
    mcp: {
      background: { loginSuccess: green8, logout: orange8 },
      border: { loginSuccess: green40, logout: orange40 },
      text: { loginSuccess: lightGreen, logout: lightOrange },
    },
    oauthStatus: {
      background: { loginSuccess: green8, logout: orange8 },
      border: { loginSuccess: green40, logout: orange40 },
      text: { loginSuccess: lightGreen, logout: lightOrange },
    },
    onboarding: {
      background: 'linear-gradient(247.51deg, #a1c5ff99 0.02%, #a1c5ff1f 50.21%, #a1d6ff99 99.64%)',
      bodyBackground: gray58,
    },
    welcome: {
      background: {
        outside: 'linear-gradient(42.04deg, #61ede966 8.85%, #fb42ff66 89.62%)',
        inner: 'linear-gradient(63.16deg, #29a9a524 16.12%, #e72feb24 85.3%)',
      },
    },
    banner: {
      default: 'linear-gradient(30deg, #3d2519 8.85%, #240f3c 89.62%)',
      border: 'linear-gradient(42.04deg, #a05714 8.85%, #7513aa 89.62%)',
    },
    interactiveTour: {
      backdrop: '#3b3e4680',
      card: 'linear-gradient(360deg, #122543 0%, #194386 100%)',
      borderGradient: 'linear-gradient(186.77deg, #2773EE 5.31%, #1A3C74 94.69%)',
      dividerGradient: 'linear-gradient(90deg, #2670e800 0%, #26ABE8 49.7%, #2670e800 100%)',
      text: '#5c82bf',
    },
    resourceCard: {
      background: {
        blue: {
          card: 'linear-gradient(0deg, #0e273e66 0%, #0E273E 100%)',
          icon: 'linear-gradient(45.36deg, #0094ff4d 16.25%, #0094ff17 87.07%)',
          iconColor: '#0094FF',
          iconBorderGradient: 'linear-gradient(180deg, #0094ff00 0%, #0094ff66 100%)',
          divider: '#0094ff26',
          borderGradient: 'linear-gradient(180deg, #0094ff33 0%, #0094ff00 100%)',
        },
        orange: {
          card: 'linear-gradient(0deg, #3b332866 0%, #3B3328 100%)',
          icon: 'linear-gradient(45.36deg, #f5ad494d 16.25%, #f5ad4917 87.07%)',
          iconColor: '#F5AD49',
          iconBorderGradient: 'linear-gradient(180deg, #f5ad4900 0%, #f5ad4966 100%)',
          divider: '#f5ad4926',
          borderGradient: 'linear-gradient(180deg, #f5ad4933 0%, #f5ad4900 100%)',
        },
        purple: {
          card: 'linear-gradient(0deg, #291d4066 0%, #291D40 100%)',
          icon: 'linear-gradient(45.36deg, #a473ff4d 16.25%, #a473ff17 87.07%)',
          iconColor: '#A473FF',
          iconBorderGradient: 'linear-gradient(180deg, #a473ff00 0%, #a473ff66 100%)',
          divider: '#a473ff26',
          borderGradient: 'linear-gradient(180deg, #a473ff33 0%, #a473ff00 100%)',
        },
        green: {
          card: 'linear-gradient(0deg, #142f2366 0%, #142F23 100%)',
          icon: 'linear-gradient(45.36deg, #4bba884d 16.25%, #4bba8817 87.07%)',
          iconColor: '#4BBA88',
          iconBorderGradient: 'linear-gradient(180deg, #4bba8800 0%, #4bba8866 100%)',
          divider: '#4bba8826',
          borderGradient: 'linear-gradient(180deg, #4bba8833 0%, #4bba8800 100%)',
        },
        pink: {
          card: 'linear-gradient(180deg, #3A1B27 0%, #3a1b2766 100%)',
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
        default: white10,
        trophy: '#48433F',
        checkedBox: gray10,
        entityGradient: 'linear-gradient(45.36deg, #a9b7c14d 16.25%, #a9b7c117 87.07%)',
        entityBorderGradient: 'linear-gradient(225deg, #9ca9b200 12.64%, #9ca9b266 87.88%)',
      },
    },
    configurationCard: { background: { highTier: green20 } },
    highlightQuery: { background: orange },
    runIndexBanner: {
      background: { success: green8, error: red8, warning: orange8, info: blueFill8 },
      border: { success: greenOutline40, error: red40, warning: orangeOutline40, info: blue40 },
      text: { success: lightGreen, error: lightRed, warning: lightOrange, info: lightBlue },
    },
    tips: { background: { main: blue5, secondary: blue8 } },
    table: { border: gray40 },
    tooltip: {
      background: { default: gray00, code: dark20 },
      text: { default: gray60 },
    },
    categorySection: { text: { title: gray10 } },
    deleteAlert: { text: { entityName: skyBlue, body: white } },
    chip: {
      background: { warning: red15, selected: blue16, default: white5 },
    },
    chipWithCheckIcon: {
      background: {
        default: white5,
        selected: blue16,
        warning: red15,
      },
      border: {
        warning: warningOrange,
      },
      text: {
        default: white,
        disabled: gray20,
      },
    },
  },
};

export default darkPalette;
