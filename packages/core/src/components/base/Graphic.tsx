import Grid from '@mui/material/Grid';
import { GraphicContent } from '@stackwright/types';
import { getStackwrightImage } from '../../utils/stackwrightComponentRegistry';

// Debug logging utility
const debugLogGraphic = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development' && process.env.STACKWRIGHT_DEBUG === 'true') {
    console.log(`🖼️ Graphic Debug: ${message}`, data ? data : '');
  }
};

// Utility to extract the actual component from potential ES module wrapper
const extractComponent = (componentOrModule: any) => {
  debugLogGraphic('Extracting component from:', {
    type: typeof componentOrModule,
    isObject: typeof componentOrModule === 'object',
    hasDefault: typeof componentOrModule === 'object' && componentOrModule !== null && 'default' in componentOrModule
  });
  
  // If it's an ES module object with default export, extract the default
  if (typeof componentOrModule === 'object' && componentOrModule !== null && 'default' in componentOrModule) {
    debugLogGraphic('Extracting default export');
    return componentOrModule.default;
  }
  
  // Otherwise return as-is (should be a direct component)
  debugLogGraphic('Using component directly');
  return componentOrModule;
};

export function Graphic(content: GraphicContent) {
  debugLogGraphic('Graphic component called with content:', content);
  
  const StackwrightImage = getStackwrightImage();
  
  debugLogGraphic('Retrieved StackwrightImage:', {
    type: typeof StackwrightImage,
    name: StackwrightImage?.name,
    constructor: StackwrightImage?.constructor?.name,
    isFunction: typeof StackwrightImage === 'function',
    isObject: typeof StackwrightImage === 'object',
    isNull: StackwrightImage === null,
    isUndefined: StackwrightImage === undefined,
    keys: typeof StackwrightImage === 'object' && StackwrightImage !== null ? Object.keys(StackwrightImage) : 'N/A',
    hasDefault: typeof StackwrightImage === 'object' && StackwrightImage !== null && 'default' in StackwrightImage
  });
  
  // Type-safe check for ES module default export
  if (typeof StackwrightImage === 'object' && StackwrightImage !== null && 'default' in StackwrightImage) {
    const moduleWithDefault = StackwrightImage as any; // Type assertion for ES module check
    debugLogGraphic('StackwrightImage has default export:', {
      defaultType: typeof moduleWithDefault.default,
      defaultName: moduleWithDefault.default?.name,
      defaultConstructor: moduleWithDefault.default?.constructor?.name
    });
  }

  const style = {
    width: '100%',
    height: '100%',
  };

  // Transform GraphicContent to StackwrightImageProps
  const imageProps = {
    src: content.image,
    alt: content.alt || content.label || '',
    fill: true,
    sizes: "(max-width: 768px) 100vw, 50vw",
    style: style,
    placeholder: 'blur' as const,
    blurDataURL: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    priority: true
  };

  return (
    <Grid container
      sx={{
        justifyContent: 'center',
        position: 'relative',
        aspectRatio: content.aspect_ratio || '1/1',
        height: 'auto',
        maxWidth: content?.max_size,
        mx: 'auto'
      }}
    >
      <StackwrightImage {...imageProps} />
    </Grid>
  );
}