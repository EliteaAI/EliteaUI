import YAML from 'js-yaml';

import * as MermaidHelpers from './mermaid.helpers';
import { json, jsonParseLinter } from '@codemirror/lang-json';
import { StreamLanguage } from '@codemirror/language';
import { linter } from '@codemirror/lint';

const csvMode = {
  startState: () => ({}),
  token: stream => {
    if (stream.match(/^"([^"]|"")*"/)) return 'string';
    if (stream.match(/^[^,\n\r]+/)) return 'variable';
    if (stream.match(',')) return 'operator';
    stream.next();
    return null;
  },
};

const tsvMode = {
  startState: () => ({}),
  token: stream => {
    if (stream.match(/^[^\t\n\r]+/)) return 'variable';
    if (stream.match('\t')) return 'operator';
    stream.next();
    return null;
  },
};

const diffMode = {
  startState: () => ({}),
  token: stream => {
    if (stream.sol()) {
      if (stream.match(/^\+{3}\s/)) return 'meta';
      if (stream.match(/^-{3}\s/)) return 'meta';
      if (stream.match(/^@@.*@@/)) return 'meta';
      if (stream.match(/^diff\s/)) return 'meta';
      if (stream.match(/^index\s/)) return 'meta';
      if (stream.match(/^\+/)) return 'inserted';
      if (stream.match(/^-/)) return 'deleted';
      if (stream.match(/^\\/)) return 'comment';
    }
    stream.next();
    return null;
  },
};

const yamlLinter = linter(view => {
  const diagnostics = [];
  try {
    YAML.load(view.state.doc);
  } catch (e) {
    const loc = e.mark;
    const to = loc?.position || 0;
    const lineBlock = view.lineBlockAt(to);
    diagnostics.push({
      from: lineBlock.from,
      to: lineBlock.to,
      message: e.message,
      severity: 'error',
      markClass: 'error_yaml_code',
    });
  }
  return diagnostics;
});

const textLinter = linter(() => []);

