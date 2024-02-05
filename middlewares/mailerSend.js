// mailersend.js

//const { MailerSend, EmailParams, Sender, Recipient } from "mailersend";

const { MailerSend, EmailParams, Sender, Recipient } = require("mailersend");
class MailerSendService {
  constructor(apiKey, recipientEmail, link) {
    this.mailerSend = new MailerSend({
      apiKey: apiKey,
    });
    this.recipientEmail = recipientEmail;
    this.link = link;
  }

  async sendEmail() {
    try {
      const sentFrom = new Sender("MS_zo0u4y@vdevapi.online", "Your name");

      const recipients = [new Recipient(this.recipientEmail, "Recipient Name")];

      const personalization = [
        {
          link: this.link,
        },
      ];

      const emailParams = new EmailParams()
        .setFrom(sentFrom)
        .setTo(recipients)
        .setTemplateId("z3m5jgrnqnzldpyo")
        .setPersonalization(personalization)
        .setSubject("REDEIFINIÇÃO DE SENHA");

      const response = await this.mailerSend.email.send(emailParams);
      return response;
    } catch (error) {
      console.error("Erro ao enviar e-mail:", error);
    }
  }
}

module.exports = MailerSendService;
