/**
 * Interpolates URL template with provided values
 * @param {string} template - URL template with variables like {project_id}, {toolkit_id}, {theme}
 * @param {Object} values - Object containing values for interpolation
 * @param {string|number} values.projectId - Project ID to replace {project_id}
 * @param {string|number} values.toolkitId - Toolkit ID to replace {toolkit_id}
 * @param {string} values.theme - Theme mode to replace {theme} (e.g., 'dark' or 'light')
 * @returns {string} Interpolated URL
 */
export const interpolateUrl = (template, values = {}) => {
  if (!template || typeof template !== 'string') {
    return template;
  }

  const { projectId, toolkitId, theme } = values;

  let result = template;

  // Replace {project_id}
  if (projectId !== undefined && projectId !== null) {
    result = result.replace(/{project_id}/g, String(projectId));
  }

  // Replace {toolkit_id}
  if (toolkitId !== undefined && toolkitId !== null) {
    result = result.replace(/{toolkit_id}/g, String(toolkitId));
  }

  // Replace {theme}
  if (theme !== undefined && theme !== null) {
    result = result.replace(/{theme}/g, String(theme));
  }

  return result;
};
