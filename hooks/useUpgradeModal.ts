"use client";

import { useState } from "react";

export function useUpgradeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");

  const showUpgrade = (limitMessage: string) => {
    setMessage(limitMessage);
    setIsOpen(true);
  };

  return {
    isOpen,
    message,
    showUpgrade,
    onOpenChange: setIsOpen,
  };
}