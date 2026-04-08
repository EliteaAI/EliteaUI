import { AuthenticationTypes, VITE_SERVER_URL } from '@/common/constants';
import {
  adoBoardsToolOptions,
  adoPlansToolOptions,
  adoReposToolOptions,
  adoWikiToolOptions,
  artifactToolOptions,
  bitbucketToolOptions,
  browserToolOptions,
  confluenceToolOptions,
  datasourceToolOptions,
  githubToolOptions,
  gitlabToolOptions,
  googleToolOptions,
  gplacesToolOptions,
  jiraToolOptions,
  qtestToolOptions,
  rallyToolOptions,
  reportPortalToolOptions,
  sharepointToolOptions,
  sonarToolOptions,
  sqlToolOptions,
  testioToolOptions,
  testrailToolOptions,
  xrayToolOptions,
  yagmailToolOptions,
  zephyrScaleToolOptions,
  zephyrToolOptions,
} from '@/pages/Applications/Components/Tools/toolOptions.js';

export const ToolEvents = {
  ValidateToolEvent: 'ValidateToolEvent',
  SaveEvent: 'SaveEvent',
  ResetValidateEvent: 'ResetValidateEvent',
  ToolkitsCreateBackEvent: 'ToolkitsCreateBackEvent',
  ToolkitsCreateToolkit: 'ToolkitsCreateToolkit',
  ToolkitsUpdateToolkit: 'ToolkitsUpdateToolkit',
  ToolkitsCreateToolkitWithConfiguration: 'ToolkitsCreateToolkitWithConfiguration',
  ToolkitsUpdateToolkitWithConfiguration: 'ToolkitsUpdateToolkitWithConfiguration',
};

export const ValidateToolEventReason = {
  createAgent: 'createAgent',
  saveNewVersion: 'saveNewVersion',
  saveLatestVersion: 'saveLatestVersion',
};

export const ToolTypes = {
  ado_boards: {
    label: 'ADO Boards',
    value: 'ado_boards',
  },
  ado_plans: {
    label: 'ADO Plans',
    value: 'ado_plans',
  },
  ado_repos: {
    label: 'ADO Repos',
    value: 'ado_repos',
  },
  ado_wiki: {
    label: 'ADO Wiki',
    value: 'ado_wiki',
  },
  application: {
    label: 'Agent',
    value: 'application',
  },
  artifact: {
    label: 'Artifact',
    value: 'artifact',
  },
  bitbucket: {
    label: 'Bitbucket',
    value: 'bitbucket',
  },
  browser: {
    label: 'Browser',
    value: 'browser',
  },
  confluence: {
    label: 'Confluence',
    value: 'confluence',
  },
  custom: {
    label: 'Custom',
    value: 'custom',
  },
  datasource: {
    label: 'Datasource',
    value: 'datasource',
  },
  github: {
    label: 'GitHub',
    value: 'github',
  },
  gitlab: {
    label: 'GitLab',
    value: 'gitlab',
  },
  gitlab_org: {
    label: 'GitLab Org',
    value: 'gitlab_org',
  },
  google: {
    label: 'Google',
    value: 'google',
  },
  google_places: {
    label: 'Google Places',
    value: 'google_places',
  },
  image_generation_model: {
    label: 'Image Generation',
    value: 'image_generation_model',
  },
  jira: {
    label: 'Jira',
    value: 'jira',
  },
  openapi: {
    label: 'OpenAPI',
    value: 'openapi',
  },
  open_api: {
    label: 'OpenAPI',
    value: 'openapi',
  },
  qtest: {
    label: 'QTest',
    value: 'qtest',
  },
  rally: {
    label: 'Rally',
    value: 'rally',
  },
  report_portal: {
    label: 'Report Portal',
    value: 'report_portal',
  },
  service_now: {
    label: 'ServiceNow',
    value: 'service_now',
  },
  sharepoint: {
    label: 'SharePoint',
    value: 'sharepoint',
  },
  sonar: {
    label: 'Sonar',
    value: 'sonar',
  },
  sql: {
    label: 'SQL',
    value: 'sql',
  },
  testio: {
    label: 'TestIO',
    value: 'testio',
  },
  testrail: {
    label: 'TestRail',
    value: 'testrail',
  },
  xray_cloud: {
    label: 'XRAY Cloud',
    value: 'xray_cloud',
  },
  yagmail: {
    label: 'Yagmail',
    value: 'yagmail',
  },
  zephyr: {
    label: 'Zephyr',
    value: 'zephyr',
  },
  zephyr_enterprise: {
    label: 'Zephyr Enterprise',
    value: 'zephyr_enterprise',
  },
  zephyr_essential: {
    label: 'Zephyr Essential',
    value: 'zephyr_essential',
  },
  zephyr_scale: {
    label: 'Zephyr Scale',
    value: 'zephyr_scale',
  },
  zephyr_squad: {
    label: 'Zephyr Squad',
    value: 'zephyr_squad',
  },
};

