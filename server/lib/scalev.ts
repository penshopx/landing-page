const SCALEV_API_URL = "https://api.scalev.id/v2";

// ── Subscription plan definitions (moved from mayar.ts, provider-agnostic) ──
export const subscriptionPlans = {
  free_trial: {
    name: "Free Trial",
    duration: 7,
    price: 0,
    chatbotLimit: 1,
    description: "7 hari gratis, 75 pesan, 1 chatbot — via Dialog Gustafta",
  },
  monthly_1: {
    name: "1 Bulan",
    duration: 30,
    price: 199000,
    chatbotLimit: 3,
    description: "Langganan bulanan dengan akses penuh",
  },
  monthly_3: {
    name: "3 Bulan",
    duration: 90,
    price: 499000,
    chatbotLimit: 5,
    description: "Hemat 16% dibanding bulanan",
  },
  monthly_6: {
    name: "6 Bulan",
    duration: 180,
    price: 999000,
    chatbotLimit: 10,
    description: "Hemat 17% dibanding bulanan",
  },
  monthly_12: {
    name: "12 Bulan",
    duration: 365,
    price: 1999000,
    chatbotLimit: 25,
    description: "Hemat 16% dibanding bulanan",
  },
};

export type SubscriptionPlanKey = keyof typeof subscriptionPlans;

export interface ScalevProductResult {
  id: number;
  slug: string;
  name: string;
  checkoutUrl: string;
}

export async function createScalevProduct(params: {
  name: string;
  description?: string;
  price: number;
  variantName?: string;
}): Promise<ScalevProductResult> {
  const apiKey = process.env.SCALEV_API_KEY;
  if (!apiKey) throw new Error("SCALEV_API_KEY tidak ditemukan di environment.");

  const body = {
    name: params.name,
    public_name: params.name,
    description: params.description || params.name,
    item_type: "digital",
    status: "active",
    variants: [{ name: params.variantName || params.name, price: params.price }],
  };

  const res = await fetch(`${SCALEV_API_URL}/products`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = await res.json() as any;
  if (!res.ok || json.code !== 200) {
    const errMsg = JSON.stringify(json?.error || json?.status || json);
    throw new Error(`Scalev API error: ${errMsg}`);
  }

  const product = json.data;
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    checkoutUrl: `https://bayar.gustafta.my.id/p/${product.slug}`,
  };
}
