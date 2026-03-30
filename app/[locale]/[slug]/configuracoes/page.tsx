import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tags, ShieldCheck, Shield, Users, CalendarDays, FileText, BookOpen, Globe, Languages } from "lucide-react";

interface ConfiguracoesPageProps {
    params: Promise<{ slug: string }>;
}

export default async function ConfiguracoesPage({ params }: ConfiguracoesPageProps) {
    const session = await auth();
    const { slug } = await params;

    if (!session?.user?.churchId) redirect("/login");

    const items = [
        {
            title: "Categorias Financeiras",
            description: "Gere as categorias de receitas e despesas da sua igreja.",
            href: `/${slug}/configuracoes/categorias`,
            icon: Tags,
            color: "bg-emerald-500/10 text-emerald-600",
        },
        {
            title: "Cargos",
            description: "Gere os cargos e funções dos membros da sua igreja.",
            href: `/${slug}/configuracoes/cargos`,
            icon: ShieldCheck,
            color: "bg-primary/10 text-primary",
        },
        {
            title: "Utilizadores",
            description: "Gere quem tem acesso ao painel da sua igreja.",
            href: `/${slug}/configuracoes/utilizadores`,
            icon: Users,
            color: "bg-blue-500/10 text-blue-600",
        },
        {
            title: "Categorias de Eventos",
            description: "Gere os tipos de eventos da sua igreja.",
            href: `/${slug}/configuracoes/categorias-eventos`,
            icon: CalendarDays,
            color: "bg-blue-500/10 text-blue-600",
        },
        {
            title: "Igreja",
            description: "Nome, slug, fuso horário e informações gerais.",
            href: `/${slug}/configuracoes/igreja`,
            icon: Globe,
            color: "bg-violet-500/10 text-violet-600",
        },
        {
            title: "Idioma",
            description: "Escolha o idioma da interface — Português ou Français.",
            href: `/${slug}/configuracoes/idioma`,
            icon: Languages,
            color: "bg-rose-500/10 text-rose-600",
        },
        {
            title: "Auditoria",
            description: "Registo completo de todas as acções realizadas no sistema.",
            href: `/${slug}/configuracoes/auditoria`,
            icon: Shield,
            color: "bg-amber-500/10 text-amber-600",
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">Configurações</h1>
                <p className="text-muted-foreground mt-1">
                    Personalize a sua igreja e gere as definições do sistema.
                </p>
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