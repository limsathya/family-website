"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useTranslation } from "@/lib/i18n/language-context";

export default function NotFound() {
  const t = useTranslation();
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center">
      <Heart className="h-16 w-16 text-rose-500 fill-rose-500 mb-6" />
      <h1 className="text-6xl font-bold tracking-tight mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-2">{t("notFound.title")}</h2>
      <p className="text-muted-foreground max-w-md mb-8">{t("notFound.message")}</p>
      <Link href="/">
        <Button className="bg-rose-500 hover:bg-rose-600">{t("notFound.home")}</Button>
      </Link>
    </div>
  );
}
