export const contentTypeExamples = {
  main: {
    "main": {
      "label": "hero_section",
      "background": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      "color": "#ffffff",
      "heading": {
        "text": "Welcome to Our Company",
        "size": "h1",
        "color": "#ffffff"
      },
      "textBlocks": [
        {
          "text": "We deliver exceptional results through innovative solutions",
          "size": "h5",
          "color": "#ffffff"
        },
        {
          "text": "Our team combines expertise with creativity to help you achieve your goals",
          "size": "body1",
          "color": "#ffffff"
        }
      ],
      "buttons": [
        {
          "text": "Get Started",
          "href": "/contact",
          "variant": "contained",
          "color": "primary",
          "alignment": "center"
        }
      ],
      "graphic": {
        "image": "/images/hero-graphic.svg",
        "aspect_ratio": 16/9,
        "max_size": 600,
        "min_size": 400
      },
      "graphic_position": "right"
    }
  },
  
  icon_grid: {
    "icon_grid": {
      "label": "features",
      "background": "#f5f5f5",
      "color": "#333333",
      "heading": {
        "text": "Why Choose Us",
        "size": "h2",
        "color": "#333333"
      },
      "iconsPerRow": 3,
      "icons": [
        {
          "iconId": "/images/icons/feature1.svg",
          "text": {
            "text": "Expert Solutions",
            "size": "h6",
            "color": "#333333"
          }
        },
        {
          "iconId": "/images/icons/feature2.svg",
          "text": {
            "text": "Reliable Support",
            "size": "h6",
            "color": "#333333"
          }
        },
        {
          "iconId": "/images/icons/feature3.svg",
          "text": {
            "text": "Proven Results",
            "size": "h6",
            "color": "#333333"
          }
        }
      ]
    }
  },

  carousel: {
    "carousel": {
      "label": "testimonials",
      "background": "#ffffff",
      "color": "#333333",
      "heading": "What Our Clients Say",
      "autoPlay": true,
      "autoPlaySpeed": 3000,
      "infinite": true,
      "items": [
        {
          "title": "Amazing Service",
          "text": "They exceeded our expectations in every way",
          "image": "/images/testimonial1.jpg"
        },
        {
          "title": "Professional Team",
          "text": "Highly skilled and responsive professionals",
          "image": "/images/testimonial2.jpg"
        },
        {
          "title": "Outstanding Results",
          "text": "Delivered exactly what we needed on time and on budget",
          "image": "/images/testimonial3.jpg"
        }
      ]
    }
  },

  graphic: {
    "graphic": {
      "label": "about_graphic",
      "background": "#f8f9fa",
      "color": "#333333",
      "image": "/images/about-us.svg",
      "aspect_ratio": 16/9,
      "min_size": 300,
      "max_size": 600
    }
  },

  tabbed_content: {
    "tabbed_content": {
      "label": "services_tabs",
      "background": "#ffffff",
      "color": "#333333",
      "heading": {
        "text": "Our Services",
        "size": "h2",
        "color": "#333333"
      },
      "tabs": [
        {
          "main": {
            "label": "consulting",
            "background": "transparent",
            "heading": {
              "text": "Strategic Consulting",
              "size": "h3",
              "color": "#333333"
            },
            "textBlocks": [
              {
                "text": "Expert guidance for complex business challenges",
                "size": "body1",
                "color": "#666666"
              }
            ]
          }
        },
        {
          "main": {
            "label": "development",
            "background": "transparent",
            "heading": {
              "text": "Custom Development",
              "size": "h3",
              "color": "#333333"
            },
            "textBlocks": [
              {
                "text": "Tailored solutions built to your specifications",
                "size": "body1",
                "color": "#666666"
              }
            ]
          }
        }
      ]
    }
  }
};

export function getContentTypeExample(type: string) {
  return contentTypeExamples[type as keyof typeof contentTypeExamples];
}

export function getAllContentTypeExamples() {
  return contentTypeExamples;
}

export function getContentTypeNames() {
  return Object.keys(contentTypeExamples);
}

export function formatExamplesForPrompt() {
  return Object.entries(contentTypeExamples)
    .map(([type, example]) => `${type.toUpperCase()} EXAMPLE:\n${JSON.stringify(example, null, 2)}`)
    .join('\n\n');
}