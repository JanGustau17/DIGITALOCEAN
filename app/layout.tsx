import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Toodles - State of Mind',
  description: 'A calm, premium experience for checking in with your feelings',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <main className="flex-1">
          {children}
        </main>
        
        {/* Global Footer */}
        <footer className="w-full py-6 px-4 border-t border-gray-200/50 bg-white/50 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs sm:text-sm text-gray-500 text-center mb-2">
              Made by <span className="font-semibold text-gray-700">Toodles Team</span>
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs sm:text-sm">
              <a
                href="https://www.linkedin.com/in/mukhammadali-yuldoshev/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-[#F9A32A] transition-colors underline-offset-2 hover:underline"
              >
                Mukhammadali Yuldoshev
              </a>
              <span className="text-gray-400">•</span>
              <a
                href="https://www.linkedin.com/in/naomi-jiahui-wang/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-[#F9A32A] transition-colors underline-offset-2 hover:underline"
              >
                Naomi Wang
              </a>
              <span className="text-gray-400">•</span>
              <a
                href="https://www.linkedin.com/in/abigail-kikirov-a9b1a2230/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-[#F9A32A] transition-colors underline-offset-2 hover:underline"
              >
                Abigail Kikirov
              </a>
              <span className="text-gray-400">•</span>
              <a
                href="https://www.linkedin.com/in/longtengzhang/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-[#F9A32A] transition-colors underline-offset-2 hover:underline"
              >
                Cris Zhang
              </a>
            </div>
          </div>
        </footer>

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
