import React from 'react';
import { Html, Head, Main, NextScript } from 'next/document';

//@TODO code-puppy, can we add fonts through the prebuild step instead of every app having to do this?

export default function Document() {
  return (
    <Html lang="en">
      <Head>


        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
