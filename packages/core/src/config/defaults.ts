export interface StackwrightConfig {
  content: {
    list_icon?: string;
  };
}

export const coreDefaults: StackwrightConfig = {
  content: {
    list_icon: '•',
  },
};

export const mergeConfig = (userConfig?: Partial<StackwrightConfig>): StackwrightConfig => {
  return {
    ...coreDefaults,
    content: {
      ...coreDefaults.content,
      ...userConfig?.content,
    },
  };
};
