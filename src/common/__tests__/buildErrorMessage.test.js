import { describe, expect, it, vi } from 'vitest';

import { buildErrorMessage } from '@/common/utils';

// The app store pulls in the whole app (and needs VITE_* env); only getState is read here
vi.mock('@/[fsd]/shared/config', () => ({
  store: { getState: () => ({ user: {}, settings: {} }) },
}));

const GENERIC = 'Insufficient permissions to perform this action\non this project.';

describe('buildErrorMessage on a 403', () => {
  it('shows the message of a refusal that carries a code', () => {
    const error = {
      status: 403,
      data: { success: false, code: 'DENIED_RBAC', message: 'Probe is not allowed.' },
    };

    expect(buildErrorMessage(error)).toBe('Probe is not allowed.');
  });

  it('keeps the generic text when the body has no code', () => {
    const error = { status: 403, data: { success: false, message: 'Probe is not allowed.' } };

    expect(buildErrorMessage(error)).toBe(GENERIC);
  });

  it('keeps the generic text when there is no body', () => {
    expect(buildErrorMessage({ status: 403 })).toBe(GENERIC);
  });

  it('still reads the message of other statuses', () => {
    expect(buildErrorMessage({ status: 400, data: { code: 'X', message: 'Bad request' } })).toBe(
      'Bad request',
    );
  });
});

describe('buildErrorMessage on a response that is not JSON', () => {
  const blockPage = '<html>\n<head><title>403 Forbidden</title></head>\n<body>blocked</body>\n</html>';

  it('names the status instead of showing the HTML page a proxy answered with', () => {
    const error = { status: 'PARSING_ERROR', originalStatus: 403, data: blockPage, error: 'SyntaxError' };

    expect(buildErrorMessage(error)).toBe(
      'The server sent an unexpected response (HTTP 403). Please try again or contact your administrator.',
    );
  });

  it('keeps the not-found text for an HTML 404', () => {
    expect(buildErrorMessage({ status: 'PARSING_ERROR', originalStatus: 404, data: '<html></html>' })).toBe(
      'The requested resource was not found!',
    );
  });
});
