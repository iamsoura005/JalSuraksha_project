import type { Metadata } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import Navigation from "@/components/Navigation";
import { I18nProvider } from "@/components/I18nProvider";
import PlasmaBackground from "@/components/PlasmaBackground";

export const metadata: Metadata = {
  title: "JalSuraksha",
  description: "smart water testing ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-transparent">
        <PlasmaBackground 
          color="#ff6b35"
          speed={0.6}
          direction="forward"
          scale={1.1}
          opacity={0.8}
          mouseInteractive={true}
        />
        <div className="relative z-10">
          <I18nProvider>
            <Navigation />
            <main>
              {children}
            </main>
          </I18nProvider>
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Delay service worker registration to ensure page renders first
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
                        console.error('Service Worker registration failed:', error);
                        // Continue without service worker
                      });
                  }, 1000);
                }
              });
            `,
          }}
        />
      </body>
    </html>
  );
}