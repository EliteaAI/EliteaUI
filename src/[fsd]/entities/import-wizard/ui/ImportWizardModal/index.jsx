import { memo } from 'react';

import IWModalFormikWrapper from '@/[fsd]/entities/import-wizard/ui/ImportWizardModal/IWModalFormikWrapper';
import ImportWizardModal from '@/[fsd]/entities/import-wizard/ui/ImportWizardModal/ImportWizardModal';

const ImportWizardModalContainer = memo(props => (
  <IWModalFormikWrapper {...props}>
    <ImportWizardModal {...props} />
  </IWModalFormikWrapper>
));

ImportWizardModalContainer.displayName = 'ImportWizardModalContainer';

export default ImportWizardModalContainer;
