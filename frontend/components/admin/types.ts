import type { LucideIcon } from "lucide-react";

export type ModuleKey = "problem" | "services" | "enquiry" | "followUp";

export type Translation = {
  lang: string;
  label: string;
  name: string;
};

export type ServiceTranslation = Translation & {
  description: string;
};

export type Problem = {
  id: number;
  displayOrder: number;
  status: "active" | "inactive";
  translations: Translation[];
};

export type SimpleRow = {
  id: number;
  title: string;
  status: "active" | "inactive" | "new" | "closed";
  meta: string;
};

export type ServiceRow = {
  id: number;
  displayOrder: number;
  status: "active" | "inactive";
  translations: ServiceTranslation[];
};

export type EnquiryStatus = "open" | "closed";

export type EnquiryRow = {
  enq_id: number;
  customer_name: string;
  customer_number: string;
  problem_name: string;
  status: EnquiryStatus;
  remark?: string;
};

export type FollowUpStatus = "hot" | "warm" | "cold";

export type FollowUpRow = {
  followup_id: number;
  enq_id: number;
  customer_name: string;
  customer_number: string;
  problem_name: string;
  remark: string;
  status: FollowUpStatus;
};

export type AdminModule = {
  key: ModuleKey;
  label: string;
  description: string;
  icon: LucideIcon;
};
