import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AuthProvider } from "@/lib/auth-context";
import { LanguageProvider } from "@/lib/i18n/language-context";
import { SiteMetaProvider } from "@/lib/site-context";
import { ThemeProvider } from "@/lib/theme-context";
import { DevtoolsBlocker } from "@/components/devtools-blocker";
import { getSetting } from "@/lib/db";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const title = getSetting("meta_site_title") || "Family Website";
    const description = getSetting("meta_site_description") || "";
    const ogImage = getSetting("meta_og_image") || "";
    return {
      title: { default: title, template: `%s | ${title}` },
      description,
      openGraph: ogImage ? { images: [ogImage] } : undefined,
    };
  } catch {
    return { title: "Family Website", description: "" };
  }
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <SiteMetaProvider>
                <DevtoolsBlocker />
                <Navbar />
                <main className="flex-1">{children}</main>
                <Footer />
              </SiteMetaProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
