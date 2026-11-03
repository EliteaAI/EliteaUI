// @vitest-environment jsdom
import { memo, useCallback, useState } from 'react';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import CredentialsSelect from '../CredentialsSelect';

const PERSONAL_PROJECT_ID = 'personal-project';
const USER_ID = 21;
const TEAM_PROJECT_ID = 'project-1';

const PGVECTOR_TITLE = 'elitea-pgvector';
const CHROMA_TITLE = 'elitea-chroma';
const GITHUB_TITLE = 'github-token';
const DELETED_TITLE = 'deleted-store';

const PGVECTOR_UUID = 'uuid-pgvector';
const CHROMA_UUID = 'uuid-chroma';
const GITHUB_UUID = 'uuid-github';

const VECTOR_STORAGE_CONFIGURATIONS = [
  { id: 1, uuid: PGVECTOR_UUID, elitea_title: PGVECTOR_TITLE, project_id: TEAM_PROJECT_ID, data: {} },
  { id: 2, uuid: CHROMA_UUID, elitea_title: CHROMA_TITLE, project_id: TEAM_PROJECT_ID, data: {} },
];

const savedCredential = (title, uuid, over) => ({
  private: false,
  elitea_title: title,
  configuration_uuid: uuid,
  configuration_project_id: TEAM_PROJECT_ID,
  ...over,
});

const ONLY_VECTOR_STORAGE_CONFIGURATION = [VECTOR_STORAGE_CONFIGURATIONS[0]];

const SELECTED_VALUE_COLOR = '#0E131D';
const LABEL_COLOR = '#0E131D';
const WARNING_ORANGE = '#ED6C02';
const THEME = {
  palette: {
    text: { primary: LABEL_COLOR },
    components: { select: { text: { selected: { primary: SELECTED_VALUE_COLOR } } } },
    warning: { main: WARNING_ORANGE },
  },
};

// The select always carries the shared attention/error underline styling; the locked
// keys are layered on top of it only when the field is locked to one configuration.
const ATTENTION_ERROR_SELECTOR =
  '& .MuiInputBase-root.MuiInput-root.MuiSelect-root.Mui-error.MuiInput-underline:before, & .MuiInputBase-root.MuiInput-root.MuiSelect-root.Mui-error.MuiInput-underline:after';

const CREDENTIAL_CONFIGURATIONS = [
  {
    id: 3,
    uuid: GITHUB_UUID,
    elitea_title: GITHUB_TITLE,
    project_id: TEAM_PROJECT_ID,
    type: 'github',
    data: {},
  },
];

const LEGACY_CONFIGURATION = { id: 4, elitea_title: GITHUB_TITLE, project_id: TEAM_PROJECT_ID, data: {} };

let singleSelectProps;
let credentialsData;
let hasAutoSelectedRef;
let personalProjectIdInStore = PERSONAL_PROJECT_ID;

const onSelectConfiguration = vi.fn();
const onRefresh = vi.fn();
const trackEvent = vi.fn();

vi.mock('@/[fsd]/shared/ui', () => ({
  Select: {
    SingleSelect: props => {
      singleSelectProps = props;
      const flatOptions = (props.optionGroups || []).flatMap(group => group.options || []);
      const foundOption = flatOptions.find(option => option.value === props.value);

      const clickOptionTheWayTheRealMenuItemDoes = (option, event) => {
        if (option.value === props.value && props.onClear) {
          props.onClear(event);
          return;
        }
        if (option.variant === 'action') {
          option.onActivate?.(event);
          return;
        }
        props.onValueChange?.(option.value);
      };

      return (
        <div data-testid="single-select">
          <span data-testid="single-select-value">
            {props.customRenderValue ? props.customRenderValue(foundOption) : null}
          </span>
          {flatOptions.map(option => (
            <button
              key={option.value}
              type="button"
              data-testid={`select-option-${option.meta?.elitea_title ?? option.value}`}
              onClick={event => clickOptionTheWayTheRealMenuItemDoes(option, event)}
            >
              {option.label}
            </button>
          ))}
        </div>
      );
    },
  },
}));

