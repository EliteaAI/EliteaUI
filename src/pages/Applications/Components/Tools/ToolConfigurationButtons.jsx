import { Button } from '@mui/material';

import { StyledCircleProgress } from '@/components/Chat/StyledComponents';
import { Create_Personal_Title, Create_Project_Title, Manual_Title } from '@/hooks/useConfigurations';

export default function ToolConfigurationButtons({
  type,
  configuration,
  isCreatingConfiguration,
  isTestingConnection,
  onCreateConfiguration,
  onTestConnection,
}) {
  return (
    !!type && (
      <>
        {[Create_Personal_Title, Create_Project_Title].includes(configuration?.configuration_title) && (
          <Button
            disabled={isCreatingConfiguration}
            variant="elitea"
            color="primary"
            onClick={onCreateConfiguration}
          >
            Save configuration
            {isCreatingConfiguration && <StyledCircleProgress size={20} />}
          </Button>
        )}
        {[Create_Personal_Title, Create_Project_Title, Manual_Title].includes(
          configuration?.configuration_title,
        ) && (
          <Button
            disabled={isTestingConnection}
            variant="elitea"
            color="secondary"
            onClick={onTestConnection}
          >
            Test
            {isTestingConnection && <StyledCircleProgress size={20} />}
          </Button>
        )}
      </>
    )
  );
}
