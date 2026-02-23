// Utilities interface for build-time and framework-specific utilities
export interface StackwrightUtilities {
  StaticGeneration: {
    getStaticProps: (...args: any[]) => any;
    getStaticPaths: (...args: any[]) => any;
  };
  // Future utilities can be added here:
  // Routing: { ... };
  // BuildUtils: { ... };
}