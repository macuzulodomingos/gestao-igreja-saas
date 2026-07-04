"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Users, Loader2 } from "lucide-react";
import { UserFormDialog } from "@/components/Settings/Users/UserFormDialog";
import { deleteUserAction } from "@/app/actions/user-actions";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UpgradeModal } from "@/components/UpgradeModal";
import { useUpgradeModal } from "@/hooks/useUpgradeModal";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { UserRole } from "@/app/generated/prisma/enums";


type User = {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  createdAt: Date;
};

const roleColors: Record<UserRole, string> = {
  SUPER_ADMIN: "bg-purple-500/10 text-purple-600",
  ADMIN: "bg-primary/10 text-primary",
  TREASURER: "bg-emerald-500/10 text-emerald-600",
  SECRETARY: "bg-blue-500/10 text-blue-600",
  OPERATOR: "bg-muted text-muted-foreground",
};

interface UsersClientProps {
  initialUsers: User[];
  currentUserId: string;
  churchId: string;
}

export default function UsersClient({ initialUsers, currentUserId, churchId }: UsersClientProps) {
  const [users, setUsers] = useState(initialUsers);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const upgrade = useUpgradeModal();
  const t = useTranslations("users");
  const te = useTranslations("users.errors");
  const router = useRouter();

  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  const roleLabels: Record<UserRole, string> = {
    SUPER_ADMIN: t("roles.SUPER_ADMIN"),
    ADMIN: t("roles.ADMIN"),
    TREASURER: t("roles.TREASURER"),
    SECRETARY: t("roles.SECRETARY"),
    OPERATOR: t("roles.OPERATOR"),
  };

  const handleDelete = async () => {
    if (!userToDelete || isDeleting) return;
    setIsDeleting(true);
    const targetId = userToDelete.id;
    try {
      const result = await deleteUserAction(targetId, churchId);
      if (result.success) {
        setUsers(prev => prev.filter(u => u.id !== targetId));
        toast.success(t("successDeleted"));
        router.refresh();
      } else {
        toast.error(result.errorCode ? te(result.errorCode) : t("errorDelete"));
      }
    } catch (error) {
      console.error("[DELETE_USER_ERROR]:", error);
      toast.error(t("errorDelete"));
    } finally {
      setIsDeleting(false);
      setUserToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" />
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <Button onClick={() => { setEditingUser(null); setIsFormOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> {t("addUser")}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-muted-foreground">
            {users.length} {t("count")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <p className="text-center text-muted-foreground py-12 text-sm">
              {t("empty")}
            </p>
          ) : (
            <div className="divide-y">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between gap-3 p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="h-9 w-9 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {user.name?.trim()?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {user.name}
                        {user.id === currentUserId && (
                          <span className="ml-2 text-xs text-muted-foreground">{t("you")}</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[user.role] ?? "bg-muted text-muted-foreground"}`}>
                      {roleLabels[user.role] ?? user.role}
                    </span>

                    {user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN && user.id !== currentUserId && (
                      
                      <div className="flex gap-1">
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8"
                          aria-label={t("edit")}
                          onClick={() => { setEditingUser(user); setIsFormOpen(true); }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          aria-label={t("delete")}
                          onClick={() => setUserToDelete(user)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <UserFormDialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingUser(null);
        }}
        editingUser={editingUser}
        onUpgrade={(message) => upgrade.showUpgrade(message)}
        churchId={churchId}
        onSuccess={(updatedUser) => {
          setUsers(prev => {
            if (prev.some(u => u.id === updatedUser.id)) {
              return prev.map(u => u.id === updatedUser.id ? updatedUser : u);
            }
            return [...prev, updatedUser];
          });
          setIsFormOpen(false);
        }}
      />

      <UpgradeModal
        open={upgrade.isOpen}
        onOpenChange={upgrade.onOpenChange}
        limitMessage={upgrade.message}
      />

      <AlertDialog
        open={!!userToDelete}
        onOpenChange={(open) => !open && !isDeleting && setUserToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{userToDelete?.name?.trim() || userToDelete?.email}</strong> {t("confirmDeleteDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}