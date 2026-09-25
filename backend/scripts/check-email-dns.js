require("dotenv").config();

const dns = require("dns/promises");

function senderDomain() {
  const from = String(process.env.SMTP_FROM || "");
  const match = from.match(/<([^>]+)>/) || from.match(/([^\s]+@[^\s]+)/);
  const email = match?.[1] || "";
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) throw new Error("SMTP_FROM não contém um endereço válido");
  return domain;
}

async function txtRecords(name) {
  try {
    return (await dns.resolveTxt(name)).map((parts) => parts.join(""));
  } catch (error) {
    if (["ENODATA", "ENOTFOUND"].includes(error.code)) return [];
    throw error;
  }
}

async function checkEmailDns() {
  const domain = senderDomain();
  const configuredSelector = String(process.env.DKIM_SELECTOR || "").trim();
  const smtpHost = String(process.env.SMTP_HOST || "").trim().toLowerCase();
  const inferredSelector = smtpHost === "smtp.gmail.com" ? "google" : "";
  const selector = configuredSelector || inferredSelector;
  const [rootRecords, dmarcRecords, dkimRecords] = await Promise.all([
    txtRecords(domain),
    txtRecords(`_dmarc.${domain}`),
    selector ? txtRecords(`${selector}._domainkey.${domain}`) : Promise.resolve([]),
  ]);
  const result = {
    domain,
    dkim: selector
      ? dkimRecords.some((value) => /^v=DKIM1\b/i.test(value))
      : null,
    dkimSelector: selector || null,
    dkimSelectorSource: configuredSelector ? "configured" : inferredSelector ? "provider" : null,
    dmarc: dmarcRecords.some((value) => /^v=DMARC1\b/i.test(value)),
    spf: rootRecords.some((value) => /^v=spf1\b/i.test(value)),
  };
  console.log(JSON.stringify(result, null, 2));
  if (!result.spf || !result.dmarc || (selector && !result.dkim)) process.exitCode = 1;
}

checkEmailDns().catch((error) => {
  console.error("Falha ao verificar DNS de e-mail:", error.message);
  process.exitCode = 1;
});
