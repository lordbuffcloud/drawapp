import { getPublicEnv } from "../../src/lib/env";
import { ProClient } from "./proClient";

export default function ProPage() {
  const env = getPublicEnv();
  return <ProClient checkoutUrl={env.NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL ?? process.env.LEMONSQUEEZY_CHECKOUT_URL ?? ""} />;
}


