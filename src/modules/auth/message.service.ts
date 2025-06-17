import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Transporter, createTransport, SendEmailOptions } from 'nodemailer';
import { SendEmailDto } from './dto/send-email.dto';

@Injectable()
export class MessageService {
  private mailTransport: Transporter;

  constructor(private configService: ConfigService) {
    this.mailTransport = createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(data: SendEmailDto) {
    const { sender, recipients, subject, html, text } = data;

    const mailOptions: SendEmailOptions = {
      from: sender ?? {
        name: process.env.MAIL_SENDER_NAME_DEFAULT,
        address: process.env.MAIL_SENDER_DEFAULT,
      },
      to: recipients,
      subject,
      html,
      text,
    };

    try {
      await this.mailTransport.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.log(error);
      return null;
    }
  }
}
