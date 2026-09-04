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

Para habilitar a confirmação de contas e a recuperação de senha por e-mail, configure também `APP_BASE_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` e `SMTP_FROM`. O endereço em `APP_BASE_URL` deve ser a URL pública HTTPS do frontend, sem barra no final. Em produção, publique SPF, DKIM e DMARC no DNS do domínio remetente conforme as instruções do provedor de e-mail; esses registros não ficam no código da aplicação.

Em produção, use um `AUTH_SECRET` aleatório com pelo menos 32 caracteres, configure `CORS_ORIGIN` com as origens autorizadas e mantenha `COOKIE_SECURE=true`. A aplicação recusa a inicialização quando as configurações críticas de produção são inválidas.

## Fluxo de submissão e aprovação

- `POST /api/auth/login`: autentica o usuário e cria uma sessão revogável em cookie `HttpOnly`, `SameSite=Lax` e `Secure` em produção. A validade é de oito horas ou 30 dias quando a opção de lembrar acesso é marcada.
- `POST /api/auth/register`: valida os dados, identifica o município pelo domínio `usuario@cidade.uf.gov.br`, cria um cadastro pendente com validade de 30 minutos e envia o link de confirmação.
- `POST /api/auth/register/confirm`: valida o token recebido por e-mail, cria o usuário com perfil `prefeitura` em `bd.usuario` e inicia a sessão autenticada.
- `POST /api/auth/register/resend`: invalida o link anterior e reenvia a confirmação para um cadastro pendente.
- `POST /api/auth/password/forgot`: envia um link de redefinição sem revelar se o e-mail está cadastrado.
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

Os endpoints sensíveis possuem limite de tentativas por IP e os eventos relevantes são registrados em `stg.autenticacao_evento`. O limitador atual fica em memória e atende uma única instância; em uma implantação com várias réplicas, substitua-o por um armazenamento compartilhado, como Redis.
