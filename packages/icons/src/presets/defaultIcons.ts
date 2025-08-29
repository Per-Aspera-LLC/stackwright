import { registerStackwrightIcons } from '../registry/iconRegistry';
import { BlueSkyIcon } from '../icons/social/BlueSkyIcon';
import { StackwrightIcon } from '../icons/brand/StackwrightIcon';

export const defaultStackwrightIcons = {
  'bluesky': BlueSkyIcon,
  'stackwright': StackwrightIcon,
};

export function registerDefaultIcons() {
  registerStackwrightIcons(defaultStackwrightIcons);
}