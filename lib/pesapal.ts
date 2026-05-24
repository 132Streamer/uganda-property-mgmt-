const PESAPAL_BASE_URL =
  process.env.PESAPAL_BASE_URL ?? "https://cybqa.pesapal.com/pesapalv3";
const CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY!;
const CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET!;

export interface PesapalTokenResponse {
  token: string;
  expiryDate: string;
  error?: string;
  message?: string;
}

export interface IPNResponse {
  url: string;
  created_date: string;
  ipn_id: string;
  notification_type: string;
  ipn_notification_type_description: string;
  ipn_status: number;
  ipn_status_decription: string;
  error?: { code: string; message: string } | null;
  status: string;
}

export interface SubmitOrderParams {
  id: string; // your internal order/reference ID
  currency: "UGX";
  amount: number;
  description: string;
  callbackUrl: string;
  notificationId: string; // IPN ID from registerIPN
  billingAddress: {
    email_address: string;
    phone_number?: string;
    first_name: string;
    last_name: string;
  };
}

export interface SubmitOrderResponse {
  order_tracking_id: string;
  merchant_reference: string;
  redirect_url: string;
  error?: string;
  status?: string;
}

export interface TransactionStatusResponse {
  payment_method: string;
  amount: number;
  created_date: string;
  confirmation_code: string;
  payment_status_description: "Completed" | "Failed" | "Invalid" | "Reversed";
  description: string;
  message: string;
  payment_account: string;
  call_back_url: string;
  status_code: number;
  merchant_reference: string;
  payment_status_code: string;
  currency: string;
  error?: { code: string; message: string } | null;
  status: string;
}

export async function getAccessToken(): Promise<string> {
  const res = await fetch(`${PESAPAL_BASE_URL}/api/Auth/RequestToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      consumer_key: CONSUMER_KEY,
      consumer_secret: CONSUMER_SECRET,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Pesapal auth failed: ${res.status} ${res.statusText}`);
  }

  const data: PesapalTokenResponse = await res.json();

  if (data.error) {
    throw new Error(`Pesapal auth error: ${data.message}`);
  }

  return data.token;
}

export async function registerIPN(ipnUrl: string): Promise<string> {
  const token = await getAccessToken();

  const res = await fetch(
    `${PESAPAL_BASE_URL}/api/URLSetup/RegisterIPN`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        url: ipnUrl,
        ipn_notification_type: "GET",
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`IPN registration failed: ${res.status} ${res.statusText}`);
  }

  const data: IPNResponse = await res.json();

  if (data.error) {
    throw new Error(
      `IPN registration error: ${data.error.message ?? "Unknown error"}`
    );
  }

  return data.ipn_id;
}

export async function submitOrder(
  params: SubmitOrderParams
): Promise<SubmitOrderResponse> {
  const token = await getAccessToken();

  const res = await fetch(
    `${PESAPAL_BASE_URL}/api/Transactions/SubmitOrderRequest`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id: params.id,
        currency: params.currency,
        amount: params.amount,
        description: params.description,
        callback_url: params.callbackUrl,
        notification_id: params.notificationId,
        billing_address: params.billingAddress,
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Order submission failed: ${res.status} ${res.statusText}`);
  }

  const data: SubmitOrderResponse = await res.json();

  if (data.error) {
    throw new Error(`Order submission error: ${data.error}`);
  }

  return data;
}

export async function getTransactionStatus(
  orderTrackingId: string
): Promise<TransactionStatusResponse> {
  const token = await getAccessToken();

  const res = await fetch(
    `${PESAPAL_BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error(
      `Transaction status check failed: ${res.status} ${res.statusText}`
    );
  }

  const data: TransactionStatusResponse = await res.json();

  if (data.error) {
    throw new Error(
      `Transaction status error: ${data.error.message ?? "Unknown error"}`
    );
  }

  return data;
}