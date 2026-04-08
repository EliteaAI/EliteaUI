import { useFormikContext } from 'formik';

import Tooltip from '@/ComponentsLib/Tooltip';
import { deduplicateVersionByAuthor } from '@/common/utils';
import { VersionAuthorAvatar } from '@/components/VersionAuthorAvatar';
import { useNavigateToAuthorPublicPage } from '@/hooks/useCardNavigate';

/**
 * Common AuthorsButton component used by both Prompts and Applications
 * @param {Object} props
 * @param {string} props.entityType - 'prompts' or 'applications'
 * @param {Array} props.versions - Optional: direct versions array
 */
export default function AuthorsButton({ versions: directVersions }) {
  const { navigateToAuthorPublicPage } = useNavigateToAuthorPublicPage();

  // For Applications - get version details from Formik context
  const formikContext = useFormikContext();
  const applicationVersions = formikContext?.values?.version_details
    ? [formikContext.values.version_details]
    : [];

  // Determine which versions to use
  let versionsToUse = directVersions;
  if (!versionsToUse) {
    versionsToUse = applicationVersions;
  }

  return (
    <>
      {deduplicateVersionByAuthor(versionsToUse).map((versionInfo = '') => {
        const [author, avatar, id] = versionInfo.split('|');
        return (
          <Tooltip
            key={versionInfo}
            title={author}
            placement="top"
          >
            <div style={{ cursor: 'pointer' }}>
              <VersionAuthorAvatar
                onClick={navigateToAuthorPublicPage(id, author)}
                name={author}
                avatar={avatar}
                size={28}
              />
            </div>
          </Tooltip>
        );
      })}
    </>
  );
}
