import { useCallback, useEffect, useRef } from 'react';

import { useSearchParams } from 'react-router-dom';

import {
  SKILL_EDITOR_VIEWS,
  SKILL_FILES_SEARCH_PARAMS,
  SKILL_SIDE_PANELS,
} from '@/[fsd]/features/skill/lib/constants';

const isOtherPanelPending = written => Boolean(written) && written !== SKILL_SIDE_PANELS.test;

/**
 * The skill page state kept in the address: the tab, the open file and the side panel. Test can also open from
 * outside the page's buttons (a run link, a restored chat), so `panel=test` follows the panel itself, and a link
 * with `panel=test` opens it once.
 */
export const useSkillEditorSearchParams = props => {
  const { isTestPanelOpen, onOpenTestPanel } = props;
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get(SKILL_FILES_SEARCH_PARAMS.view) || SKILL_EDITOR_VIEWS.settings;
  const panel = searchParams.get(SKILL_FILES_SEARCH_PARAMS.panel);
  const filePath = searchParams.get(SKILL_FILES_SEARCH_PARAMS.file);

  const writtenPanel = useRef(undefined);
  const updateParams = useCallback(
    changes => {
      if (SKILL_FILES_SEARCH_PARAMS.panel in changes)
        writtenPanel.current = changes[SKILL_FILES_SEARCH_PARAMS.panel];
      setSearchParams(
        previous => {
          const next = new URLSearchParams(previous);
          Object.entries(changes).forEach(([key, value]) => {
            if (value) next.set(key, value);
            else next.delete(key);
          });
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const hasRestoredTest = useRef(false);
  useEffect(() => {
    if (hasRestoredTest.current) return;
    hasRestoredTest.current = true;
    if (panel === SKILL_SIDE_PANELS.test && !isTestPanelOpen) onOpenTestPanel?.();
  }, [isTestPanelOpen, onOpenTestPanel, panel]);

  const wasTestOpen = useRef(isTestPanelOpen);
  useEffect(() => {
    if (wasTestOpen.current === isTestPanelOpen) return;
    wasTestOpen.current = isTestPanelOpen;
    if (isTestPanelOpen) updateParams({ [SKILL_FILES_SEARCH_PARAMS.panel]: SKILL_SIDE_PANELS.test });
    else if (panel === SKILL_SIDE_PANELS.test && !isOtherPanelPending(writtenPanel.current))
      updateParams({ [SKILL_FILES_SEARCH_PARAMS.panel]: null });
  }, [isTestPanelOpen, panel, updateParams]);

  return { view, panel, filePath, updateParams };
};
