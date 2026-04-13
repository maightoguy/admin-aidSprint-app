import { Eye, EyeOff } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { cn } from "@/lib/utils";

export interface SecurityFormValues {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface SecurityFormProps {
  initialValues?: Partial<SecurityFormValues>;
  onSubmit: (values: SecurityFormValues) => void;
  className?: string;
}

function PasswordField({
  id,
  label,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-[12px] font-medium text-[#667085]">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={id === "old-password" ? "current-password" : "new-password"}
          className={cn(
            "h-11 w-full rounded-[10px] border border-[#EAECF0] bg-white px-3 pr-11 text-[12px] text-[#101828]",
            "placeholder:text-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#071B58]/20",
          )}
        />
        <button
          type="button"
          onClick={() => setVisible((previous) => !previous)}
          className={cn(
            "absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[#667085]",
            "transition hover:bg-[#F2F4F7] focus:outline-none focus:ring-2 focus:ring-[#071B58]/20",
          )}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export function SecurityForm({
  initialValues,
  onSubmit,
  className = "",
}: SecurityFormProps) {
  const [values, setValues] = useState<SecurityFormValues>({
    oldPassword: initialValues?.oldPassword ?? "",
    newPassword: initialValues?.newPassword ?? "",
    confirmPassword: initialValues?.confirmPassword ?? "",
  });

  const canSubmit = useMemo(() => {
    if (!values.oldPassword || !values.newPassword || !values.confirmPassword) {
      return false;
    }

    return values.newPassword === values.confirmPassword;
  }, [values]);

  const mismatch = values.confirmPassword.length > 0 && values.newPassword !== values.confirmPassword;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
      <PasswordField
        id="old-password"
        label="Old password"
        placeholder="Kindly fill in your old password"
        value={values.oldPassword}
        onChange={(value) => setValues((previous) => ({ ...previous, oldPassword: value }))}
      />
      <PasswordField
        id="new-password"
        label="New password"
        placeholder="Kindly type in a new password"
        value={values.newPassword}
        onChange={(value) => setValues((previous) => ({ ...previous, newPassword: value }))}
      />
      <div className="space-y-2">
        <PasswordField
          id="confirm-password"
          label="Confirm new password"
          placeholder="Kindly re-enter your new password"
          value={values.confirmPassword}
          onChange={(value) =>
            setValues((previous) => ({ ...previous, confirmPassword: value }))
          }
        />
        {mismatch ? (
          <p className="text-[12px] font-medium text-[#F04438]" role="status">
            Passwords do not match.
          </p>
        ) : null}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!canSubmit}
          className={cn(
            "inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-[#B1B5C0] bg-[#041133] px-6 py-[13px] text-[14px] font-medium text-white",
            "transition hover:bg-[#0A1C4E] focus:outline-none focus:ring-2 focus:ring-[#071B58]/25",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
          aria-label="Update password"
        >
          Update password
        </button>
      </div>
    </form>
  );
}
