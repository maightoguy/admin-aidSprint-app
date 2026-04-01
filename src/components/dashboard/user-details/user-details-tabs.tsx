import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { UserDetailsTabValue } from "./user-details.types";

const tabItems: { value: UserDetailsTabValue; label: string }[] = [
  { value: "personal-details", label: "Personal details" },
  { value: "request-history", label: "Request history" },
];

export function UserDetailsTabs({
  value,
}: {
  value: UserDetailsTabValue;
}) {
  return (
    <TabsList className="inline-grid h-auto grid-cols-2 gap-1 rounded-[10px] border border-[#EAECF0] bg-[#F8FAFC] p-1">
      {tabItems.map((tab) => (
        <TabsTrigger
          key={tab.value}
          value={tab.value}
          className={[
            "min-h-10 rounded-[8px] px-4 py-2 text-xs font-semibold text-[#667085] shadow-none",
            "data-[state=active]:bg-white data-[state=active]:text-[#101828] data-[state=active]:shadow-none",
            value === tab.value ? "" : "",
          ].join(" ")}
        >
          {tab.label}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}
