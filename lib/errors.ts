import { Prisma } from "@/app/generated/prisma/client";


export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Erro desconhecido";
}

export function isPrismaError(
  error: unknown
): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}