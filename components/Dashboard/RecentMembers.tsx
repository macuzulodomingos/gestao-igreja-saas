import { UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR, fr } from "date-fns/locale";
import { useTranslations, useLocale } from "next-intl";

type RecentMember = {
  id: string;
  name: string;
  role: string;
  joinDate: Date;
};

interface RecentMembersProps {
  members: RecentMember[];
}

const dateLocalesMap = { pt: ptBR, fr: fr };

export function RecentMembers({ members }: RecentMembersProps) {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const dateLocale = dateLocalesMap[locale as keyof typeof dateLocalesMap] ?? ptBR;

  return (
    <Card className="card-shadow rounded-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{t("recentMembers")}</CardTitle>
          <UserPlus className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">{t("recentMembersSubtitle")}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t("noRecentMembers")}
          </p>
        ) : (
          members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors"
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {member.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {member.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("joinedOn")} {format(new Date(member.joinDate), "dd 'de' MMM, yyyy", { locale: dateLocale })}
                </p>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {member.role}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}