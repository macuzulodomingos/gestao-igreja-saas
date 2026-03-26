import { Prisma } from "@prisma/client";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


/**
 * Compara dois objetos e retorna apenas as propriedades que mudaram.
 * Ideal para logs de auditoria (Audit Logs).
 */
export function getDiff<T extends Record<PropertyKey, unknown>>(
  oldData: T,
  newData: T
) {
  const diff: {
    old: Record<string, Prisma.InputJsonValue>;
    new: Record<string, Prisma.InputJsonValue>;
  } = { old: {}, new: {} };

  // Usamos (key as keyof T) para manter a rastreabilidade total
  (Object.keys(newData) as Array<keyof T>).forEach((key) => {
    const oldValue = oldData[key];
    const newValue = newData[key];

    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      // O cast para InputJsonValue continua necessário para o Prisma
      diff.old[key as string] = oldValue as Prisma.InputJsonValue;
      diff.new[key as string] = newValue as Prisma.InputJsonValue;
    }
  });

  return diff;
}