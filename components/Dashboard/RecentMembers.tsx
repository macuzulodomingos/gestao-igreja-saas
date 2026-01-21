import { UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { members } from "@/lib/mock-data";

const roleColors: Record<string, string> = {
  Pastor: "bg-primary/10 text-primary",
  Elder: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Deacon: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Volunteer: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  Member: "bg-muted text-muted-foreground",
};

export function RecentMembers() {
  const recentMembers = [...members]
    .sort((a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime())
    .slice(0, 5);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card className="card-shadow rounded-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Membros recentes</CardTitle>
          <UserPlus className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          Últimas adições à sua congregação
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentMembers.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors"
          >
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {member.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {member.name}
              </p>
              <p className="text-xs text-muted-foreground">
                Ingressou {formatDate(member.joinDate)}
              </p>
            </div>
            <Badge className={roleColors[member.role]} variant="secondary">
              {member.role}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
