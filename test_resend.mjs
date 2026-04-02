import { Resend } from 'resend';
import 'dotenv/config';

const resend = new Resend(process.env.RESEND_API_KEY);

async function testResend() {
  try {
    const data = await resend.apiKeys.list();
    console.log("SUCCESS: API Key is valid.", data);
  } catch (error) {
    console.error("ERROR:", error.message || error);
  }
}

testResend();
