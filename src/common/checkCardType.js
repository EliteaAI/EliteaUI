import { ContentType } from '@/common/constants';

export const isApplicationCard = type =>
  type === ContentType.MyLibraryApplications ||
  type === ContentType.ApplicationTop ||
  type === ContentType.ApplicationLatest ||
  type === ContentType.ApplicationMyLiked ||
  type === ContentType.ApplicationTrending ||
  type === ContentType.UserPublicApplications ||
  type === ContentType.ModerationSpaceApplication ||
  type === ContentType.ApplicationAdmin ||
  type === ContentType.ApplicationAll ||
  type === ContentType.ApplicationApproval ||
  type === ContentType.ApplicationDraft ||
  type === ContentType.ApplicationModeration ||
  type === ContentType.ApplicationPublished ||
  type === ContentType.ApplicationRejected;

export const isPipelineCard = type =>
  type === ContentType.PipelineTop ||
  type === ContentType.PipelineLatest ||
  type === ContentType.PipelineMyLiked ||
  type === ContentType.PipelineTrending ||
  type === ContentType.UserPublicPipelines ||
  type === ContentType.ModerationSpaceApplication ||
  type === ContentType.PipelineAdmin ||
  type === ContentType.PipelineAll ||
  type === ContentType.PipelineApproval ||
  type === ContentType.PipelineDraft ||
  type === ContentType.PipelineModeration ||
  type === ContentType.PipelinePublished ||
  type === ContentType.PipelineRejected;

export const isToolkitCard = type =>
  type === ContentType.ToolkitAdmin || type === ContentType.ToolkitAll || type === ContentType.AppAll;

export const isMCPCard = type => type === ContentType.MCPAdmin || type === ContentType.MCPAll;

export const isCredentialCard = type => type === ContentType.CredentialAll;

export const isAppAllCard = type => type === ContentType.AppAll;
