import { NextRequest } from 'next/server';
import {
  RateLimiter,
  getClientIP,
  sanitizeInput,
  sanitizeForHtml,
  successResponse,
  errorResponse,
  rateLimitResponse,
  configErrorResponse,
  serverErrorResponse,
  logError,
} from '@/lib/api-helpers';
import { validateCSRFToken } from '@/lib/csrf';
import { quoteSchema, parseSchema } from '@/lib/schemas';

// Rate limiter: 5 requests per minute per IP
const rateLimiter = new RateLimiter({ maxRequests: 5 });

// Brevo configuration
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'info@shammasdevelopment.io';
const SENDER_NAME = process.env.BREVO_SENDER_NAME || 'Shammas Development';
const COMPANY_EMAIL = 'info@shammasdevelopment.io';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shammasdevelopment.io';

// Send notification email to Shammas Development
async function sendNotificationToCompany(data: { name: string; email: string; summary: string }): Promise<boolean> {
  try {
    const emailData = {
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to: [{ email: COMPANY_EMAIL, name: 'Shammas Development' }],
      subject: `New Quote Request from ${data.name}`,
      htmlContent: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Quote Request</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%;">

          <!-- Header -->
          <tr>
            <td style="background-color: #171717; padding: 32px 40px; border-radius: 16px 16px 0 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">New Quote Request</h1>
                    <p style="margin: 8px 0 0 0; color: #a3a3a3; font-size: 14px;">A potential client has submitted a project inquiry</p>
                  </td>
                  <td align="right" style="vertical-align: top;">
                    <span style="display: inline-block; background-color: #22c55e; color: #ffffff; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">NEW LEAD</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="background-color: #ffffff; padding: 40px;">

              <!-- Client Info -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 32px;">
                <tr>
                  <td style="padding-bottom: 16px; border-bottom: 1px solid #e5e5e5;">
                    <p style="margin: 0 0 4px 0; color: #737373; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Client Name</p>
                    <p style="margin: 0; color: #171717; font-size: 18px; font-weight: 600;">${data.name}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 0; border-bottom: 1px solid #e5e5e5;">
                    <p style="margin: 0 0 4px 0; color: #737373; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Email Address</p>
                    <p style="margin: 0;">
                      <a href="mailto:${data.email}" style="color: #171717; font-size: 16px; text-decoration: none;">${data.email}</a>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Project Summary -->
              <div style="background-color: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
                <p style="margin: 0 0 12px 0; color: #737373; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Project Summary</p>
                <div style="color: #171717; font-size: 14px; line-height: 1.7; white-space: pre-wrap;">${data.summary}</div>
              </div>

              <!-- CTA -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="mailto:${data.email}?subject=Re: Your Quote Request - Shammas Development" style="display: inline-block; background-color: #171717; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">Reply to ${data.name}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; padding: 24px 40px; border-radius: 0 0 16px 16px; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0; color: #737373; font-size: 12px; text-align: center;">
                This is an automated notification from your website's quote form.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
      textContent: `
NEW QUOTE REQUEST
=================

Client: ${data.name}
Email: ${data.email}

PROJECT SUMMARY:
${data.summary}

---
Reply to this lead: ${data.email}
      `,
    };

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY!,
      },
      body: JSON.stringify(emailData),
    });

    return response.ok;
  } catch (error) {
    logError('Quote notification email', error);
    return false;
  }
}

