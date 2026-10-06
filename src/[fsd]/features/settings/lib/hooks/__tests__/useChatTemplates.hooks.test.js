// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { act, cleanup, renderHook } from '@testing-library/react';

import { useChatTemplates } from '../useChatTemplates.hooks.js';

const { api, toast } = vi.hoisted(() => {
  // RTK Query mutation triggers return an object with `unwrap()`
  const mutation = () => vi.fn(() => ({ unwrap: () => Promise.resolve({}) }));
  return {
    api: {
      templates: [],
      create: mutation(),
      update: mutation(),
      remove: mutation(),
      setDefault: mutation(),
      unsetDefault: mutation(),
    },
    toast: { toastError: vi.fn(), toastSuccess: vi.fn() },
  };
});

vi.mock('@/[fsd]/features/settings/api', () => ({
  useGetChatTemplatesQuery: () => ({ data: api.templates, isLoading: false }),
  useCreateChatTemplateMutation: () => [api.create, { isLoading: false }],
  useUpdateChatTemplateMutation: () => [api.update, { isLoading: false }],
  useDeleteChatTemplateMutation: () => [api.remove, { isLoading: false }],
  useSetDefaultChatTemplateMutation: () => [api.setDefault, { isLoading: false }],
  useUnsetDefaultChatTemplateMutation: () => [api.unsetDefault, { isLoading: false }],
}));

vi.mock('@/hooks/useToast', () => ({ default: () => toast }));

const resolvesWith = value => ({ unwrap: () => Promise.resolve(value) });
const rejects = () => ({ unwrap: () => Promise.reject(new Error('boom')) });

const setup = (templates = []) => {
  api.templates = templates;
  return renderHook(() => useChatTemplates(7)).result;
};

describe('useChatTemplates handleSave', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.create.mockImplementation(() => resolvesWith({ id: 42 }));
    api.update.mockImplementation(() => resolvesWith({}));
    api.setDefault.mockImplementation(() => resolvesWith({}));
    api.unsetDefault.mockImplementation(() => resolvesWith({}));
  });
  afterEach(() => cleanup());

  it('creates a draft and marks the new id as default when requested', async () => {
    const result = setup();

    await act(() => result.current.handleSave({ id: null, name: 'T', participants: [], isDefault: true }));

    expect(api.create).toHaveBeenCalledWith({ projectId: 7, name: 'T', participants: [] });
    expect(api.setDefault).toHaveBeenCalledWith({ projectId: 7, templateId: 42 });
    expect(toast.toastSuccess).toHaveBeenCalledWith('Template saved');
  });

  it('does not touch the default flag when it did not change', async () => {
    const result = setup([{ id: 3, name: 'Main', participants: [], is_default: true }]);

    await act(() => result.current.handleSave({ id: 3, name: 'Main', participants: [], isDefault: true }));

    expect(api.update).toHaveBeenCalled();
    expect(api.setDefault).not.toHaveBeenCalled();
    expect(api.unsetDefault).not.toHaveBeenCalled();
  });

  it('unsets the default when the flag was cleared', async () => {
    const result = setup([{ id: 3, name: 'Main', participants: [], is_default: true }]);

    await act(() => result.current.handleSave({ id: 3, name: 'Main', participants: [], isDefault: false }));

    expect(api.unsetDefault).toHaveBeenCalledWith({ projectId: 7, templateId: 3 });
  });

  it('closes the editor even when updating the default flag fails', async () => {
    const result = setup([{ id: 3, name: 'Main', participants: [], is_default: false }]);
    api.setDefault.mockImplementation(rejects);

    act(() => result.current.handleSelectTemplate(3));
    expect(result.current.selectedTemplate?.id).toBe(3);

    await act(() => result.current.handleSave({ id: 3, name: 'Main', participants: [], isDefault: true }));

    expect(result.current.selectedTemplate).toBeNull();
    expect(toast.toastError).toHaveBeenCalledWith(
      'Template saved, but failed to update the default template',
    );
  });

  it('reports the default as failed when the created template has no id', async () => {
    const result = setup();
    api.create.mockImplementation(() => resolvesWith({}));

    await act(() => result.current.handleSave({ id: null, name: 'T', participants: [], isDefault: true }));

    expect(api.setDefault).not.toHaveBeenCalled();
    expect(toast.toastSuccess).not.toHaveBeenCalled();
    expect(toast.toastError).toHaveBeenCalledWith(
      'Template saved, but failed to update the default template',
    );
  });

  it('keeps the editor open when the template itself fails to save', async () => {
    const result = setup([{ id: 3, name: 'Main', participants: [], is_default: false }]);
    api.update.mockImplementation(rejects);

    act(() => result.current.handleSelectTemplate(3));
    await act(() => result.current.handleSave({ id: 3, name: 'New', participants: [], isDefault: false }));

    expect(result.current.selectedTemplate?.id).toBe(3);
    expect(toast.toastError).toHaveBeenCalledWith('Failed to save template');
  });
});
