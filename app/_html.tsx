import { ScrollViewStyleReset } from 'expo-router/html';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />

        {/* SEO */}
        <title>SchoolKit - Student Support Platform</title>
        <meta
          name="description"
          content="A comprehensive support platform for students dealing with health challenges"
        />

        {/* PWA */}
        <meta name="theme-color" content="#6B5AD6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />

        {/* Reset styles */}
        <ScrollViewStyleReset />

        {/* Global Web Styles */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
              }

              html, body, #root {
                height: 100%;
              }

              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
                  'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans',
                  'Helvetica Neue', sans-serif;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                background-color: #FAF8FC;
                overflow-x: hidden;
              }

              #root {
                display: flex;
                flex-direction: column;
              }

              /* Disable text selection on buttons for better UX */
              button {
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                user-select: none;
              }

              /* Custom scrollbar for webkit browsers */
              ::-webkit-scrollbar {
                width: 8px;
                height: 8px;
              }

              ::-webkit-scrollbar-track {
                background: #F4F1F9;
              }

              ::-webkit-scrollbar-thumb {
                background: #C9C1E4;
                border-radius: 4px;
              }

              ::-webkit-scrollbar-thumb:hover {
                background: #6B5AD6;
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
