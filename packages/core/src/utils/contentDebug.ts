import { PageContent } from '@stackwright/types';

export const debugContent = (content: PageContent): string => {
  return JSON.stringify(
    content,
    (key, value) => {
      if (typeof value !== 'object' || Array.isArray(value)) {
        return value;
      }
      return { ...value };
    },
    2
  );
};
