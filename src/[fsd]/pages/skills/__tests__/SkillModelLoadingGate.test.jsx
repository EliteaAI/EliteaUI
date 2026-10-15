// @vitest-environment jsdom
import { useFormikContext } from 'formik';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { cleanup, render, screen } from '@testing-library/react';

import CreateSkill from '../CreateSkill';
import EditSkill from '../EditSkill';

const fixture = vi.hoisted(() => ({
  models: { defaultModel: { name: 'haiku', project_id: 1 }, isLoadingModels: false },
  details: { data: undefined, isFetching: false, isError: false },
  formValues: null,
}));

vi.mock('@/[fsd]/features/skill/lib/hooks', () => ({ useSkillModels: () => fixture.models }));
vi.mock('@/[fsd]/features/skill', () => {
  const SkillForm = () => {
    fixture.formValues = useFormikContext().values;
    return <div data-testid="skill-form" />;
  };
  return {
    AIEditSkillButton: () => null,
    CreateSkillForm: SkillForm,
    CreateSkillTabBar: () => null,
    SkillControls: () => null,
    SkillInformation: () => null,
    SkillRunPane: () => null,
    SkillValidateSchema: {},
    useCompareSkillVersions: () => ({}),
    useSetSkillDefaultVersionMutation: () => [vi.fn(), {}],
    useSkillDetailsQuery: () => fixture.details,
  };
});
vi.mock('@/[fsd]/entities/compare-versions', () => ({ CompareVersionsModal: () => null }));
vi.mock('@/[fsd]/entities/version', () => ({ LATEST_VERSION_NAME: 'base' }));
vi.mock('@/[fsd]/entities/version/ui', () => ({ SetDefaultVersionDialog: () => null }));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useRestoredConversation: () => ({}),
  useRunHistoryNavigation: () => ({}),
  useSelectedProjectId: () => 2,
  useToast: () => ({ toastError: vi.fn(), toastSuccess: vi.fn() }),
}));
vi.mock('@/[fsd]/shared/ui', () => ({ Breadcrumbs: () => null, BreadcrumbsOrTitle: () => null }));
vi.mock('@/[fsd]/widgets/skill-tab-bar', () => ({ SkillTabBar: () => null }));
vi.mock('@/api/eliteaApi', () => ({ eliteaApi: { endpoints: {} } }));
vi.mock('@/common/constants', () => ({ SkillsTabs: ['all'], ViewMode: { Owner: 'owner' } }));
vi.mock('@/common/utils.jsx', () => ({ buildErrorMessage: vi.fn(), isNotFoundError: () => false }));
vi.mock('@/components/Formik/DirtyDetector', () => ({ default: () => null }));
vi.mock('@/components/StyledTabs', () => ({ default: ({ tabs }) => <>{tabs[0].content}</> }));
vi.mock('@/hooks/useNavBlocker', () => ({ default: () => {} }));
vi.mock('@/pages/Common/Components', () => ({ StyledGridContainer: ({ children }) => <>{children}</> }));
vi.mock('@/pages/Common/Components/StyledComponents', () => {
  const Passthrough = ({ children }) => <>{children}</>;
  return {
    ContentContainer: Passthrough,
    LeftGridItem: Passthrough,
    RightGridItem: Passthrough,
    StyledGridContainer: Passthrough,
  };
});
vi.mock('@/pages/Page404.jsx', () => ({ default: () => null }));
vi.mock('@/routes', () => ({ default: { Skills: '/skills' }, PathSessionMap: {} }));
vi.mock('react-redux', () => ({ useDispatch: () => vi.fn() }));
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ skillId: '601' }),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));

const LEGACY_SKILL = {
  id: 601,
  name: 'Reviewer',
  versions: [],
  version_details: { id: 702, instructions: 'Review it.', run_settings: { ignore_project_context: true } },
};

afterEach(() => {
  cleanup();
  fixture.models = { defaultModel: { name: 'haiku', project_id: 1 }, isLoadingModels: false };
  fixture.details = { data: undefined, isFetching: false, isError: false };
  fixture.formValues = null;
});

describe.each([
  ['the create page', () => render(<CreateSkill />)],
  [
    'the edit page',
    () => {
      fixture.details = { data: LEGACY_SKILL, isFetching: false, isError: false };
      return render(<EditSkill />);
    },
  ],
])('%s while the models load', (_, renderPage) => {
  it('holds the form back so a late default model cannot reset typed edits', () => {
    fixture.models = { defaultModel: null, isLoadingModels: true };
    renderPage();

    expect(screen.queryByTestId('skill-form')).toBeNull();
  });

  it('starts the form on the project default model once they load', () => {
    renderPage();

    expect(screen.getByTestId('skill-form')).toBeTruthy();
    expect(fixture.formValues.version_details.run_settings.llm_settings).toMatchObject({
      model_name: 'haiku',
      model_project_id: 1,
    });
  });
});
