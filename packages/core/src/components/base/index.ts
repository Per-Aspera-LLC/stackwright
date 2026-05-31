// Clean named exports - no "default as" needed

export { TextGrid } from './TextGrid';
export { TextBlockGrid } from './TextBlockGrid';
export { MainContentGrid } from './MainContentGrid';
export { TabbedContentGrid } from './TabbedContentGrid';
// CodeBlock is NOT exported from the main barrel — it is lazy-loaded by the
// component registry (React.lazy) so it stays out of the first-load bundle.
// Import directly from '@stackwright/core/code-block' if you need the component.
export { IconGrid } from './IconGrid';
export { FeatureList } from './FeatureList';
export { TestimonialGrid } from './TestimonialGrid';
// Faq is NOT exported from the main barrel — it is lazy-loaded by the
// component registry (React.lazy) so it stays out of the first-load bundle.
// Import directly from '@stackwright/core/faq' if you need the component.
export { PricingTable } from './PricingTable';
export { ContactFormStub } from './ContactFormStub';
export { Form } from './Form';
export { Alert } from './Alert';
export { LayoutGrid } from './LayoutGrid';
export { CollectionList } from './CollectionList';
// Map is NOT exported from the main barrel — it is lazy-loaded by the
// component registry (React.lazy) so it stays out of the first-load bundle.
// Import directly from '@stackwright/core/map' if you need the component.
export { UnknownContentType } from './UnknownContentType';

export * from './Menu';
