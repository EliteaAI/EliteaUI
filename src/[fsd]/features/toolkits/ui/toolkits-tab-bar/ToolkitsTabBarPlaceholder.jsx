import { memo } from 'react';

import { useFormikContext } from 'formik';

import { Button } from '@/[fsd]/shared/ui';
import SaveApplicationButton from '@/pages/Applications/Components/Applications/SaveApplicationButton';
import useDiscardApplicationChanges from '@/pages/Applications/useDiscardApplicationChanges';
import { TabBarItems } from '@/pages/Common';

const ToolkitsTabBarPlaceholder = memo(props => {
  const { onDiscard } = props;

  const { discardApplicationChanges } = useDiscardApplicationChanges(onDiscard);
  const { dirty: isFormDirty } = useFormikContext();

  return (
    <>
      <TabBarItems>
        <SaveApplicationButton />
        <Button.DiscardButton
          disabled={!isFormDirty}
          onDiscard={discardApplicationChanges}
        />
      </TabBarItems>
    </>
  );
});

ToolkitsTabBarPlaceholder.displayName = 'ToolkitsTabBarPlaceholder';

export default ToolkitsTabBarPlaceholder;
