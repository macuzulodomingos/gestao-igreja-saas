import { auth } from "@/lib/auth";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { type LucideIcon, Tags, ShieldCheck, Shield, Users, CalendarDays, Globe, Languages } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { notFound } from "next/navigation";


interface ConfiguracoesPageProps {
  params: Promise<{ slug: string }>;
}

interface SettingItem {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  color: string;
}

export default async function ConfiguracoesPage({ params }: ConfiguracoesPageProps) {
  const session = await auth();
  const { slug } = await params;
  const locale = await getLocale();


  if (!session?.user) {
    redirect({ href: "/login", locale });
    return; 
  }

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";
  if (!isSuperAdmin && session.user.churchSlug !== slug) {
    notFound();
  }

  const t = await getTranslations("settings");


  const items: SettingItem[] = [
    {
      title: t("financialCategories"),
      description: t("financialCategoriesDesc"),
      href: `/${locale}/${slug}/configuracoes/categorias`,
      icon: Tags,
      color: "bg-emerald-500/10 text-emerald-600",
    },
    {
      title: t("roles"),
      description: t("rolesDesc"),
      href: `/${locale}/${slug}/configuracoes/cargos`,
      icon: ShieldCheck,
      color: "bg-primary/10 text-primary",
    },
    {
      title: t("users"),
      description: t("usersDesc"),
      href: `/${locale}/${slug}/configuracoes/utilizadores`,
      icon: Users,
      color: "bg-blue-500/10 text-blue-600",
    },
    {
      title: t("eventCategories"),
      description: t("eventCategoriesDesc"),
      href: `/${locale}/${slug}/configuracoes/categorias-eventos`,
      icon: CalendarDays,
      color: "bg-blue-500/10 text-blue-600",
    },
    {
      title: t("church"),
      description: t("churchDesc"),
      href: `/${locale}/${slug}/configuracoes/igreja`,
      icon: Globe,
      color: "bg-violet-500/10 text-violet-600",
    },
    {
      title: t("language"),
      description: t("languageDesc"),
      href: `/${locale}/${slug}/configuracoes/idioma`,
      icon: Languages,
      color: "bg-rose-500/10 text-rose-600",
    },
    {
      title: t("audit"),
      description: t("auditDesc"),
      href: `/${locale}/${slug}/configuracoes/auditoria`,
      icon: Shield,
      color: "bg-amber-500/10 text-amber-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t("pageTitle")}</h1>
        <p className="text-muted-foreground mt-1">{t("pageSubtitle")}</p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
              <CardHeader className="pb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${item.color}`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">{item.title}</CardTitle>
                <CardDescription className="text-sm">
                  {item.description}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}