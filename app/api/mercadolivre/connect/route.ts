import { NextResponse } from "next/server";

export async function GET() {
  const clientId =
    process.env.MERCADOLIVRE_CLIENT_ID;

  const redirectUri =
    process.env.MERCADOLIVRE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      {
        error:
          "Variáveis do Mercado Livre não configuradas.",
      },
      {
        status: 500,
      }
    );
  }

  const params =
    new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
    });

  const url =
    `https://auth.mercadolivre.com.br/authorization?${params.toString()}`;

  return NextResponse.redirect(url);
}
