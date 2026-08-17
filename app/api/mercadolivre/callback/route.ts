import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");

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
        error: "Código de autorização não recebido.",
      },
      {
        status: 400,
      }
    );
  }

  const clientId = process.env.MERCADOLIVRE_CLIENT_ID;
  const clientSecret = process.env.MERCADOLIVRE_CLIENT_SECRET;
  const redirectUri = process.env.MERCADOLIVRE_REDIRECT_URI;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (
    !clientId ||
    !clientSecret ||
    !redirectUri ||
    !supabaseUrl ||
    !supabaseAnonKey
  ) {
    return NextResponse.json(
      {
        error: "Variáveis de ambiente não configuradas.",
      },
      {
        status: 500,
      }
    );
  }

  try {
    /*
     * ============================================================
     * 1. RECUPERAR USUÁRIO LOGADO NO ALCANCE
     * ============================================================
     */

    const cookieStore = await cookies();

    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },

          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(
                ({ name, value, options }) => {
                  cookieStore.set(name, value, options);
                }
              );
            } catch {
              // Pode ocorrer em contexto onde os cookies
              // não podem ser alterados.
            }
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error(
        "Usuário Supabase não encontrado:",
        userError
      );

      return NextResponse.redirect(
        new URL(
          "/login?erro=mercadolivre_sessao",
          request.url
        )
      );
    }

    /*
     * ============================================================
     * 2. TROCAR CODE PELOS TOKENS DO MERCADO LIVRE
     * ============================================================
     */

    const tokenResponse = await fetch(
      "https://api.mercadolibre.com/oauth/token",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },

        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri,
        }),
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error(
        "Erro ao obter token Mercado Livre:",
        tokenData
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível obter o token do Mercado Livre.",
          details: tokenData,
        },
        {
          status: tokenResponse.status,
        }
      );
    }

    /*
     * ============================================================
     * 3. VALIDAR RESPOSTA DO MERCADO LIVRE
     * ============================================================
     */

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const mlUserId = tokenData.user_id;
    const expiresIn = Number(tokenData.expires_in);

    if (
      !accessToken ||
      !refreshToken ||
      !mlUserId ||
      !expiresIn
    ) {
      console.error(
        "Resposta incompleta do Mercado Livre:",
        tokenData
      );

      return NextResponse.json(
        {
          error:
            "O Mercado Livre retornou dados incompletos.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * ============================================================
     * 4. CALCULAR EXPIRAÇÃO DO TOKEN
     * ============================================================
     */

    const expiresAt = new Date(
      Date.now() + expiresIn * 1000
    ).toISOString();

    /*
     * ============================================================
     * 5. SALVAR / ATUALIZAR CONTA NO SUPABASE
     * ============================================================
     *
     * Como user_id é UNIQUE:
     *
     * - primeira conexão = INSERT
     * - nova autorização = UPDATE automático
     */

    const { error: saveError } = await supabase
      .from("mercadolivre_contas")
      .upsert(
        {
          user_id: user.id,
          ml_user_id: mlUserId,
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      );

    if (saveError) {
      console.error(
        "Erro ao salvar conta Mercado Livre:",
        saveError
      );

      return NextResponse.json(
        {
          error:
            "A conta foi autorizada, mas não foi possível salvar a conexão.",
          details: saveError,
        },
        {
          status: 500,
        }
      );
    }

    /*
     * ============================================================
     * 6. CONEXÃO CONCLUÍDA
     * ============================================================
     */

    console.log(
      "Mercado Livre conectado e salvo.",
      {
        alcance_user_id: user.id,
        ml_user_id: mlUserId,
        expires_at: expiresAt,
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