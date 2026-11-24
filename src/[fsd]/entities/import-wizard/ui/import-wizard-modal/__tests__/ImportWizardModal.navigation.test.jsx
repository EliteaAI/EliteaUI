// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { cleanup, render } from '@testing-library/react';

import ImportWizardModal from '../ImportWizardModal';

const fixture = vi.hoisted(() => ({
  selectedProjectId: 7,
  targetProjectId: 7,
  cardNavigateProps: null,
}));

vi.mock('formik', () => ({
  useFormikContext: () => ({
    values: { selectedProject: { id: fixture.targetProjectId }, importItems: [] },
  }),
}));
vi.mock('react-redux', () => ({ useSelector: selector => selector({ user: { permissions: [] } }) }));
vi.mock('@/[fsd]/entities/import-wizard/lib/hooks', () => ({
  useForkProjectIds: () => ({ excludedProjectIds: [] }),
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useSelectedProjectId: () => fixture.selectedProjectId,
  useCardNavigate: props => {
    fixture.cardNavigateProps = props;
    return vi.fn();
  },
}));
vi.mock('@/api', () => ({
  useLazyCheckPermissionListQuery: () => [vi.fn().mockResolvedValue({ data: [] })],
}));
vi.mock('@/[fsd]/shared/ui', () => ({ Modal: { BaseModal: () => null } }));
vi.mock('@/[fsd]/entities/import-wizard/ui/import-wizard-modal/IWModalActions', () => ({
  default: () => null,
}));
vi.mock('@/[fsd]/entities/import-wizard/ui/import-wizard-modal/IWModalContent', () => ({
  default: () => null,
}));
vi.mock('@/[fsd]/entities/import-wizard/ui/import-wizard-modal/IWModalSucceedContent', () => ({
  default: () => null,
}));

describe('ImportWizardModal navigation after import', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(fixture, { selectedProjectId: 7, targetProjectId: 7, cardNavigateProps: null });
  });
  afterEach(() => cleanup());

  it('opens the imported entity in place when it lands in the current project', () => {
    render(<ImportWizardModal open />);
    expect(fixture.cardNavigateProps.projectId).toBeNull();
  });

  it('switches project when the entity lands in another project', () => {
    fixture.targetProjectId = 12;
    render(<ImportWizardModal open />);
    expect(fixture.cardNavigateProps.projectId).toBe(12);
  });
});
