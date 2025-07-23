/**
 * Simple test to verify theme integration works
 * This would be run in a React environment with both themes
 */

import React from 'react';
import { DynamicPage } from '@stackwright/core';

// Test with corporate theme
const corporateTest = {
  siteConfig: {
    title: "Corporate Theme Test",
    themeName: "corporate",
    navigation: [
      { label: "Home", href: "/" }
    ],
    footer: {
      copyright: "© 2024 Corporate Test"
    }
  },
  pageContent: {
    content: {
      app_bar: {
        title: "Corporate Theme Test",
        menuItems: [{ label: "Home", href: "/" }]
      },
      footer: {
        label: "Footer",
        color: "",
        background: "",
        copyright: "© 2024 Corporate Test",
        buttons: []
      },
      content_items: [
        {
          main: {
            label: "Main Content",
            color: "",
            background: "",
            heading: {
              text: "Corporate Theme Applied",
              size: "h1"
            },
            textBlocks: [
              {
                text: "This should use corporate theme colors (amber/yellow primary)",
                size: "body1"
              }
            ]
          }
        }
      ]
    }
  }
};

// Test with soft theme
const softTest = {
  siteConfig: {
    title: "Soft Theme Test",
    themeName: "soft",
    navigation: [
      { label: "Home", href: "/" }
    ],
    footer: {
      copyright: "© 2024 Soft Test"
    }
  },
  pageContent: {
    content: {
      app_bar: {
        title: "Soft Theme Test",
        menuItems: [{ label: "Home", href: "/" }]
      },
      footer: {
        label: "Footer",
        color: "",
        background: "",
        copyright: "© 2024 Soft Test",
        buttons: []
      },
      content_items: [
        {
          main: {
            label: "Main Content",
            color: "",
            background: "",
            heading: {
              text: "Soft Theme Applied",
              size: "h1"
            },
            textBlocks: [
              {
                text: "This should use soft theme colors (pink primary)",
                size: "body1"
              }
            ]
          }
        }
      ]
    }
  }
};

// Test components
export const CorporateThemeTest = () => (
  <DynamicPage {...corporateTest} />
);

export const SoftThemeTest = () => (
  <DynamicPage {...softTest} />
);

console.log('Theme integration test components exported successfully');
