import { foldService } from '@codemirror/language';

const countLeadingSpaces = str => {
  let count = 0;

  for (let i = 0; i < str.length; i++) {
    if (str[i] === ' ') {
      count++;
    } else if (str[i] === '\t') {
      count += 4;
    } else {
      break;
    }
  }

  return count;
};

const isEmptyLine = text => {
  return /^[ \t]*$/.test(text);
};

export const foldByIndent = () => {
  return foldService.of((state, lineStart, lineEnd) => {
    const line = state.doc.lineAt(lineStart);
    const lineCount = state.doc.lines;

    const indents = countLeadingSpaces(line.text);
    let foldStart = lineStart;
    let foldEnd = lineEnd;
    let nextLine = line;

    while (nextLine.number < lineCount) {
      nextLine = state.doc.line(nextLine.number + 1);

      if (nextLine.text === '' || isEmptyLine(nextLine.text)) continue;

      const nextIndents = countLeadingSpaces(nextLine.text);

      if (nextIndents > indents && !isEmptyLine(nextLine.text)) {
        foldEnd = nextLine.to;
      } else {
        break;
      }
    }

    if (state.doc.lineAt(foldStart).number === state.doc.lineAt(foldEnd).number) {
      return null;
    }

    foldStart = line.to;
    const lineAtFoldStart = state.doc.lineAt(foldStart);

    if (lineAtFoldStart.text === '' || isEmptyLine(lineAtFoldStart.text)) {
      return null;
    }

    return { from: foldStart, to: foldEnd };
  });
};

/* eslint-disable no-useless-escape */
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
    label: 'MDX',
    value: 'mdx',
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
    trimmed.match(/^[+\-@]{1,3}\s/m)
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
