// @vitest-environment jsdom
import { memo, useCallback, useState } from 'react';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import CredentialsSelect from '../CredentialsSelect';

const PERSONAL_PROJECT_ID = 'personal-project';
const TEAM_PROJECT_ID = 'project-1';

const PGVECTOR_TITLE = 'elitea-pgvector';
const CHROMA_TITLE = 'elitea-chroma';
const GITHUB_TITLE = 'github-token';
const DELETED_TITLE = 'deleted-store';

const VECTOR_STORAGE_CONFIGURATIONS = [
  { id: 'cfg-pgvector', elitea_title: PGVECTOR_TITLE, project_id: TEAM_PROJECT_ID, data: {} },
  { id: 'cfg-chroma', elitea_title: CHROMA_TITLE, project_id: TEAM_PROJECT_ID, data: {} },
];

const CREDENTIAL_CONFIGURATIONS = [
  { id: 'cfg-github', elitea_title: GITHUB_TITLE, project_id: TEAM_PROJECT_ID, type: 'github', data: {} },
];

let singleSelectProps;
let credentialsData;
let hasAutoSelectedRef;

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
  useContextExecutionEntity: () => ({ contextExecutionEntity: 'agent' }),
}));

vi.mock('@/GA', () => ({ useTrackEvent: () => trackEvent }));

vi.mock('react-redux', () => ({
  useSelector: selector => selector({ user: { personal_project_id: PERSONAL_PROJECT_ID } }),
}));

vi.mock('@/hooks/useSelectedProject', () => ({ useSelectedProjectId: () => TEAM_PROJECT_ID }));

vi.mock('@/routes', async importOriginal => {
  const actual = await importOriginal();
  return { ...actual, getBasename: () => '' };
});

vi.mock('@/hooks/useConfigurations', () => ({
  Manual_Title: 'Manual_Title',
  Create_Personal_Title: 'Create_Personal_Title',
  Create_Project_Title: 'Create_Project_Title',
}));

vi.mock('../CredentialMismatchFooter', () => ({
  default: () => <div data-testid="credential-mismatch-footer" />,
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
} = {}) => {
  stubCredentialsData({ configurations, projectDefault });

  return render(
    <CredentialsSelect
      label="Vector storage"
      section={section}
      isCreationAllowed={section !== 'vectorstorage'}
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
      expect(onSelectConfiguration).toHaveBeenCalledWith({
        private: false,
        elitea_title: CHROMA_TITLE,
      });

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

  it('lets the cleared vector storage be picked again instead of clearing it a second time', async () => {
    renderControlledSelect({
      initialValue: { elitea_title: PGVECTOR_TITLE, private: false },
      projectDefault: PGVECTOR_TITLE,
    });

    expect(onSelectConfiguration).not.toHaveBeenCalled();

    clickOption(PGVECTOR_TITLE);

    expect(onSelectConfiguration).toHaveBeenCalledTimes(1);
    expect(onSelectConfiguration).toHaveBeenCalledWith(null);
    await waitFor(() => expect(singleSelectProps.value).toBe(''));
    expect(renderedValue()).toBeEmptyDOMElement();

    onSelectConfiguration.mockClear();
    clickOption(PGVECTOR_TITLE);

    expect(onSelectConfiguration).toHaveBeenCalledTimes(1);
    expect(onSelectConfiguration).toHaveBeenCalledWith({
      private: false,
      elitea_title: PGVECTOR_TITLE,
    });
  });

  it('keeps auto-selecting the first saved credential in the credentials section', async () => {
    renderSelect({ section: 'credentials', value: null, configurations: CREDENTIAL_CONFIGURATIONS });

    expect(singleSelectProps.value).toBe(optionValueFor(GITHUB_TITLE));
    expect(within(renderedValue()).getByText(GITHUB_TITLE)).toBeInTheDocument();
    await waitFor(() =>
      expect(onSelectConfiguration).toHaveBeenCalledWith(
        { private: false, elitea_title: GITHUB_TITLE },
        { isAutoSelect: true },
      ),
    );
  });

  it('still repairs a stale private flag when the saved title matches a team configuration', async () => {
    renderSelect({
      value: { elitea_title: PGVECTOR_TITLE, private: true },
      projectDefault: PGVECTOR_TITLE,
    });

    await waitFor(() =>
      expect(onSelectConfiguration).toHaveBeenCalledWith(
        { private: false, elitea_title: PGVECTOR_TITLE },
        { isAutoSelect: true },
      ),
    );
  });

  it('still repairs a saved vector storage that no longer exists with the project default', async () => {
    renderSelect({
      value: { elitea_title: DELETED_TITLE, private: false },
      projectDefault: PGVECTOR_TITLE,
    });

    expect(singleSelectProps.value).toBe(optionValueFor(PGVECTOR_TITLE));
    await waitFor(() =>
      expect(onSelectConfiguration).toHaveBeenCalledWith(
        { private: false, elitea_title: PGVECTOR_TITLE },
        { isAutoSelect: true },
      ),
    );
  });
});
