/* eslint-disable no-useless-escape */
import { useCallback, useEffect, useState } from 'react';

import YAML from 'js-yaml';
import { lint as lintSync } from 'markdownlint/sync';
import mermaid from 'mermaid';

import { cpp } from '@codemirror/lang-cpp';
import { css } from '@codemirror/lang-css';
import { go } from '@codemirror/lang-go';
import { html } from '@codemirror/lang-html';
import { java } from '@codemirror/lang-java';
// Import C++ language extension
import { javascript } from '@codemirror/lang-javascript';
import { json, jsonParseLinter } from '@codemirror/lang-json';
import { less } from '@codemirror/lang-less';
import { markdown } from '@codemirror/lang-markdown';
import { php } from '@codemirror/lang-php';
import { python } from '@codemirror/lang-python';
import { rust } from '@codemirror/lang-rust';
import { sass } from '@codemirror/lang-sass';
import { sql } from '@codemirror/lang-sql';
import { xml } from '@codemirror/lang-xml';
import { StreamLanguage } from '@codemirror/language';
import { jinja2 } from '@codemirror/legacy-modes/mode/jinja2';
import { swift } from '@codemirror/legacy-modes/mode/swift';
import { yaml } from '@codemirror/legacy-modes/mode/yaml';
import { linter, setDiagnostics } from '@codemirror/lint';
import { langs } from '@uiw/codemirror-extensions-langs';

export const languageOptions = [
  {
    label: 'C',
    value: 'c',
  },
  {
    label: 'C#',
    value: 'csharp',
  },
  {
    label: 'C++',
    value: 'c++',
  },
  {
    label: 'CMake',
    value: 'cmake',
  },
  {
    label: 'CSV',
    value: 'csv',
  },
  {
    label: 'Css',
    value: 'css',
  },
  {
    label: 'Dart',
    value: 'dart',
  },
  {
    label: 'Diff',
    value: 'diff',
  },
  {
    label: 'Dockerfile',
    value: 'dockerfile',
  },
  {
    label: 'Feature/Gherkin',
    value: 'gherkin',
  },
  {
    label: 'Go',
    value: 'go',
  },
  {
    label: 'Html',
    value: 'html',
  },
  {
    label: 'INI',
    value: 'ini',
  },
  {
    label: 'Java',
    value: 'java',
  },
  {
    label: 'Java script',
    value: 'javascript',
  },
  {
    label: 'Jsx',
    value: 'jsx',
  },
  {
    label: 'Jinja2',
    value: 'jinja',
  },
  {
    label: 'Json',
    value: 'json',
  },
  {
    label: 'Kotlin',
    value: 'kotlin',
  },
  {
    label: 'Less',
    value: 'less',
  },
  {
    label: 'Log',
    value: 'log',
  },
  {
    label: 'Lua',
    value: 'lua',
  },
  {
    label: 'Makefile',
    value: 'makefile',
  },
  {
    label: 'Markdown',
    value: 'markdown',
  },
  {
    label: 'Mermaid',
    value: 'mermaid',
  },
  {
    label: 'Perl',
    value: 'perl',
  },
  {
    label: 'Php',
    value: 'php',
  },
  {
    label: 'Properties',
    value: 'properties',
  },
  {
    label: 'Python',
    value: 'python',
  },
  {
    label: 'Rust',
    value: 'rust',
  },
  {
    label: 'Ruby',
    value: 'ruby',
  },
  {
    label: 'Scss',
    value: 'scss',
  },
  {
    label: 'Shell',
    value: 'shell',
  },
  {
    label: 'Swift',
    value: 'swift',
  },
  {
    label: 'Sql',
    value: 'sql',
  },
  {
    label: 'Text',
    value: 'text',
  },
  {
    label: 'TOML',
    value: 'toml',
  },
  {
    label: 'TSV',
    value: 'tsv',
  },
  {
    label: 'Type script',
    value: 'typescript',
  },
  {
    label: 'Tsx',
    value: 'tsx',
  },
  {
    label: 'Vim',
    value: 'vim',
  },
  {
    label: 'XML',
    value: 'xml',
  },
  {
    label: 'Yaml',
    value: 'yaml',
  },
];

// Simple language modes for CSV, TSV, and Diff files
const csvMode = {
  startState: () => ({}),
  token: stream => {
    if (stream.match(/^"([^"]|"")*"/)) {
      return 'string';
    }
    if (stream.match(/^[^,\n\r]+/)) {
      return 'variable';
    }
    if (stream.match(',')) {
      return 'operator';
    }
    stream.next();
    return null;
  },
};

