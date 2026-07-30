import { LegalPage } from '@/components/legal/LegalPage';

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="July 2026">
      <p>
        Shree Samriddhi Astro ("we", "us", "our") respects your privacy. This Privacy Policy
        explains what information we collect through shreesamriddhiastro.com, how we use it,
        and the choices you have.
      </p>
      <h2 className="pt-2 text-lg text-ink">1. Information We Collect</h2>
      <p>
        When you fill our enquiry form or book a package, we collect the details you provide
        such as your name, mobile number, email, state, pin code and the problem/service you
        select. When you pay for a package, payment is processed by our payment partner,
        Razorpay; we receive confirmation of payment but never see or store your card, UPI or
        bank account details.
      </p>
      <h2 className="pt-2 text-lg text-ink">2. How We Use Your Information</h2>
      <p>
        We use the information you share to contact you about your enquiry, provide the
        requested consultation or pooja service, send updates related to your booking, and
        improve our services. We may reach out via phone call, SMS, email or WhatsApp.
      </p>
      <h2 className="pt-2 text-lg text-ink">3. Cookies & Analytics</h2>
      <p>
        Our website uses Google Tag Manager, Meta Pixel and Microsoft Clarity to understand how
        visitors use our site and to measure the effectiveness of our communication, so we can
        improve your experience. These tools may set cookies in your browser. You can control
        or disable cookies through your browser settings at any time.
      </p>
      <h2 className="pt-2 text-lg text-ink">4. Sharing of Information</h2>
      <p>
        We do not sell or rent your personal information to anyone. We share information only
        with trusted service providers who help us run our business - such as Razorpay for
        payment processing and WhatsApp for communication - solely for the purpose of delivering
        our services to you, or where required by law.
      </p>
      <h2 className="pt-2 text-lg text-ink">5. Data Security</h2>
      <p>
        We take reasonable technical and organisational measures to protect your information
        from unauthorised access, alteration or misuse. However, no method of transmission over
        the internet is completely secure, and we cannot guarantee absolute security.
      </p>
      <h2 className="pt-2 text-lg text-ink">6. Your Rights</h2>
      <p>
        You may ask us to review, correct or delete the personal information we hold about you
        at any time by writing to us at contactus@shreesamriddhiastro.com.
      </p>
      <h2 className="pt-2 text-lg text-ink">7. Children's Privacy</h2>
      <p>
        Our services are intended for adults. We do not knowingly collect personal information
        from children under 18 years of age.
      </p>
      <h2 className="pt-2 text-lg text-ink">8. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time to reflect changes in our practices.
        Any updates will be posted on this page with a revised "Last updated" date.
      </p>
      <h2 className="pt-2 text-lg text-ink">9. Contact Us</h2>
      <p>
        If you have any questions about this Privacy Policy or how we handle your data, please
        contact us at contactus@shreesamriddhiastro.com or WhatsApp +91 8958979467.
        Registered office:
      </p>
    </LegalPage>
  );
}