vi.mock('@/[fsd]/features/credentials/ui', () => ({
  CredentialOptionLabel: props => <span data-testid="credential-option-label">{props.label}</span>,
}));

vi.mock('@/[fsd]/features/credentials/lib/hooks', () => ({
  useCredentialsData: () => credentialsData,
  useCredentialValidation: () => ({
    validateCredential: vi.fn(),
    batchValidateCredentials: vi.fn(),
    getCredentialStatus: () => undefined,
    getCredentialMessage: () => undefined,
    resetStatus: vi.fn(),
    resetStatuses: vi.fn(),
  }),
}));

const EMPTY_TOKENS = Object.freeze({});
vi.mock('@/[fsd]/features/mcp', () => ({ McpAuthHelpers: { loadTokens: () => EMPTY_TOKENS } }));

vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useSelectedProjectId: () => TEAM_PROJECT_ID,
  useContextExecutionEntity: () => ({ contextExecutionEntity: 'agent' }),
}));

vi.mock('@/GA', () => ({ useTrackEvent: () => trackEvent }));

vi.mock('react-redux', () => ({
  useSelector: selector => selector({ user: { personal_project_id: personalProjectIdInStore, id: USER_ID } }),
}));

vi.mock('@/routes', async importOriginal => {
  const actual = await importOriginal();
  return { ...actual, getBasename: () => '' };
});

vi.mock('../CredentialMismatchFooter', () => ({
  default: props => (
    <div
      data-testid="credential-mismatch-footer"
      data-mismatched-private={String(Boolean(props.mismatchedPrivateCredential))}
    />
  ),
}));

vi.mock('../CredentialNotFoundValue', () => ({
  default: props => <div data-testid="credential-not-found-value">{props.eliteaTitle}</div>,
}));

vi.mock('@/[fsd]/shared/ui/button', async () => {
  const { forwardRef } = await import('react');

  const BaseBtn = forwardRef((props, ref) => (
    <button
      ref={ref}
      type="button"
      onClick={props.onClick}
    >
      {props.children}
    </button>
  ));
  BaseBtn.displayName = 'BaseBtn';

  return { BaseBtn };
});
vi.mock('@/[fsd]/shared/ui/button/BaseBtn', () => ({ BUTTON_VARIANTS: { tertiary: 'tertiary' } }));
vi.mock('@/assets/refresh-icon.svg?react', () => ({ default: () => null }));

beforeEach(() => {
  singleSelectProps = undefined;
  hasAutoSelectedRef = { current: false };
  personalProjectIdInStore = PERSONAL_PROJECT_ID;
  onSelectConfiguration.mockClear();
  onRefresh.mockClear();
  trackEvent.mockClear();
});

afterEach(() => cleanup());

const stubCredentialsData = ({ configurations, projectDefault }) => {
  credentialsData = {
    configurations,
    hasFetchedData: true,
    isFetching: false,
    onRefresh,
    hasAutoSelectedRef,
    projectDefaultVectorStorageModel: projectDefault,
  };
};

const renderSelect = ({
  section = 'vectorstorage',
  value = null,
  projectDefault = '',
  configurations = VECTOR_STORAGE_CONFIGURATIONS,
  isCreationAllowed = section !== 'vectorstorage',
} = {}) => {
  stubCredentialsData({ configurations, projectDefault });

  return render(
    <CredentialsSelect
      label="Vector storage"
      section={section}
      isCreationAllowed={isCreationAllowed}
      value={value}
      onSelectConfiguration={onSelectConfiguration}
    />,
  );
};

const ControlledCredentialsSelect = memo(props => {
  const { initialValue, ...rest } = props;
  const [value, setValue] = useState(initialValue);

  const handleSelect = useCallback((...args) => {
    onSelectConfiguration(...args);
    setValue(args[0]);
  }, []);

  return (
    <CredentialsSelect
      value={value}
      onSelectConfiguration={handleSelect}
      {...rest}
    />
  );
});

