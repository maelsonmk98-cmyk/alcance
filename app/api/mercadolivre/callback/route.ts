import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const code =
    request.nextUrl.searchParams.get("code");

  const error =
    request.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/anuncios?ml_error=${encodeURIComponent(error)}`,
        request.url
      )
    );
  }

  if (!code) {
    return NextResponse.json(
      {
        error:
          "Código de autorização não recebido.",
      },
      {
        status: 400,
      }
    );
  }

  const clientId =
    process.env.MERCADOLIVRE_CLIENT_ID;

  const clientSecret =
    process.env.MERCADOLIVRE_CLIENT_SECRET;

  const redirectUri =
    process.env.MERCADOLIVRE_REDIRECT_URI;

  if (
    !clientId ||
    !clientSecret ||
    !redirectUri
  ) {
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

  try {
    const tokenResponse = await fetch(
      "https://api.mercadolibre.com/oauth/token",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },

        body: new URLSearchParams({
          grant_type:
            "authorization_code",
          client_id: clientId,
          client_secret:
            clientSecret,
          code,
          redirect_uri:
            redirectUri,
        }),
      }
    );

    const tokenData =
      await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error(
        "Erro Mercado Livre:",
        tokenData
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível obter o token do Mercado Livre.",
          details: tokenData,
        },
        {
          status:
            tokenResponse.status,
        }
      );
    }

    /*
     * Por enquanto apenas confirmamos
     * que a autorização funcionou.
     *
     * No próximo passo vamos salvar
     * access_token e refresh_token
     * com segurança no Supabase.
     */

    console.log(
      "Mercado Livre conectado.",
      {
        user_id:
          tokenData.user_id,
        expires_in:
          tokenData.expires_in,
      }
    );

    return NextResponse.redirect(
      new URL(
        "/anuncios?mercadolivre=conectado",
        request.url
      )
    );
  } catch (error) {
    console.error(
      "Erro no callback Mercado Livre:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro interno ao conectar com o Mercado Livre.",
      },
      {
        status: 500,
      }
    );
  }
}
