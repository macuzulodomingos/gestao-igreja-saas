"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDebounce } from "@/hooks/use-debounce";
import { searchActiveMembersAction } from "@/app/actions/member-actions";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { MemberSearchResult } from "@/types/member";

interface MemberComboboxProps {
  value: string | null;
  onChange: (memberId: string | null) => void;
  churchId: string;
  initialLabel?: string | null;
  placeholder?: string;
}

export function MemberCombobox({ value, onChange, churchId, initialLabel, placeholder }: MemberComboboxProps) {
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<MemberSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(initialLabel ?? "");
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    setSelectedLabel(initialLabel ?? "");
  }, [initialLabel]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    searchActiveMembersAction(debouncedQuery, churchId)
      .then((result) => {
        if (cancelled) return;
        if (result.success) setOptions(result.data);
      })
      .catch((error) => {
        console.error("[MEMBER_COMBOBOX_SEARCH_ERROR]:", error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [debouncedQuery, open, churchId]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal">
          {selectedLabel || placeholder || t("search")}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}>
          <CommandInput placeholder={t("search")} value={query} onValueChange={setQuery} />
          <CommandList>
            {loading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
            {!loading && options.length === 0 && (
              <CommandEmpty>{t("noResults")}</CommandEmpty>
            )}
            <CommandGroup>
              {options.map((member) => (
                <CommandItem
                  key={member.id}
                  value={member.id}
                  onSelect={() => {
                    onChange(member.id);
                    setSelectedLabel(`${member.name}${member.role ? ` (${member.role.name})` : ""}`);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === member.id ? "opacity-100" : "opacity-0")} />
                  {member.name}{member.role ? ` (${member.role.name})` : ""}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}