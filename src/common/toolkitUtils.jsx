import { useMemo, useState } from 'react';

import BuildIcon from '@mui/icons-material/Build';
import EmailIcon from '@mui/icons-material/Email';
import { SvgIcon, useTheme } from '@mui/material';

import AdoGeneralIcon from '@/assets/ado-general.svg?react';
import AdoPlansIcon from '@/assets/ado-plans.svg?react';
import AdoReposIcon from '@/assets/ado-repos-icon.svg?react';
import AmazonBedrock from '@/assets/amazon-bedrock.svg?react';
import ApplicationToolkitIcon from '@/assets/applications-icon.svg?react';
import ArtifactsIcon from '@/assets/artifacts-icon.svg?react';
import AttachSvgIcon from '@/assets/attach-icon.svg?react';
import AdoIcon from '@/assets/azure-icon.svg?react';
import BitbucketIcon from '@/assets/bitbucket-icon.svg?react';
import CalendarIcon from '@/assets/calendar.svg?react';
import ChromaIcon from '@/assets/chroma-icon.svg?react';
import DialIcon from '@/assets/dial-icon.svg?react';
import EmbeddingIcon from '@/assets/embeddings.svg?react';
import FigmaIcon from '@/assets/figma-icon.svg?react';
import FlowIcon from '@/assets/flow-icon.svg?react';
import GitlabWorkspaceIcon from '@/assets/gitlab-space.svg?react';
import GplacesIcon from '@/assets/gplaces-icon.svg?react';
import ImageIcon from '@/assets/image.svg?react';
import JiraIcon from '@/assets/jira-icon.svg?react';
import LlmIcon from '@/assets/llm.svg?react';
import MCPIcon from '@/assets/mcp-icon.svg?react';
import MemoryIcon from '@/assets/memory-icon.svg?react';
import OllamaIcon from '@/assets/ollama.svg?react';
import PieChartIcon from '@/assets/pie-chart-icon.svg?react';
import PostgreSQLIcon from '@/assets/postgre-sql-icon.svg?react';
import PostmanIcon from '@/assets/postman-icon.svg?react';
import PPTXIcon from '@/assets/pptx-icon.svg?react';
import PythonIcon from '@/assets/python.svg?react';
import QTestIcon from '@/assets/qtest.svg?react';
import RallyIcon from '@/assets/rally.svg?react';
import ReportPortalIcon from '@/assets/reportportal-icon.svg?react';
import S3Storage from '@/assets/s3storage-icon.svg?react';
import SalesForceIcon from '@/assets/salesforce.svg?react';
import ServiceNowIcon from '@/assets/service-now.svg?react';
import SharepointIcon from '@/assets/sharepoint.svg?react';
import SlackIcon from '@/assets/slack-icon.svg?react';
import SonarIcon from '@/assets/sonar-icon.svg?react';
import SqlIcon from '@/assets/sql-icon.svg?react';
import SwarmIconSVG from '@/assets/swarm-icon.svg?react';
import TestIOIcon from '@/assets/testio-icon.svg?react';
import TestrailIcon from '@/assets/testrail-icon.svg?react';
import ToolsIcon from '@/assets/tools-icon.svg?react';
import XrayIcon from '@/assets/xray.svg?react';
import ZephyrIcon from '@/assets/zephyr.svg?react';
import { capitalizeFirstChar } from '@/common/utils';
import ApplicationsIcon from '@/components/Icons/ApplicationsIcon.jsx';
import BrowserIcon from '@/components/Icons/BrowserIcon.jsx';
import ConfluenceIcon from '@/components/Icons/ConfluenceIcon.jsx';
import DatabaseIcon from '@/components/Icons/DatabaseIcon.jsx';
import FileCodeIcon from '@/components/Icons/FileCodeIcon.jsx';
import GitHubIcon from '@/components/Icons/GitHubIcon.jsx';
import GitLabIcon from '@/components/Icons/GitLabIcon.jsx';
import HuggingFaceIcon from '@/components/Icons/HuggingFaceIcon';
import JsonIcon from '@/components/Icons/JsonIcon.jsx';
import OpenAIIcon from '@/components/Icons/OpenAIIcon';
import VertexAIIcon from '@/components/Icons/VertexAIIcon';
import { Create_Personal_Title, Create_Project_Title, Manual_Title } from '@/hooks/useConfigurations';
import { ToolTypes, toolIconStaticURL } from '@/pages/Applications/Components/Tools/consts';

