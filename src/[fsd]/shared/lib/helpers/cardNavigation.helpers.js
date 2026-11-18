import { AppsTabs, ContentType, SearchParams } from '@/common/constants';
import RouteDefinitions from '@/routes';

/**
 * Builds the destination of an entity card / table row. Pure, so the same result feeds both the
 * programmatic `navigate()` call and a real `<a href>` (needed for "Open link in new tab").
 *
 * @param {object} params
 * @param {string} params.type - ContentType of the card
 * @param {string|number} params.id - entity id
 * @param {string} [params.tab] - list tab the entity is opened from
 * @param {string|number|null} [params.projectId] - optional project path prefix
 * @param {string} params.viewMode
 * @param {string} params.name
 * @param {string} [params.extraParam] - raw query prefix, e.g. 'foo=bar&'
 * @param {string} [params.anchor]
 * @param {string} [params.authorName]
 * @param {string|number} [params.authorId]
 * @returns {{ pathname: string | undefined, search: string, pagePath: string }}
 */
export const buildCardNavigation = params => {
  const {
    type,
    id,
    tab,
    projectId = null,
    viewMode,
    name,
    extraParam,
    anchor = '',
    authorName,
    authorId,
  } = params;

  const search = `${extraParam || ''}${SearchParams.ViewMode}=${viewMode}&${SearchParams.Name}=${encodeURIComponent(name)}${authorName ? `&${SearchParams.AuthorName}=${encodeURIComponent(authorName)}` : ''}${authorId ? `&${SearchParams.AuthorId}=${authorId}` : ''}`;
  const query = `${anchor}?${search}`;

  const buildUrl = (route, pathSegment) =>
    projectId ? `/${projectId}${route}/${pathSegment}/${id}` : `${route}/${pathSegment}/${id}`;

  const urlMap = {
    [ContentType.ApplicationAdmin]: buildUrl(RouteDefinitions.Applications, tab),
    [ContentType.ApplicationAll]: buildUrl(RouteDefinitions.Applications, tab),
    [ContentType.ApplicationApproval]: buildUrl(RouteDefinitions.Applications, tab),
    [ContentType.ApplicationDraft]: buildUrl(RouteDefinitions.Applications, tab),
    [ContentType.ApplicationModeration]: buildUrl(RouteDefinitions.Applications, tab),
    [ContentType.ApplicationPublished]: buildUrl(RouteDefinitions.Applications, tab),
    [ContentType.ApplicationRejected]: buildUrl(RouteDefinitions.Applications, tab),
    [ContentType.PipelineAdmin]: buildUrl(RouteDefinitions.Pipelines, tab),
    [ContentType.PipelineAll]: buildUrl(RouteDefinitions.Pipelines, tab),
    [ContentType.PipelineApproval]: buildUrl(RouteDefinitions.Pipelines, tab),
    [ContentType.PipelineDraft]: buildUrl(RouteDefinitions.Pipelines, tab),
    [ContentType.PipelineModeration]: buildUrl(RouteDefinitions.Pipelines, tab),
    [ContentType.PipelinePublished]: buildUrl(RouteDefinitions.Pipelines, tab),
    [ContentType.PipelineRejected]: buildUrl(RouteDefinitions.Pipelines, tab),
    [ContentType.ToolkitAdmin]: buildUrl(RouteDefinitions.Toolkits, tab),
    [ContentType.ToolkitAll]: buildUrl(RouteDefinitions.Toolkits, tab),
    [ContentType.AppAll]: buildUrl(RouteDefinitions.Apps, AppsTabs[1]),
    [ContentType.MCPAll]: buildUrl(RouteDefinitions.MCPs, tab),
    [ContentType.CredentialAll]: buildUrl(RouteDefinitions.Credentials, tab),
    [ContentType.SkillAll]: buildUrl(RouteDefinitions.Skills, tab),
    [ContentType.ApplicationTop]: buildUrl(RouteDefinitions.Applications, 'top'),
    [ContentType.ApplicationLatest]: buildUrl(RouteDefinitions.Applications, 'latest'),
    [ContentType.ApplicationMyLiked]: buildUrl(RouteDefinitions.Applications, 'my-liked'),
    [ContentType.ApplicationTrending]: buildUrl(RouteDefinitions.Applications, 'trending'),
    [ContentType.PipelineTop]: buildUrl(RouteDefinitions.Pipelines, 'top'),
    [ContentType.PipelineLatest]: buildUrl(RouteDefinitions.Pipelines, 'latest'),
    [ContentType.PipelineMyLiked]: buildUrl(RouteDefinitions.Pipelines, 'my-liked'),
    [ContentType.PipelineTrending]: buildUrl(RouteDefinitions.Pipelines, 'trending'),
    [ContentType.UserPublicApplications]: buildUrl(RouteDefinitions.UserPublic, 'agents'),
    [ContentType.UserPublicPipelines]: buildUrl(RouteDefinitions.UserPublic, 'pipelines'),
    [ContentType.UserPublicToolkits]: buildUrl(RouteDefinitions.UserPublic, 'toolkits'),
    [ContentType.UserPublicMCPs]: buildUrl(RouteDefinitions.UserPublic, 'mcps'),
  };

  const pathname = urlMap[type];

  return { pathname, search, pagePath: `${pathname}${query}` };
};
