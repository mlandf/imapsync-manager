"use client";

import { MailCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/use-i18n";
import { cn } from "@/lib/utils";

import { LanguageSwitcher } from "./language-switcher";
import { ThemeToggle } from "./theme-toggle";

export function AppHeader() {
  const { t } = useI18n();
  const pathname = usePathname();
  const links = [
    { href: "/", label: t("nav.jobs"), active: pathname === "/" || pathname.startsWith("/jobs") },
    { href: "/profiles", label: t("nav.profiles"), active: pathname.startsWith("/profiles") },
  ];

  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <MailCheck className="size-5" />
          <span className="hidden sm:inline">{t("app.title")}</span>
        </Link>
        <nav className="flex flex-1 items-center gap-1">
          {links.map((link) => (
            <Button
              key={link.href}
              asChild
              variant="ghost"
              size="sm"
              className={cn(link.active && "bg-accent")}
            >
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </nav>
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </header>
  );
}
