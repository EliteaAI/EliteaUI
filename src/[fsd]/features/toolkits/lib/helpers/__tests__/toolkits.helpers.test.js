import { describe, expect, it, vi } from 'vitest';

import { prettifyToolkitConversation } from '../toolkits.helpers';

vi.mock('@/common/toolkitUtils', () => ({ getToolIconByType: vi.fn() }));
vi.mock('@/common/constants', () => ({ BLOCKED_TOOLKITS: [] }));
vi.mock('@/pages/Applications/Components/Tools/consts', () => ({ ToolTypes: {} }));
vi.mock('@/[fsd]/features/credentials', () => ({ CredentialNameHelpers: {} }));
vi.mock('@/[fsd]/shared/lib/helpers', () => ({ resolveToolkitSchemaByType: vi.fn() }));

const conversationWith = content => [
  {
    message_items: [{ item_details: { content } }],
  },
];

const prettify = content =>
  prettifyToolkitConversation(conversationWith(content))[0].message_items[0].item_details.content;

describe('prettifyToolkitConversation — tool call messages', () => {
  it('renders JSON-formatted parameters structured', () => {
    const params = {
      index_name: 'docs',
      clean_index: false,
      cql: null,
      chunking_config: { '.md': { max_tokens: 512 } },
    };
    const message = `Calling tool 'index_data' with parameters: ${JSON.stringify(params)}`;

    const result = prettify(message);

    expect(result).toBe(`Calling 'index_data' with parameters:\n\n\n${JSON.stringify(params, null, 2)}\n`);
  });

  it('still parses the legacy k=v format', () => {
    const message = "Calling tool 'search_index' with parameters: query='release status', limit=5, cql=None";

    const result = prettify(message);

    expect(result).toContain('"query": "release status"');
    expect(result).toContain('"limit": 5');
    expect(result).toContain('"cql": null');
  });

  it('salvages Python-repr dict values persisted before the JSON write-side fix', () => {
    const message =
      "Calling tool 'index_data' with parameters: branch=None, clean_index=True, " +
      "chunking_config={'.png': {'max_tokens': 512, 'strategy': None}}";

    const result = prettify(message);

    expect(result).toContain('"branch": null');
    expect(result).toContain('"clean_index": true');
    expect(result).toContain('"max_tokens": 512');
    expect(result).toContain('"strategy": null');
    expect(result).not.toContain("'.png'");
  });

  it('never rewrites None/True/False inside quoted user text while salvaging', () => {
    const message =
      "Calling tool 'index_data' with parameters: " +
      "chunking_config={'prompt': 'Return None if the answer is not True', 'strategy': None}";

    const result = prettify(message);

    expect(result).toContain('"prompt": "Return None if the answer is not True"');
    expect(result).toContain('"strategy": null');
  });

  it('salvages repr strings Python quoted with double quotes for their apostrophes', () => {
    const message =
      "Calling tool 'index_data' with parameters: whitelist={'mode': 'strict', 'note': \"don't stop\"}";

    const result = prettify(message);

    expect(result).toContain('"mode": "strict"');
    expect(result).toContain('"note": "don\'t stop"');
  });

  it('keeps a repr value verbatim when normalization cannot make it JSON', () => {
    const message = "Calling tool 'index_data' with parameters: whitelist={'broken': datetime(2020}";

    const result = prettify(message);

    expect(result).toContain("{'broken': datetime(2020}");
  });

  it('leaves plain messages untouched', () => {
    expect(prettify('just text')).toBe('just text');
  });
});
