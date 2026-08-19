import { SupabaseClient } from "@supabase/supabase-js";

type MercadoLivreConta = {
  ml_user_id: string | number;
  access_token: string;
  refresh_token: string;
  expires_at: string;
};

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user_id?: number;
  token_type?: string;
  scope?: string;
  error?: string;
  message?: string;
};

type GetAccessTokenResult = {
  accessToken: string;
  mlUserId: string | number;
};

export async function getMercadoLivreAccessToken(
  supabase: SupabaseClient,
  userId: string
): Promise<GetAccessTokenResult> {
  /*
   * ============================================================
   * 1. BUSCAR CONTA DO MERCADO LIVRE
   * ============================================================
   */

  const { data, error } = await supabase
    .from("mercadolivre_contas")
    .select(
      `
        ml_user_id,
        access_token,
        refresh_token,
        expires_at
      `
    )
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    console.error(
      "Erro ao buscar conta Mercado Livre:",
      error
    );

    throw new Error(
      "Nenhuma conta do Mercado Livre conectada."
    );
  }

  const conta = data as MercadoLivreConta;

  if (
    !conta.access_token ||
    !conta.refresh_token ||
    !conta.expires_at ||
    !conta.ml_user_id
  ) {
    throw new Error(
      "Dados da conta do Mercado Livre estão incompletos."
    );
  }

  /*
   * ============================================================
   * 2. VERIFICAR SE O ACCESS TOKEN AINDA É VÁLIDO
   * ============================================================
   *
   * Renovamos 5 minutos antes da expiração.
   *
   * Isso evita que o token expire durante uma requisição
   * que esteja sendo executada.
   */

  const expiresAt = new Date(
    conta.expires_at
  ).getTime();

  const agora = Date.now();

  const margemSeguranca = 5 * 60 * 1000;

  const tokenAindaValido =
    Number.isFinite(expiresAt) &&
    expiresAt - agora > margemSeguranca;

  if (tokenAindaValido) {
    return {
      accessToken: conta.access_token,
      mlUserId: conta.ml_user_id,
    };
  }

  /*
   * ============================================================
   * 3. TOKEN EXPIRADO OU PRÓXIMO DE EXPIRAR
   * ============================================================
   */

  console.log(
    "Access token Mercado Livre expirado ou próximo de expirar. Renovando..."
  );

  const clientId =
    process.env.MERCADOLIVRE_CLIENT_ID;

  const clientSecret =
    process.env.MERCADOLIVRE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Credenciais do Mercado Livre não configuradas."
    );
  }

  /*
   * ============================================================
   * 4. RENOVAR TOKEN
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
        grant_type: "refresh_token",
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: conta.refresh_token,
      }),

      cache: "no-store",
    }
  );

  const tokenData =
    (await tokenResponse.json()) as TokenResponse;

  /*
   * ============================================================
   * 5. TRATAR ERRO DO MERCADO LIVRE
   * ============================================================
   */

  if (!tokenResponse.ok) {
    console.error(
      "Erro ao renovar token Mercado Livre:",
      tokenData
    );

    if (
      tokenData.error === "invalid_grant" ||
      tokenResponse.status === 401
    ) {
      throw new Error(
        "A autorização do Mercado Livre expirou ou foi revogada. Conecte a conta novamente."
      );
    }

    throw new Error(
      tokenData.message ||
        "Não foi possível renovar o token do Mercado Livre."
    );
  }

  /*
   * ============================================================
   * 6. VALIDAR NOVOS TOKENS
   * ============================================================
   */

  const novoAccessToken =
    tokenData.access_token;

  const novoRefreshToken =
    tokenData.refresh_token;

  const expiresIn =
    Number(tokenData.expires_in);

  if (
    !novoAccessToken ||
    !novoRefreshToken ||
    !expiresIn
  ) {
    console.error(
      "Resposta incompleta ao renovar token:",
      tokenData
    );

    throw new Error(
      "O Mercado Livre retornou dados incompletos ao renovar o token."
    );
  }

  /*
   * ============================================================
   * 7. CALCULAR NOVA DATA DE EXPIRAÇÃO
   * ============================================================
   */

  const novoExpiresAt = new Date(
    Date.now() + expiresIn * 1000
  ).toISOString();

  /*
   * ============================================================
   * 8. SALVAR NOVOS TOKENS NO SUPABASE
   * ============================================================
   *
   * IMPORTANTE:
   *
   * Mercado Livre pode gerar um novo refresh_token.
   * Portanto substituímos os DOIS tokens.
   */

  const { error: updateError } =
    await supabase
      .from("mercadolivre_contas")
      .update({
        access_token: novoAccessToken,
        refresh_token: novoRefreshToken,
        expires_at: novoExpiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

  if (updateError) {
    console.error(
      "Erro ao salvar tokens renovados:",
      updateError
    );

    /*
     * NÃO continuamos com o token novo sem salvá-lo.
     *
     * Como o refresh_token pode ter sido rotacionado,
     * perder esse novo valor poderia impedir a próxima
     * renovação.
     */

    throw new Error(
      "O token foi renovado, mas não foi possível salvar a nova autorização."
    );
  }

  console.log(
    "Token Mercado Livre renovado automaticamente.",
    {
      ml_user_id:
        tokenData.user_id ??
        conta.ml_user_id,

      expires_at:
        novoExpiresAt,
    }
  );

  /*
   * ============================================================
   * 9. RETORNAR TOKEN NOVO
   * ============================================================
   */

  return {
    accessToken: novoAccessToken,

    mlUserId:
      tokenData.user_id ??
      conta.ml_user_id,
  };
}