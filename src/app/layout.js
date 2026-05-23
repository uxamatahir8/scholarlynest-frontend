import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import TransitionWrapper from '../components/TransitionWrapper';
import MainLayoutWrapper from '../components/MainLayoutWrapper';
import './globals.css';

export const metadata = {
  title: 'ScholarlyNest - Premium Blog & CMS Platform',
  description: 'Advancing technological and scientific dissemination through robust technical posts, open content, and custom editorial reviews.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <script src="https://accounts.google.com/gsi/client" async defer></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const saved = localStorage.getItem('theme-selection') || 'light';
                  const root = document.documentElement;
                  if (saved === 'dark' || (saved === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    root.classList.add('dark');
                    root.classList.remove('light');
                  } else {
                    root.classList.add('light');
                    root.classList.remove('dark');
                  }
                } catch (e) {}
              })()
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-305">
        <AuthProvider>
          <ToastProvider>
            <MainLayoutWrapper>
              <TransitionWrapper>
                {children}
              </TransitionWrapper>
            </MainLayoutWrapper>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
