
export function generateTelegramDeepLink(
  botUsername: string,
  businessId: string
): string {
  return `https://t.me/${botUsername}?start=${businessId}`;
}

export function openTelegramDeepLink(
  botUsername: string,
  businessId: string
): void {
  const link = generateTelegramDeepLink(botUsername, businessId);
  window.open(link, "_blank");
}
