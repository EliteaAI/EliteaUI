import { memo } from 'react';

import IWModalFormikWrapper from '@/[fsd]/entities/import-wizard/ui/import-wizard-modal/IWModalFormikWrapper';
import ImportWizardModal from '@/[fsd]/entities/import-wizard/ui/import-wizard-modal/ImportWizardModal';

const ImportWizardModalContainer = memo(props => (
  <IWModalFormikWrapper {...props}>
    <ImportWizardModal {...props} />
  </IWModalFormikWrapper>
));

ImportWizardModalContainer.displayName = 'ImportWizardModalContainer';

export default ImportWizardModalContainer;
