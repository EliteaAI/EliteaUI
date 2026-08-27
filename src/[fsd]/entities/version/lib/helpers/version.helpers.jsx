import VersionIconBlock from '@/[fsd]/entities/version/ui/VersionIconBlock';

export const formatVersionMeta = version => {
  if (!version) return null;
  const parts = [];
  if (version.created_at) {
    const d = new Date(version.created_at);
    const month = d.toLocaleString('en-US', { month: 'short' });
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    parts.push(`${month} ${day}, ${year}, ${hours}:${minutes}`);
  }
  const authorName = version.author_name ?? version.author_email ?? 'Author unavailable';
  parts.push(`by ${authorName}`);
  return parts.length ? parts.join(' · ') : null;
};

export const buildVersionOption =
  ({ enableVersionListAvatar, defaultVersionID, handleSetDefaultVersion }) =>
  ({ name, id, created_at, author = {}, author_name, author_email, status }) => {
    const avatar = author.avatar;
    const meta = formatVersionMeta({ created_at, author_name, author_email });

    return {
      label: name,
      value: id,
      date: meta,
      versionMeta: meta,
      versionAvatar: enableVersionListAvatar ? avatar : undefined,
      icon: (
        <VersionIconBlock
          status={status}
          id={id}
          name={name}
          defaultVersionID={defaultVersionID}
          handleSetDefaultVersion={handleSetDefaultVersion}
        />
      ),
      searchText: `${name} ${author_name ?? ''} ${author_email ?? ''}`.toLowerCase(),
      testId: `version-option-${name}`,
    };
  };
