import Link from "next/link";
import { Church, Users, Wallet, Calendar, Building2, ShieldCheck, ArrowRight, CheckCircle, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Church className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg">ChurchOS</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#funcionalidades" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Funcionalidades
            </a>
            <a href="#precos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Preços
            </a>
            <a href="#testemunhos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Testemunhos
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link href="/registar">
              <Button size="sm">Começar Grátis</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center space-y-8">
        <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 px-4 py-1">
          Sistema de Gestão para Igrejas
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
          Gerencie a sua igreja{" "}
          <span className="text-primary">com simplicidade</span>{" "}
          e profissionalismo
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          O ChurchOS centraliza membros, finanças, eventos e departamentos numa única plataforma
          segura, moderna e pensada para igrejas angolanas.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link href="/registar">
            <Button size="lg" className="gap-2 px-8">
              Criar Conta Gratuitamente
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/sua-igreja/painel">
            <Button size="lg" variant="outline" className="gap-2 px-8">
              Ver Demonstração
            </Button>
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">
          Sem cartão de crédito. Configuração em menos de 2 minutos.
        </p>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-muted/30">
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "500+", label: "Igrejas Registadas" },
            { value: "50 000+", label: "Membros Geridos" },
            { value: "99.9%", label: "Disponibilidade" },
            { value: "24/7", label: "Suporte Dedicado" },
          ].map((stat) => (
            <div key={stat.label} className="space-y-1">
              <p className="text-3xl font-bold text-primary">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Funcionalidades */}
      <section id="funcionalidades" className="max-w-6xl mx-auto px-6 py-24 space-y-16">
        <div className="text-center space-y-4">
          <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5">
            Funcionalidades
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold">
            Tudo o que a sua igreja precisa
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Uma plataforma completa para modernizar a gestão da sua congregação.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Users,
              title: "Gestão de Membros",
              description: "Registe e acompanhe todos os membros, cargos, datas de ingresso e histórico completo de alterações.",
              color: "bg-blue-500/10 text-blue-600",
            },
            {
              icon: Wallet,
              title: "Controlo Financeiro",
              description: "Registe receitas e despesas, filtre por mês, exporte relatórios PDF e acompanhe o saldo da igreja.",
              color: "bg-emerald-500/10 text-emerald-600",
            },
            {
              icon: Calendar,
              title: "Gestão de Eventos",
              description: "Crie e gira eventos como cultos, ensaios e conferências. Registe presenças por membro.",
              color: "bg-amber-500/10 text-amber-600",
            },
            {
              icon: Building2,
              title: "Departamentos",
              description: "Organize a sua igreja em departamentos com líderes e membros atribuídos a cada área.",
              color: "bg-purple-500/10 text-purple-600",
            },
            {
              icon: ShieldCheck,
              title: "Controlo de Acessos",
              description: "Atribua roles diferentes: Administrador, Tesoureiro, Secretário e muito mais.",
              color: "bg-red-500/10 text-red-600",
            },
            {
              icon: Church,
              title: "Multi-Igreja",
              description: "Arquitectura SaaS — cada igreja tem o seu espaço isolado, seguro e independente.",
              color: "bg-primary/10 text-primary",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-border p-6 space-y-4 hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${feature.color}`}>
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-base">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Preços */}
      <section id="precos" className="bg-muted/30 border-y border-border">
        <div className="max-w-6xl mx-auto px-6 py-24 space-y-16">
          <div className="text-center space-y-4">
            <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5">
              Preços
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold">
              Planos para cada etapa
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Comece gratuitamente e cresça conforme a sua igreja cresce.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                plan: "FREE",
                price: "Grátis",
                period: "para sempre",
                description: "Para igrejas que estão a começar.",
                features: [
                  "Até 50 membros",
                  "Gestão financeira básica",
                  "1 departamento",
                  "Suporte por e-mail",
                ],
                cta: "Começar Grátis",
                highlight: false,
              },
              {
                plan: "PRO",
                price: "9 900 Kz",
                period: "por mês",
                description: "Para igrejas em crescimento.",
                features: [
                  "Membros ilimitados",
                  "Relatórios PDF",
                  "Departamentos ilimitados",
                  "Gestão de eventos",
                  "Auditoria completa",
                  "Suporte prioritário",
                ],
                cta: "Assinar PRO",
                highlight: true,
              },
              {
                plan: "ENTERPRISE",
                price: "Sob consulta",
                period: "",
                description: "Para denominações e redes de igrejas.",
                features: [
                  "Multi-sede",
                  "API dedicada",
                  "Gestor de conta exclusivo",
                  "Onboarding personalizado",
                  "SLA garantido",
                ],
                cta: "Falar com Equipa",
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.plan}
                className={`rounded-xl border p-8 space-y-6 relative ${
                  plan.highlight
                    ? "border-primary bg-primary/5 shadow-lg"
                    : "border-border bg-card"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4">
                      Mais Popular
                    </Badge>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {plan.plan}
                  </p>
                  <p className="text-3xl font-bold">{plan.price}</p>
                  {plan.period && (
                    <p className="text-sm text-muted-foreground">{plan.period}</p>
                  )}
                  <p className="text-sm text-muted-foreground pt-1">{plan.description}</p>
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/registar">
                  <Button
                    className="w-full"
                    variant={plan.highlight ? "default" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testemunhos */}
      <section id="testemunhos" className="max-w-6xl mx-auto px-6 py-24 space-y-16">
        <div className="text-center space-y-4">
          <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5">
            Testemunhos
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold">
            O que os pastores dizem
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: "Pastor António Silva",
              church: "Igreja Evangélica Central, Luanda",
              text: "O ChurchOS transformou a forma como gerimos a nossa congregação. Agora temos controlo total das finanças e dos membros numa só plataforma.",
            },
            {
              name: "Pastora Maria João",
              church: "Igreja Baptista do Huambo",
              text: "Finalmente um sistema feito para a realidade angolana. A gestão de membros e eventos ficou muito mais simples e organizada.",
            },
            {
              name: "Pastor Carlos Mendes",
              church: "Igreja Assembleia de Deus, Benguela",
              text: "Os relatórios financeiros em PDF são excelentes para apresentar às lideranças. Recomendo a todas as igrejas.",
            },
          ].map((t) => (
            <div key={t.name} className="rounded-xl border border-border p-6 space-y-4">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed italic">
                "{t.text}"
              </p>
              <div>
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.church}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-6 py-24 text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold">
            Pronto para modernizar a sua igreja?
          </h2>
          <p className="text-primary-foreground/80 text-lg max-w-xl mx-auto">
            Junte-se a centenas de igrejas que já confiam no ChurchOS para gerir a sua congregação.
          </p>
          <Link href="/registar">
            <Button size="lg" variant="secondary" className="gap-2 px-10">
              Criar Conta Gratuitamente
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Church className="h-4 w-4" />
            </div>
            <span className="font-bold">ChurchOS</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ChurchOS. Todos os direitos reservados.
          </p>
          <div className="flex gap-6">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Entrar
            </Link>
            <Link href="/registar" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Registar
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}