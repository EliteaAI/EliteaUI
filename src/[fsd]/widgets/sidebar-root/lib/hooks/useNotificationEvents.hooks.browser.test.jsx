import { act } from 'react';

import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  NOTIFICATION_EVENT_NAME,
  NOTIFICATION_READY_EVENT_NAME,
  useNotificationEvents,
} from './useNotificationEvents.hooks';

class FakeEventSource {
  static instances = [];

  constructor(url, options) {
    this.url = url;
    this.options = options;
    this.listeners = new Map();
    this.closed = false;
    FakeEventSource.instances.push(this);
  }

  addEventListener(name, listener) {
    this.listeners.set(name, listener);
  }

  removeEventListener(name, listener) {
    if (this.listeners.get(name) === listener) this.listeners.delete(name);
  }

  emit(name, data) {
    this.listeners.get(name)?.({ data });
  }

  close() {
    this.closed = true;
  }
}

describe('useNotificationEvents', () => {
  let container;
  let root;
  let props;

  const Harness = () => {
    useNotificationEvents(props);
    return null;
  };

  const renderHook = async nextProps => {
    props = nextProps;
    await act(async () => root.render(<Harness />));
  };

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    globalThis.EventSource = FakeEventSource;
    FakeEventSource.instances = [];
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it('subscribes with credentials, delivers the current event and closes on project change', async () => {
    const onNotification = vi.fn();
    const onReady = vi.fn();
    await renderHook({ baseUrl: '/api/v2/', projectId: 7, onNotification, onReady });

    expect(FakeEventSource.instances).toHaveLength(1);
    const first = FakeEventSource.instances[0];
    expect(first.url).toBe('/api/v2/notifications/events/prompt_lib/7');
    expect(first.options).toEqual({ withCredentials: true });

    first.emit(NOTIFICATION_EVENT_NAME, '{"id":19}');
    expect(onNotification).toHaveBeenCalledOnce();
    first.emit(NOTIFICATION_READY_EVENT_NAME, '{"cursor":19}');
    expect(onReady).toHaveBeenCalledOnce();

    await renderHook({ baseUrl: '/api/v2/', projectId: 9, onNotification, onReady });
    expect(first.closed).toBe(true);
    expect(first.listeners.has(NOTIFICATION_EVENT_NAME)).toBe(false);
    expect(first.listeners.has(NOTIFICATION_READY_EVENT_NAME)).toBe(false);
    expect(FakeEventSource.instances[1].url).toBe('/api/v2/notifications/events/prompt_lib/9');
  });

  it('does not open a stream before a project is available', async () => {
    await renderHook({ baseUrl: '/api/v2/', projectId: null, onNotification: vi.fn() });
    expect(FakeEventSource.instances).toHaveLength(0);
  });
});
