import { useEffect } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { skillFilesApi } from '@/[fsd]/features/skill/api/skillFilesApi';
import { shallowEqual } from '@/[fsd]/shared/lib/utils';

const { skillVersionFileText } = skillFilesApi.endpoints;

export const useSkillVersionFileTexts = (scope, paths) => {
  const dispatch = useDispatch();
  const pathsKey = JSON.stringify(paths);
  useEffect(() => {
    const subscriptions = JSON.parse(pathsKey).map(path =>
      dispatch(skillVersionFileText.initiate({ ...scope, path })),
    );
    return () => subscriptions.forEach(subscription => subscription.unsubscribe());
  }, [dispatch, scope, pathsKey]);
  return useSelector(
    state =>
      Object.fromEntries(
        paths.map(path => [path, skillVersionFileText.select({ ...scope, path })(state).data]),
      ),
    shallowEqual,
  );
};
