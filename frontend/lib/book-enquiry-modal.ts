export const BOOK_ENQUIRY_EVENT = "book-enquiry:open";

export type BookEnquiryPayload = {
  concern?: {
    value: string | number;
    label: string;
  };
};

export function openBookEnquiryModal(payload?: BookEnquiryPayload) {
  window.dispatchEvent(
    new CustomEvent<BookEnquiryPayload>(BOOK_ENQUIRY_EVENT, {
      detail: payload,
    })
  );
}
