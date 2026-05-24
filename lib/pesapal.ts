// lib/pesapal.ts

interface PesapalToken {
  token: string
  expiryDate: string
}

let cachedToken: PesapalToken | null = null

export async function getPesapalToken(): Promise<string> {
  // Return cached token if still valid (with 5-min buffer)
  if (cachedToken) {
    const expiry = new Date(cachedToken.expiryDate).getTime()
    if (Date.now() < expiry - 5 * 60 * 1000) {
      return cachedToken.token
    }
  }

  const res = await fetch(`${process.env.PESAPAL_BASE_URL}/api/Auth/RequestToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      consumer_key: process.env.PESAPAL_CONSUMER_KEY,
      consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
    }),
  })

  if (!res.ok) {
    throw new Error(`Pesapal auth failed: ${res.status} ${await res.text()}`)
  }

  const data = await res.json()

  if (data.status !== '200') {
    throw new Error(`Pesapal auth error: ${data.message}`)
  }

  cachedToken = { token: data.token, expiryDate: data.expiryDate }
  return cachedToken.token
}

export async function getTransactionStatus(orderTrackingId: string) {
  const token = await getPesapalToken()

  const res = await fetch(
    `${process.env.PESAPAL_BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    }
  )

  if (!res.ok) {
    throw new Error(`GetTransactionStatus failed: ${res.status}`)
  }

  return res.json()
}