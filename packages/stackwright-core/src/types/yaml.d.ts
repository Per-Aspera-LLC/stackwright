declare module '*.yaml' {
  const content: import('@/types/content').PageContent;
  export = content;
}

declare module '*.yml' {
  const content: import('@/types/content').PageContent;
  export = content;
}