ControlledCredentialsSelect.displayName = 'ControlledCredentialsSelect';

const renderControlledSelect = ({
  section = 'vectorstorage',
  initialValue = null,
  projectDefault = '',
  configurations = VECTOR_STORAGE_CONFIGURATIONS,
} = {}) => {
  stubCredentialsData({ configurations, projectDefault });

  return render(
    <ControlledCredentialsSelect
      label="Vector storage"
      section={section}
      isCreationAllowed={section !== 'vectorstorage'}
      initialValue={initialValue}
    />,
  );
};

const savedOptions = () =>
  singleSelectProps.optionGroups.find(group => group.title.includes('Saved')).options;

const optionValueFor = eliteaTitle =>
  savedOptions().find(option => option.meta.elitea_title === eliteaTitle).value;

const renderedValue = () => screen.getByTestId('single-select-value');

const clickOption = eliteaTitle => fireEvent.click(screen.getByTestId(`select-option-${eliteaTitle}`));

describe('CredentialsSelect', () => {
  describe('vector storage with nothing saved', () => {
    it.each([
      ['a null value', null],
      ['an empty elitea_title', { elitea_title: '', private: false }],
    ])('renders an empty field for %s even though the project has a default', (_label, value) => {
      renderSelect({ value, projectDefault: PGVECTOR_TITLE });

      expect(savedOptions()).toHaveLength(VECTOR_STORAGE_CONFIGURATIONS.length);
      expect(singleSelectProps.value).toBe('');
      expect(renderedValue()).toBeEmptyDOMElement();
    });

    it('does not write the project default into form state on the toolkit behalf', () => {
      renderSelect({ value: null, projectDefault: PGVECTOR_TITLE });

      expect(savedOptions()).toHaveLength(VECTOR_STORAGE_CONFIGURATIONS.length);
      expect(onSelectConfiguration).not.toHaveBeenCalled();
    });

    it('does not follow a manual pick with an auto-select that would reset the dirty form', async () => {
      renderControlledSelect({ initialValue: null, projectDefault: PGVECTOR_TITLE });

      clickOption(CHROMA_TITLE);

      expect(onSelectConfiguration).toHaveBeenCalledTimes(1);
      expect(onSelectConfiguration).toHaveBeenCalledWith(savedCredential(CHROMA_TITLE, CHROMA_UUID));

      await waitFor(() => expect(singleSelectProps.value).toBe(optionValueFor(CHROMA_TITLE)));
      expect(onSelectConfiguration).toHaveBeenCalledTimes(1);
    });
  });

  it('shows the vector storage that is actually saved, not the project default', () => {
    renderSelect({
      value: { elitea_title: PGVECTOR_TITLE, private: false },
      projectDefault: CHROMA_TITLE,
    });

    expect(singleSelectProps.value).toBe(optionValueFor(PGVECTOR_TITLE));
    expect(within(renderedValue()).getByText(PGVECTOR_TITLE)).toBeInTheDocument();
    expect(within(renderedValue()).queryByText(CHROMA_TITLE)).not.toBeInTheDocument();
  });

  describe('vector storage can never be cleared', () => {
    it('ignores a click on the row it already holds instead of emptying the field', async () => {
      renderControlledSelect({
        initialValue: { elitea_title: PGVECTOR_TITLE, private: false },
        projectDefault: PGVECTOR_TITLE,
      });

      expect(onSelectConfiguration).not.toHaveBeenCalled();

      clickOption(PGVECTOR_TITLE);

      expect(onSelectConfiguration).not.toHaveBeenCalled();
      await waitFor(() => expect(singleSelectProps.value).toBe(optionValueFor(PGVECTOR_TITLE)));
      expect(within(renderedValue()).getByText(PGVECTOR_TITLE)).toBeInTheDocument();
    });

    it('refuses the clear no matter which menu path asks for it', () => {
      renderSelect({ value: { elitea_title: PGVECTOR_TITLE, private: false } });

      singleSelectProps.onClear();
      singleSelectProps.onValueChange(optionValueFor(PGVECTOR_TITLE));

      expect(onSelectConfiguration).not.toHaveBeenCalled();
    });

    it('still switches to a different vector storage', async () => {
      renderControlledSelect({ initialValue: { elitea_title: PGVECTOR_TITLE, private: false } });

      clickOption(CHROMA_TITLE);

      expect(onSelectConfiguration).toHaveBeenCalledTimes(1);
      expect(onSelectConfiguration).toHaveBeenCalledWith(savedCredential(CHROMA_TITLE, CHROMA_UUID));
      await waitFor(() => expect(singleSelectProps.value).toBe(optionValueFor(CHROMA_TITLE)));
    });

    it('still clears the credentials section when the menu routes a reselect as a value change', () => {
      renderSelect({
        section: 'credentials',
        value: { elitea_title: GITHUB_TITLE, private: false },
        configurations: CREDENTIAL_CONFIGURATIONS,
      });

      singleSelectProps.onValueChange(optionValueFor(GITHUB_TITLE));

      expect(onSelectConfiguration).toHaveBeenCalledWith(null);
    });

    it('leaves the credentials section free to clear its selection', () => {
      renderSelect({
        section: 'credentials',
        value: { elitea_title: GITHUB_TITLE, private: false },
        configurations: CREDENTIAL_CONFIGURATIONS,
      });

      expect(singleSelectProps.onClear).toBeInstanceOf(Function);

      clickOption(GITHUB_TITLE);

      expect(onSelectConfiguration).toHaveBeenCalledWith(null);
    });
  });

  it('keeps auto-selecting the first saved credential in the credentials section', async () => {
    renderSelect({ section: 'credentials', value: null, configurations: CREDENTIAL_CONFIGURATIONS });

    expect(singleSelectProps.value).toBe(optionValueFor(GITHUB_TITLE));
    expect(within(renderedValue()).getByText(GITHUB_TITLE)).toBeInTheDocument();
    await waitFor(() =>
      expect(onSelectConfiguration).toHaveBeenCalledWith(savedCredential(GITHUB_TITLE, GITHUB_UUID), {
        isAutoSelect: true,
      }),
    );
  });

  describe('with the first-credential fallback switched off', () => {
    const renderWithoutFallback = value => {
      stubCredentialsData({ configurations: CREDENTIAL_CONFIGURATIONS, projectDefault: '' });
      return render(
        <CredentialsSelect
          section="credentials"
          value={value}
          onSelectConfiguration={onSelectConfiguration}
          fallbackToFirstCredential={false}
        />,
      );
    };

    it('leaves an empty field empty instead of committing the first saved credential', async () => {
      renderWithoutFallback(null);

      expect(savedOptions()).toHaveLength(1);
      expect(singleSelectProps.value).toBe('');
      expect(renderedValue()).toBeEmptyDOMElement();
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(onSelectConfiguration).not.toHaveBeenCalled();
    });

    it('still shows a credential that is set', () => {
      renderWithoutFallback({ elitea_title: GITHUB_TITLE, private: false });

      expect(singleSelectProps.value).toBe(optionValueFor(GITHUB_TITLE));
    });
  });

  it('still repairs a stale private flag when the saved title matches a team configuration', async () => {
    renderSelect({
      value: { elitea_title: PGVECTOR_TITLE, private: true },
      projectDefault: PGVECTOR_TITLE,
    });

    await waitFor(() =>
      expect(onSelectConfiguration).toHaveBeenCalledWith(savedCredential(PGVECTOR_TITLE, PGVECTOR_UUID), {
        isAutoSelect: true,
      }),
    );
  });

  it('still repairs a saved vector storage that no longer exists with the project default', async () => {
    renderSelect({
      value: { elitea_title: DELETED_TITLE, private: false },
      projectDefault: PGVECTOR_TITLE,
    });

    expect(singleSelectProps.value).toBe(optionValueFor(PGVECTOR_TITLE));
    await waitFor(() =>
      expect(onSelectConfiguration).toHaveBeenCalledWith(savedCredential(PGVECTOR_TITLE, PGVECTOR_UUID), {
        isAutoSelect: true,
      }),
    );
  });

  describe('vector storage with a single configuration to choose from', () => {
    it('locks the field so the only configuration cannot be cleared', () => {
      renderSelect({
        value: { elitea_title: PGVECTOR_TITLE, private: false },
        configurations: ONLY_VECTOR_STORAGE_CONFIGURATION,
      });

      expect(savedOptions()).toHaveLength(1);
      expect(singleSelectProps.value).toBe(optionValueFor(PGVECTOR_TITLE));
      expect(singleSelectProps.disabled).toBe(true);
    });

    it('locks the field once the repaired configuration is the only one left', async () => {
      renderSelect({
        value: { elitea_title: DELETED_TITLE, private: false },
        projectDefault: PGVECTOR_TITLE,
        configurations: ONLY_VECTOR_STORAGE_CONFIGURATION,
      });

      await waitFor(() =>
        expect(onSelectConfiguration).toHaveBeenCalledWith(savedCredential(PGVECTOR_TITLE, PGVECTOR_UUID), {
          isAutoSelect: true,
        }),
      );
      expect(singleSelectProps.disabled).toBe(true);
    });

    it('leaves an empty field open so the only configuration can still be picked', () => {
      renderSelect({ value: null, configurations: ONLY_VECTOR_STORAGE_CONFIGURATION });

      expect(singleSelectProps.value).toBe('');
      expect(singleSelectProps.disabled).toBe(false);
    });

    it('leaves the field open while the saved configuration is nowhere to be found', () => {
      renderSelect({
        value: { elitea_title: DELETED_TITLE, private: false },
        configurations: ONLY_VECTOR_STORAGE_CONFIGURATION,
      });

      expect(singleSelectProps.disabled).toBe(false);
    });

    it('leaves the field open while a create row shares the menu with it', () => {
      renderSelect({
        value: { elitea_title: PGVECTOR_TITLE, private: false },
        configurations: ONLY_VECTOR_STORAGE_CONFIGURATION,
        isCreationAllowed: true,
      });

      expect(singleSelectProps.disabled).toBe(false);
    });

    it('keeps the locked value at the contrast an enabled field would have', () => {
      renderSelect({
        value: { elitea_title: PGVECTOR_TITLE, private: false },
        configurations: ONLY_VECTOR_STORAGE_CONFIGURATION,
      });

      const lockedSx = singleSelectProps.sx(THEME);

      expect(lockedSx).toEqual({
        [ATTENTION_ERROR_SELECTOR]: {
          borderBottom: `0.0625rem solid ${WARNING_ORANGE} !important`,
        },
        '& .MuiInputBase-root.Mui-disabled .MuiSelect-select': {
          color: `${SELECTED_VALUE_COLOR} !important`,
          WebkitTextFillColor: `${SELECTED_VALUE_COLOR} !important`,
        },
        '& .MuiFormLabel-root.Mui-disabled': { color: LABEL_COLOR },
      });
    });

    it('leaves an unlocked field to the shared select styling', () => {
      renderSelect({ value: { elitea_title: PGVECTOR_TITLE, private: false } });

      // Only the shared attention/error styling — none of the locked-value overrides.
      expect(singleSelectProps.sx(THEME)).toEqual({
        [ATTENTION_ERROR_SELECTOR]: {
          borderBottom: `0.0625rem solid ${WARNING_ORANGE} !important`,
        },
      });
    });
  });

  it('keeps the field open when a second vector storage is available to switch to', () => {
    renderSelect({ value: { elitea_title: PGVECTOR_TITLE, private: false } });

    expect(savedOptions()).toHaveLength(VECTOR_STORAGE_CONFIGURATIONS.length);
    expect(singleSelectProps.disabled).toBe(false);
  });

  it('keeps the single saved credential selectable outside the vector storage section', () => {
    renderSelect({
      section: 'credentials',
      value: { elitea_title: GITHUB_TITLE, private: false },
      configurations: CREDENTIAL_CONFIGURATIONS,
      isCreationAllowed: false,
    });

    expect(savedOptions()).toHaveLength(1);
    expect(singleSelectProps.optionGroups.some(group => group.title === 'Create')).toBe(false);
    expect(singleSelectProps.disabled).toBe(false);
  });

  describe('immutable configuration reference', () => {
    const TWIN_A_UUID = 'uuid-twin-a';
    const TWIN_B_UUID = 'uuid-twin-b';
    const TWIN_CONFIGURATIONS = [
      { id: 5, uuid: TWIN_A_UUID, elitea_title: GITHUB_TITLE, project_id: TEAM_PROJECT_ID, data: {} },
      { id: 6, uuid: TWIN_B_UUID, elitea_title: GITHUB_TITLE, project_id: TEAM_PROJECT_ID, data: {} },
    ];

    it('commits the legacy two-key shape for a row that has no uuid', () => {
      renderSelect({
        section: 'credentials',
        value: { elitea_title: GITHUB_TITLE, private: false },
        configurations: [
          LEGACY_CONFIGURATION,
          { ...LEGACY_CONFIGURATION, id: 7, elitea_title: CHROMA_TITLE },
        ],
      });

      singleSelectProps.onValueChange(optionValueFor(CHROMA_TITLE));

      expect(onSelectConfiguration).toHaveBeenCalledTimes(1);
      expect(onSelectConfiguration.mock.calls[0][0]).toStrictEqual({
        private: false,
        elitea_title: CHROMA_TITLE,
      });
    });

    it('selects the row with the saved uuid even when another row shares its title and private flag', () => {
      renderSelect({
        section: 'credentials',
        value: savedCredential(GITHUB_TITLE, TWIN_B_UUID),
        configurations: TWIN_CONFIGURATIONS,
      });

      expect(savedOptions()).toHaveLength(2);
      expect(singleSelectProps.value).toBe(savedOptions()[1].value);
      expect(singleSelectProps.value).not.toBe(savedOptions()[0].value);
    });

    it('commits the picked twin by uuid instead of treating it as the already committed row', () => {
      renderSelect({
        section: 'credentials',
        value: savedCredential(GITHUB_TITLE, TWIN_A_UUID),
        configurations: TWIN_CONFIGURATIONS,
      });

      singleSelectProps.onValueChange(savedOptions()[1].value);

      expect(onSelectConfiguration).toHaveBeenCalledTimes(1);
      expect(onSelectConfiguration).toHaveBeenCalledWith(savedCredential(GITHUB_TITLE, TWIN_B_UUID));
    });

    it('switches from a uuid-pinned value to a legacy row of the same title instead of deselecting', () => {
      renderSelect({
        section: 'credentials',
        value: savedCredential(GITHUB_TITLE, TWIN_A_UUID),
        configurations: [...TWIN_CONFIGURATIONS, LEGACY_CONFIGURATION],
      });

      singleSelectProps.onValueChange(savedOptions()[2].value);

      expect(onSelectConfiguration).toHaveBeenCalledTimes(1);
      expect(onSelectConfiguration.mock.calls[0][0]).toStrictEqual({
        private: false,
        elitea_title: GITHUB_TITLE,
      });
    });

    it('serialises a row with a null uuid like a row without one', () => {
      renderSelect({
        section: 'credentials',
        value: { elitea_title: GITHUB_TITLE, private: false },
        configurations: [{ ...LEGACY_CONFIGURATION, uuid: null }],
      });

      expect(JSON.parse(savedOptions()[0].value)).not.toHaveProperty('configuration_uuid');
      expect(singleSelectProps.value).toBe(optionValueFor(GITHUB_TITLE));
    });

    // #7333: a private credential is per user. A team toolkit saved by another member carries the creator's
    // uuid and personal project; this user must see their own same-title private credential selected.
    it("selects the user's own private credential for another member's private reference", () => {
      renderSelect({
        section: 'credentials',
        value: savedCredential(GITHUB_TITLE, 'uuid-creators-private', {
          private: true,
          configuration_project_id: 'creators-personal-project',
        }),
        configurations: [{ ...CREDENTIAL_CONFIGURATIONS[0], project_id: PERSONAL_PROJECT_ID }],
      });

      expect(singleSelectProps.value).toBe(savedOptions()[0].value);
      expect(JSON.parse(savedOptions()[0].value).configuration_uuid).toBe(GITHUB_UUID);
    });

    it("clears another member's private reference instead of committing the user's own credential", () => {
      renderSelect({
        section: 'credentials',
        value: savedCredential(GITHUB_TITLE, 'uuid-creators-private', {
          private: true,
          configuration_project_id: 'creators-personal-project',
        }),
        configurations: [{ ...CREDENTIAL_CONFIGURATIONS[0], project_id: PERSONAL_PROJECT_ID }],
      });

      singleSelectProps.onClear();

      expect(onSelectConfiguration).toHaveBeenCalledTimes(1);
      expect(onSelectConfiguration).toHaveBeenCalledWith(null);
    });

    const foreignPrivateValue = () =>
      savedCredential(GITHUB_TITLE, 'uuid-creators-private', {
        private: true,
        configuration_project_id: 'creators-personal-project',
      });
    const OWN_PRIVATE = { ...CREDENTIAL_CONFIGURATIONS[0], project_id: PERSONAL_PROJECT_ID };

    it("commits a team credential picked while another member's private reference is stored", () => {
      renderSelect({
        section: 'credentials',
        value: foreignPrivateValue(),
        configurations: [
          OWN_PRIVATE,
          { id: 99, uuid: 'uuid-other', elitea_title: 'other-token', project_id: TEAM_PROJECT_ID, data: {} },
        ],
      });

      singleSelectProps.onValueChange(optionValueFor('other-token'));

      expect(onSelectConfiguration).toHaveBeenCalledTimes(1);
      expect(onSelectConfiguration).toHaveBeenCalledWith(
        expect.objectContaining({ configuration_uuid: 'uuid-other', private: false }),
      );
    });

    it("commits another own private credential picked while another member's private reference is stored", () => {
      renderSelect({
        section: 'credentials',
        value: foreignPrivateValue(),
        configurations: [
          OWN_PRIVATE,
          {
            id: 98,
            uuid: 'uuid-own-other',
            elitea_title: 'other-token',
            project_id: PERSONAL_PROJECT_ID,
            data: {},
          },
        ],
      });

      singleSelectProps.onValueChange(optionValueFor('other-token'));

      expect(onSelectConfiguration).toHaveBeenCalledTimes(1);
      expect(onSelectConfiguration).toHaveBeenCalledWith(
        expect.objectContaining({ configuration_uuid: 'uuid-own-other', private: true }),
      );
    });

    it("deselects when the resolved own credential is clicked again for another member's private reference", () => {
      renderSelect({ section: 'credentials', value: foreignPrivateValue(), configurations: [OWN_PRIVATE] });

      singleSelectProps.onValueChange(optionValueFor(GITHUB_TITLE));

      expect(onSelectConfiguration).toHaveBeenCalledTimes(1);
      expect(onSelectConfiguration).toHaveBeenCalledWith(null);
    });

    it("shows the mismatch footer when the user has no credential for another member's private reference", () => {
      renderSelect({ section: 'credentials', value: foreignPrivateValue(), configurations: [] });

      expect(screen.getByTestId('credential-mismatch-footer')).toBeInTheDocument();
      expect(JSON.parse(singleSelectProps.value).configuration_uuid).toBe('uuid-creators-private');
    });

    it("does not fall through to a team or other-title credential for another member's private reference", () => {
      renderSelect({
        section: 'credentials',
        value: foreignPrivateValue(),
        configurations: [
          { ...CREDENTIAL_CONFIGURATIONS[0], project_id: TEAM_PROJECT_ID },
          {
            id: 98,
            uuid: 'uuid-own-other',
            elitea_title: 'other-token',
            project_id: PERSONAL_PROJECT_ID,
            data: {},
          },
        ],
      });

      expect(screen.getByTestId('credential-mismatch-footer')).toBeInTheDocument();
      expect(JSON.parse(singleSelectProps.value).configuration_uuid).toBe('uuid-creators-private');
    });

    it("keeps the uuid-only match for the user's own private reference", () => {
      renderSelect({
        section: 'credentials',
        value: savedCredential(GITHUB_TITLE, 'uuid-deleted', {
          private: true,
          configuration_project_id: PERSONAL_PROJECT_ID,
        }),
        configurations: [{ ...CREDENTIAL_CONFIGURATIONS[0], project_id: PERSONAL_PROJECT_ID }],
      });

      // No row is selected: the select echoes the saved reference, not the same-title row's uuid
      expect(JSON.parse(singleSelectProps.value).configuration_uuid).toBe('uuid-deleted');
      expect(singleSelectProps.value).not.toBe(savedOptions()[0].value);
    });

    it('stays on the uuid-only match while the personal project is not loaded yet', () => {
      personalProjectIdInStore = undefined;
      renderSelect({
        section: 'credentials',
        value: savedCredential(GITHUB_TITLE, 'uuid-deleted', {
          private: true,
          configuration_project_id: PERSONAL_PROJECT_ID,
        }),
        configurations: [{ ...CREDENTIAL_CONFIGURATIONS[0], project_id: PERSONAL_PROJECT_ID }],
      });

      // No row is selected: the select echoes the saved reference, not the same-title row's uuid
      expect(JSON.parse(singleSelectProps.value).configuration_uuid).toBe('uuid-deleted');
      expect(singleSelectProps.value).not.toBe(savedOptions()[0].value);
    });

    it('still matches a legacy saved value that has no uuid by title and private flag', () => {
      renderSelect({
        section: 'credentials',
        value: { elitea_title: GITHUB_TITLE, private: false },
        configurations: CREDENTIAL_CONFIGURATIONS,
      });

      expect(singleSelectProps.value).toBe(optionValueFor(GITHUB_TITLE));
    });
  });

  // --- EL-7228: a credential the chat's form created as "Only me (in this project)" ----------------------------------

  describe('EL-7228 an Only-me credential of this project', () => {
    const own = (owner = USER_ID) => ({
      ...CREDENTIAL_CONFIGURATIONS[0],
      project_id: TEAM_PROJECT_ID,
      meta: { personal_owner_id: owner },
    });

    it("is listed as its author's own and stored by its uuid in this project", () => {
      renderSelect({
        section: 'credentials',
        value: null,
        configurations: [own()],
        fallbackToFirstCredential: false,
      });
      const stored = JSON.parse(savedOptions()[0].value);
      expect(stored).toMatchObject({ private: true, configuration_uuid: GITHUB_UUID });
      expect(stored.configuration_project_id).toBe(TEAM_PROJECT_ID);
    });

    it('is the selection of a toolkit that stores it, with no mismatch shown', () => {
      renderSelect({
        section: 'credentials',
        value: savedCredential(GITHUB_TITLE, GITHUB_UUID, { private: true }),
        configurations: [own()],
      });
      expect(singleSelectProps.value).toBe(savedOptions()[0].value);
      const footer = screen.queryByTestId('credential-mismatch-footer');
      expect(footer === null || footer.dataset.mismatchedPrivate === 'false').toBe(true);
    });

    it('stays a team credential for another member (it is not their own)', () => {
      renderSelect({
        section: 'credentials',
        value: null,
        configurations: [own(99)],
        fallbackToFirstCredential: false,
      });
      expect(JSON.parse(savedOptions()[0].value).private).toBe(false);
    });
  });
});