const tsvMode = {
  startState: () => ({}),
  token: stream => {
    if (stream.match(/^[^\t\n\r]+/)) {
      return 'variable';
    }
    if (stream.match('\t')) {
      return 'operator';
    }
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

// Enhanced auto-detection function that properly distinguishes markdown, YAML, and text
export const detectContentType = content => {
  if (!content || typeof content !== 'string') return 'text';

  const trimmed = content.trim();
  if (!trimmed) return 'text';

  const lines = trimmed.split('\n');
  const firstLine = lines[0]?.toLowerCase() || '';
  const firstFewLines = lines.slice(0, Math.min(10, lines.length));

  // Comprehensive emoji regex that covers all Unicode emoji ranges
  const emojiRegex =
    /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{238C}-\u{2454}]|[\u{20D0}-\u{20FF}]|[\u{FE0F}]|[\u{1F004}]|[\u{1F0CF}]|[\u{1F170}-\u{1F251}]/gu;
  // Check for shebang lines first (highest priority)
  if (trimmed.startsWith('#!')) {
    if (firstLine.includes('python')) return 'python';
    if (firstLine.includes('node') || firstLine.includes('nodejs')) return 'javascript';
    if (firstLine.includes('bash') || firstLine.includes('sh')) return 'shell';
    if (firstLine.includes('ruby')) return 'ruby';
    if (firstLine.includes('php')) return 'php';
  }

  // Check for XML/HTML declarations (before other checks)
  if (trimmed.startsWith('<?xml')) return 'xml';
  if (trimmed.startsWith('<!DOCTYPE html') || trimmed.includes('<html')) return 'html';
  if (trimmed.startsWith('<?php')) return 'php';

  // JSON - strict check (must be valid JSON)
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {
      // Continue to other checks
    }
  }

  // Markdown detection - enhanced logic (run BEFORE YAML to get priority)
  const isMarkdown = () => {
    let markdownScore = 0;
    const totalLines = firstFewLines.length;
    let hasStrongMarkdownIndicators = false;

    for (const line of firstFewLines) {
      const cleanLine = line.trim();
      if (!cleanLine) continue;

      // Very strong markdown indicators (immediate high score)
      if (/^#{1,6}\s+/.test(cleanLine)) {
        markdownScore += 4;
        hasStrongMarkdownIndicators = true;
      }
      if (/```/.test(cleanLine)) {
        markdownScore += 4;
        hasStrongMarkdownIndicators = true;
      }

      // Strong markdown indicators
      if (/^\s*[-*+]\s+/.test(cleanLine) && !cleanLine.includes(':')) markdownScore += 3; // Lists (not YAML)
      if (/^\s*\d+\.\s+/.test(cleanLine)) markdownScore += 3; // Numbered lists
      if (/\*\*.*\*\*/.test(cleanLine) || /__.*__/.test(cleanLine)) markdownScore += 3; // Bold
      if (/\[.*\]\(.*\)/.test(cleanLine)) markdownScore += 3; // Links
      if (/!\[.*\]\(.*\)/.test(cleanLine)) markdownScore += 3; // Images
      if (/^\s*\|.*\|/.test(cleanLine)) markdownScore += 3; // Tables
      if (/^[-=]{3,}$/.test(cleanLine)) markdownScore += 3; // Horizontal rules
      if (/^\s*>/.test(cleanLine)) markdownScore += 2; // Blockquotes

      // Moderate markdown indicators
      if (/\*.*\*/.test(cleanLine) && !/\*\*/.test(cleanLine)) markdownScore += 1; // Italic
      if (/`[^`]+`/.test(cleanLine)) markdownScore += 1; // Inline code

      // Enhanced emoji detection - covers all Unicode emoji ranges
      if (emojiRegex.test(cleanLine)) {
        markdownScore += 2; // Emojis are very common in markdown
        if (
          /^#{1,6}\s+.*[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}]/gu.test(
            cleanLine,
          )
        ) {
          markdownScore += 3; // Emoji headers are very strong markdown indicators
          hasStrongMarkdownIndicators = true;
        }
      }

      // Special markdown patterns that might conflict with YAML
      if (/\*\*[^:*]+\*\*:/.test(cleanLine)) {
        markdownScore += 3; // Bold text followed by colon (common in markdown)
        hasStrongMarkdownIndicators = true;
      }

      // Markdown-style emphasis with colons
      if (/^\*\*[A-Z][^:]*\*\*:/.test(cleanLine)) {
        markdownScore += 3; // Bold headers with colons
        hasStrongMarkdownIndicators = true;
      }

      // Reduce score for pure YAML-like patterns (but be more careful)
      if (
        /^[a-zA-Z_][a-zA-Z0-9_\-]*:\s*[^#*\[`"']/.test(cleanLine) &&
        !cleanLine.includes('**') &&
        !cleanLine.includes('://') &&
        !cleanLine.match(/^#{1,6}\s/) &&
        !emojiRegex.test(cleanLine)
      ) {
        markdownScore -= 0.5; // Smaller penalty to avoid over-penalizing
      }
    }

    // If we have strong markdown indicators, prioritize markdown
    if (hasStrongMarkdownIndicators) {
      return true;
    }

    // Otherwise, use scoring system
    return markdownScore >= 4 || (totalLines > 0 && markdownScore / totalLines > 0.7);
  };

  // YAML detection - enhanced logic with better patterns (run AFTER markdown)
  const isYaml = () => {
    // Strong YAML indicators (immediate return)
    if (trimmed.startsWith('---') && !trimmed.startsWith('--- ')) return true; // YAML doc separator, not markdown horizontal rule
    if (trimmed.endsWith('...')) return true;

    // Check for YAML document separators (but not markdown horizontal rules)
    if (lines.some(line => line.trim() === '---' || line.trim() === '...')) {
      // Make sure it's not just markdown horizontal rules
      const horizontalRules = lines.filter(line => /^-{3,}$/.test(line.trim())).length;
      const yamlSeparators = lines.filter(line => line.trim() === '---' || line.trim() === '...').length;
      if (yamlSeparators > horizontalRules) return true;
    }

    // If content has strong markdown indicators, it's probably not YAML
    const hasStrongMarkdownPatterns = firstFewLines.some(line => {
      const cleanLine = line.trim();
      return (
        /^#{1,6}\s+/.test(cleanLine) || // Headers
        /\*\*.*\*\*/.test(cleanLine) || // Bold text
        /```/.test(cleanLine) || // Code blocks
        /\[.*\]\(.*\)/.test(cleanLine) || // Links
        emojiRegex.test(cleanLine) || // Any emoji
        /^\*\*[A-Z][^:]*\*\*:/.test(cleanLine)
      ); // Bold headers with colons
    });

    if (hasStrongMarkdownPatterns) {
      return false;
    }

    // Count lines that look like YAML key-value pairs
    let yamlLikeLines = 0;
    let totalContentLines = 0;
    let listItems = 0;

    for (const line of firstFewLines) {
      const cleanLine = line.trim();
      if (!cleanLine || cleanLine.startsWith('#')) continue; // Skip empty lines and comments

      totalContentLines++;

      // YAML key-value patterns (more restrictive)
      if (
        /^[a-zA-Z_][a-zA-Z0-9_\-]*:\s*(.+|$)/.test(cleanLine) &&
        !cleanLine.includes('://') && // Not URLs
        !cleanLine.match(/^#+\s/) && // Not markdown headers
        !cleanLine.includes('](') && // Not markdown links
        !cleanLine.includes('**') && // Not markdown bold
        !cleanLine.includes('`') && // Not markdown code
        !cleanLine.includes('*') && // Not markdown emphasis
        !cleanLine.includes('[') && // Not markdown links
        !emojiRegex.test(cleanLine) && // No emojis
        !/^[A-Z\s]+:/.test(cleanLine) && // Not titles/headers like "INPUTS REQUIRED:"
        !/^\*\*/.test(cleanLine)
      ) {
        // Not bold markdown
        yamlLikeLines++;
      }

      // YAML list items (more restrictive)
      if (
        /^-\s+[a-zA-Z0-9]/.test(cleanLine) &&
        !cleanLine.match(/^-\s*\[/) &&
        !cleanLine.includes('**') &&
        !cleanLine.includes('`') &&
        !cleanLine.includes('*') &&
        !cleanLine.includes('#') &&
        !emojiRegex.test(cleanLine)
      ) {
        yamlLikeLines++;
        listItems++;
      }

      // YAML array syntax
      if (/^\s*-\s+\w+:\s*\w/.test(cleanLine) && !emojiRegex.test(cleanLine)) {
        yamlLikeLines++;
      }
    }

    // Require higher threshold for YAML detection
    const threshold = 0.85; // Increased threshold

    // Need significant YAML content and minimal conflicting patterns
    return (
      totalContentLines >= 3 &&
      yamlLikeLines / totalContentLines > threshold &&
      listItems < totalContentLines * 0.8
    ); // Not mostly list items (could be markdown)
  };

  // Check markdown FIRST, then YAML
  if (isMarkdown()) return 'markdown';
  if (isYaml()) return 'yaml';

  // Programming languages with strong indicators

  // Python
  if (
    firstLine.includes('import ') ||
    firstLine.includes('from ') ||
    trimmed.includes('def ') ||
    trimmed.includes('class ') ||
    trimmed.includes('print(') ||
    trimmed.includes('if __name__') ||
    trimmed.includes('pip install') ||
    trimmed.includes('python -')
  ) {
    return 'python';
  }

  // JavaScript/TypeScript
  if (
    trimmed.includes('function') ||
    trimmed.includes('=>') ||
    trimmed.includes('const ') ||
    trimmed.includes('let ') ||
    trimmed.includes('var ') ||
    trimmed.includes('require(') ||
    trimmed.includes('import ') ||
    trimmed.includes('export ') ||
    trimmed.includes('console.log') ||
    trimmed.includes('document.') ||
    trimmed.includes('window.') ||
    trimmed.includes('npm ')
  ) {
    // TypeScript specific patterns
    if (
      trimmed.includes(': string') ||
      trimmed.includes(': number') ||
      trimmed.includes(': boolean') ||
      trimmed.includes('interface ') ||
      trimmed.includes('type ') ||
      trimmed.includes('enum ') ||
      trimmed.includes('<T>') ||
      trimmed.includes('extends ')
    ) {
      return 'typescript';
    }

    // JSX/TSX patterns
    if (
      trimmed.includes('<') &&
      trimmed.includes('>') &&
      (trimmed.includes('React') ||
        trimmed.includes('jsx') ||
        trimmed.includes('className=') ||
        trimmed.includes('onClick='))
    ) {
      return trimmed.includes(': React.') || trimmed.includes('interface ') ? 'tsx' : 'jsx';
    }

    return 'javascript';
  }

  // Java
  if (
    trimmed.includes('public class ') ||
    trimmed.includes('private ') ||
    trimmed.includes('public static void main') ||
    trimmed.includes('package ') ||
    trimmed.includes('import java.') ||
    trimmed.includes('System.out.') ||
    firstLine.includes('package ')
  ) {
    return 'java';
  }

  // C/C++
  if (
    trimmed.includes('#include') ||
    trimmed.includes('int main(') ||
    trimmed.includes('std::') ||
    trimmed.includes('cout <<') ||
    trimmed.includes('printf(') ||
    trimmed.includes('#define') ||
    trimmed.includes('namespace ') ||
    trimmed.includes('using namespace')
  ) {
    return 'cpp';
  }

  // C#
  if (
    trimmed.includes('using System') ||
    trimmed.includes('namespace ') ||
    trimmed.includes('public class ') ||
    trimmed.includes('static void Main') ||
    trimmed.includes('Console.Write')
  ) {
    return 'csharp';
  }

  // Go
  if (
    trimmed.includes('package main') ||
    trimmed.includes('func main()') ||
    trimmed.includes('import (') ||
    firstLine.includes('package ') ||
    trimmed.includes('fmt.Print') ||
    trimmed.includes('go ')
  ) {
    return 'go';
  }

  // Rust
  if (
    trimmed.includes('fn main()') ||
    trimmed.includes('use std::') ||
    trimmed.includes('let mut ') ||
    trimmed.includes('impl ') ||
    trimmed.includes('cargo ') ||
    trimmed.includes('println!') ||
    (trimmed.includes('struct ') && trimmed.includes('impl '))
  ) {
    return 'rust';
  }

  // Swift
  if (
    trimmed.includes('import Swift') ||
    trimmed.includes('func ') ||
    (trimmed.includes('var ') && trimmed.includes(': String')) ||
    (trimmed.includes('print(') && trimmed.includes('swift'))
  ) {
    return 'swift';
  }

  // Ruby
  if (
    trimmed.includes('require ') ||
    trimmed.includes('puts ') ||
    trimmed.includes('def ') ||
    trimmed.includes('end') ||
    trimmed.includes('gem ') ||
    firstLine.includes('ruby')
  ) {
    return 'ruby';
  }

  // PHP
  if (
    trimmed.includes('<?php') ||
    trimmed.includes('echo ') ||
    trimmed.includes('$_GET') ||
    trimmed.includes('$_POST') ||
    (trimmed.includes('function ') && trimmed.includes('$'))
  ) {
    return 'php';
  }

  // SQL
  if (
    firstLine.includes('select ') ||
    firstLine.includes('SELECT ') ||
    firstLine.includes('insert ') ||
    firstLine.includes('INSERT ') ||
    firstLine.includes('update ') ||
    firstLine.includes('UPDATE ') ||
    firstLine.includes('delete ') ||
    firstLine.includes('DELETE ') ||
    firstLine.includes('create table') ||
    firstLine.includes('CREATE TABLE') ||
    trimmed.includes('FROM ') ||
    trimmed.includes('WHERE ') ||
    trimmed.includes('JOIN ') ||
    trimmed.includes('GROUP BY')
  ) {
    return 'sql';
  }

  // Kotlin
  if (
    trimmed.includes('fun main(') ||
    trimmed.includes('package ') ||
    trimmed.includes('import kotlin') ||
    trimmed.includes('println(') ||
    trimmed.includes('val ') ||
    (trimmed.includes('var ') && trimmed.includes('kotlin'))
  ) {
    return 'kotlin';
  }

  // Dart
  if (
    trimmed.includes('void main(') ||
    trimmed.includes("import 'dart:") ||
    trimmed.includes('flutter') ||
    trimmed.includes('dart ') ||
    (trimmed.includes('print(') && trimmed.includes('dart'))
  ) {
    return 'dart';
  }

  // Vue
  if (
    trimmed.includes('<template>') ||
    trimmed.includes('<script>') ||
    (trimmed.includes('export default {') && trimmed.includes('<style')) ||
    trimmed.includes('Vue.')
  ) {
    return 'vue';
  }

  // Web technologies

  // HTML
  if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
    if (
      trimmed.includes('<div') ||
      trimmed.includes('<span') ||
      trimmed.includes('<html') ||
      trimmed.includes('<head') ||
      trimmed.includes('<body') ||
      trimmed.includes('<script') ||
      trimmed.includes('<style')
    ) {
      return 'html';
    }
    return 'xml'; // Generic XML
  }

  // CSS/SCSS/LESS
  if (trimmed.includes('{') && trimmed.includes('}')) {
    if (
      trimmed.includes('@import') ||
      trimmed.includes('@mixin') ||
      (trimmed.includes('$') && trimmed.includes(':'))
    ) {
      return 'scss';
    }
    if (trimmed.includes('@') && (trimmed.includes('.') || trimmed.includes('#'))) {
      return 'less';
    }
    if (
      (trimmed.includes(':') && trimmed.includes(';')) ||
      trimmed.includes('color:') ||
      trimmed.includes('margin:') ||
      trimmed.includes('padding:') ||
      trimmed.includes('@media')
    ) {
      return 'css';
    }
  }

  // Mermaid diagrams (check before diff to avoid conflicts)
  if (
    trimmed.includes('graph ') ||
    trimmed.includes('flowchart ') ||
    trimmed.includes('sequenceDiagram') ||
    trimmed.includes('classDiagram') ||
    trimmed.includes('gitGraph') ||
    trimmed.includes('journey') ||
    trimmed.includes('pie ') ||
    trimmed.includes('gantt') ||
    trimmed.includes('stateDiagram') ||
    trimmed.includes('erDiagram')
  ) {
    return 'mermaid';
  }

  // Diff/Patch files
  if (
    trimmed.includes('diff --git') ||
    trimmed.includes('--- a/') ||
    trimmed.includes('+++ b/') ||
    trimmed.includes('@@') ||
    firstLine.includes('diff ') ||
    firstLine.includes('***') ||
    (lines.some(line => line.startsWith('+ ')) && lines.some(line => line.startsWith('- '))) ||
    trimmed.includes('Index: ') ||
    trimmed.includes('===') ||
    trimmed.match(/^[+-@]{1,3}\s/m)
  ) {
    return 'diff';
  }

  // CSV detection
  if (lines.length > 1) {
    const sampleLines = lines.slice(0, Math.min(5, lines.length));
    const potentialCsv = sampleLines.every(line => {
      const commaCount = (line.match(/,/g) || []).length;
      const tabCount = (line.match(/\t/g) || []).length;
      return commaCount > 0 && tabCount === 0; // Has commas but no tabs
    });

    if (potentialCsv) {
      // Check if all lines have similar comma counts (typical CSV structure)
      const commaCounts = sampleLines.map(line => (line.match(/,/g) || []).length);
      const avgCommas = commaCounts.reduce((a, b) => a + b, 0) / commaCounts.length;
      const variance = commaCounts.every(count => Math.abs(count - avgCommas) <= 2);

      if (variance) {
        return 'csv';
      }
    }
  }

  // TSV detection
  if (lines.length > 1) {
    const sampleLines = lines.slice(0, Math.min(5, lines.length));
    const potentialTsv = sampleLines.every(line => {
      const tabCount = (line.match(/\t/g) || []).length;
      const commaCount = (line.match(/,/g) || []).length;
      return tabCount > 0 && commaCount < tabCount; // Has tabs, fewer commas than tabs
    });

    if (potentialTsv) {
      // Check if all lines have similar tab counts
      const tabCounts = sampleLines.map(line => (line.match(/\t/g) || []).length);
      const avgTabs = tabCounts.reduce((a, b) => a + b, 0) / tabCounts.length;
      const variance = tabCounts.every(count => Math.abs(count - avgTabs) <= 1);

      if (variance) {
        return 'tsv';
      }
    }
  }

  // Jinja2 templates
  if (
    (trimmed.includes('{{') && trimmed.includes('}}')) ||
    (trimmed.includes('{%') && trimmed.includes('%}')) ||
    (trimmed.includes('{#') && trimmed.includes('#}'))
  ) {
    return 'jinja';
  }

  // Default to plain text
  return 'text';
};

const yamlLinter = linter(view => {
  const diagnostics = [];
  try {
    YAML.load(view.state.doc);
  } catch (e) {
    const loc = e.mark;
    const to = loc?.position || 0;
    const lineBlock = view.lineBlockAt(to);
    // const from = (to - loc?.snippet.split('--------^')[0]?.length || 0)
    const severity = 'error';
    diagnostics.push({
      from: lineBlock.from,
      to: lineBlock.to,
      message: e.message,
      severity,
      markClass: 'error_yaml_code',
    });
  }
  return diagnostics;
});

// eslint-disable-next-line no-unused-vars
const textLinter = linter(view => {
  const diagnostics = [];
  return diagnostics;
});

export const jsonLinter = linter(jsonParseLinter());

const jinjaLinter = linter(view => {
  const diagnostics = [];
  const doc = view.state.doc.toString();

  // Example: Check for unclosed Jinja2 tags
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

  // Example: Check for unclosed variable braces
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

  // Example: Check for unclosed or unmatched Jinja2 comments
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

  // Example: Check for invalid syntax (basic regex-based validation)
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

function extractLineNumber(errorMessage) {
  const lineNumberRegex = /line (\d+)/; // Regex to match "line X"
  const match = errorMessage.match(lineNumberRegex); // Search for the line number
  if (match) {
    return parseInt(match[1], 10); // Extract and return the line number as an integer
  }
  return null; // Return null if no line number is found
}

const mermaidLinter = linter(async view => {
  const diagnostics = [];
  const doc = view.state.doc.toString();

  try {
    // Validate the Mermaid content
    await mermaid.parse(doc);
  } catch (error) {
    // Extract error details and push diagnostics
    const errorMessage = error.toString?.() || 'Unknown error';
    const lineNumber = extractLineNumber(errorMessage) || 1; // Extract line number if available
    const from = view.state.doc.line(error.hash?.loc?.first_line || lineNumber).from || 0; // Get the start position of the line
    const to = view.state.doc.line(error.hash?.loc?.last_line || lineNumber).to || doc.length; // Get the end position of the line

    diagnostics.push({
      from,
      to,
      severity: 'error',
      message: errorMessage,
    });
  }
  return diagnostics;
});

const markdownLinter = linter(view => {
  const diagnostics = [];
  try {
    const doc = view.state.doc.toString();
    const options = {
      default: true, // Enable default rules
      'line-length': false, // Disable the "line-length" rule
    };
    const results = lintSync({ strings: { content: doc }, config: options });
    if (results?.content) {
      results.content.forEach(error => {
        diagnostics.push({
          from: view.state.doc.line(error.lineNumber).from, // Start position of the line
          to: view.state.doc.line(error.lineNumber).to, // End position of the line
          message: error.ruleDescription, // Description of the linting issue
          severity: 'warning', // Severity level ('error', 'warning', etc.)
        });
      });
    }
  } catch {
    // Silently ignore markdown parsing errors during streaming or with incomplete content
    // This can happen when content is being streamed and is temporarily malformed
  }
  return diagnostics;
});

export const getExtensionsByLang = lang => {
  // console.log("Getting extensions for language:",langs);
  switch (lang) {
    case 'yaml':
      return {
        extensionWithoutLinter: [StreamLanguage.define(yaml)],
        extensionWithLinter: [StreamLanguage.define(yaml), yamlLinter],
      };
    case 'text':
      return {
        extensionWithoutLinter: [],
        extensionWithLinter: [textLinter],
      };
    case 'json':
      return {
        extensionWithoutLinter: [json()],
        extensionWithLinter: [json(), jsonLinter],
      };
    case 'jinja':
      return {
        extensionWithoutLinter: [StreamLanguage.define(jinja2)],
        extensionWithLinter: [StreamLanguage.define(jinja2), jinjaLinter],
      };
    case 'kotlin':
      return {
        extensionWithoutLinter: [langs.kotlin?.()].filter(item => item),
        extensionWithLinter: [langs.kotlin?.()].filter(item => item),
      };
    case 'mermaid':
      return {
        extensionWithoutLinter: [langs.mermaid?.()].filter(item => item),
        extensionWithLinter: [langs.mermaid?.(), mermaidLinter].filter(item => item),
      };
    case 'markdown':
      return {
        extensionWithoutLinter: [markdown()],
        extensionWithLinter: [markdown(), markdownLinter],
      };
    case 'csharp':
    case 'c#':
    case 'c':
    case 'c++':
    case 'cpp':
      return {
        extensionWithoutLinter: [cpp()],
        extensionWithLinter: [cpp()],
      };
    case 'csv':
      return {
        extensionWithoutLinter: [StreamLanguage.define(csvMode)],
        extensionWithLinter: [StreamLanguage.define(csvMode)],
      };
    case 'css':
      return {
        extensionWithoutLinter: [css()],
        extensionWithLinter: [css()],
      };
    case 'dart':
      return {
        extensionWithoutLinter: [langs.dart?.()].filter(item => item),
        extensionWithLinter: [langs.dart?.()].filter(item => item),
      };
    case 'diff':
      return {
        extensionWithoutLinter: [StreamLanguage.define(diffMode)],
        extensionWithLinter: [StreamLanguage.define(diffMode)],
      };
    case 'go':
      return {
        extensionWithoutLinter: [go()],
        extensionWithLinter: [go()],
      };
    case 'gherkin':
    case 'feature':
      return {
        extensionWithoutLinter: [langs.gherkin?.()].filter(item => item),
        extensionWithLinter: [langs.gherkin?.()].filter(item => item),
      };
    case 'html':
      return {
        extensionWithoutLinter: [html()],
        extensionWithLinter: [html()],
      };
    case 'java':
      return {
        extensionWithoutLinter: [java()],
        extensionWithLinter: [java()],
      };
    case 'js':
    case 'javascript':
      return {
        extensionWithoutLinter: [javascript()],
        extensionWithLinter: [javascript()],
      };
    case 'jsx':
      return {
        extensionWithoutLinter: [langs.jsx?.()].filter(item => item),
        extensionWithLinter: [langs.jsx?.()].filter(item => item),
      };
    case 'less':
      return {
        extensionWithoutLinter: [less()],
        extensionWithLinter: [less()],
      };
    case 'php':
      return {
        extensionWithoutLinter: [php()],
        extensionWithLinter: [php()],
      };
    case 'python':
      return {
        extensionWithoutLinter: [python()],
        extensionWithLinter: [python()],
      };
    case 'ruby':
      return {
        extensionWithoutLinter: [langs.ruby?.()].filter(item => item),
        extensionWithLinter: [langs.ruby?.()].filter(item => item),
      };
    case 'rust':
      return {
        extensionWithoutLinter: [rust()],
        extensionWithLinter: [rust()],
      };
    case 'sass':
    case 'scss':
      return {
        extensionWithoutLinter: [sass()],
        extensionWithLinter: [sass()],
      };
    case 'shell':
      return {
        extensionWithoutLinter: [langs.shell?.()].filter(item => item),
        extensionWithLinter: [langs.shell?.()].filter(item => item),
      };
    case 'sql':
      return {
        extensionWithoutLinter: [sql()],
        extensionWithLinter: [sql()],
      };
    case 'swift':
      return {
        extensionWithoutLinter: [StreamLanguage.define(swift)],
        extensionWithLinter: [StreamLanguage.define(swift)],
      };
    case 'tsv':
      return {
        extensionWithoutLinter: [StreamLanguage.define(tsvMode)],
        extensionWithLinter: [StreamLanguage.define(tsvMode)],
      };
    case 'ts':
    case 'typescript':
      return {
        extensionWithoutLinter: [langs.typescript?.()].filter(item => item),
        extensionWithLinter: [langs.typescript?.()].filter(item => item),
      };
    case 'tsx':
      return {
        extensionWithoutLinter: [langs.tsx?.()].filter(item => item),
        extensionWithLinter: [langs.tsx?.()].filter(item => item),
      };
    case 'vue':
      return {
        extensionWithoutLinter: [langs.vue?.()].filter(item => item),
        extensionWithLinter: [langs.vue?.()].filter(item => item),
      };
    case 'xml':
      return {
        extensionWithoutLinter: [xml()],
        extensionWithLinter: [xml()],
      };
    case 'log':
      return {
        extensionWithoutLinter: [],
        extensionWithLinter: [textLinter],
      };
    case 'dockerfile':
      return {
        extensionWithoutLinter: [langs.dockerfile?.()].filter(item => item),
        extensionWithLinter: [langs.dockerfile?.()].filter(item => item),
      };
    case 'makefile':
      return {
        extensionWithoutLinter: [langs.makefile?.()].filter(item => item),
        extensionWithLinter: [langs.makefile?.()].filter(item => item),
      };
    case 'ini':
      return {
        extensionWithoutLinter: [langs.ini?.()].filter(item => item),
        extensionWithLinter: [langs.ini?.()].filter(item => item),
      };
    case 'toml':
      return {
        extensionWithoutLinter: [langs.toml?.()].filter(item => item),
        extensionWithLinter: [langs.toml?.()].filter(item => item),
      };
    case 'properties':
      return {
        extensionWithoutLinter: [langs.properties?.()].filter(item => item),
        extensionWithLinter: [langs.properties?.()].filter(item => item),
      };
    case 'perl':
      return {
        extensionWithoutLinter: [langs.perl?.()].filter(item => item),
        extensionWithLinter: [langs.perl?.()].filter(item => item),
      };
    case 'lua':
      return {
        extensionWithoutLinter: [langs.lua?.()].filter(item => item),
        extensionWithLinter: [langs.lua?.()].filter(item => item),
      };
    case 'vim':
      return {
        extensionWithoutLinter: [langs.vim?.()].filter(item => item),
        extensionWithLinter: [langs.vim?.()].filter(item => item),
      };
    case 'cmake':
      return {
        extensionWithoutLinter: [langs.cmake?.()].filter(item => item),
        extensionWithLinter: [langs.cmake?.()].filter(item => item),
      };
    default:
      return {
        extensionWithoutLinter: [],
        extensionWithLinter: [textLinter],
      };
  }
};

const initLang = defaultLanguage => defaultLanguage || localStorage.getItem('EditorContentType') || 'text';

export const useLanguageLinter = (defaultLanguage, editorView, isGenerating = false) => {
  const [language, setLanguage] = useState(initLang(defaultLanguage));
  const [extensions, setExtensions] = useState(
    getExtensionsByLang(initLang(defaultLanguage)).extensionWithLinter,
  );

  // Update extensions when isGenerating changes
  useEffect(() => {
    const { extensionWithoutLinter, extensionWithLinter } = getExtensionsByLang(language);
    setExtensions(isGenerating ? extensionWithoutLinter : extensionWithLinter);
  }, [isGenerating, language]);

  const onChangeLanguage = useCallback(
    newLanguage => {
      localStorage.setItem('EditorContentType', newLanguage);
      if (editorView) {
        editorView.dispatch(setDiagnostics(editorView.state, []));
      }
      const { extensionWithoutLinter, extensionWithLinter } = getExtensionsByLang(newLanguage);
      setExtensions(extensionWithoutLinter); // Only apply the new language, no linter
      // Optionally reapply the linter after clearing
      setTimeout(() => {
        setExtensions(extensionWithLinter);
      }, 0); // Reapply linter after a short delay
      setLanguage(newLanguage);
    },
    [editorView],
  );

  return {
    extensions,
    onChangeLanguage,
    language,
  };
};
