import type { ContractorsSummaryCard } from "./contractors.types";

export function ContractorSummaryCard({
  card,
  backgroundImage,
}: {
  card: ContractorsSummaryCard;
  backgroundImage: string;
}) {
  const Icon = card.Icon;

  return (
    <article
      className="relative overflow-hidden rounded-[16px] border border-[#E6E7EB] bg-white px-4 py-5 sm:px-[14px] sm:py-[18px]"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.96)), url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[14px] font-medium text-[#6B7280]">{card.title}</p>
          <p className="mt-4 text-[28px] font-bold tracking-[-0.02em] text-[#101828]">
            {card.value}
          </p>
          <p className="mt-4 text-[14px] font-medium text-[#15803D]">
            {card.trend}
          </p>
        </div>
        <div className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#EAECF0] bg-white">
          <Icon size={20} className="inline-flex" aria-hidden="true" />
        </div>
      </div>
    </article>
  );
}
