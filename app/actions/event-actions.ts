"use server";

import { auth } from "@/lib/auth";
import { EventService } from "@/services/eventService";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getErrorMessage, isPrismaError } from "@/lib/errors";

async function getAuthContext(targetChurchId?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";
  const churchId = isSuperAdmin && targetChurchId
    ? targetChurchId
    : session.user.churchId;

  if (!churchId) throw new Error("CHURCH_ID_REQUIRED");

  return {
    churchId,
    actor: { userId: session.user.id, email: session.user.email! },
    isSuperAdmin,
  };
}

const eventSchema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(100),
  description: z.string().max(500).optional().or(z.literal("")),
  type: z.enum(["SERVICO", "REUNIAO", "ENSAIO", "CONFERENCIA", "OUTRO"]),
  date: z.string().min(1, "Data obrigatória").refine(
    (val) => new Date(val) >= new Date(new Date().toDateString()),
    "A data não pode ser no passado"
  ),
  time: z.string().min(1, "Hora obrigatória"),
  departmentId: z.string().optional().or(z.literal("")),
});

export async function saveEventAction(
  formData: FormData,
  eventId?: string,
  targetChurchId?: string,
) {
  try {
    const { churchId, actor } = await getAuthContext(targetChurchId);

    const result = eventSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!result.success) {
      return { success: false, fieldErrors: result.error.flatten().fieldErrors };
    }

    const data = {
      name: result.data.name,
      description: result.data.description || undefined,
      type: result.data.type,
      date: new Date(`${result.data.date}T12:00:00Z`),
      time: result.data.time,
      departmentId: result.data.departmentId === "none" || !result.data.departmentId
        ? undefined
        : result.data.departmentId,
    };

    if (eventId) {
      await EventService.updateEvent(eventId, churchId, actor, data);
    } else {
      await EventService.createEvent(churchId, actor, data);
    }

    revalidatePath(`/[slug]/eventos`, "page");
    return { success: true };

  } catch (error: unknown) {
    const message = getErrorMessage(error);
    if (message === "UNAUTHORIZED")
      return { success: false, error: "Não autenticado." };
    if (message === "CHURCH_ID_REQUIRED")
      return { success: false, error: "Igreja não encontrada." };
    if (message === "INVALID_DEPARTMENT")
      return { success: false, error: "Departamento inválido para esta igreja." };
    if (isPrismaError(error) && error.code === "P2002")
      return { success: false, error: "Já existe um evento com estes dados." };
    if (isPrismaError(error) && error.code === "P2025")
      return { success: false, error: "Registo não encontrado." };
    console.error("[SAVE_EVENT_ERROR]:", error);
    return { success: false, error: "Erro ao salvar evento." };
  }
}

export async function deleteEventAction(
  id: string,
  targetChurchId?: string,
) {
  try {
    const { churchId, actor } = await getAuthContext(targetChurchId);

    await EventService.deleteEvent(id, churchId, actor);

    revalidatePath(`/[slug]/eventos`, "page");
    return { success: true };

  } catch (error: unknown) {
    const message = getErrorMessage(error);
    if (message === "UNAUTHORIZED")
      return { success: false, error: "Não autenticado." };
    if (message === "EVENT_NOT_FOUND")
      return { success: false, error: "Evento não encontrado." };
    if (isPrismaError(error) && error.code === "P2025")
      return { success: false, error: "Evento já foi eliminado." };
    console.error("[DELETE_EVENT_ERROR]:", error);
    return { success: false, error: "Não foi possível eliminar o evento." };
  }
}

export async function syncAttendeesAction(
  eventId: string,
  memberIds: string[],
  targetChurchId?: string,
) {
  try {
    const { churchId, actor } = await getAuthContext(targetChurchId);

    await EventService.syncAttendees(eventId, churchId, memberIds, actor);

    revalidatePath(`/[slug]/eventos`, "page");
    return { success: true };

  } catch (error: unknown) {
    const message = getErrorMessage(error);
    if (message === "UNAUTHORIZED")
      return { success: false, error: "Não autenticado." };
    if (message === "EVENT_NOT_FOUND")
      return { success: false, error: "Evento não encontrado." };
    if (message === "INVALID_MEMBERS")
      return { success: false, error: "Um ou mais membros são inválidos." };
    console.error("[SYNC_ATTENDEES_ERROR]:", error);
    return { success: false, error: "Erro ao actualizar presenças." };
  }
}