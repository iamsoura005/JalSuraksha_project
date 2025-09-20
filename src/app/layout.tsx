import type { Metadata } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import Navigation from "@/components/Navigation";
import { I18nProvider } from "@/components/I18nProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import PlasmaBackground from "@/components/PlasmaBackground";
import ErrorBoundary from "@/components/ErrorBoundary";
import SupabaseConnectionTest from "@/components/SupabaseConnectionTest";

export const metadata: Metadata = {
  title: "JalSuraksha - Smart Water Testing",
  description: "Advanced groundwater quality analysis with heavy metal pollution index calculation and ML-powered predictions",
  keywords: "water testing, heavy metals, pollution index, groundwater analysis, environmental monitoring",
  authors: [{ name: "JalSuraksha Team" }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#2563eb" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="antialiased min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <ErrorBoundary>
          <PlasmaBackground 
            color="#ff6b35"
            speed={0.6}
            direction="forward"
            scale={1.1}
            opacity={0.8}
            mouseInteractive={true}
          />
          <div className="relative z-10 min-h-screen">
            <AuthProvider>
              <I18nProvider>
                <Navigation />
                <main className="min-h-screen">
                  {children}
                </main>
                <SupabaseConnectionTest />
              </I18nProvider>
            </AuthProvider>
          </div>
        </ErrorBoundary>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Delay service worker registration to ensure page renders first
              if (typeof window !== 'undefined') {
                window.addEventListener('load', function() {
                  // Check if service workers are supported
                  if ('serviceWorker' in navigator) {
                    // Add a small delay to prioritize rendering
                    setTimeout(() => {
                      navigator.serviceWorker.register('/sw.js')
                        .then(registration => {
                          console.log('Service Worker registered with scope:', registration.scope);
                        })
                        .catch(error => {
                          console.warn('Service Worker registration failed:', error);
                          // Continue without service worker
                        });
                    }, 3000);
                  }
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}