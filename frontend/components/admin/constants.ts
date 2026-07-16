import { ClipboardList, HelpCircle, ListChecks, Settings } from "lucide-react";
import type { SelectOption } from "@/components/ui/CustomSelect";
import type { AdminModule, EnquiryRow, SimpleRow } from "./types";

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
  { value: "hot", label: "Hot" },
  { value: "warm", label: "Warm" },
  { value: "cold", label: "Cold" },
];

export const MODULES: AdminModule[] = [
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
    key: "enquiry",
    label: "Enquiry",
    description: "Review inbound customer enquiries and follow-up status.",
    icon: HelpCircle,
  },
  {
    key: "followUp",
    label: "Follow Up",
    description: "Track enquiry follow-ups by priority status.",
    icon: ListChecks,
  },
];

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
    problem_name: "Marriage consultation",
    status: "open",
  },
  {
    enq_id: 102,
    customer_name: "Priya Singh",
    customer_number: "+91 9123456780",
    problem_name: "Career reading",
    status: "open",
    remark: "Customer asked for evening callback.",
  },
  {
    enq_id: 103,
    customer_name: "Rahul Verma",
    customer_number: "+91 9988776655",
    problem_name: "Payment support",
    status: "closed",
    remark: "Resolved on first call.",
  },
];
