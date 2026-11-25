import path from 'node:path';
import { fileURLToPath } from 'url';

import { screenshotHistory } from './screenshotHistory.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

// Concept stories show the team's real chat screen with one part replaced, without editing product files: an import
// listed here is redirected to a switch in src/[fsd]/stories/concepts/chat/swaps/. The switch renders the team's own
// component everywhere, and the concept copy only inside <ConceptSwapProvider> of a concept story, so every other story
// stays as it is. Storybook only; the app's Vite config is not touched.
const CONCEPT_SWAPS = [
  {
    importers: [
      'src/[fsd]/features/chat/ui/chat-box/ChatBox.jsx',
      'src/pages/NewChat/NewConversationView.jsx',
    ],
    source: 'src/[fsd]/features/chat/ui/chat-input/NewChatInput',
    to: 'src/[fsd]/stories/concepts/chat/swaps/NewChatInput.swap.jsx',
  },
  {
    importers: ['src/[fsd]/widgets/context-budget/ui/ContextBudgetInfo.jsx'],
    source: 'src/[fsd]/widgets/context-budget/ui/ContextBudgetRing',
    to: 'src/[fsd]/stories/concepts/chat/swaps/ContextBudgetRing.swap.jsx',
  },
  // a row of the «who answers» list gets ⚙ (version, variables) and «Fix»; the panel's rows stay the team's
  {
    importers: [
      'src/[fsd]/features/chat/participants/ui/expanded-participants/ParticipantNormalCard.jsx',
      'src/[fsd]/features/chat/participants/ui/expanded-participants/ParticipantAttentionCard.jsx',
    ],
    source: 'src/[fsd]/features/chat/participants/ui/participant-actions/ParticipantActions',
    to: 'src/[fsd]/stories/concepts/chat/swaps/ParticipantActions.swap.jsx',
  },
  {
    importers: ['src/[fsd]/features/chat/participants/ui/expanded-participants/ParticipantAttentionCard.jsx'],
    source: 'src/[fsd]/features/chat/participants/ui/expanded-participants/ParticipantWarning',
    to: 'src/[fsd]/stories/concepts/chat/swaps/ParticipantWarning.swap.jsx',
  },
];

// A one-line change to a team file, seen only by the listed importer: the import gets its own patched copy of the
// module (same path plus ?<query>, so its relative imports still resolve); every other importer gets the file as it is.
// If the team changes the line, the concept story shows dev's behaviour and the build prints a warning: these stories
// live on main, where a team change must never break the whole Storybook, which is public.
const CONCEPT_PATCHES = [
  {
    // concept: the field's placeholder stays while the field is empty, also with focus
    importers: ['src/[fsd]/stories/concepts/chat/ConceptChatInput.jsx'],
    source: 'src/ComponentsLib/Chat/UserInput',
    query: 'concept-placeholder',
    from: "placeholder={isFocused ? '' : input?.placeholder}",
    to: 'placeholder={input?.placeholder /* concept: stays with focus (dev hides it) */}',
  },
  {
    // concept: ChatBox hands the field what the concept needs, as two one-line edits: the chat's values for the ring's
    // card (as ParticipantsWrapper gives the ring); onShowToolkitEditor, so the pencil of a toolkit in «who answers» opens
    // its editor, and the page's editingToolkit and selected managers for the rows of that list
    importers: ['src/[fsd]/features/chat/ui/chat-box/index.js'],
    source: 'src/[fsd]/features/chat/ui/chat-box/ChatBox',
    query: 'concept-chat-box',
    edits: [
      {
        from: 'internal_tools={activeConversation?.meta?.internal_tools || []}',
        to: [
          'internal_tools={activeConversation?.meta?.internal_tools || []}',
          'contextStrategy={activeConversation?.meta?.context_strategy || {}}',
          'setActiveConversation={setActiveConversation}',
          "conversationInstructions={activeConversation?.instructions || ''}",
          'persona={activeConversation?.meta?.persona}',
        ].join(' '),
      },
      {
        from: 'onShowParticipantsList={onShowParticipantsList}',
        to: [
          'onShowParticipantsList={onShowParticipantsList}',
          'onShowToolkitEditor={onShowToolkitEditor /* concept */}',
          'editingToolkit={props.editingToolkit}',
          'selectedManager={props.selectedManager}',
          'newConversationSelectedManager={props.newConversationSelectedManager}',
        ].join(' '),
      },
    ],
  },
  {
    // concept: the «who answers» list draws the panel's rows and opens their editors, so the chat page hands ChatBox
    // (a saved chat) and NewConversationView (a new chat) what it hands the panel
    importers: ['src/pages/NewChat/index.jsx'],
    source: 'src/pages/NewChat/NewChat',
    query: 'concept-new-chat',
    edits: [
      {
        from: 'showParticipantsWelcome',
        to: [
          'showParticipantsWelcome',
          'editingToolkit={editingToolkit}',
          'selectedManager={selectedManager}',
          'newConversationSelectedManager={newConversationSelectedManager}',
        ].join(' '),
      },
      {
        // the first one is NewConversationView's
        from: 'onShowAgentEditor={onEditAgent}',
        to: [
          'onShowAgentEditor={onEditAgent}',
          'onShowToolkitEditor={onEditToolkit}',
          'editingToolkit={editingToolkit}',
          'newConversationSelectedManager={newConversationSelectedManager}',
        ].join(' '),
      },
    ],
  },
  {
    // concept: NewConversationView takes those three and hands them to the field
    importers: ['src/pages/NewChat/NewChat.jsx'],
    source: 'src/pages/NewChat/NewConversationView',
    query: 'concept-new-conversation',
    edits: [
      {
        from: 'addNewParticipants,',
        to: 'addNewParticipants, onShowToolkitEditor, editingToolkit, newConversationSelectedManager,',
      },
      {
        from: 'onShowParticipantsList={onShowParticipantsList}',
        to: [
          'onShowParticipantsList={onShowParticipantsList}',
          'onShowToolkitEditor={onShowToolkitEditor}',
          'editingToolkit={editingToolkit}',
          'newConversationSelectedManager={newConversationSelectedManager}',
        ].join(' '),
      },
    ],
  },
  {
    // a row's version label gets a class, so the «who answers» list can give it room (the panel caps it at 2.5rem,
    // «v3-strict-review» shows as «v3-s…»); the panel keeps the cap
    importers: ['src/[fsd]/features/chat/participants/ui/expanded-participants/ParticipantItem.jsx'],
    source: 'src/[fsd]/features/chat/participants/ui/expanded-participants/ParticipantNormalCard',
    query: 'concept-version-label',
    from: 'sx={styles.versionLabel}',
    to: 'sx={styles.versionLabel}\n                className="concept-version-label" /* concept */',
  },
];