// Send confirmation email to the user
async function sendConfirmationToUser(data: { name: string; email: string; summary: string }): Promise<boolean> {
  try {
    const emailData = {
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to: [{ email: data.email, name: data.name }],
      subject: 'Your Project Plan Summary - Shammas Development',
      htmlContent: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Project Plan Summary</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <a href="${SITE_URL}" style="text-decoration: none; color: #ffffff; font-size: 24px; font-weight: 700;">Shammas Development</a>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden;">

                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #171717 0%, #262626 100%); padding: 48px 40px; text-align: center;">
                    <div style="width: 64px; height: 64px; background-color: #ffffff; border-radius: 50%; margin: 0 auto 20px auto; line-height: 64px;">
                      <span style="font-size: 28px;">&#128203;</span>
                    </div>
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Your Plan Summary</h1>
                    <p style="margin: 12px 0 0 0; color: #a3a3a3; font-size: 16px;">Thank you for your interest, ${data.name}!</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 24px 0; color: #171717; font-size: 16px; line-height: 1.7;">
                      We've received your project inquiry and saved your plan summary below. Our team will review your requirements and get back to you within <strong>24-48 hours</strong>.
                    </p>

                    <!-- Summary Box -->
                    <div style="background-color: #f9fafb; border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #171717;">
                      <p style="margin: 0 0 12px 0; color: #737373; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Your Project Summary</p>
                      <div style="color: #171717; font-size: 14px; line-height: 1.8; white-space: pre-wrap;">${data.summary}</div>
                    </div>

                    <!-- What's Next -->
                    <div style="margin: 32px 0;">
                      <h2 style="margin: 0 0 16px 0; color: #171717; font-size: 18px; font-weight: 600;">What happens next?</h2>
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="padding: 12px 0;">
                            <table role="presentation" cellspacing="0" cellpadding="0">
                              <tr>
                                <td style="width: 32px; vertical-align: top;">
                                  <div style="width: 24px; height: 24px; background-color: #171717; border-radius: 50%; text-align: center; line-height: 24px; color: #ffffff; font-size: 12px; font-weight: 600;">1</div>
                                </td>
                                <td style="padding-left: 12px; color: #525252; font-size: 14px; line-height: 1.5;">
                                  <strong style="color: #171717;">Review</strong> — Our team reviews your requirements
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 0;">
                            <table role="presentation" cellspacing="0" cellpadding="0">
                              <tr>
                                <td style="width: 32px; vertical-align: top;">
                                  <div style="width: 24px; height: 24px; background-color: #171717; border-radius: 50%; text-align: center; line-height: 24px; color: #ffffff; font-size: 12px; font-weight: 600;">2</div>
                                </td>
                                <td style="padding-left: 12px; color: #525252; font-size: 14px; line-height: 1.5;">
                                  <strong style="color: #171717;">Connect</strong> — We'll reach out to schedule a discovery call
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 0;">
                            <table role="presentation" cellspacing="0" cellpadding="0">
                              <tr>
                                <td style="width: 32px; vertical-align: top;">
                                  <div style="width: 24px; height: 24px; background-color: #171717; border-radius: 50%; text-align: center; line-height: 24px; color: #ffffff; font-size: 12px; font-weight: 600;">3</div>
                                </td>
                                <td style="padding-left: 12px; color: #525252; font-size: 14px; line-height: 1.5;">
                                  <strong style="color: #171717;">Proposal</strong> — Receive a detailed scope and timeline
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </div>

                    <!-- CTA -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center" style="padding-top: 16px;">
                          <a href="${SITE_URL}/contact" style="display: inline-block; background-color: #171717; color: #ffffff; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">Schedule a Call Now</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 20px; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #737373; font-size: 14px; font-weight: 500;">
                Shammas Development LLC
              </p>
              <p style="margin: 0 0 16px 0; color: #525252; font-size: 13px;">
                Remote-first &bull; Serving clients across the United States
              </p>
              <p style="margin: 0; color: #525252; font-size: 12px;">
                Questions? Reply to this email or contact us at <a href="mailto:info@shammasdevelopment.io" style="color: #a3a3a3;">info@shammasdevelopment.io</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
      textContent: `
YOUR PROJECT PLAN SUMMARY
=========================

Hi ${data.name},

Thank you for your interest in Shammas Development! We've received your project inquiry and saved your plan summary below.

YOUR PROJECT SUMMARY:
${data.summary}

WHAT HAPPENS NEXT?
1. Review — Our team reviews your requirements
2. Connect — We'll reach out to schedule a discovery call
3. Proposal — Receive a detailed scope and timeline

We'll be in touch within 24-48 hours.

Schedule a call: ${SITE_URL}/contact

---
Shammas Development LLC
Remote-first | Serving clients across the United States

Questions? Reply to this email or contact us at info@shammasdevelopment.io
      `,
    };

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY!,
      },
      body: JSON.stringify(emailData),
    });

    return response.ok;
  } catch (error) {
    logError('Quote confirmation email', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate CSRF token
    const isValidCSRF = await validateCSRFToken(request);
    if (!isValidCSRF) {
      return errorResponse('Invalid or missing CSRF token. Please refresh the page and try again.', 403, 'CSRF_ERROR');
    }

    const ip = getClientIP(request);

    if (!rateLimiter.check(ip)) {
      return rateLimitResponse();
    }

    const body = await request.json();

    // Validate with Zod schema
    const validation = parseSchema(quoteSchema, body);
    if (!validation.success) {
      return errorResponse(validation.error);
    }

    const { name, email, summary } = validation.data;

    const sanitizedData = {
      name: sanitizeInput(name),
      email: sanitizeInput(email).toLowerCase(),
      summary: sanitizeInput(summary, 10000),
    };

    // HTML-escaped version for email templates (prevents XSS)
    const htmlSafeData = {
      name: sanitizeForHtml(name),
      email: sanitizeForHtml(email).toLowerCase(),
      summary: sanitizeForHtml(summary, 10000),
    };

    if (!BREVO_API_KEY) {
      logError('Quote API', 'BREVO_API_KEY not configured');
      return configErrorResponse();
    }

    // Send both emails in parallel (use HTML-safe data for email templates)
    const [companyEmailSent, userEmailSent] = await Promise.all([
      sendNotificationToCompany(htmlSafeData),
      sendConfirmationToUser(htmlSafeData),
    ]);

    if (companyEmailSent && userEmailSent) {
      return successResponse(undefined, 'Your plan summary has been sent to your email!');
    } else if (companyEmailSent) {
      return successResponse(undefined, 'Request received! We\'ll be in touch soon.');
    } else {
      return serverErrorResponse('Unable to send email. Please try again or contact us directly at info@shammasdevelopment.io');
    }
  } catch (error) {
    logError('Quote API', error);
    return serverErrorResponse('An error occurred. Please try again or contact us directly at info@shammasdevelopment.io');
  }
}

export async function OPTIONS() {
  return successResponse();
}
