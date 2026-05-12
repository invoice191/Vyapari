const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') || '8658673137:AAHK2B-5RMoJPKiOTnU2OygCOhpriOwn4fo';

export async function sendMessage(chatId: string | number, text: string, options: any = {}) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      ...options,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Telegram API error:', error);
    throw new Error(`Telegram API error: ${JSON.stringify(error)}`);
  }

  return response.json();
}
