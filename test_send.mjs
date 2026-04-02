import { Resend } from 'resend';
import 'dotenv/config';

const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_FROM = process.env.EMAIL_FROM || "PGMentor <noreply@pgmentor.in>";

async function testSend() {
  try {
    const data = await resend.emails.send({
      from: EMAIL_FROM,
      to: ['drnarayanak@gmail.com'],
      subject: "Test Email from Resend",
      html: "<p>This is a test email to check if the sender domain is verified.</p>"
    });
    console.log("SEND_API_RESULT:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.log("SEND_API_ERROR:", error.message || error);
  }
}

testSend();
