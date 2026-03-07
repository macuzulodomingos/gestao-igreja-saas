"use server";

import { auth } from "@/lib/auth";
import { EventService } from "@/services/eventService";
import { revalidatePath } from "next/cache";
import { z } from "zod";

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
  date: z.string().min(1, "Data obrigatória"),
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

    const result = eventSchema.safeParse(
      Object.fromEntries(formData.entries())
    );
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

  } catch (error: any) {
    console.error("[SAVE_EVENT_ERROR]:", error);
    if (error.message === "UNAUTHORIZED")
      return { success: false, error: "Não autenticado." };
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

  } catch (error: any) {
    console.error("[DELETE_EVENT_ERROR]:", error);
    if (error.message === "UNAUTHORIZED")
      return { success: false, error: "Não autenticado." };
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

  } catch (error: any) {
    console.error("[SYNC_ATTENDEES_ERROR]:", error);
    if (error.message === "UNAUTHORIZED")
      return { success: false, error: "Não autenticado." };
    return { success: false, error: "Erro ao actualizar presenças." };
  }
}