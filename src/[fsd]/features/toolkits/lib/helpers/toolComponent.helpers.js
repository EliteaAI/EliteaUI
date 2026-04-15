import { ToolkitForm } from '@/[fsd]/features/toolkits/ui';
import ToolConfluence from '@/[fsd]/features/toolkits/ui/form/ToolBase/ToolConfluence';
import ToolJira from '@/[fsd]/features/toolkits/ui/form/ToolBase/ToolJira';
import ToolDatasource from '@/pages/Applications/Components/Tools/ToolComponents/ToolDatasource';
import { ToolTypes } from '@/pages/Applications/Components/Tools/consts';

export const getToolComponent = (type, toolSchema = undefined, isCredential = false) => {
  switch (type) {
    case ToolTypes.datasource.value:
      return ToolDatasource;
    case ToolTypes.jira.value:
      if (!isCredential) return ToolJira;
      break;
    case ToolTypes.confluence.value:
      if (!isCredential) return ToolConfluence;
      break;
    case undefined:
      return;
    default:
      break;
  }
  return toolSchema && toolSchema.type ? ToolkitForm.ToolBase : ToolkitForm.ToolCustom;
};
