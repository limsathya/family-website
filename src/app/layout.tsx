import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FamilyChat } from "@/components/family-chat";
import { AuthProvider } from "@/lib/auth-context";
import { LanguageProvider } from "@/lib/i18n/language-context";
import { SiteMetaProvider } from "@/lib/site-context";
import { ThemeProvider } from "@/lib/theme-context";
import { ToastProvider } from "@/lib/toast";
import { DevtoolsBlocker } from "@/components/devtools-blocker";
import { getSetting } from "@/lib/db";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const defaultTitle = process.env.NEXT_PUBLIC_APP_NAME || "Family Website";
    const title = await getSetting("meta_site_title") || defaultTitle;
    const description = await getSetting("meta_site_description") || "";
    const ogImage = await getSetting("meta_og_image") || "";
    return {
      title: { default: title, template: `%s | ${title}` },
      description,
      openGraph: ogImage ? { images: [ogImage] } : undefined,
    };
  } catch {
    const defaultTitle = process.env.NEXT_PUBLIC_APP_NAME || "Family Website";
    return { title: defaultTitle, description: "" };
  }
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <ToastProvider>
              <SiteMetaProvider>
                <DevtoolsBlocker />
                <Navbar />
                <main className="flex-1">{children}</main>
                <Footer />
                <FamilyChat />
              </SiteMetaProvider>
              </ToastProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
