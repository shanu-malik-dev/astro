import type { LucideIcon } from "lucide-react";

export type ModuleKey =
  | "dashboard"
  | "master"
  | "services"
  | "astrologers"
  | "enquiry"
  | "followUp"
  | "payments"
  | "shop"
  | "products"
  | "support"
  | "roles"
  | "content"
  | "countryCodes"
  | "users";

export type MasterModuleKey =
  | "users"
  | "services"
  | "products"
  | "roles"
  | "content"
  | "astrologers"
  | "countryCodes";

export type DashboardFilterPreset = "today" | "mtd" | "custom";

export type AdminDateFilter = {
  preset: DashboardFilterPreset;
  start: string;
  end: string;
};

export type Translation = {
  lang: string;
  label: string;
  name: string;
};

export type ServiceTranslation = Translation & {
  description: string;
};

export type AstrologerTranslation = ServiceTranslation & {
  expertise: string;
};

export type Problem = {
  id: number;
  createdAt?: string;
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
  createdAt?: string;
  displayOrder: number;
  status: "active" | "inactive";
  translations: ServiceTranslation[];
};

export type AstrologerRow = {
  id: number;
  createdAt?: string;
  image: string;
  experience: string;
  languages: string;
  rating: number;
  consultations: string;
  status: "active" | "inactive";
  translations: AstrologerTranslation[];
};

export type ProductRow = {
  id: number;
  createdAt?: string;
  productCode: string;
  productImage: string;
  productPrice: number;
  displayOrder: number;
  status: "active" | "inactive";
  translations: ServiceTranslation[];
};

export type EnquiryStatus = number;

export type EnquiryRow = {
  enq_id: number;
  created_at?: string;
  customer_name: string;
  customer_number: string;
  country_code: string;
  mobile: string;
  problem_name: string;
  status: EnquiryStatus;
  remark?: string;
};

export type FollowUpStatus = number;

export type FollowUpRow = {
  followup_id: number;
  created_at?: string;
  enq_id: number;
  customer_name: string;
  customer_number: string;
  problem_name: string;
  remark: string;
  status: FollowUpStatus;
  follow_up_at?: string;
};

export type AdminModule = {
  key: ModuleKey;
  label: string;
  description: string;
  icon: LucideIcon;
};
