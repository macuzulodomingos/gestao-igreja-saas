"use client";

import { authenticate } from "@/app/actions/auth";
import { useFormStatus } from "react-dom";
import { Church } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Church className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">ChurchOS</h1>
          <p className="text-sm text-muted-foreground">
            Introduza os seus dados para aceder ao painel
          </p>
        </div>

        <form action={authenticate} className="space-y-4 rounded-lg border bg-card p-8 shadow-sm">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">E-mail</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="pastor@igreja.com"
              required
              className="w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">Palavra-passe</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
            />
          </div>
          <LoginButton />
        </form>
      </div>
    </div>
  );
}

function LoginButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
    >
      {pending ? "A entrar..." : "Entrar"}
    </button>
  );
}