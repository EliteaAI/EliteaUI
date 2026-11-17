// Storybook only. A design prototype that changes product code keeps its files in a folder under src/[fsd]/stories/,
// laid out as src/[fsd] itself: <overlay>/widgets/skill-editor/ui/SkillEditorWorkspace.jsx stands for
// src/[fsd]/widgets/skill-editor/ui/SkillEditorWorkspace.jsx. Storybook loads the overlay's file wherever one exists,
// so the stories show the page as designed while src/ stays as on main. Overlay files import what they do not carry
// by its full path (@/[fsd]/…), which resolves to the team's file. To build it, diff each overlay file against
// the file at the same path in src/[fsd]; files that exist only in the overlay are new.
import { existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src/[fsd]');

export const OVERLAYS = [join(SRC, 'stories/features/skill/skill-page')];

const inside = (dir, file) => file === dir || file.startsWith(`${dir}/`);
const overlayOf = file => OVERLAYS.find(dir => inside(dir, file));
const cleanId = id => id.split('?')[0];

export default function prototypeOverlay() {
  return {
    name: 'prototype-overlay',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (source.startsWith('\0')) return null;
      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
      if (!resolved || resolved.external) return resolved;
      const file = cleanId(resolved.id);
      if (!inside(SRC, file) || overlayOf(file)) return resolved;
      for (const dir of OVERLAYS) {
        const copy = join(dir, relative(SRC, file));
        if (existsSync(copy)) return copy;
      }
      return resolved;
    },
  };
}
