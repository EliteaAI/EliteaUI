import JSZip from 'jszip';

const SKILL_MD_NAME = 'skill.md';
const ARCHIVER_FOLDER = '__MACOSX/';
const ARCHIVER_FILE_NAME = '.DS_Store';
const SKILL_PACKAGE_EXTENSIONS = ['.zip', '.skill'];
const KB = 1024;
const MB = KB * KB;

const fileNameOf = memberName => memberName.split('/').pop();

const isPackageMember = member =>
  !member.dir && !member.name.startsWith(ARCHIVER_FOLDER) && fileNameOf(member.name) !== ARCHIVER_FILE_NAME;

const declaredSizeOf = member => member._data?.uncompressedSize ?? 0;

const toFixedHalfEven = (value, digits) => {
  const scaled = value * 10 ** digits;
  const lower = Math.floor(scaled);
  if (scaled - lower !== 0.5) return value.toFixed(digits);
  return ((lower % 2 === 0 ? lower : lower + 1) / 10 ** digits).toFixed(digits);
};

const describeSize = size =>
  size >= MB ? `${toFixedHalfEven(size / MB, 1)} MB` : `${toFixedHalfEven(size / KB, 0)} KB`;

const hasPackageLimits = limits =>
  [limits?.max_file_bytes, limits?.max_package_bytes, limits?.max_package_files].every(Number.isInteger);

const refuseFileOverCap = (label, size, limits) => {
  if (size > limits.max_file_bytes)
    throw new Error(
      `${label} is ${describeSize(size)}; a skill file can be at most ${describeSize(limits.max_file_bytes)}`,
    );
};

const refuseVersionOverCaps = (files, root, limits) => {
  const seenPaths = new Set();
  let total = 0;
  files.forEach((member, index) => {
    const path = member.name.slice(root.length);
    const size = declaredSizeOf(member);
    if (seenPaths.has(path.toLowerCase())) throw new Error(`'${path}' is listed more than once`);
    seenPaths.add(path.toLowerCase());
    refuseFileOverCap(`'${path}'`, size, limits);
    if (index + 1 > limits.max_package_files)
      throw new Error(`a skill version can hold at most ${limits.max_package_files} files`);
    total += size;
    if (total > limits.max_package_bytes)
      throw new Error(
        `the version's files would be ${describeSize(total)}; ` +
          `a skill version can hold at most ${describeSize(limits.max_package_bytes)}`,
      );
  });
};

const refuseSkillOverCaps = (skillMd, files, label, limits) => {
  if (!hasPackageLimits(limits)) return;
  refuseVersionOverCaps(files, skillMd.name.slice(0, -SKILL_MD_NAME.length), limits);
  refuseFileOverCap(label, declaredSizeOf(skillMd), limits);
};

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

const readSkillFolder = async (members, limits) => {
  const skillMd = findSkillMd(members);
  const root = skillMd.name.slice(0, -SKILL_MD_NAME.length);
  const files = members.filter(member => member !== skillMd);
  const outside = files.find(member => !member.name.startsWith(root));
  if (outside) throw new Error(`'${outside.name}' is outside the skill folder '${root.slice(0, -1)}'`);
  refuseSkillOverCaps(skillMd, files, 'SKILL.md', limits);

  return {
    content: await skillMd.async('string'),
    filePaths: files.map(member => member.name.slice(root.length)).sort(),
  };
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

const isPluginCommand = (name, commandsDir) =>
  name.startsWith(commandsDir) && name.toLowerCase().endsWith('.md');

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

const refusePluginOverCaps = (pluginMembers, limits) => {
  if (!hasPackageLimits(limits)) return;
  const total = pluginMembers.reduce((sum, member) => sum + declaredSizeOf(member), 0);
  if (total > limits.max_package_bytes)
    throw new Error(
      `the plugin's skills and commands are ${describeSize(total)}; ` +
        `a plugin can hold at most ${describeSize(limits.max_package_bytes)}`,
    );
  if (pluginMembers.length > limits.max_package_files)
    throw new Error(`a plugin can hold at most ${limits.max_package_files} skill and command files`);
};

const readPluginSkills = async (members, root, limits) => {
  const skillsDir = `${root}skills/`;
  const commandsDir = `${root}commands/`;
  const pluginMembers = members.filter(
    member => member.name.startsWith(skillsDir) || isPluginCommand(member.name, commandsDir),
  );
  refusePluginOverCaps(pluginMembers, limits);

  const skills = pluginMembers
    .filter(member => isPluginSkillMd(member.name, skillsDir))
    .map(skillMd => {
      const folder = skillMd.name.slice(0, -SKILL_MD_NAME.length);
      const files = pluginMembers.filter(member => member !== skillMd && member.name.startsWith(folder));
      refuseSkillOverCaps(skillMd, files, `'${skillMd.name}'`, limits);
      return { skillMd, filePaths: files.map(member => member.name.slice(folder.length)).sort() };
    });
  const commands = pluginMembers.filter(member => isPluginCommand(member.name, commandsDir));
  if (hasPackageLimits(limits))
    commands.forEach(command => refuseFileOverCap(`'${command.name}'`, declaredSizeOf(command), limits));

  return Promise.all([
    ...skills.map(async ({ skillMd, filePaths }) => ({
      content: await skillMd.async('string'),
      filePaths,
      source: skillMd.name,
    })),
    ...commands.map(async command => ({
      content: await command.async('string'),
      filePaths: [],
      source: command.name,
      commandName: commandSkillName(command.name, commandsDir),
    })),
  ]);
};

export const readSkillZip = async (file, limits) => {
  const zip = await loadZip(file);
  const members = Object.values(zip.files).filter(isPackageMember);
  const pluginRoot = findPluginRoot(members);

  const pluginSkills = pluginRoot === null ? [] : await readPluginSkills(members, pluginRoot, limits);

  return pluginSkills.length ? pluginSkills : [await readSkillFolder(members, limits)];
};
