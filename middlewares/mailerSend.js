// mailersend.js

// Importar as dependências necessárias
const { Recipient, EmailParams, MailerSend } = require("mailersend");

// Criar uma classe para facilitar o envio de e-mails usando MailerSend
class MailerSendService {
  constructor(recipientEmail, recipientName, link) {
    this.mailerSend = new MailerSend({
      api_key:
        "mlsn.3be5849ceb6fae0a5eecae06cbaed4989c78485f90af3c5dadccd44465a278c3",
    });
    this.recipientEmail = recipientEmail;
    this.recipientName = recipientName;
    this.link = link;
  }

  async sendEmail() {
    try {
      const recipients = [
        new Recipient(this.recipientEmail, this.recipientName),
      ];

      const personalization = [
        {
          email: this.recipientEmail,
          data: {
            link: this.link,
          },
        },
      ];

      const emailParams = new EmailParams()
        .setFrom("MS_zo0u4y@vdevapi.online")
        .setFromName("Seu Nome")
        .setRecipients(recipients)
        .setSubject("Assunto")
        .setTemplateId("z3m5jgrnqnzldpyo")
        .setPersonalization(personalization);

      const response = await this.mailerSend.send(emailParams);
      return response;
    } catch (error) {
      console.error("Erro ao enviar e-mail:", error);
    }
  }
}

module.exports = MailerSendService;
