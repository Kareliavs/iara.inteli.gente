# API do inteli.gente

## Configuração do formulário autodeclaratório

1. Copie as variáveis de `.env.example` para `.env` e configure `AUTH_SECRET` com pelo menos 32 caracteres aleatórios.
2. Execute `npm run db:migrate-form` para aplicar, em ordem, as migrações do diretório `migrations` no PostgreSQL.
3. Gere o hash de cada senha sem colocá-la no histórico do banco:

```powershell
$env:USER_PASSWORD='uma-senha-segura'
npm run auth:hash-password
Remove-Item Env:USER_PASSWORD
```

4. Grave o hash retornado em `bd.usuario.usuario_senha`. As senhas usam `scrypt` assíncrono com salt aleatório de 16 bytes e parâmetros `N=32768`, `r=8` e `p=3`. O formato armazenado é `scrypt$N$r$p$salt$hash`, permitindo aumentar o custo no futuro. Hashes antigos no formato `scrypt$salt$hash` continuam válidos e são atualizados automaticamente após um login correto. As senhas nunca são armazenadas em texto puro. Cada usuário que envia o formulário precisa ter `municipio_cod_ibge`.
5. Verifique se todas as siglas usadas pelo formulário existem no catálogo com `npm run form:check-catalog`.

As únicas funções aceitas em `bd.usuario.usuario_funcao` são `prefeitura` e `admin`. Cadastros realizados pela aplicação sempre recebem `prefeitura`; administradores são criados exclusivamente pelo comando abaixo, exigem senha com pelo menos 12 caracteres e não ficam vinculados a um município:

```powershell
$env:ADMIN_EMAIL='admin@seu-dominio.gov.br'
$env:ADMIN_PASSWORD='uma-senha-administrativa-segura'
$env:ADMIN_NAME='Administrador'
npm run auth:create-admin
Remove-Item Env:ADMIN_EMAIL, Env:ADMIN_PASSWORD, Env:ADMIN_NAME
```

Para habilitar a confirmação de contas e a recuperação de senha por e-mail, configure também `APP_BASE_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` e `SMTP_FROM`. O endereço em `APP_BASE_URL` deve ser a URL pública HTTPS do frontend, sem barra no final. Em produção, essas variáveis são obrigatórias e a API verifica a conexão e autenticação SMTP antes de começar a aceitar requisições.

Valide a configuração sem enviar uma mensagem:

```powershell
npm run email:check
```

Em produção, publique SPF, DKIM e DMARC no DNS do domínio remetente conforme as instruções do provedor de e-mail; esses registros não ficam no código da aplicação.

Verifique os registros publicados com `npm run email:dns-check`. Caso a assinatura DKIM seja feita pela própria aplicação, configure `DKIM_DOMAIN_NAME`, `DKIM_SELECTOR` e `DKIM_PRIVATE_KEY`; se o provedor SMTP assinar as mensagens, mantenha essas três variáveis vazias e use o seletor fornecido pelo provedor na verificação DNS.

Quando `SMTP_HOST=smtp.gmail.com` e nenhum seletor é informado, a verificação usa automaticamente o seletor padrão `google`. Se DKIM aparecer como `false`, ative a autenticação DKIM no administrador do Google Workspace, publique no DNS o registro TXT fornecido pela instituição e repita a checagem após a propagação.

Os e-mails não são enviados dentro da requisição HTTP. O cadastro ou token de redefinição e a mensagem são gravados atomicamente em `stg.email_outbox`. Um worker do backend busca a fila a cada cinco segundos e tenta entregar cada mensagem até seis vezes, usando atrasos progressivos. O conteúdo sensível da mensagem fica criptografado com AES-256-GCM derivado de `AUTH_SECRET`; mensagens entregues são apagadas e o payload é descartado ao esgotar as tentativas. Por isso, não altere `AUTH_SECRET` enquanto houver mensagens pendentes.

Para acompanhar a entrega sem consultar o conteúdo criptografado:

```sql
SELECT status, email_tipo, tentativas, criado_em, proxima_tentativa_em, ultimo_erro
FROM stg.email_outbox
ORDER BY criado_em DESC;
```

Administradores também podem consultar `GET /api/admin/email-outbox/status`. O endpoint não expõe destinatários nem o conteúdo das mensagens e informa quantidades pendentes, em processamento, com falha ou próximas da expiração.

Em produção, use um `AUTH_SECRET` aleatório com pelo menos 32 caracteres, configure `CORS_ORIGIN` com as origens autorizadas e mantenha `COOKIE_SECURE=true`. A aplicação recusa a inicialização quando as configurações críticas de produção são inválidas.

