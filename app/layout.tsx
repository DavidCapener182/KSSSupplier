import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

const montserrat = Montserrat({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "KSS NW UK Event Staffing Platform",
  description: "Event staffing management platform for KSS NW UK 2026 Festival Season",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Always start with light mode, then apply user preference after React loads
                document.documentElement.classList.remove('dark');
              })();
            `,
          }}
        />
      </head>
      <body className={montserrat.className}>
        <TooltipProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}