const jinjaLinter = linter(view => {
  const diagnostics = [];
  const doc = view.state.doc.toString();

  const openTags = (doc.match(/{%/g) || []).length;
  const closeTags = (doc.match(/%}/g) || []).length;
  if (openTags !== closeTags) {
    diagnostics.push({
      from: 0,
      to: doc.length,
      severity: 'error',
      message: 'Unmatched Jinja2 tags: {% and %} must be balanced.',
    });
  }

  const openBraces = (doc.match(/{{/g) || []).length;
  const closeBraces = (doc.match(/}}/g) || []).length;
  if (openBraces !== closeBraces) {
    diagnostics.push({
      from: 0,
      to: doc.length,
      severity: 'error',
      message: 'Unmatched Jinja2 variable braces: {{ and }} must be balanced.',
    });
  }

  const openComments = (doc.match(/{#/g) || []).length;
  const closeComments = (doc.match(/#}/g) || []).length;
  if (openComments !== closeComments) {
    diagnostics.push({
      from: 0,
      to: doc.length,
      severity: 'error',
      message: 'Unmatched Jinja2 comments: {# and #} must be balanced.',
    });
  }

  const invalidSyntax = doc.match(/{%.*?[^%]}/g);
  if (invalidSyntax) {
    invalidSyntax.forEach(match => {
      const start = doc.indexOf(match);
      diagnostics.push({
        from: start,
        to: start + match.length,
        severity: 'warning',
        message: `Potential invalid syntax: "${match}"`,
      });
    });
  }

  return diagnostics;
});

const extractLineNumber = errorMessage => {
  const match = errorMessage.match(/line (\d+)/);
  return match ? parseInt(match[1], 10) : null;
};

const mermaidLinter = linter(async view => {
  const diagnostics = [];
  const doc = view.state.doc.toString();

  try {
    const mermaid = await MermaidHelpers.getMermaid();
    await mermaid.parse(doc);
  } catch (error) {
    const errorMessage = error.toString?.() || 'Unknown error';
    const lineNumber = extractLineNumber(errorMessage) || 1;
    const from = view.state.doc.line(error.hash?.loc?.first_line || lineNumber).from || 0;
    const to = view.state.doc.line(error.hash?.loc?.last_line || lineNumber).to || doc.length;
    diagnostics.push({ from, to, severity: 'error', message: errorMessage });
  }

  return diagnostics;
});

const markdownLinter = linter(async view => {
  const diagnostics = [];

  try {
    const doc = view.state.doc.toString();
    const { lint: lintSync } = await import('markdownlint/sync');
    const results = lintSync({ strings: { content: doc }, config: { default: true, 'line-length': false } });

    if (results?.content) {
      results.content.forEach(error => {
        diagnostics.push({
          from: view.state.doc.line(error.lineNumber).from,
          to: view.state.doc.line(error.lineNumber).to,
          message: error.ruleDescription,
          severity: 'warning',
        });
      });
    }
  } catch {
    // Silently ignore markdown parsing errors during streaming
  }
  return diagnostics;
});

export const jsonLinter = linter(jsonParseLinter());

const loadLangs = () => import('@uiw/codemirror-extensions-langs').then(m => m.langs);

export const getExtensionsByLang = async lang => {
  switch (lang) {
    case 'yaml': {
      const { yaml } = await import('@codemirror/legacy-modes/mode/yaml');
      return {
        extensionWithoutLinter: [StreamLanguage.define(yaml)],
        extensionWithLinter: [StreamLanguage.define(yaml), yamlLinter],
      };
    }
    case 'text':
      return { extensionWithoutLinter: [], extensionWithLinter: [textLinter] };
    case 'json':
      return { extensionWithoutLinter: [json()], extensionWithLinter: [json(), linter(jsonParseLinter())] };
    case 'jinja': {
      const { jinja2 } = await import('@codemirror/legacy-modes/mode/jinja2');
      return {
        extensionWithoutLinter: [StreamLanguage.define(jinja2)],
        extensionWithLinter: [StreamLanguage.define(jinja2), jinjaLinter],
      };
    }
    case 'mermaid': {
      const langs = await loadLangs();
      return {
        extensionWithoutLinter: [langs.mermaid?.()].filter(Boolean),
        extensionWithLinter: [langs.mermaid?.(), mermaidLinter].filter(Boolean),
      };
    }
    case 'markdown': {
      const { markdown } = await import('@codemirror/lang-markdown');
      return { extensionWithoutLinter: [markdown()], extensionWithLinter: [markdown(), markdownLinter] };
    }
    case 'csharp':
    case 'c#':
    case 'c':
    case 'c++':
    case 'cpp': {
      const { cpp } = await import('@codemirror/lang-cpp');
      return { extensionWithoutLinter: [cpp()], extensionWithLinter: [cpp()] };
    }
    case 'csv':
      return {
        extensionWithoutLinter: [StreamLanguage.define(csvMode)],
        extensionWithLinter: [StreamLanguage.define(csvMode)],
      };
    case 'css': {
      const { css } = await import('@codemirror/lang-css');
      return { extensionWithoutLinter: [css()], extensionWithLinter: [css()] };
    }
    case 'diff':
      return {
        extensionWithoutLinter: [StreamLanguage.define(diffMode)],
        extensionWithLinter: [StreamLanguage.define(diffMode)],
      };
    case 'go': {
      const { go } = await import('@codemirror/lang-go');
      return { extensionWithoutLinter: [go()], extensionWithLinter: [go()] };
    }
    case 'html': {
      const { html } = await import('@codemirror/lang-html');
      return { extensionWithoutLinter: [html()], extensionWithLinter: [html()] };
    }
    case 'java': {
      const { java } = await import('@codemirror/lang-java');
      return { extensionWithoutLinter: [java()], extensionWithLinter: [java()] };
    }
    case 'js':
    case 'javascript': {
      const { javascript } = await import('@codemirror/lang-javascript');
      return { extensionWithoutLinter: [javascript()], extensionWithLinter: [javascript()] };
    }
    case 'less': {
      const { less } = await import('@codemirror/lang-less');
      return { extensionWithoutLinter: [less()], extensionWithLinter: [less()] };
    }
    case 'php': {
      const { php } = await import('@codemirror/lang-php');
      return { extensionWithoutLinter: [php()], extensionWithLinter: [php()] };
    }
    case 'python': {
      const { python } = await import('@codemirror/lang-python');
      return { extensionWithoutLinter: [python()], extensionWithLinter: [python()] };
    }
    case 'rust': {
      const { rust } = await import('@codemirror/lang-rust');
      return { extensionWithoutLinter: [rust()], extensionWithLinter: [rust()] };
    }
    case 'sass':
    case 'scss': {
      const { sass } = await import('@codemirror/lang-sass');
      return { extensionWithoutLinter: [sass()], extensionWithLinter: [sass()] };
    }
    case 'sql': {
      const { sql } = await import('@codemirror/lang-sql');
      return { extensionWithoutLinter: [sql()], extensionWithLinter: [sql()] };
    }
    case 'swift': {
      const { swift } = await import('@codemirror/legacy-modes/mode/swift');
      return {
        extensionWithoutLinter: [StreamLanguage.define(swift)],
        extensionWithLinter: [StreamLanguage.define(swift)],
      };
    }
    case 'tsv':
      return {
        extensionWithoutLinter: [StreamLanguage.define(tsvMode)],
        extensionWithLinter: [StreamLanguage.define(tsvMode)],
      };
    case 'xml': {
      const { xml } = await import('@codemirror/lang-xml');
      return { extensionWithoutLinter: [xml()], extensionWithLinter: [xml()] };
    }
    case 'log':
      return { extensionWithoutLinter: [], extensionWithLinter: [textLinter] };
    case 'kotlin':
    case 'dart':
    case 'gherkin':
    case 'feature':
    case 'jsx':
    case 'ruby':
    case 'shell':
    case 'ts':
    case 'typescript':
    case 'tsx':
    case 'vue':
    case 'dockerfile':
    case 'makefile':
    case 'ini':
    case 'toml':
    case 'properties':
    case 'perl':
    case 'lua':
    case 'vim':
    case 'cmake': {
      const langs = await loadLangs();
      const langKey = lang === 'ts' ? 'typescript' : lang === 'feature' ? 'gherkin' : lang;
      const langFn = langs[langKey];
      return {
        extensionWithoutLinter: [langFn?.()].filter(Boolean),
        extensionWithLinter: [langFn?.()].filter(Boolean),
      };
    }
    default:
      return { extensionWithoutLinter: [], extensionWithLinter: [textLinter] };
  }
};
