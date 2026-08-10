import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center px-4">
        <p className="text-8xl font-bold bg-gradient-to-r from-rose-500 to-amber-500 bg-clip-text text-transparent mb-4">
          404
        </p>
        <h1 className="text-2xl font-bold tracking-tight mb-2">Page not found</h1>
        <p className="text-muted-foreground mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/" className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium h-9 px-4 hover:bg-primary/80 transition-all">
          <Home className="h-4 w-4" />
          Go home
        </Link>
      </div>
    </div>
  );
}
