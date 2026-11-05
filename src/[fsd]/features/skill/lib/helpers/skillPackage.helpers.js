import JSZip from 'jszip';

const SKILL_MD_NAME = 'skill.md';
const ARCHIVER_FOLDER = '__MACOSX/';
const ARCHIVER_FILE_NAME = '.DS_Store';

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

export const isSkillZip = fileName => fileName.toLowerCase().endsWith('.zip');

export const readSkillZip = async file => {
  const zip = await JSZip.loadAsync(file);
  const members = Object.values(zip.files).filter(isPackageMember);
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
