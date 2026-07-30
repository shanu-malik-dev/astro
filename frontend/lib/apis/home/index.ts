import { adminServiceApi, type ServiceDto } from "../services";
import { request, type TenantId } from "../shared";

export interface TestimonialDto {
  id: string;
  customerName: string;
  customerPhotoUrl?: string;
  message: string;
  rating: number;
  isApproved: boolean;
  isFeatured: boolean;
  createdAt: string;
}

export interface BlogPostDto {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl?: string;
  category?: string;
  tags?: string[];
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
}

export const servicesApi = {
  listPublic: (tenantId: TenantId) =>
    adminServiceApi
      .publicList(tenantId)
      .then((response) => response.data || []),
};

export const testimonialsApi = {
  listApproved: (tenantId: TenantId) =>
    request<TestimonialDto[]>("/testimonials", { tenantId, method: "GET" }),
};

export const blogApi = {
  listPublished: (tenantId: TenantId) =>
    request<BlogPostDto[]>("/blog", { tenantId, method: "GET" }),
};
