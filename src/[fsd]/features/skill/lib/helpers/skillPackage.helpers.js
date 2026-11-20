import JSZip from 'jszip';

const SKILL_MD_NAME = 'skill.md';
const ARCHIVER_FOLDER = '__MACOSX/';
const ARCHIVER_FILE_NAME = '.DS_Store';
const SKILL_PACKAGE_EXTENSIONS = ['.zip', '.skill'];

const fileNameOf = memberName => memberName.split('/').pop();

const isPackageMember = member =>
  !member.dir && !member.name.startsWith(ARCHIVER_FOLDER) && fileNameOf(member.name) !== ARCHIVER_FILE_NAME;

const findSkillMd = members => {
  const candidates = members.filter(member => fileNameOf(member.name).toLowerCase() === SKILL_MD_NAME);
  const atRoot = candidates.filter(member => !member.name.includes('/'));
  const found = atRoot.length ? atRoot : candidates.filter(member => member.name.split('/').length === 2);

  if (found.length !== 1)
    throw new Error(
      `A skill ZIP must hold exactly one SKILL.md, at the root or inside one top-level folder; found ${found.length}`,
    );

  return found[0];
};

export const isSkillPackage = fileName =>
  SKILL_PACKAGE_EXTENSIONS.some(extension => fileName.toLowerCase().endsWith(extension));

const loadZip = file =>
  JSZip.loadAsync(file).catch(error => {
    if (error.message.startsWith("Can't find end of central directory"))
      throw new Error('the file is not a valid ZIP archive');
    throw error;
  });

const readSkillFolder = async members => {
  const skillMd = findSkillMd(members);
  const root = skillMd.name.slice(0, -SKILL_MD_NAME.length);
  const filePaths = members
    .filter(member => member !== skillMd)
    .map(member => {
      if (!member.name.startsWith(root))
        throw new Error(`'${member.name}' is outside the skill folder '${root.slice(0, -1)}'`);
      return member.name.slice(root.length);
    })
    .sort();

  return { content: await skillMd.async('string'), filePaths };
};

const findPluginRoot = members => {
  const roots = members
    .map(member => member.name)
    .filter(
      name =>
        name === '.claude-plugin/plugin.json' ||
        (name.endsWith('/.claude-plugin/plugin.json') && name.split('/').length === 3),
    )
    .map(name => name.slice(0, -'.claude-plugin/plugin.json'.length))
    .sort();
  if (roots.length > 1) throw new Error('The ZIP holds more than one plugin; import them one at a time');
  return roots.length ? roots[0] : null;
};

const isPluginSkillMd = (name, skillsDir) => {
  const relative = name.slice(skillsDir.length);
  return (
    name.startsWith(skillsDir) &&
    relative.split('/').length === 2 &&
    fileNameOf(relative).toLowerCase() === SKILL_MD_NAME
  );
};

const commandSkillName = (path, commandsDir) => {
  const name = ['claude', 'anthropic']
    .reduce(
      (words, reserved) => words.replaceAll(reserved, '-'),
      path
        .slice(commandsDir.length, -'.md'.length)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-'),
    )
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64)
    .replace(/-$/, '');
  if (!name) throw new Error(`'${path}': the file name leaves no valid skill name`);
  return name;
};

const readPluginSkills = async (members, root) => {
  const skillsDir = `${root}skills/`;
  const commandsDir = `${root}commands/`;
  const skills = await Promise.all(
    members
      .filter(member => isPluginSkillMd(member.name, skillsDir))
      .map(async skillMd => {
        const folder = skillMd.name.slice(0, -SKILL_MD_NAME.length);
        const filePaths = members
          .filter(member => member !== skillMd && member.name.startsWith(folder))
          .map(member => member.name.slice(folder.length))
          .sort();
        return { content: await skillMd.async('string'), filePaths, source: skillMd.name };
      }),
  );
  const commands = await Promise.all(
    members
      .filter(member => member.name.startsWith(commandsDir) && member.name.toLowerCase().endsWith('.md'))
      .map(async command => ({
        content: await command.async('string'),
        filePaths: [],
        source: command.name,
        commandName: commandSkillName(command.name, commandsDir),
      })),
  );
  return [...skills, ...commands];
};

export const readSkillZip = async file => {
  const zip = await loadZip(file);
  const members = Object.values(zip.files).filter(isPackageMember);
  const pluginRoot = findPluginRoot(members);

  const pluginSkills = pluginRoot === null ? [] : await readPluginSkills(members, pluginRoot);

  return pluginSkills.length ? pluginSkills : [await readSkillFolder(members)];
};
