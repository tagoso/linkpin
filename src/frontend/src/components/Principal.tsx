import { useInternetIdentity } from "ic-use-internet-identity";

export default function Principal({ principal }: { principal?: string }) {
  const { identity } = useInternetIdentity();

  if (!identity || !principal) return null;

  // Get the last 3 characters of the principal
  const principalSuffix = principal.slice(-3);

  return <div className="flex items-center gap-2 whitespace-nowrap">Anti-phishing code: {principalSuffix}</div>;
}
