"use client";

import { useEffect } from "react";
import { openBookEnquiryModal } from "@/lib/book-enquiry-modal";

export default function BookPage() {
  useEffect(() => {
    openBookEnquiryModal();
  }, []);

  return null;
}
