import { useEffect, useState } from 'react';

import { MdxStatus } from '@/[fsd]/features/artifacts/lib/constants/previewMdx.constants';
import { PreviewMdxHelpers } from '@/[fsd]/features/artifacts/lib/helpers';

export const useMdxEvaluator = mdxContent => {
  const [state, setState] = useState({ status: MdxStatus.IDLE, Component: null, error: null });

  useEffect(() => {
    if (!mdxContent?.trim()) {
      setState({ status: MdxStatus.IDLE, Component: null, error: null });
      return;
    }

    let cancelled = false;
    setState({ status: MdxStatus.LOADING, Component: null, error: null });

    PreviewMdxHelpers.evaluateMdx(mdxContent)
      .then(Component => {
        if (!cancelled) setState({ status: MdxStatus.SUCCESS, Component, error: null });
      })
      .catch(err => {
        if (!cancelled)
          setState({ status: MdxStatus.ERROR, Component: null, error: err?.message || String(err) });
      });

    return () => {
      cancelled = true;
    };
  }, [mdxContent]);

  return state;
};
