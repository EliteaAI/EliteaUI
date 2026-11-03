// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

import ToolSection from '../ToolSection';

const oauthApps = { resolve: ({ subsections }) => ({ subsections, isResolving: false, mode: null }) };

vi.mock('@/[fsd]/features/credentials/lib/hooks', () => ({
  useOAuthAppSubsections: args => oauthApps.resolve(args),
}));
vi.mock('@/[fsd]/features/toolkits/ui', () => ({
  ToolkitForm: { ToolBaseProperty: props => <span data-testid={`field-${props.k}`} /> },
}));
vi.mock('@/[fsd]/shared/ui', () => ({
  Checkbox: {
    RadioButtonGroup: props => (
      <span>
        {props.items.map(item => (
          <button
            key={item.value}
            data-testid={`option-${item.value}`}
            onClick={() => props.onChange(item.value)}
          />
        ))}
      </span>
    ),
  },
}));

// SharePoint's Custom app and App-only share client_id/client_secret: the only shared fields in any SDK schema
const SUBSECTIONS = [
  {
    name: 'Custom app',
    key_fields: ['oauth_discovery_endpoint'],
    fields: ['client_id', 'client_secret', 'scopes'],
  },
  { name: 'App-only', key_fields: ['client_id'], fields: ['client_id', 'client_secret'] },
];
const SCHEMA = {
  properties: {
    client_id: { type: 'string' },
    client_secret: { type: 'string' },
    scopes: { type: 'array' },
  },
};

const editField = vi.fn();
const setToolErrors = vi.fn();

const renderSection = settings =>
  render(
    <ThemeProvider theme={createTheme()}>
      <ToolSection
        sectionKey="auth"
        subsections={SUBSECTIONS}
        required
        schema={SCHEMA}
        settings={settings}
        editField={editField}
        setToolErrors={setToolErrors}
        setEditToolDetail={vi.fn()}
        credentialType="sharepoint"
      />
    </ThemeProvider>,
  );

const lastErrors = () => setToolErrors.mock.calls.at(-1)[0]({});

describe('ToolSection with fields shared between subsections', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('a shared field stays required in the selected subsection', () => {
    renderSection({ client_id: '', client_secret: '', scopes: null, oauth_discovery_endpoint: null });
    // No key field set: the first subsection (Custom app) is selected; its client fields are required
    expect(lastErrors()).toMatchObject({ client_id: true, client_secret: true });
  });

  it('switching keeps the shared fields and clears only the ones the new subsection lacks', () => {
    renderSection({
      client_id: 'id',
      client_secret: 's',
      scopes: ['Sites.Read.All'],
      oauth_discovery_endpoint: 'x',
    });
    fireEvent.click(screen.getByTestId('option-App-only'));
    const cleared = editField.mock.calls.filter(([, value]) => value === null).map(([field]) => field);
    expect(cleared).toEqual(['settings.scopes']);
    expect(screen.getByTestId('field-client_id')).toBeInTheDocument();
  });
});

describe('ToolSection when the admin has no OAuth app (Custom app only)', () => {
  const APP_SUBSECTIONS = [
    { name: 'Default app', key_fields: ['oauth_app_id'], fields: ['oauth_app_id'] },
    { name: 'Custom app', key_fields: ['client_id'], fields: ['client_id', 'client_secret'] },
  ];
  const APP_SCHEMA = {
    properties: {
      oauth_app_id: { type: 'string' },
      client_id: { type: 'string' },
      client_secret: { type: 'string' },
    },
  };

  afterEach(() => {
    cleanup();
    oauthApps.resolve = ({ subsections }) => ({ subsections, isResolving: false, mode: null });
  });

  it('a filled Custom app form has no error left from the hidden Default app field', () => {
    let errors = {};
    const collectErrors = update => {
      errors = typeof update === 'function' ? update(errors) : update;
    };
    const ui = settings => (
      <ThemeProvider theme={createTheme()}>
        <ToolSection
          sectionKey="auth"
          subsections={APP_SUBSECTIONS}
          required
          schema={APP_SCHEMA}
          settings={settings}
          editField={vi.fn()}
          setToolErrors={collectErrors}
          setEditToolDetail={vi.fn()}
          credentialType="teams"
        />
      </ThemeProvider>
    );
    // While the admin's apps load the form starts on Default app: oauth_app_id is required
    oauthApps.resolve = ({ subsections }) => ({ subsections, isResolving: true, mode: null });
    const { rerender } = render(ui({}));
    // No app: only Custom app is offered
    oauthApps.resolve = ({ subsections }) => ({
      subsections: subsections.filter(subsection => subsection.name === 'Custom app'),
      isResolving: false,
      mode: 'custom',
    });
    act(() => rerender(ui({})));
    act(() => rerender(ui({ client_id: 'id', client_secret: 'secret' })));

    expect(Object.entries(errors).filter(([, value]) => value)).toEqual([]);
  });
});
