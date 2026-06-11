import { ContractorsActionsMenu } from "./contractors-actions-menu";
import type { ContractorMenuAction, ContractorRecord } from "./contractors.types";
import {
  getContractorAccountStatusClasses,
  getContractorCurrentStatusClasses,
  getContractorInitials,
  getContractorLifecycleClasses,
  getContractorPayoutClasses,
  getContractorRiskClasses,
  getContractorVerificationClasses,
} from "./contractors.utils";

export function ContractorCard({
  contractor,
  onAction,
}: {
  contractor: ContractorRecord;
  onAction: (action: ContractorMenuAction, contractor: ContractorRecord) => void;
}) {
  return (
    <article className="rounded-[14px] border border-[#EAECF0] bg-white px-4 py-4 shadow-[0_10px_20px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E6E7EB] text-sm font-semibold text-[#0F172A]">
            {getContractorInitials(contractor.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#101828]">
              {contractor.name}
            </p>
            <p className="truncate text-xs text-[#667085]">{contractor.email}</p>
          </div>
        </div>
        <ContractorsActionsMenu contractor={contractor} onAction={onAction} />
      </div>

      <div className="mt-4 grid gap-3 text-sm text-[#667085] sm:grid-cols-2">
        <p>
          <span className="font-semibold text-[#101828]">Availability:</span>{" "}
          <span className={getContractorCurrentStatusClasses(contractor.currentStatus)}>
            {contractor.currentStatus}
          </span>
        </p>
        <p>
          <span className="font-semibold text-[#101828]">Lifecycle:</span>{" "}
          <span
            className={[
              "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
              getContractorLifecycleClasses(contractor.lifecycleState),
            ].join(" ")}
          >
            {contractor.lifecycleState}
          </span>
        </p>
        <p className="sm:col-span-2">
          <span className="font-semibold text-[#101828]">Service zone:</span>{" "}
          {contractor.serviceZoneLabel}
        </p>
        <p>
          <span className="font-semibold text-[#101828]">Performance:</span>{" "}
          {contractor.rating.toFixed(1)} rating
        </p>
        <p>
          <span className="font-semibold text-[#101828]">Payout:</span>{" "}
          <span
            className={[
              "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
              getContractorPayoutClasses(contractor.payoutStatus),
            ].join(" ")}
          >
            {contractor.payoutStatus}
          </span>
        </p>
        <div className="sm:col-span-2 flex flex-wrap gap-2">
          <span
            className={[
              "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
              getContractorVerificationClasses(contractor.verificationState),
            ].join(" ")}
          >
            {contractor.verificationState}
          </span>
          <span
            className={[
              "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
              getContractorRiskClasses(contractor.riskLevel),
            ].join(" ")}
          >
            {contractor.riskLevel} risk
          </span>
          <span
            className={[
              "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
              getContractorAccountStatusClasses(contractor.accountStatus),
            ].join(" ")}
          >
            {contractor.accountStatus}
          </span>
        </div>
        <p className="sm:col-span-2 text-xs leading-5 text-[#667085]">
          {contractor.suspensionReason ??
            contractor.watchlistReason ??
            `${contractor.totalJobsAccepted}/${contractor.totalJobsOffered} jobs accepted with ${contractor.responseTimeLabel}.`}
        </p>
      </div>
    </article>
  );
}
