"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { UserFormDialog } from "@/components/Settings/Users/UserFormDialog";
import { deleteUserAction } from "@/app/actions/user-actions";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type User = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: Date;
};

const roleLabels: Record<string, string> = {
  ADMIN: "Administrador",
  TREASURER: "Tesoureiro",
  SECRETARY: "Secretário",
  OPERATOR: "Operador",
};

const roleColors: Record<string, string> = {
  ADMIN: "bg-primary/10 text-primary",
  TREASURER: "bg-emerald-500/10 text-emerald-600",
  SECRETARY: "bg-blue-500/10 text-blue-600",
  OPERATOR: "bg-muted text-muted-foreground",
};

interface UsersClientProps {
  initialUsers: User[];
  currentUserId: string;
}

export default function UsersClient({ initialUsers, currentUserId }: UsersClientProps) {
  const [users, setUsers] = useState(initialUsers);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!userToDelete) return;
    startTransition(async () => {
      const result = await deleteUserAction(userToDelete.id);
      if (result.success) {
        setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
        toast.success("Utilizador removido.");
      } else {
        toast.error(result.error || "Erro ao remover.");
      }
      setUserToDelete(null);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" />
            Utilizadores
          </h1>
          <p className="text-muted-foreground mt-1">
            Gere quem tem acesso ao painel da sua igreja.
          </p>
        </div>
        <Button onClick={() => { setEditingUser(null); setIsFormOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Adicionar Utilizador
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-muted-foreground">
            {users.length} utilizador(es)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <p className="text-center text-muted-foreground py-12 text-sm">
              Nenhum utilizador encontrado.
            </p>
          ) : (
            <div className="divide-y">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {user.name?.charAt(0).toUpperCase() ?? "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {user.name}
                        {user.id === currentUserId && (
                          <span className="ml-2 text-xs text-muted-foreground">(você)</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[user.role] ?? "bg-muted text-muted-foreground"}`}>
                      {roleLabels[user.role] ?? user.role}
                    </span>

                    {user.role !== "ADMIN" && user.id !== currentUserId && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => { setEditingUser(user); setIsFormOpen(true); }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
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
        onOpenChange={setIsFormOpen}
        editingUser={editingUser}
        onSuccess={(updatedUser) => {
          if (editingUser) {
            setUsers((prev) => prev.map((u) => u.id === updatedUser.id ? updatedUser : u));
          } else {
            setUsers((prev) => [...prev, updatedUser]);
          }
          setIsFormOpen(false);
        }}
      />

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover utilizador?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{userToDelete?.name}</strong> perderá acesso ao painel imediatamente.
              Esta acção não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}