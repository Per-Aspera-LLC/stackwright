import { GetStaticProps } from 'next';
import { NextStackwrightStaticGeneration } from '@stackwright/nextjs';
import { registerDefaultIcons } from '@stackwright/icons';
   
// Import the same page component used by [...slug].tsx
import SlugPage from './[slug]';

/**
 * getStaticProps for the root index page
 * Creates a mock context to reuse the existing slug-based getStaticProps logic
 */
export const getStaticProps: GetStaticProps = async (context) => {
  console.log('getStaticProps called for root index page');
  
  // Create a mock context that represents the root route
  // This allows us to reuse the existing getStaticProps logic
  const mockContext = {
    ...context,
    params: { slug: [] }, // Empty slug array represents root route
  };

  // Delegate to the existing getStaticProps implementation
  return await NextStackwrightStaticGeneration.getStaticProps(mockContext);
};

// Export the same component used by [...slug].tsx
export default SlugPage;