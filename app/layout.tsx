
import { EnvVarWarning } from "@/components/env-var-warning";
import HeaderAuth from "@/components/header-auth";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import "./globals.css";
import { Input } from "@/components/ui/input";
import { Search, Waves } from "lucide-react";

export const metadata = {
  title: "Find Your Wave",
  description: "Find the perfect surfing spot with your preferred wave style",
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="min-h-screen flex flex-col items-center">
            <div className="w-full flex flex-col items-center">
              <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
                <div className="w-full max-w-7xl flex justify-between items-center px-4">
                  <div className="flex items-center gap-4">
                    <Link href={"/"} className="flex items-center gap-2">
                      <div className="hidden sm:block text-lg font-bold whitespace-nowrap">
                        Find Your Wave
                      </div>
                      <div className="sm:hidden">
                        <Waves className="h-6 w-6 text-primary" />
                      </div>
                    </Link>
                    
                  </div>

                  <div className="relative w-30  sm:block">
                    <Input
                      placeholder="Search for waves"
                      className="pl-10 pr-4 py-2 w-full rounded-full border-border"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {!hasEnvVars ? <EnvVarWarning /> : <HeaderAuth />}
                  </div>
                </div>
              </nav>
              <div className="w-full">
                {children}
              </div>

              <footer className="w-full border-t">
                <div className="max-w-5xl mx-auto flex items-center justify-center gap-4 py-4 text-xs">
                  <p>
                    Powered by{" "}
                    <a
                      href="https://odd-lute-2f5.notion.site/Hongmin-Yoon-1976b24eb2ee80758500d5577e798434?pvs=74"
                      target="_blank"
                      className="font-bold hover:underline"
                      rel="noreferrer"
                    >
                      Cielo
                    </a>
                  </p>
                  <ThemeSwitcher />
                </div>
              </footer>
            </div>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
