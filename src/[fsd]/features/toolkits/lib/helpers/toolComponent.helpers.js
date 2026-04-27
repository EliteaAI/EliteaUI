import { ToolkitForm } from '@/[fsd]/features/toolkits/ui';
import ToolDatasource from '@/pages/Applications/Components/Tools/ToolComponents/ToolDatasource';
import { ToolTypes } from '@/pages/Applications/Components/Tools/consts';

export const getToolComponent = (type, toolSchema = undefined) => {
  switch (type) {
    case ToolTypes.datasource.value:
      return ToolDatasource;
    case undefined:
      return;
    default:
      return toolSchema && toolSchema.type ? ToolkitForm.ToolBase : ToolkitForm.ToolCustom;
  }
};
