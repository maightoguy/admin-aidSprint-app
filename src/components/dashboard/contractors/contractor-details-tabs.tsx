import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ContractorDetailsTabValue } from "./contractors.types";

export function ContractorDetailsTabs({
  value,
  verificationCount,
}: {
  value: ContractorDetailsTabValue;
  verificationCount: number;
}) {
  const tabItems: { value: ContractorDetailsTabValue; label: string }[] = [
    { value: "personal-details", label: "Personal details" },
    {
      value: "kyc-verification",
      label: `KYC verification(${verificationCount}/3)`,
    },
    { value: "request-history", label: "Request history" },
    { value: "transaction-history", label: "Transaction history" },
  ];

  return (
    <TabsList className="inline-grid h-auto grid-cols-2 gap-1 rounded-[10px] border border-[#EAECF0] bg-[#F8FAFC] p-1 md:grid-cols-4">
      {tabItems.map((tab) => (
        <TabsTrigger
          key={tab.value}
          value={tab.value}
          className={[
            "min-h-10 rounded-[8px] px-3 py-2 text-[11px] font-semibold text-[#667085] shadow-none sm:px-4 sm:text-xs",
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
