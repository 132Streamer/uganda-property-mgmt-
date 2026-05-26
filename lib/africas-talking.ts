// lib/africas-talking.ts
// Sends SMS via Africa's Talking REST API (Uganda format: +256...)

const AT_BASE_URL = "https://api.africastalking.com/version1/messaging";

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendSMS(phone: string, message: string): Promise<SMSResult> {
  const apiKey = process.env.AT_API_KEY;
  const username = process.env.AT_USERNAME;

  if (!apiKey || !username) {
    throw new Error("Missing AT_API_KEY or AT_USERNAME env vars");
  }

  // Normalise to +256 format
  const normalised = normaliseUgandaPhone(phone);

  const body = new URLSearchParams({
    username,
    to: normalised,
    message,
    from: "", // uses default shortcode; set if you have a dedicated sender
  });

  const res = await fetch(AT_BASE_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      apiKey,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    return { success: false, error: `HTTP ${res.status}: ${text}` };
  }

  const data = await res.json();
  const recipient = data?.SMSMessageData?.Recipients?.[0];

  if (!recipient || recipient.status !== "Success") {
    return {
      success: false,
      error: recipient?.status ?? "Unknown AT error",
    };
  }

  return { success: true, messageId: recipient.messageId };
}

function normaliseUgandaPhone(phone: string): string {
  // Strip spaces/dashes
  const cleaned = phone.replace(/[\s\-]/g, "");

  if (cleaned.startsWith("+256")) return cleaned;
  if (cleaned.startsWith("256")) return `+${cleaned}`;
  if (cleaned.startsWith("0")) return `+256${cleaned.slice(1)}`;

  // Assume bare local number (7xx xxx xxx)
  return `+256${cleaned}`;
}