import { ToolkitForm } from '@/[fsd]/features/toolkits/ui';
import ToolConfluence from '@/[fsd]/features/toolkits/ui/form/ToolBase/ToolConfluence';
import ToolJira from '@/[fsd]/features/toolkits/ui/form/ToolBase/ToolJira';
import ToolDatasource from '@/pages/Applications/Components/Tools/ToolComponents/ToolDatasource';
import { ToolTypes } from '@/pages/Applications/Components/Tools/consts';

export const getToolComponent = (type, toolSchema = undefined) => {
  switch (type) {
    case ToolTypes.datasource.value:
      return ToolDatasource;
    case ToolTypes.jira.value:
      return ToolJira;
    case ToolTypes.confluence.value:
      return ToolConfluence;
    case undefined:
      return;
    default:
      return toolSchema && toolSchema.type ? ToolkitForm.ToolBase : ToolkitForm.ToolCustom;
  }
};
