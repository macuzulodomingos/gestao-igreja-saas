import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tags, ShieldCheck, Shield, Users, CalendarDays, Globe, Languages } from "lucide-react";
import { getTranslations } from "next-intl/server";

interface ConfiguracoesPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ConfiguracoesPage({ params }: ConfiguracoesPageProps) {
  const session = await auth();
  const { slug } = await params;

  if (!session?.user?.churchId) redirect("/login");

  const t = await getTranslations("settings");

  const items = [
    {
      title: t("financialCategories"),
      description: t("financialCategoriesDesc"),
      href: `/${slug}/configuracoes/categorias`,
      icon: Tags,
      color: "bg-emerald-500/10 text-emerald-600",
    },
    {
      title: t("roles"),
      description: t("rolesDesc"),
      href: `/${slug}/configuracoes/cargos`,
      icon: ShieldCheck,
      color: "bg-primary/10 text-primary",
    },
    {
      title: t("users"),
      description: t("usersDesc"),
      href: `/${slug}/configuracoes/utilizadores`,
      icon: Users,
      color: "bg-blue-500/10 text-blue-600",
    },
    {
      title: t("eventCategories"),
      description: t("eventCategoriesDesc"),
      href: `/${slug}/configuracoes/categorias-eventos`,
      icon: CalendarDays,
      color: "bg-blue-500/10 text-blue-600",
    },
    {
      title: t("church"),
      description: t("churchDesc"),
      href: `/${slug}/configuracoes/igreja`,
      icon: Globe,
      color: "bg-violet-500/10 text-violet-600",
    },
    {
      title: t("language"),
      description: t("languageDesc"),
      href: `/${slug}/configuracoes/idioma`,
      icon: Languages,
      color: "bg-rose-500/10 text-rose-600",
    },
    {
      title: t("audit"),
      description: t("auditDesc"),
      href: `/${slug}/configuracoes/auditoria`,
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