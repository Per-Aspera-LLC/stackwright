import { registerStackwrightIcons } from '../registry/iconRegistry';
import { BlueSkyIcon } from '../icons/social/BlueSkyIcon';
import { StackwrightIcon } from '../icons/brand/StackwrightIcon';
import { lucideAllIconsPreset } from './lucideAllIcons';

export const defaultStackwrightIcons: Record<string, React.ComponentType<any>> = {
  bluesky: BlueSkyIcon,
  stackwright: StackwrightIcon,
  ...lucideAllIconsPreset,
};

export function registerDefaultIcons() {
  registerStackwrightIcons(defaultStackwrightIcons);
}
