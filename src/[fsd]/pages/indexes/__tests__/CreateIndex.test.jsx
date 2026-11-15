// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import CreateIndex from '../CreateIndex';

const { navigate, toastError, access } = vi.hoisted(() => ({
  navigate: vi.fn(),
  toastError: vi.fn(),
  access: { permissions: undefined, canWrite: false },
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
  useParams: () => ({ tab: 'all', toolkitId: '44' }),
}));
vi.mock('react-redux', () => ({
  useSelector: selector => selector({ user: { permissions: access.permissions } }),
}));
vi.mock('formik', () => ({ Formik: props => props.children }));
vi.mock('@/[fsd]/features/settings', () => ({ DrawerPageHeader: () => null }));
vi.mock('@/[fsd]/shared/ui/breadcrumbs', () => ({ default: () => null }));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useSelectedProjectId: () => 2,
  useToast: () => ({ toastError }),
}));
vi.mock('@/[fsd]/features/toolkits/indexes/api', () => ({ useGetIndexesListQuery: () => ({}) }));
vi.mock('@/[fsd]/features/toolkits/indexes/lib/hooks', () => ({ useCanWriteIndexes: () => access.canWrite }));
vi.mock('@/api/toolkits.js', () => ({
  useToolkitsDetailsQuery: () => ({
    data: { id: 44, type: 'confluence' },
    isFetching: false,
    isError: false,
  }),
}));
vi.mock('@/common/utils.jsx', () => ({ buildErrorMessage: () => '', isNotFoundError: () => false }));
vi.mock('../CreateIndexForm', () => ({ default: () => <div data-testid="create-index-form" /> }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  access.permissions = undefined;
  access.canWrite = false;
});

describe('CreateIndex', () => {
  it('sends someone who may only read indexes back to the toolkit with the reason', () => {
    access.permissions = ['models.applications.index_meta.details'];
    render(<CreateIndex />);

    expect(toastError).toHaveBeenCalledWith('You have read-only access to this index');
    expect(navigate).toHaveBeenCalledWith('/toolkits/all/44', { replace: true });
    expect(screen.queryByTestId('create-index-form')).not.toBeInTheDocument();
  });

  it('waits for the permissions before deciding, so a fresh tab never bounces an editor', () => {
    render(<CreateIndex />);

    expect(navigate).not.toHaveBeenCalled();
    expect(toastError).not.toHaveBeenCalled();
  });

  it('shows the form to someone who may write indexes', () => {
    access.permissions = ['models.applications.index_meta.edit'];
    access.canWrite = true;
    render(<CreateIndex />);

    expect(screen.getByTestId('create-index-form')).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });
});
