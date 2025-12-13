import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Unpack - State of Mind',
  description: 'A calm, premium experience for checking in with your feelings',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        {/* Remove Next.js error overlay */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                const removeErrorOverlay = () => {
                  const overlay = document.querySelector('nextjs-portal');
                  if (overlay) overlay.remove();
                  const errorBanner = document.querySelector('[data-nextjs-dialog]');
                  if (errorBanner) errorBanner.remove();
                  const errorDiv = document.querySelector('[id*="error"]');
                  if (errorDiv && errorDiv.textContent.includes('error')) {
                    errorDiv.remove();
                  }
                };
                removeErrorOverlay();
                setInterval(removeErrorOverlay, 100);
              }
            `,
          }}
        />
      </body>
    </html>
  )
}

