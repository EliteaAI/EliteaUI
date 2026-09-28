const configurationTitle = configuration => configuration.elitea_title || configuration.data?.title;

export const resolveCredentialLabel = ({ configurations = [], credential, personalProjectId }) => {
  const eliteaTitle = credential?.elitea_title;
  if (!eliteaTitle) return null;

  const sameTitle = configurations.filter(configuration => configurationTitle(configuration) === eliteaTitle);
  const match =
    sameTitle.find(
      configuration => (configuration.project_id === personalProjectId) === Boolean(credential.private),
    ) ?? sameTitle.find(configuration => configuration.shared);

  return match?.label || eliteaTitle;
};
