export const BOOK_ENQUIRY_EVENT = "book-enquiry:open";

export function openBookEnquiryModal() {
  window.dispatchEvent(new Event(BOOK_ENQUIRY_EVENT));
}
