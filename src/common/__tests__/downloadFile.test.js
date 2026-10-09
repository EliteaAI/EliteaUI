/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { downloadFile } from '../utils';

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

describe('downloadFile', () => {
  beforeEach(() => {
    window.URL.createObjectURL = vi.fn(() => 'blob:test');
    window.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('calls handleError and does not save the error body when the response is not ok', async () => {
    const blob = vi.fn();
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: false, status: 400, blob })),
    );
    const handleError = vi.fn();

    downloadFile({ url: '/api/file', filename: 'report.html', handleError });
    await flushPromises();

    expect(handleError).toHaveBeenCalledWith(expect.any(Error));
    expect(blob).not.toHaveBeenCalled();
    expect(window.URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('downloads the file when the response is ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({ ok: true, status: 200, blob: () => Promise.resolve(new Blob(['<html/>'])) }),
      ),
    );
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const handleError = vi.fn();

    downloadFile({ url: '/api/file', filename: 'report.html', handleError });
    await flushPromises();

    expect(handleError).not.toHaveBeenCalled();
    expect(window.URL.createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
  });
});
