"use client"; // Adicione isso para garantir o controle de montagem

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Church } from "lucide-react";

export default function NotFound() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // Evita o mismatch de HTML inicial

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
      <div className="bg-primary/10 p-6 rounded-full mb-6">
        <Church className="h-12 w-12 text-primary" />
      </div>
      
      <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
        404
      </h1>
      
      <h2 className="mt-4 text-2xl font-semibold text-foreground">
        Igreja não encontrada
      </h2>
      
      <p className="mt-4 text-muted-foreground max-w-md">
        O endereço que você tentou acessar não pertence a nenhuma congregação registrada ou foi digitado incorretamente.
      </p>

      <div className="mt-10">
        <Button asChild size="lg">
          <Link href="/">
            Voltar para a página inicial
          </Link>
        </Button>
      </div>
    </div>
  );
}