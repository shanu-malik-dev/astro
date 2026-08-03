import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { successResponse } from '../../../common/helpers/response.helper';
import { SaveSiteContentDto } from '../dto/save-site-content.dto';
import { SiteContentEntity } from '../entity/site-content.entity';

const DEFAULT_CONTENT: Record<string, string> = {
  'contact.email': 'contact@shreesamriddhiatro.com',
  'social.facebook': 'https://facebook.com/',
  'social.instagram': 'https://instagram.com/',
  'social.youtube': '',
  'legal.terms.updated': 'July 2026',
  'legal.terms.content': `By booking a consultation through Shree Samriddhi Astro, you agree to the terms below. Please read them before completing payment.

## Nature of consultations
Astrology consultations are provided for entertainment, reflection, and personal guidance purposes. They are not a substitute for professional medical, legal, or financial advice.

## Booking & scheduling
Bookings require full payment at the time of scheduling. Slots are held only once payment is confirmed. Rescheduling is available up to 12 hours before your session, subject to availability.

## Conduct
Sessions are conducted respectfully on both sides. Shree Samriddhi Astro reserves the right to end a session early in the event of abusive conduct, without refund.

## Changes to these terms
These terms may be updated periodically; continued use of the service constitutes acceptance of the current version.`,
  'legal.privacy.updated': 'July 2026',
  'legal.privacy.content': `Shree Samriddhi Astro respects your privacy. This Privacy Policy explains what information we collect, how we use it, and the choices you have.

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
If you have questions about this Privacy Policy, please contact us through the contact details on this website.`,
};

@Injectable()
export class SiteContentService {
  constructor(
    @InjectRepository(SiteContentEntity)
    private readonly siteContentRepository: Repository<SiteContentEntity>,
  ) {}

  async publicContent() {
    return successResponse('SITE_CONTENT_FETCHED', await this.getContent());
  }

  async adminContent() {
    return successResponse('SITE_CONTENT_FETCHED', await this.getContent());
  }

  async save(dto: SaveSiteContentDto) {
    const nextValues = dto.values || {};
    const entries = Object.entries(nextValues);
    const nextKeys = entries.map(([key]) => key.trim()).filter(Boolean);

    const existingRecords = await this.siteContentRepository.find();

    for (const [key, value] of entries) {
      const contentKey = key.trim();
      if (!contentKey) continue;

      const existing = existingRecords.find(
        (record) => record.content_key === contentKey,
      );
      const contentValue = String(value ?? '').trim();

      if (existing) {
        existing.content_value = contentValue;
        await this.siteContentRepository.save(existing);
      } else {
        await this.siteContentRepository.save(
          this.siteContentRepository.create({
            content_key: contentKey,
            content_value: contentValue,
          }),
        );
      }
    }

    const defaultKeys = new Set(Object.keys(DEFAULT_CONTENT));
    const removedCustomIds = existingRecords
      .filter(
        (record) =>
          !defaultKeys.has(record.content_key) &&
          !nextKeys.includes(record.content_key),
      )
      .map((record) => record.id);

    if (removedCustomIds.length) {
      await this.siteContentRepository.delete(removedCustomIds);
    }

    return successResponse('SITE_CONTENT_SAVED', await this.getContent());
  }

  private async getContent() {
    const records = await this.siteContentRepository.find();
    const values = { ...DEFAULT_CONTENT };

    records.forEach((record) => {
      values[record.content_key] = record.content_value || '';
    });

    return values;
  }
}
