import SibApiV3Sdk from "@getbrevo/brevo";

let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const BREVO_API_KEY = process.env.BREVO_API_KEY as string;

apiInstance.setApiKey(0, BREVO_API_KEY);

export const sendEmail = async (to: string, subject: string, text: string) => {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

  // Set fields.
  return apiInstance.sendTransacEmail(sendSmtpEmail);
};
