import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  ContractorAccountStatus,
  ContractorCurrentStatus,
  ContractorFormValues,
  ContractorRecord,
  ContractorServiceCategory,
} from "./contractors.types";

const currentStatuses = ["Online", "Offline", "Busy"] as const;
const accountStatuses = ["Active", "Deactivated"] as const;
const serviceCategories = [
  "Plumbing",
  "Cleaning",
  "Baby sitting",
  "Electrician",
  "Laundry",
  "Carpentry",
] as const;

function formatDateForInput(date: string) {
  if (!date) {
    return "";
  }

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toISOString().slice(0, 10);
}

function formatDateForDisplay(date: string) {
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function getDefaultValues(
  contractor: ContractorRecord | null,
): ContractorFormValues {
  if (!contractor) {
    return {
      name: "",
      email: "",
      phone: "",
      location: "",
      currentStatus: "Online",
      totalServicesProvided: 0,
      dateJoined: "",
      accountStatus: "Active",
      serviceCategory: "Plumbing",
      bio: "",
    };
  }

  return {
    name: contractor.name,
    email: contractor.email,
    phone: contractor.phone,
    location: contractor.location,
    currentStatus: contractor.currentStatus,
    totalServicesProvided: contractor.totalServicesProvided,
    dateJoined: formatDateForInput(contractor.dateJoined),
    accountStatus: contractor.accountStatus,
    serviceCategory: contractor.serviceCategory,
    bio: contractor.bio,
  };
}

export function ContractorFormModal({
  open,
  mode,
  contractor,
  isSaving,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  mode: "add" | "edit";
  contractor: ContractorRecord | null;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ContractorFormValues) => Promise<void> | void;
}) {
  const form = useForm<ContractorFormValues>({
    defaultValues: getDefaultValues(contractor),
  });

  useEffect(() => {
    form.reset(getDefaultValues(contractor));
  }, [contractor, form, open]);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit({
      ...values,
      dateJoined: formatDateForDisplay(values.dateJoined),
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[24px] border border-[#EAECF0] bg-white p-0 sm:max-w-[720px]">
        <div className="border-b border-[#EAECF0] px-6 py-5">
          <DialogTitle className="text-xl font-bold text-[#101828]">
            {mode === "add" ? "Add contractor" : "Edit contractor"}
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-[#667085]">
            {mode === "add"
              ? "Create a contractor profile with operational status, service category, and contact details."
              : "Update contractor information, availability, and account settings."}
          </DialogDescription>
        </div>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                rules={{
                  required: "Enter a name.",
                  minLength: {
                    value: 2,
                    message: "Enter at least 2 characters.",
                  },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter contractor name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                rules={{
                  required: "Enter an email address.",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Enter a valid email address.",
                  },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="Enter email address"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                rules={{
                  required: "Enter a phone number.",
                  minLength: {
                    value: 10,
                    message: "Enter a valid phone number.",
                  },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter phone number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                rules={{
                  required: "Enter a location.",
                  minLength: { value: 5, message: "Enter a valid location." },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter service location" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="serviceCategory"
                rules={{ required: "Select a category." }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {serviceCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currentStatus"
                rules={{ required: "Select current status." }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select current status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currentStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accountStatus"
                rules={{ required: "Select account status." }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accountStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="totalServicesProvided"
                rules={{
                  required: "Enter a value.",
                  min: { value: 0, message: "Value cannot be negative." },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total service providing</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min={0}
                        value={field.value}
                        onChange={(event) =>
                          field.onChange(Number(event.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dateJoined"
                rules={{ required: "Select a join date." }}
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Date joined</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bio"
                rules={{
                  required: "Enter a bio.",
                  minLength: {
                    value: 10,
                    message: "Enter at least 10 characters.",
                  },
                }}
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Contractor bio</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={4}
                        placeholder="Describe the contractor profile, capabilities, and availability."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-[#EAECF0] pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="inline-flex items-center justify-center rounded-[10px] border border-[#D0D5DD] px-4 py-3 text-sm font-semibold text-[#344054] transition hover:bg-[#F8FAFC]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center justify-center rounded-[10px] bg-[#041133] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0A1C4E] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSaving
                  ? mode === "add"
                    ? "Adding contractor..."
                    : "Saving changes..."
                  : mode === "add"
                    ? "Add contractor"
                    : "Save changes"}
              </button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
