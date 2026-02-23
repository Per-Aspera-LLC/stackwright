import { registerStackwrightIcons } from '../registry/iconRegistry';
import { BlueSkyIcon } from '../icons/social/BlueSkyIcon';
import { StackwrightIcon } from '../icons/brand/StackwrightIcon';
import { muiIconPreset } from './muiIcons';

export const defaultStackwrightIcons = {
  'bluesky': BlueSkyIcon,
  'stackwright': StackwrightIcon,
  ...muiIconPreset,
};

export function registerDefaultIcons() {
  registerStackwrightIcons(defaultStackwrightIcons);
}