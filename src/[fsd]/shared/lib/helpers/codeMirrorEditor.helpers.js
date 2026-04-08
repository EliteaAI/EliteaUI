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