export const hostingOptions = [
  { label: 'Cloud', value: true },
  { label: 'Server', value: false },
];

export const ToolInitialValues = {
  [ToolTypes.artifact.value]: {
    type: ToolTypes.artifact.value,
    settings: {
      bucket: '',
      selected_tools: artifactToolOptions.map(i => i.value),
    },
  },
  [ToolTypes.datasource.value]: {
    type: ToolTypes.datasource.value,
    settings: {
      datasource_id: '',
      selected_tools: datasourceToolOptions.map(i => i.value),
    },
  },
  [ToolTypes.open_api.value]: {
    type: ToolTypes.open_api.value,
    settings: {
      schema_settings: '',
      selected_tools: [],
      authentication: {
        type: AuthenticationTypes.None.value,
        settings: {},
      },
    },
  },
  [ToolTypes.custom.value]: {
    type: ToolTypes.custom.value,
    name: 'Custom tool',
    description: 'custom tool',
    settings: {},
  },
  [ToolTypes.browser.value]: {
    type: ToolTypes.browser.value,
    settings: {
      google_api_key: '',
      google_cse_id: '',
      selected_tools: browserToolOptions.map(i => i.value),
    },
  },
  [ToolTypes.confluence.value]: {
    type: ToolTypes.confluence.value,
    settings: {
      base_url: '',
      cloud: true,
      limit: 5,
      max_pages: 10,
      number_of_retries: 2,
      min_retry_seconds: 10,
      max_retry_seconds: 60,
      space: '', // New field added
      selected_tools: confluenceToolOptions.map(i => i.value),
    },
  },
  [ToolTypes.github.value]: {
    type: ToolTypes.github.value,
    settings: {
      base_url: 'https://api.github.com',
      repository: '',
      active_branch: 'main',
      app_id: null,
      app_private_key: null,
      access_token: null,
      username: null,
      password: null,
      selected_tools: githubToolOptions.map(i => i.value),
    },
  },
  [ToolTypes.gitlab.value]: {
    type: ToolTypes.gitlab.value,
    settings: {
      url: '',
      repository: '',
      branch: 'main',
      private_token: '',
      selected_tools: gitlabToolOptions.map(i => i.value),
    },
  },
  [ToolTypes.gitlab_org.value]: {
    type: ToolTypes.gitlab_org.value,
    settings: {
      url: '',
      repositories: '',
      branch: 'main',
      private_token: '',
      selected_tools: gitlabToolOptions.map(i => i.value),
    },
  },
  [ToolTypes.bitbucket.value]: {
    type: ToolTypes.bitbucket.value,
    settings: {
      url: '',
      project: '',
      repository: '',
      branch: 'main',
      username: '',
      password: '',
      selected_tools: bitbucketToolOptions.map(i => i.value),
    },
  },
  [ToolTypes.jira.value]: {
    type: ToolTypes.jira.value,
    settings: {
      base_url: '',
      token: null,
      api_key: null,
      username: null,
      cloud: true,
      limit: 5,
      additional_fields: '',
      verify_ssl: true,
      selected_tools: jiraToolOptions.map(i => i.value),
    },
  },
  [ToolTypes.yagmail.value]: {
    type: ToolTypes.yagmail.value,
    settings: {
      host: null,
      username: null,
      password: null,
      selected_tools: yagmailToolOptions.map(i => i.value),
    },
  },
  [ToolTypes.report_portal.value]: {
    type: ToolTypes.report_portal.value,
    settings: {
      endpoint: '',
      api_key: '',
      project: '',
      selected_tools: reportPortalToolOptions.map(i => i.value),
    },
  },
  [ToolTypes.application.value]: {
    type: ToolTypes.application.value,
    settings: {
      application_id: '',
      application_version_id: '',
      variables: [],
    },
  },
  [ToolTypes.testrail.value]: {
    type: ToolTypes.testrail.value,
    settings: {
      url: null,
      email: null,
      password: null,
      selected_tools: testrailToolOptions.map(i => i.value),
    },
  },
  [ToolTypes.ado_boards.value]: {
    type: ToolTypes.ado_boards.value,
    settings: {
      organization_url: null,
      project: null,
      token: null,
      limit: 5,
      selected_tools: adoBoardsToolOptions.map(i => i.value),
    },
  },
  [ToolTypes.ado_wiki.value]: {
    type: ToolTypes.ado_wiki.value,
    settings: {
      organization_url: null,
      project: null,
      token: null,
      selected_tools: adoWikiToolOptions.map(i => i.value),
    },
  },
  [ToolTypes.ado_plans.value]: {
    type: ToolTypes.ado_plans.value,
    settings: {
      organization_url: null,
      project: null,
      token: null,
      selected_tools: adoPlansToolOptions.map(i => i.value),
    },
  },
  [ToolTypes.ado_repos.value]: {
    type: ToolTypes.ado_repos.value,
    settings: {
      organization_url: null,
      repository_id: null,
      project: null,
      token: null,
      base_branch: 'main',
      active_branch: 'main',
      selected_tools: adoReposToolOptions.map(i => i.value),
    },
  },
  [ToolTypes.testio.value]: {
    type: ToolTypes.testio.value,
    settings: {
      endpoint: '',
      api_key: '',
      selected_tools: testioToolOptions.map(i => i.value),
    },
  },
  [ToolTypes.xray_cloud.value]: {
    type: ToolTypes.xray_cloud.value,
    settings: {
      base_url: '',
      client_id: '',
      client_secret: '',
      limit: '100',
      selected_tools: xrayToolOptions.map(i => i.value),
    },
  },
  [ToolTypes.zephyr.value]: {
    type: ToolTypes.zephyr.value,
    settings: {
      base_url: '',
      username: null,
      password: null,
      selected_tools: zephyrToolOptions.map(i => i.value),
    },
  },
  [ToolTypes.zephyr_scale.value]: {
    type: ToolTypes.zephyr_scale.value,
    settings: {
      base_url: '',
      token: null,
      username: null,
      password: null,
      cookies: null,
      selected_tools: zephyrScaleToolOptions.map(i => i.value),
    },
  },
  [ToolTypes.qtest.value]: {
    type: ToolTypes.qtest.value,
    settings: {
      base_url: '',
      // qtest_project_id: null,
      project_id: null,
      qtest_api_token: null,
      selected_tools: qtestToolOptions.map(i => i.value),
    },
  },
  [ToolTypes.google.value]: {
    type: ToolTypes.google.value,
    settings: {
      token_json: '',
      selected_tools: googleToolOptions.map(i => i.value),
    },
  },
  [ToolTypes.sharepoint.value]: {
    type: ToolTypes.sharepoint.value,
    settings: {
      url: '',
      client_id: '',
      client_secret: '',
      selected_tools: sharepointToolOptions.map(i => i.value),
    },
  },
  [ToolTypes.rally.value]: {
    type: ToolTypes.rally.value,
    settings: {
      server: '',
      api_key: '',
      username: '',
      password: '',
      workspace: '',
      project: '',
      selected_tools: rallyToolOptions.map(i => i.value),
    },
  },
  [ToolTypes.sql.value]: {
    type: ToolTypes.sql.value,
    settings: {
      dialect: '',
      host: '',
      port: '',
      username: '',
      password: '',
      database_name: '',
      selected_tools: sqlToolOptions.map(i => i.value),
    },
  },
  [ToolTypes.sonar.value]: {
    type: ToolTypes.sonar.value,
    settings: {
      url: '',
      sonar_token: '',
      sonar_project_name: '',
      selected_tools: sonarToolOptions.map(i => i.value),
    },
  },
  [ToolTypes.google_places.value]: {
    type: ToolTypes.google_places.value,
    settings: {
      api_key: '',
      results_count: '',
      selected_tools: gplacesToolOptions.map(i => i.value),
    },
  },
};

export const toolIconStaticURL =
  (VITE_SERVER_URL.endsWith('/')
    ? VITE_SERVER_URL.replace('/api/v2/', '')
    : VITE_SERVER_URL.replace('/api/v2', '')) + '/app/application_tool_icon';
// export const toolIconStaticURL = 'https://raw.githubusercontent.com/ProjectEliteA/elitea_static/refs/heads/main/tool_icons'