const generateColorMatrix = color => {
  let r = 0,
    g = 0,
    b = 0;

  if (color.startsWith('#')) {
    r = parseInt(color.slice(1, 3), 16) / 255;
    g = parseInt(color.slice(3, 5), 16) / 255;
    b = parseInt(color.slice(5, 7), 16) / 255;
  } else if (color.startsWith('rgba')) {
    const rgbaMatch = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*(\d+|\d*\.\d+)\)/);
    if (rgbaMatch) {
      r = parseInt(rgbaMatch[1], 10) / 255;
      g = parseInt(rgbaMatch[2], 10) / 255;
      b = parseInt(rgbaMatch[3], 10) / 255;
    }
  } else if (color.startsWith('rgb')) {
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      r = parseInt(rgbMatch[1], 10) / 255;
      g = parseInt(rgbMatch[2], 10) / 255;
      b = parseInt(rgbMatch[3], 10) / 255;
    }
  } else {
    return `1 0 0 0 0
            0 1 0 0 0
            0 0 1 0 0
            0 0 0 1 0`;
  }

  return `0 0 0 0 ${r}
          0 0 0 0 ${g}
          0 0 0 0 ${b}
          0 0 0 1 0`;
};

const EliteASvgIcon = ({ iconUrl, isToolIcon, fallbackIcon, ...iconProps }) => {
  const theme = useTheme();
  const [iconError, setIconError] = useState(false);
  const matrix = generateColorMatrix(theme.palette.icon.fill.default);

  const handleIconError = () => {
    setIconError(true);
  };

  const href = useMemo(() => {
    if (iconUrl === undefined || iconUrl === null) {
      return null;
    }
    if (iconUrl.startsWith('http')) {
      return iconUrl;
    }
    return `${toolIconStaticURL}/${iconUrl}`;
  }, [iconUrl]);

  if (iconError || href === null) {
    return fallbackIcon || <BuildIcon {...iconProps} />;
  } else {
    return (
      <SvgIcon
        {...iconProps}
        style={{ color: 'red' }}
      >
        <defs>
          <filter
            id="customColor1"
            colorInterpolationFilters="sRGB"
          >
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values={matrix}
            />
          </filter>
        </defs>
        <image
          href={href}
          width="100%"
          height="100%"
          filter={isToolIcon ? 'url(#customColor1)' : ''}
          // eslint-disable-next-line
          onError={handleIconError}
        />
      </SvgIcon>
    );
  }
};

const getInternalToolIcon = (toolkitName, iconProps) => {
  switch (toolkitName) {
    case 'swarm':
      return <SwarmIconSVG {...iconProps} />;
    case 'pyodide':
      return <PythonIcon {...iconProps} />;
    case 'data_analysis':
      return <PieChartIcon {...iconProps} />;
    case 'planner':
      return <CalendarIcon {...iconProps} />;
    case 'lazy_tools_mode':
      return <ToolsIcon {...iconProps} />;
    case 'attachments':
    case 'Attachments':
      return <AttachSvgIcon {...iconProps} />;
    case 'image_generation':
    case 'ImageGen':
      return <ImageIcon {...iconProps} />;
    case 'memory':
      return <MemoryIcon {...iconProps} />;
    default:
      return <BuildIcon {...iconProps} />;
  }
};

