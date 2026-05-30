import { registerStackwrightIcons } from '../registry/iconRegistry';
import { BlueSkyIcon } from '../icons/social/BlueSkyIcon';
import { StackwrightIcon } from '../icons/brand/StackwrightIcon';
import { lucideIconPreset } from './lucideIcons';

export const defaultStackwrightIcons: Record<string, React.ComponentType<any>> = {
  bluesky: BlueSkyIcon,
  stackwright: StackwrightIcon,
  ...lucideIconPreset,
};

export function registerDefaultIcons() {
  registerStackwrightIcons(defaultStackwrightIcons);
}