const matches = (list, source, importer) => {
  const file = decodeURIComponent(importer.split('?')[0]);
  // Vite's own alias plugin runs first, so '@/…' arrives here as an absolute path: compare by the path's end
  const raw = decodeURIComponent(source).replace(/\.jsx?$/, '');
  const target = raw.startsWith('.') ? path.join(path.dirname(file), raw) : raw;
  return list.find(
    s =>
      (target === s.source || target.endsWith(`/${s.source}`)) &&
      s.importers.some(i => file.endsWith(`/${i}`)),
  );
};

const conceptSwaps = () => ({
  name: 'concept-swaps',
  enforce: 'pre',
  resolveId(source, importer) {
    if (!importer) return null;
    const swap = matches(CONCEPT_SWAPS, source, importer);
    if (swap) return path.join(ROOT, swap.to);
    const patch = matches(CONCEPT_PATCHES, source, importer);
    return patch ? `${path.join(ROOT, patch.source)}.jsx?${patch.query}` : null;
  },
  async load(id) {
    const [file, query] = id.split('?');
    const patch = query && CONCEPT_PATCHES.find(p => p.query === query);
    if (!patch) return null;
    const { readFile } = await import('node:fs/promises');
    const code = await readFile(file, 'utf8');
    return (patch.edits ?? [patch]).reduce((patched, { from, to }) => {
      if (patched.includes(from)) return patched.replace(from, to);
      console.warn(
        `concept-swaps: ${patch.source}.jsx no longer has «${from}»; the concept story shows dev's line, update CONCEPT_PATCHES`,
      );
      return patched;
    }, code);
  },
});

/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    {
      name: '@storybook/addon-docs',
      options: {
        configureJSX: true,
        babelOptions: {},
        sourceLoaderOptions: null,
        transcludeMarkdown: true,
      },
    },
    '@chromatic-com/storybook',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    defaultName: 'Documentation',
  },
  core: {
    // No «what's new» pop-ups in the sidebar
    disableWhatsNewNotifications: true,
  },
  features: {
    // No git-based «new / changed story» markers in the sidebar
    changeDetection: false,
    // No «Get started» onboarding checklist in the sidebar and the menu
    sidebarOnboardingChecklist: false,
    menuOnboardingChecklist: false,
  },
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      shouldRemoveUndefinedFromOptional: true,
      propFilter: prop => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    },
  },
  viteFinal: async viteConfig => {
    // Merge custom configuration into the default config
    const { mergeConfig } = await import('vite');

    return mergeConfig(viteConfig, {
      // Add any custom Vite configuration here if needed
      define: {
        global: 'globalThis',
      },
      plugins: [
        // Versions of the saved story screenshots from git, for the stories' compare view
        screenshotHistory(ROOT),
        conceptSwaps(),
      ],
    });
  },
};

export default config;
