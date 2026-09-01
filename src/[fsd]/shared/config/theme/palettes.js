import { buildPalette } from './buildPalette';
import { darkColorScheme } from './colorScheme.dark';
import { lightColorScheme } from './colorScheme.light';
import { darkEffectScheme } from './effectScheme.dark';
import { lightEffectScheme } from './effectScheme.light';
import { darkNodeColors } from './nodeColors.dark';
import { lightNodeColors } from './nodeColors.light';

export const darkPalette = buildPalette(darkColorScheme, darkEffectScheme, darkNodeColors);
export const lightPalette = buildPalette(lightColorScheme, lightEffectScheme, lightNodeColors);