const getPredefinedIcon = (type, iconProps) => {
  switch (type) {
    case ToolTypes.application.value:
      return <ApplicationsIcon {...iconProps} />;
    case ToolTypes.artifact.value:
      return <ArtifactsIcon {...iconProps} />;
    case ToolTypes.browser.value:
      return <BrowserIcon {...iconProps} />;
    case ToolTypes.custom.value:
      return <JsonIcon {...iconProps} />;
    case ToolTypes.confluence.value:
      return <ConfluenceIcon {...iconProps} />;
    case ToolTypes.datasource.value:
      return <DatabaseIcon {...iconProps} />;
    case ToolTypes.github.value:
      return <GitHubIcon {...iconProps} />;
    case ToolTypes.gitlab.value:
      return <GitLabIcon {...iconProps} />;
    case ToolTypes.gitlab_org.value:
      return <GitlabWorkspaceIcon {...iconProps} />;
    case ToolTypes.bitbucket.value:
      return <BitbucketIcon {...iconProps} />;
    case ToolTypes.jira.value:
      return <JiraIcon {...iconProps} />;
    case ToolTypes.open_api.value:
      return <FileCodeIcon {...iconProps} />;
    case ToolTypes.report_portal.value:
      return <ReportPortalIcon {...iconProps} />;
    case ToolTypes.testrail.value:
      return <TestrailIcon {...iconProps} />;
    case ToolTypes.ado_boards.value:
      return <AdoIcon {...iconProps} />;
    case ToolTypes.ado_wiki.value:
      return <AdoIcon {...iconProps} />;
    case ToolTypes.ado_plans.value:
      return <AdoPlansIcon {...iconProps} />;
    case ToolTypes.ado_repos.value:
      return <AdoReposIcon {...iconProps} />;
    case ToolTypes.testio.value:
      return <TestIOIcon {...iconProps} />;
    case ToolTypes.xray_cloud.value:
      return <XrayIcon {...iconProps} />;
    case ToolTypes.qtest.value:
      return <QTestIcon {...iconProps} />;
    case ToolTypes.zephyr_scale.value:
    case 'zephyr_enterprise':
    case 'zephyr_essential':
    case 'zephyr_squad':
    case ToolTypes.zephyr.value:
      return <ZephyrIcon {...iconProps} />;
    case ToolTypes.rally.value:
      return <RallyIcon {...iconProps} />;
    case ToolTypes.sql.value:
      return <SqlIcon {...iconProps} />;
    case ToolTypes.sonar.value:
      return <SonarIcon {...iconProps} />;
    case ToolTypes.google_places.value:
      return <GplacesIcon {...iconProps} />;
    case ToolTypes.sharepoint.value:
      return <SharepointIcon {...iconProps} />;
    case 'salesforce':
      return <SalesForceIcon {...iconProps} />;
    case 'vertex_ai':
      return <VertexAIIcon {...iconProps} />;
    case 'ai_dial':
      return <DialIcon {...iconProps} />;
    case 'ollama':
      return <OllamaIcon {...iconProps} />;
    case 'amazon_bedrock':
      return <AmazonBedrock {...iconProps} />;
    case 'llm_model':
      return <LlmIcon {...iconProps} />;
    case 'embedding_model':
      return <EmbeddingIcon {...iconProps} />;
    case 'open_ai':
      return <OpenAIIcon {...iconProps} />;
    case 'hugging_face':
      return <HuggingFaceIcon {...iconProps} />;
    case 'chroma':
      return <ChromaIcon {...iconProps} />;
    case 'azure_open_ai':
      return <AdoIcon {...iconProps} />;
    case 'pgvector':
      return <PostgreSQLIcon {...iconProps} />;
    case 'service_now':
      return <ServiceNowIcon {...iconProps} />;
    case 'slack':
      return <SlackIcon {...iconProps} />;
    case 'postman':
      return <PostmanIcon {...iconProps} />;
    case 'ado':
      return <AdoGeneralIcon {...iconProps} />;
    case 'pipeline':
      return <FlowIcon {...iconProps} />;
    case 'mcp':
      return <MCPIcon {...iconProps} />;
    case 'figma':
      return <FigmaIcon {...iconProps} />;
    case 'memory':
      return <MemoryIcon {...iconProps} />;
    case 'pptx':
      return <PPTXIcon {...iconProps} />;
    case 's3_storage':
    case 's3_api_credentials':
      return <S3Storage {...iconProps} />;
    case ToolTypes.image_generation_model.value:
      return <ImageIcon {...iconProps} />;
    case 'swarm_child':
      return <ApplicationsIcon {...iconProps} />;
    case 'deepwiki_Deepwiki':
    case 'inventory':
      return <ApplicationToolkitIcon {...iconProps} />;
    default:
      return <BuildIcon {...iconProps} />;
  }
};

export const getToolIconByType = (
  type,
  theme,
  { toolSchema = {}, isMCP = false, internalToolkitName = '', isAppAll = false } = {},
) => {
  const iconProps = {
    // htmlColor: theme.palette.icon.fill.default,
    color: 'secondary',
    fill: theme.palette.icon.fill.default,
    width: '16px',
    height: '16px',
    fontSize: '16px',
  };

  if (type === 'internal' || type === 'sandbox') {
    return getInternalToolIcon(internalToolkitName, iconProps);
  }

  const realType = isMCP ? 'mcp' : type;
  const predefinedIcon = getPredefinedIcon(realType, iconProps);

  if (predefinedIcon.type !== BuildIcon) {
    return predefinedIcon;
  }

  if (toolSchema?.metadata?.icon_url) {
    return (
      <EliteASvgIcon
        isToolIcon
        iconUrl={toolSchema.metadata.icon_url}
        fallbackIcon={predefinedIcon}
        {...iconProps}
      />
    );
  }

  if (isAppAll) {
    return <ApplicationToolkitIcon {...iconProps} />;
  }

  return predefinedIcon;
};

