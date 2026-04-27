"use server";

import { EventService } from "@/services/eventService";
import { revalidatePath } from "next/cache";
import { getErrorMessage, isPrismaError } from "@/lib/errors";
import { eventSchema } from "@/lib/validations/event";
import { getAuthContext } from "@/lib/auth-context";
import { fromZonedTime } from "date-fns-tz";
import { getTimezone } from "@/lib/get-timezone";
import { checkEventMonthlyLimit } from "@/lib/plan-guard";
import prisma from "@/lib/prisma";



export async function saveEventAction(
  formData: FormData,
  eventId?: string,
  targetChurchId?: string,
) {
  try {
    const { churchId, actor, plan } = await getAuthContext(targetChurchId);

    const result = eventSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!result.success) {
      return { success: false, fieldErrors: result.error.flatten().fieldErrors };
    }

    const timezone = await getTimezone(churchId);

    // 👈 Converte para UTC usando o timezone da igreja
    const startAt = fromZonedTime(
      `${result.data.date}T${result.data.time}:00`,
      timezone
    );


    const data = {
      name: result.data.name,
      description: result.data.description || undefined,
      categoryId: result.data.categoryId, // 👈
      startAt,
      departmentId: result.data.departmentId === "none" || !result.data.departmentId
        ? undefined
        : result.data.departmentId,
    };

    if (eventId) {
      await EventService.updateEvent(eventId, churchId, actor, data);
    } else {
      await checkEventMonthlyLimit(churchId, plan);
      await EventService.createEvent(churchId, actor, data);
    }

    revalidatePath(`/[slug]/eventos`, "page");
    return { success: true };

  } catch (error: unknown) {
    const message = getErrorMessage(error);
    if (message === "UNAUTHORIZED")
      return { success: false, errorCode: "unauthorized" };
    if (message === "CHURCH_ID_REQUIRED")
      return { success: false, errorCode: "unauthorized" };
    if (message === "INVALID_DEPARTMENT")
      return { success: false, errorCode: "invalidDepartment" };
    if (message === "INVALID_CATEGORY")
      return { success: false, errorCode: "invalidCategory" };
    if (message === "PLAN_LIMIT_EVENTS")
      return { success: false, errorCode: "planLimitEvents", upgrade: true };
    if (isPrismaError(error) && error.code === "P2025")
      return { success: false, errorCode: "eventNotFound" };
    console.error("[SAVE_EVENT_ERROR]:", error);
    return { success: false, errorCode: "errorSave" };
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
      return { success: false, errorCode: "unauthorized" };
    if (message === "EVENT_NOT_FOUND")
      return { success: false, errorCode: "eventNotFound" };
    if (isPrismaError(error) && error.code === "P2025")
      return { success: false, errorCode: "eventAlreadyDeleted" };
    console.error("[DELETE_EVENT_ERROR]:", error);
    return { success: false, errorCode: "errorDelete" };
  }
}

export async function syncAttendeesAction(
  eventId: string,
  memberIds: string[],
  targetChurchId?: string,
) {
  // 👈 protecção contra payload malicioso
  if (memberIds.length > 1000)
    return { success: false, errorCode: "tooManyMembers" };

  try {
    const { churchId, actor } = await getAuthContext(targetChurchId);

    await EventService.syncAttendees(eventId, churchId, memberIds, actor);

    revalidatePath(`/[slug]/eventos`, "page");
    return { success: true };

  } catch (error: unknown) {
    const message = getErrorMessage(error);
    if (message === "UNAUTHORIZED")
      return { success: false, errorCode: "unauthorized" };
    if (message === "EVENT_NOT_FOUND")
      return { success: false, errorCode: "eventNotFound" };
    if (message === "INVALID_MEMBERS")
      return { success: false, errorCode: "invalidMembers" };
    console.error("[SYNC_ATTENDEES_ERROR]:", error);
    return { success: false, errorCode: "errorSync" };
  }
}


export async function getEventAttendeesAction(eventId: string, targetChurchId?: string) {
  try {
    const { churchId } = await getAuthContext(targetChurchId);
    const attendees = await EventService.getEventAttendees(eventId, churchId);
    
    return { success: true, memberIds: attendees.map(a => a.memberId) };
  } catch (error: unknown) {
    console.error("[GET_EVENT_ATTENDEES_ERROR]:", error);
    return { success: false, memberIds: [] };
  }
}