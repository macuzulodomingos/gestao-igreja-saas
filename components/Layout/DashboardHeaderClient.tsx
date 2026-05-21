"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { DashboardHeader } from "./DashboardHeader";



export const DashboardHeaderDynamic = dynamic(
  () => import("@/components/Layout/DashboardHeader").then(m => m.DashboardHeader),
  { ssr: false, loading: () => <div className="h-16 w-full bg-background border-b" />, }
);

type Props = ComponentProps<typeof DashboardHeader>;

export function DashboardHeaderClient(props: Props) {
  return <DashboardHeaderDynamic {...props} />;
}