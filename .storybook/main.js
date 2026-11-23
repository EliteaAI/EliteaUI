import path from 'node:path';

// Storybook runs from the repository root (npm run storybook)
const ROOT = process.cwd();

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
    source: './ContextBudgetRing',
    to: 'src/[fsd]/stories/concepts/chat/swaps/ContextBudgetRing.swap.jsx',
  },
];

// A one-line change to a team file, seen only by the listed importer: the import gets its own patched copy of the
// module (same path plus ?<query>, so its relative imports still resolve); every other importer gets the file as it is.
// If the team changes the line, the build stops with the message below instead of silently showing dev's behaviour.
const CONCEPT_PATCHES = [
  {
    // concept: the field's placeholder stays while the field is empty, also with focus (owner 2026-11-19)
    importers: ['src/[fsd]/stories/concepts/chat/ConceptChatInput.jsx'],
    source: 'src/ComponentsLib/Chat/UserInput',
    query: 'concept-placeholder',
    from: "placeholder={isFocused ? '' : input?.placeholder}",
    to: 'placeholder={input?.placeholder /* concept: stays with focus (dev hides it) */}',
  },
];

const matches = (list, source, importer) => {
  const file = decodeURIComponent(importer.split('?')[0]);
  // Vite's own alias plugin runs first, so '@/…' arrives here as an absolute path: compare by the path's end
  const target = decodeURIComponent(source).replace(/\.jsx$/, '');
  return list.find(
    s =>
      (target === s.source || target.endsWith(`/${s.source}`) || target === s.specifier) &&
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
    if (!code.includes(patch.from)) {
      throw new Error(
        `concept-swaps: ${patch.source}.jsx no longer has «${patch.from}»; update CONCEPT_PATCHES`,
      );
    }
    return code.replace(patch.from, patch.to);
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
      plugins: [conceptSwaps()],
    });
  },
};

export default config;
