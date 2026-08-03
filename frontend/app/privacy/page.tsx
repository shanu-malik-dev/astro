import { DynamicLegalContent } from "@/components/legal/DynamicLegalContent";

const fallbackPrivacy = `Shree Samriddhi Astro respects your privacy. This Privacy Policy explains what information we collect, how we use it, and the choices you have.

## 1. Information We Collect
When you fill our enquiry form or book a package, we collect the details you provide such as your name, mobile number, email, state, pin code and selected problem or service.

## 2. How We Use Your Information
We use the information you share to contact you about your enquiry, provide the requested consultation or pooja service, send booking updates, and improve our services.

## 3. Cookies & Analytics
Our website may use analytics and advertising tools to understand visitor behavior and measure communication effectiveness. You can control cookies through your browser settings.

## 4. Sharing of Information
We do not sell or rent your personal information. We share information only with trusted providers who help us operate payments, communication, and service delivery, or where required by law.

## 5. Data Security
We take reasonable measures to protect your information, but no internet transmission method is completely secure.

## 6. Your Rights
You may ask us to review, correct or delete your personal information by contacting us.

## 7. Children's Privacy
Our services are intended for adults. We do not knowingly collect personal information from children under 18 years of age.

## 8. Changes to This Policy
We may update this Privacy Policy from time to time. Updates will be posted on this page with a revised last updated date.

## 9. Contact Us
If you have questions about this Privacy Policy, please contact us through the contact details on this website.`;

export default function PrivacyPage() {
  return (
    <DynamicLegalContent
      title="Privacy Policy"
      updatedKey="legal.privacy.updated"
      contentKey="legal.privacy.content"
      fallbackUpdated="July 2026"
      fallback={fallbackPrivacy}
    />
  );
}
