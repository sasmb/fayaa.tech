import { type EmailSender } from "@wasp.sh/spec";

export const emailSender: EmailSender = {
  provider: "SendGrid",
  defaultFrom: {
    name: "FAYAA",
    email: "sam@nepocommerce.com",
  },
};
