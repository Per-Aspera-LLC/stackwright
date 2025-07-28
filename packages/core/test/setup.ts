import { beforeAll } from 'vitest';
import { stackwrightRegistry } from '../src/utils/stackwrightComponentRegistry';
import { DefaultStackwrightImage } from '../src/components/stackwright/DefaultStackwrightComponents';
import '@testing-library/jest-dom/vitest';

beforeAll(() => {
  // Register test components using existing defaults
  stackwrightRegistry.register({
        Image: DefaultStackwrightImage
    });
});
