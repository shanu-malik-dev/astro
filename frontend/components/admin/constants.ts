import { ClipboardList, CreditCard, Headset, HelpCircle, ListChecks, Settings, ShieldCheck, Sparkles, Users } from "lucide-react";
import type { SelectOption } from "@/components/ui/CustomSelect";
import { ADMIN_MODULE_FLAGS } from "@/lib/feature-flags";
import { FOLLOW_UP_STATUS } from "@/lib/status-constants";
import type { AdminModule, EnquiryRow, SimpleRow } from "./types";

export { ADMIN_MODULE_FLAGS };

export const PROBLEM_STORAGE_KEY = "astronova_admin_problems";
export const SERVICES_STORAGE_KEY = "astronova_admin_services";
export const PAGE_SIZE = 10;

export const PROBLEM_LANGUAGES = [
  { lang: "en", label: "English" },
  { lang: "hi", label: "Hindi" },
];

export const PROBLEM_STATUS_OPTIONS: SelectOption[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export const FOLLOW_UP_STATUS_OPTIONS: SelectOption[] = [
  { value: String(FOLLOW_UP_STATUS.HOT), label: "Hot" },
  { value: String(FOLLOW_UP_STATUS.WARM), label: "Warm" },
  { value: String(FOLLOW_UP_STATUS.COLD), label: "Cold" },
];

export const ALL_MODULES: AdminModule[] = [
  {
    key: "problem",
    label: "Problem",
    description: "Create, update, translate, and manage customer problems.",
    icon: ClipboardList,
  },
  {
    key: "services",
    label: "Services",
    description: "Manage service names, descriptions, and status.",
    icon: Settings,
  },
  {
    key: "astrologers",
    label: "Astrologers",
    description: "Manage astrologer profiles, expertise, and languages.",
    icon: Sparkles,
  },
  {
    key: "enquiry",
    label: "Enquiry",
    description: "Review inbound customer enquiries and follow-up status.",
    icon: HelpCircle,
  },
  {
    key: "customers",
    label: "Customers",
    description: "View customers and track whether they were called.",
    icon: Users,
  },
  {
    key: "followUp",
    label: "Follow Up",
    description: "Track enquiry follow-ups by priority status.",
    icon: ListChecks,
  },
  {
    key: "payments",
    label: "Payments",
    description: "Track generated payment links and payment status.",
    icon: CreditCard,
  },
  {
    key: "support",
    label: "Support",
    description: "Review contact requests and support status.",
    icon: Headset,
  },
  {
    key: "roles",
    label: "Roles",
    description: "Assign admin modules to each role.",
    icon: ShieldCheck,
  },
];

export const MODULES: AdminModule[] = ALL_MODULES.filter(
  (module) => ADMIN_MODULE_FLAGS[module.key]
);

export const PROFESSIONS: SimpleRow[] = [
  { id: 1, title: "Doctor", status: "active", meta: "Health and medical" },
  { id: 2, title: "Engineer", status: "active", meta: "Technical career" },
  { id: 3, title: "Business Owner", status: "inactive", meta: "Trade and commerce" },
];

export const ENQUIRIES: EnquiryRow[] = [
  {
    enq_id: 101,
    customer_name: "Amit Sharma",
    customer_number: "+91 9876543210",
    country_code: "+91",
    mobile: "9876543210",
    problem_name: "Marriage consultation",
    status: 1,
  },
  {
    enq_id: 102,
    customer_name: "Priya Singh",
    customer_number: "+91 9123456780",
    country_code: "+91",
    mobile: "9123456780",
    problem_name: "Career reading",
    status: 1,
    remark: "Customer asked for evening callback.",
  },
  {
    enq_id: 103,
    customer_name: "Rahul Verma",
    customer_number: "+91 9988776655",
    country_code: "+91",
    mobile: "9988776655",
    problem_name: "Payment support",
    status: 2,
    remark: "Resolved on first call.",
  },
];
