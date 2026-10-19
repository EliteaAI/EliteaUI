export const buildAccessDeniedMessage = (action, projectName) => {
  const projectLabel = projectName ? `the "${projectName}" project` : 'the selected project';

  return `Access denied: you don't have permission to ${action} into ${projectLabel}`;
};
