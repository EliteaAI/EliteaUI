import { ToolkitForm } from '@/[fsd]/features/toolkits/ui';
import ToolConfluence from '@/[fsd]/features/toolkits/ui/form/tool-base/ToolConfluence';
import ToolJira from '@/[fsd]/features/toolkits/ui/form/tool-base/ToolJira';
import { ToolTypes } from '@/pages/Applications/Components/Tools/consts';

export const getToolComponent = (type, toolSchema = undefined, isCredential = false) => {
  switch (type) {
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
