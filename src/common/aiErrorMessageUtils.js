import { convertJsonToString } from './utils';

/**
 * Checks if a string CONTAINS a Python traceback header anywhere in the message.
 * This is effective for messages that wrap the traceback in other text.
 */
export default function containsPythonTraceback(errorMessage) {
  if (typeof errorMessage !== 'string' || !errorMessage) {
    return false;
  }

  // Just check if the message contains the traceback header anywhere
  const tracebackRegex = /Traceback \(most recent call last\):\s*\n/;
  return tracebackRegex.test(errorMessage);
}

export function formatErrorMessage(errorMessage) {
  if (containsPythonTraceback(errorMessage)) {
    return '```python\n' + errorMessage + '\n```';
  } else if (typeof errorMessage === 'string') {
    if (errorMessage.startsWith('```')) {
      return errorMessage;
    }
    return '```plaintext\n' + errorMessage + '\n```';
  } else {
    return '```plaintext\n' + convertJsonToString(errorMessage, true) + '\n```';
  }
}