Use `.env.production.example` como checklist de implantação. Em produção, `CORS_ORIGIN` aceita apenas origens HTTPS e requisições autenticadas que alteram estado são rejeitadas quando não apresentam uma origem ou referenciador autorizado, oferecendo proteção CSRF adicional ao cookie `SameSite=Lax`.

O teste integrado de autenticação usa uma conta temporária, não envia e-mails e limpa os dados criados ao terminar. Ele exige um PostgreSQL local com as migrações aplicadas:

```powershell
$env:RUN_DB_INTEGRATION_TESTS='true'
node --test test/authFlow.integration.test.js
Remove-Item Env:RUN_DB_INTEGRATION_TESTS
```

## Fluxo de submissão e aprovação

- `POST /api/auth/login`: autentica o usuário e cria uma sessão revogável em cookie `HttpOnly`, `SameSite=Lax` e `Secure` em produção. A validade é de oito horas ou 30 dias quando a opção de lembrar acesso é marcada.
- `POST /api/auth/register`: valida os dados, identifica o município pelo domínio `usuario@cidade.uf.gov.br` e grava atomicamente o cadastro pendente e o e-mail de confirmação na outbox, ambos com validade de 30 minutos.
- `POST /api/auth/register/confirm`: valida o token recebido por e-mail, cria o usuário com perfil `prefeitura` em `bd.usuario` e inicia a sessão autenticada.
- `POST /api/auth/register/resend`: invalida o link anterior e grava o novo e-mail de confirmação na mesma transação.
- `POST /api/auth/password/forgot`: grava o token e o e-mail de redefinição na mesma transação, sem revelar se o endereço está cadastrado.
- `POST /api/auth/password/reset`: troca a senha e revoga todas as sessões anteriores do usuário.
- `GET /api/auth/session`: valida o cookie e devolve os dados mínimos do usuário autenticado.
- `POST /api/auth/logout`: revoga a sessão atual e remove o cookie.
- `POST /api/formularios/autodeclaracao`: valida as 29 respostas e grava a submissão como `PENDENTE` somente na staging. O município é obtido da sessão, nunca do corpo da requisição.
- `GET /api/formularios/autodeclaracao/atual`: consulta a submissão mais recente do município no ano corrente e reconstrói as respostas para edição. O ano é sempre definido pelo relógio do servidor.
- `GET /api/formularios/autodeclaracao/submissoes?status=PENDENTE`: lista a fila administrativa; também aceita `APROVADA` e `REJEITADA`.
- `GET /api/formularios/autodeclaracao/submissoes/:submissaoId`: apresenta os dados e respostas da staging para revisão do administrador.
- `PATCH /api/formularios/autodeclaracao/submissoes/:submissaoId/aprovar`: revalida a staging e promove as respostas para `bd.municipio_apresenta_variavel` na mesma transação que registra o administrador e a data da aprovação.
- `PATCH /api/formularios/autodeclaracao/submissoes/:submissaoId/rejeitar`: registra a rejeição e seu motivo sem publicar as respostas na tabela definitiva.

Nas perguntas de múltipla escolha, todas as alternativas são gravadas em `variavel_valor` como `0` ou `1`. Nas perguntas de escolha única (`F7`, `F11`, `F14`, `F23`, `F24`, `F28` e `F29`), a alternativa escolhida é gravada em `variavel_valor_textual`; durante a promoção, `variavel_valor` recebe `0` para atender à restrição atual da tabela final.

Os endpoints sensíveis possuem limite de tentativas por IP e os eventos relevantes são registrados em `stg.autenticacao_evento`. Os contadores do limitador ficam no PostgreSQL, com a identificação do IP armazenada somente como SHA-256, e são compartilhados por todas as réplicas do backend.

## Assistente municipal orientado

`POST /api/assistente/consultar` executa consultas determinísticas sobre os dados municipais. O endpoint aceita somente as ações `comparar_municipios` e `desafios_oportunidades_transformacao_digital`. A comparação de municípios semelhantes preserva o recorte territorial e socioeconômico da plataforma e apresenta pontuações separadas para as dimensões Econômica, Sociocultural e Meio Ambiente. Não há modelo de linguagem, embeddings ou serviço externo: o backend valida o município, consulta o PostgreSQL e monta a resposta com templates localizados.

O limite padrão é de 30 consultas por IP a cada 15 minutos e pode ser ajustado com `ASSISTANT_RATE_LIMIT_MAX` e `ASSISTANT_RATE_LIMIT_WINDOW_MS`.
