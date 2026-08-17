import { NextResponse } from "next/server";

export async function GET() {
  const clientId =
    process.env.MERCADOLIVRE_CLIENT_ID;

  const redirectUri =
    process.env.MERCADOLIVRE_REDIRECT_URI;

  // Verifica se as variáveis necessárias existem
  if (!clientId || !redirectUri) {
    console.error(
      "Mercado Livre: CLIENT_ID ou REDIRECT_URI não configurados."
    );

    return NextResponse.json(
      {
        conectado: false,
        error:
          "Variáveis do Mercado Livre não configuradas.",
      },
      {
        status: 500,
      }
    );
  }

  /*
   * Monta os parâmetros OAuth.
   *
   * IMPORTANTE:
   * MERCADOLIVRE_CLIENT_ID deve conter somente o ID.
   *
   * Exemplo:
   * 6988240592906195
   *
   * MERCADOLIVRE_REDIRECT_URI deve conter somente:
   * https://alcance-blond.vercel.app/api/mercadolivre/callback
   */

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId.trim(),
    redirect_uri: redirectUri.trim(),
  });

  const authorizationUrl =
    `https://auth.mercadolivre.com.br/authorization?${params.toString()}`;

  return NextResponse.redirect(
    authorizationUrl
  );
}