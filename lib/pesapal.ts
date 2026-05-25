// lib/pesapal.ts

const BASE_URL = process.env.PESAPAL_BASE_URL!;
const CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY!;
const CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET!;

export interface PesapalToken {
  token: string;
  expiryDate: string;
}

export interface IPNRegistration {
  ipn_id: string;
  url: string;
  created_date: string;
  ipn_notification_type: string;
  ipn_notification_type_description: string;
  ipn_status: number;
  ipn_status_description: string;
  error?: { code: string | null; message: string | null };
  status: string;
}

export interface OrderSubmission {
  order_tracking_id: string;
  merchant_reference: string;
  redirect_url: string;
  error?: { code: string | null; message: string | null };
  status: string;
}

export interface TransactionStatus {
  payment_method: string;
  amount: number;
  created_date: string;
  confirmation_code: string;
  payment_status_description: string; // "Completed" | "Failed" | "Invalid" | "Reversed"
  description: string;
  message: string;
  name: string;
  payment_account: string;
  cell_phone_number: string;
  currency: string;
  status_code: number;
  merchant_reference: string;
  payment_status_code: string;
  order_tracking_id: string;
  error?: { code: string | null; message: string | null };
  status: string;
}

/** Fetch a short-lived bearer token from Pesapal. */
export async function getAuthToken(): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/Auth/RequestToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      consumer_key: CONSUMER_KEY,
      consumer_secret: CONSUMER_SECRET,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pesapal auth failed (${res.status}): ${text}`);
  }

  const data: PesapalToken & { error?: { message: string } } = await res.json();
  if (data.error?.message) throw new Error(`Pesapal auth error: ${data.error.message}`);
  return data.token;
}

/** Register (or re-register) the IPN endpoint. Returns the ipn_id. */
export async function registerIPN(token: string, ipnUrl: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/URLSetup/RegisterIPN`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      url: ipnUrl,
      ipn_notification_type: "POST",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`IPN registration failed (${res.status}): ${text}`);
  }

  const data: IPNRegistration = await res.json();
  if (data.error?.message) throw new Error(`IPN registration error: ${data.error.message}`);
  return data.ipn_id;
}

export interface SubmitOrderParams {
  token: string;
  ipnId: string;
  merchantReference: string; // unique per order
  amount: number;
  currency: string;
  description: string;
  callbackUrl: string;
  payerName: string;
  payerEmail: string;
  payerPhone: string;
}

/** Submit an order to Pesapal. Returns redirect URL and tracking ID. */
export async function submitOrder(params: SubmitOrderParams): Promise<OrderSubmission> {
  const [firstName, ...rest] = params.payerName.trim().split(" ");
  const lastName = rest.join(" ") || firstName;

  const body = {
    id: params.merchantReference,
    currency: params.currency,
    amount: params.amount,
    description: params.description,
    callback_url: params.callbackUrl,
    notification_id: params.ipnId,
    billing_address: {
      email_address: params.payerEmail,
      phone_number: params.payerPhone,
      first_name: firstName,
      last_name: lastName,
    },
  };

  const res = await fetch(`${BASE_URL}/api/Transactions/SubmitOrderRequest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${params.token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Order submission failed (${res.status}): ${text}`);
  }

  const data: OrderSubmission = await res.json();
  if (data.error?.message) throw new Error(`Order submission error: ${data.error.message}`);
  return data;
}

/** Query transaction status by orderTrackingId. */
export async function getTransactionStatus(
  token: string,
  orderTrackingId: string
): Promise<TransactionStatus> {
  const res = await fetch(
    `${BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Status query failed (${res.status}): ${text}`);
  }

  const data: TransactionStatus = await res.json();
  if (data.error?.message) throw new Error(`Status query error: ${data.error.message}`);
  return data;
}