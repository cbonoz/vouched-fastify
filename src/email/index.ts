import { TransactionalEmailsApi, SendSmtpEmail } from "@getbrevo/brevo";
import { APP_NAME } from "../constants";

let apiInstance = new TransactionalEmailsApi();

const BREVO_API_KEY = process.env.BREVO_API_KEY as string;

apiInstance.setApiKey(0, BREVO_API_KEY);

export const DOMAIN = "usevouched.com";
export const NOREPLY_EMAIL = `noreply@${DOMAIN}`;

export const sendEmail = async (toEmail: string, subject: string, body: string) => {
  const sendSmtpEmail = new SendSmtpEmail();

  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = body;
  sendSmtpEmail.sender = { name: APP_NAME, email: NOREPLY_EMAIL };
  sendSmtpEmail.to = [{ email: toEmail, name: "" }];
  sendSmtpEmail.replyTo = { email: NOREPLY_EMAIL, name: APP_NAME };

  // Set fields.
  return apiInstance.sendTransacEmail(sendSmtpEmail);
};

export const sendNewApprovalEmail = async (toEmail: string, handle: string) => {
  const subject = "New endorsement awaiting approval";
  const body = `Hi there, you have a new endorsement awaiting approval for ${handle}. Please login to your account to approve or reject this endorsement.`;
  return sendEmail(toEmail, subject, body);
};

export const sendAccessRequestEmailToAdmin = async (email: string, name: string) => {
  const subject = "New access request";
  const body = `Hi there, ${name} (${email}) has requested access to Vouched.`;
  return sendEmail(email, subject, body);
};

export const sendWelcomeEmail = async (toEmail: string, handle: string) => {
  const subject = "Welcome to Vouched";
  const body = `Hi there, welcome to Vouched. You can use vouched to endorse your colleagues or approve or reject endorsements that have been left for you. <p>Use vouched as your own personal reference checker.</p>`;
  return sendEmail(toEmail, subject, body);
};