export const getToolIcon = toolType => {
  switch (toolType) {
    case ToolTypes.datasource.value:
      return DatabaseIcon;
    case ToolTypes.open_api.value:
      return FileCodeIcon;
    case ToolTypes.browser.value:
      return BrowserIcon;
    case ToolTypes.confluence.value:
      return ConfluenceIcon;
    case ToolTypes.github.value:
      return GitHubIcon;
    case ToolTypes.gitlab.value:
      return GitLabIcon;
    case ToolTypes.gitlab_org.value:
      return GitlabWorkspaceIcon;
    case ToolTypes.bitbucket.value:
      return BitbucketIcon;
    case ToolTypes.jira.value:
      return JiraIcon;
    case ToolTypes.yagmail.value:
      return EmailIcon;
    case ToolTypes.report_portal.value:
      return ReportPortalIcon;
    case ToolTypes.application.value:
      return ApplicationsIcon;
    case ToolTypes.testrail.value:
      return TestrailIcon;
    case ToolTypes.ado_boards.value:
    case ToolTypes.ado_wiki.value:
      return AdoIcon;
    case ToolTypes.ado_plans.value:
      return AdoPlansIcon;
    case ToolTypes.ado_repos.value:
      return AdoReposIcon;
    case ToolTypes.custom.value:
      return JsonIcon;
    case ToolTypes.artifact.value:
      return ArtifactsIcon;
    case ToolTypes.testio.value:
      return TestIOIcon;
    case ToolTypes.xray_cloud.value:
      return XrayIcon;
    case ToolTypes.zephyr.value:
    case ToolTypes.zephyr_scale.value:
    case 'zephyr_enterprise':
    case 'zephyr_essential':
    case 'zephyr_squad':
      return ZephyrIcon;
    case ToolTypes.qtest.value:
      return QTestIcon;
    case ToolTypes.rally.value:
      return RallyIcon;
    case ToolTypes.sql.value:
      return SqlIcon;
    case ToolTypes.sonar.value:
      return SonarIcon;
    case ToolTypes.google_places.value:
      return GplacesIcon;
    case ToolTypes.sharepoint.value:
      return SharepointIcon;
    case 'salesforce':
      return SalesForceIcon;
    case 'vertex_ai':
      return VertexAIIcon;
    case 'ai_dial':
      return DialIcon;
    case 'ollama':
      return OllamaIcon;
    case 'amazon_bedrock':
      return AmazonBedrock;
    case 'llm_model':
      return LlmIcon;
    case 'embedding_model':
      return EmbeddingIcon;
    case 'open_ai':
      return OpenAIIcon;
    case 'hugging_face':
      return HuggingFaceIcon;
    case 'chroma':
      return ChromaIcon;
    case 'azure_open_ai':
      return AdoIcon;
    case 'pgvector':
      return PostgreSQLIcon;
    case 'service_now':
      return ServiceNowIcon;
    case 'slack':
      return SlackIcon;
    case 'postman':
      return PostmanIcon;
    case 'ado':
      return AdoGeneralIcon;
    case 'mcp':
      return MCPIcon;
    case 'figma':
      return FigmaIcon;
    case 'memory':
      return MemoryIcon;
    case 'pptx':
      return PPTXIcon;
    case 'agent':
      return ApplicationsIcon;
    case 'pipeline':
      return FlowIcon;
    default:
      return BuildIcon;
  }
};

export const checkNotUseConfig = configuration_title =>
  !configuration_title ||
  configuration_title === Manual_Title ||
  configuration_title === Create_Personal_Title ||
  configuration_title === Create_Project_Title;

export const getAvailableTools = (selectedToolsSchema, defaultMapping = []) => {
  const argsSchemasKeys = Object.keys(selectedToolsSchema?.args_schemas || {});
  if (argsSchemasKeys.length) {
    return argsSchemasKeys.map(k => {
      return {
        label: defaultMapping.find(i => i.value === k)?.label || capitalizeFirstChar(k.replaceAll('_', ' ')),
        value: k,
      };
    });
  }
  if (selectedToolsSchema?.items?.enum) {
    return selectedToolsSchema?.items?.enum.map(i => ({
      label:
        defaultMapping.find(item => item.value === i)?.label || capitalizeFirstChar(i.replaceAll('_', ' ')),
      value: i,
    }));
  }
  return defaultMapping;
};

export const getDefaultTools = selectedToolsSchema => {
  const argsSchemasKeys = Object.keys(selectedToolsSchema?.args_schemas || {});
  if (argsSchemasKeys.length) return argsSchemasKeys;
  return [...(selectedToolsSchema?.items?.enum || [])];
};
