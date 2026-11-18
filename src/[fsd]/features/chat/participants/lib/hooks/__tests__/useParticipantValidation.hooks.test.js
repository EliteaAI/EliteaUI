// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChatParticipantType } from '@/common/constants';
import { cleanup, renderHook } from '@testing-library/react';

import { useParticipantValidation } from '../useParticipantValidation.hooks';

const validationInfo = vi.hoisted(() => ({ agent: [], toolkit: [] }));

vi.mock('@/hooks/application/useValidateApplicationVersion', () => ({
  default: () => undefined,
  useToolsValidationInfo: () => ({ totalValidationInfo: validationInfo.agent }),
}));
vi.mock('@/hooks/application/useValidateToolkit', () => ({
  default: () => undefined,
  useToolkitValidationInfo: () => ({ toolkitValidationInfoList: validationInfo.toolkit }),
}));

const SIGN_IN = {
  configuration_type: 'dataverse',
  message: 'repro7585 Dataverse child: Sign in to Dataverse to connect this credential.',
  requires_authorization: true,
};
const WRONG_SECRET = {
  configuration_type: 'github',
  message: 'repro7585 mixed child: Authentication failed: Invalid credentials',
  requires_authorization: false,
};
const nested = (...errors) => `Value error, ${JSON.stringify({ __connection_errors__: errors })}`;

const validate = () =>
  renderHook(() =>
    useParticipantValidation({
      participant: { entity_settings: { version_id: 338 } },
      originalDetails: { version_details: { tools: [{ id: 149 }] } },
      entity_meta: { id: 222, project_id: 2 },
      type: ChatParticipantType.Applications,
      isToolkitParticipant: false,
      isPublishedParticipant: false,
    }),
  ).result.current;

describe('useParticipantValidation sign-in-only participants (#7585)', () => {
  afterEach(() => {
    validationInfo.agent = [];
    validationInfo.toolkit = [];
    cleanup();
  });

  it('marks a participant whose only errors need a sign-in as sign-in only, still misconfigured', () => {
    validationInfo.agent = [nested(SIGN_IN)];

    expect(validate()).toMatchObject({
      hasMisconfigurationErrors: true,
      signInOnly: true,
      connectionNotice: { message: SIGN_IN.message, requiresAuthorization: true },
    });
  });

  it('does not mark a participant with an error a sign-in will not clear', () => {
    validationInfo.agent = [nested(SIGN_IN, WRONG_SECRET)];

    expect(validate()).toMatchObject({
      hasMisconfigurationErrors: true,
      signInOnly: false,
      connectionNotice: { message: WRONG_SECRET.message, requiresAuthorization: false },
    });
  });

  it('has no notice for a participant without validation errors', () => {
    expect(validate()).toMatchObject({
      hasMisconfigurationErrors: false,
      signInOnly: false,
      connectionNotice: null,
    });
  });
});
