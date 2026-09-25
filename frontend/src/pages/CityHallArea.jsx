import { useState } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Info,
  LockKeyhole,
  Mail,
  MailCheck,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getCityHallHomePath, saveCityHallAuth } from "@/lib/cityHallAuth";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useI18n } from "@/lib/i18n";

const emailPattern = /^\S+@\S+\.\S+$/;
const municipalEmailPattern = /^[a-z0-9](?:[a-z0-9._%+-]{0,62}[a-z0-9])?@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.(?:ac|al|ap|am|ba|ce|df|es|go|ma|mt|ms|mg|pa|pb|pr|pe|pi|rj|rn|rs|ro|rr|sc|sp|se|to)\.gov\.br$/i;
const allowPersonalEmailRegistration =
  import.meta.env.VITE_ALLOW_PERSONAL_EMAIL_REGISTRATION === "true";

const CityHallArea = () => {
  const navigate = useNavigate();
  const { language } = useI18n();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState(
    () =>
      localStorage.getItem("city-hall-user-email") ||
      sessionStorage.getItem("city-hall-user-email") ||
      "",
  );
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberAccess, setRememberAccess] = useState(
    () => Boolean(localStorage.getItem("city-hall-user-email")),
  );
  const [loginError, setLoginError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registration, setRegistration] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirmation: "",
  });
  const [registrationErrors, setRegistrationErrors] = useState({});
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryError, setRecoveryError] = useState("");
  const [recoverySent, setRecoverySent] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [isResending, setIsResending] = useState(false);
  const finishAuthentication = (data, remember = false) => {
    saveCityHallAuth(data, remember);
    navigate(getCityHallHomePath(data.usuario), {
      state: { userEmail: data.usuario.usuario_login },
    });
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoginError("");

    if (!email.trim() || !password) {
      setLoginError("Informe seu e-mail e sua senha para continuar.");
      return;
    }
    if (!emailPattern.test(email)) {
      setLoginError("Informe um endereço de e-mail válido.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          login: email.trim(),
          senha: password,
          lembrar: rememberAccess,
          language,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Não foi possível entrar na sua conta.");
      }
      finishAuthentication(data, rememberAccess);
    } catch (error) {
      setLoginError(error.message || "Não foi possível entrar na sua conta.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegistration = async (event) => {
    event.preventDefault();
    setLoginError("");

    const errors = {};
    if (!registration.name.trim()) {
      errors.name = "Informe seu nome completo.";
    } else if (registration.name.trim().length < 3) {
      errors.name = "O nome deve possuir pelo menos 3 caracteres.";
    }
    if (!registration.email.trim()) {
      errors.email = "Informe seu e-mail.";
    } else if (
      !(allowPersonalEmailRegistration ? emailPattern : municipalEmailPattern).test(
        registration.email.trim(),
      )
    ) {
      errors.email = allowPersonalEmailRegistration
        ? "Informe um endereço de e-mail válido."
        : "Use o formato usuario@cidade.estado.gov.br.";
    }
    if (!registration.password) {
      errors.password = "Informe uma senha.";
    } else if (registration.password.length < 8) {
      errors.password = "A senha deve possuir pelo menos 8 caracteres.";
    }
    if (!registration.passwordConfirmation) {
      errors.passwordConfirmation = "Confirme sua senha.";
    } else if (registration.password !== registration.passwordConfirmation) {
      errors.passwordConfirmation = "As senhas informadas não coincidem.";
    }

    setRegistrationErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          nome: registration.name.trim(),
          email: registration.email.trim(),
          senha: registration.password,
          language,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 409) {
          setRegistrationErrors((current) => ({ ...current, email: data.error }));
          return;
        } else if (response.status === 422) {
          setRegistrationErrors((current) => ({ ...current, email: data.error }));
          return;
        }
        throw new Error(data.error || "Não foi possível criar sua conta.");
      }
      setConfirmationEmail(data.email || registration.email.trim());
    } catch (error) {
      setLoginError(error.message || "Não foi possível criar sua conta.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordRecovery = async (event) => {
    event.preventDefault();
    setRecoveryError("");

    if (!recoveryEmail.trim()) {
      setRecoveryError("Informe seu e-mail.");
      return;
    }
    if (
      !(allowPersonalEmailRegistration ? emailPattern : municipalEmailPattern).test(
        recoveryEmail.trim(),
      )
    ) {
      setRecoveryError(
        allowPersonalEmailRegistration
          ? "Informe um endereço de e-mail válido."
          : "Use o formato usuario@cidade.estado.gov.br.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/password/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: recoveryEmail.trim(), language }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Não foi possível solicitar a redefinição de senha.");
      }
      setRecoverySent(true);
    } catch (error) {
      setRecoveryError(error.message || "Não foi possível solicitar a redefinição de senha.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendConfirmation = async () => {
    setResendMessage("");
    setIsResending(true);
    try {
      const response = await fetch("/api/auth/register/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: confirmationEmail, language }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Não foi possível reenviar o link.");
      }
      setResendMessage(data.message || "Se o cadastro estiver pendente, um novo link foi enviado.");
    } catch (error) {
      setResendMessage(error.message || "Não foi possível reenviar o link.");
    } finally {
      setIsResending(false);
    }
  };

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setLoginError("");
    setShowPassword(false);
    setRegistrationErrors({});
    setConfirmationEmail("");
    setRecoveryError("");
    setRecoverySent(false);
    setResendMessage("");
  };

  const updateRegistration = (field, value) => {
    setRegistration((current) => ({ ...current, [field]: value }));
    setRegistrationErrors((current) => ({ ...current, [field]: undefined }));
    setLoginError("");
  };

  return (
    <div>
      <section className="city-search-hero-gradient py-16 md:py-20">
        <div className="mx-auto max-w-[1300px] px-6">
          <h1 className="text-4xl font-extrabold text-white md:text-5xl">
            Acesso da Prefeitura
          </h1>
          <p className="mt-4 max-w-[900px] text-base text-white/90 md:text-lg">
            Área exclusiva para gestores e representantes municipais.
          </p>
        </div>
      </section>

      <section className="bg-[#f6f9fe] py-10 md:py-14">
        <div className="mx-auto grid max-w-[1100px] items-start gap-10 px-6 lg:grid-cols-[1fr_460px] lg:gap-16">
          <div>
            <span className="text-sm font-bold uppercase tracking-[0.18em] text-[#2f66d0]">
              Portal da gestão municipal
            </span>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight text-[#26364d] md:text-4xl">
              Gerencie as informações do seu município
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-[#5c6b80]">
              Acesse os formulários autodeclaratórios, acompanhe os resultados e
              mantenha os dados da prefeitura atualizados.
            </p>
          </div>

          <div className="rounded-3xl border border-[#dce6f5] bg-white p-6 shadow-[0_18px_50px_rgba(39,72,125,0.12)] md:p-8">
            {mode === "login" ? (
              <>
                <div className="mb-7">
                  <h3 className="text-2xl font-extrabold text-[#26364d]">
                    Acesse sua conta
                  </h3>
                </div>

                <form onSubmit={handleLogin} noValidate>
                  <TextField
                    id="city-hall-email"
                    label="E-mail"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    autoComplete="email"
                    placeholder="nome@prefeitura.gov.br"
                    icon={Mail}
                  />

                  <PasswordField
                    id="city-hall-password"
                    label="Senha"
                    value={password}
                    onChange={setPassword}
                    showPassword={showPassword}
                    onToggle={() => setShowPassword((current) => !current)}
                    autoComplete="current-password"
                    className="mt-5"
                  />

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                    <label className="flex cursor-pointer items-center gap-3 text-sm text-[#56657a]">
                      <input
                        type="checkbox"
                        checked={rememberAccess}
                        onChange={(event) => setRememberAccess(event.target.checked)}
                        className="h-4 w-4 rounded border-[#b9c7da] text-[#2f66d0] focus:ring-[#2f66d0]"
                      />
                      Manter meu e-mail neste dispositivo
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setRecoveryEmail(email);
                        changeMode("forgot");
                      }}
                      className="text-sm font-semibold text-[#2f66d0] transition hover:text-[#2556b4] hover:underline"
                    >
                      Esqueci minha senha
                    </button>
                  </div>

                  <FormError message={loginError} />

                  <PrimaryButton disabled={isSubmitting}>
                    {isSubmitting ? "Entrando…" : "Entrar"}
                  </PrimaryButton>
                </form>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-t border-[#e1e8f2] pt-5 text-center">
                  <p className="text-sm text-[#6b788c]">Ainda não possui acesso?</p>
                  <button
                    type="button"
                    onClick={() => changeMode("register")}
                    className="text-sm font-bold text-[#2f66d0] transition hover:text-[#2556b4] hover:underline"
                  >
                    Criar nova conta
                  </button>
                </div>
              </>
            ) : mode === "register" ? (
              <>
                <button
                  type="button"
                  onClick={() => changeMode("login")}
                  className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[#66758a] transition hover:text-[#2f66d0]"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Voltar para o acesso
                </button>

                {confirmationEmail ? (
                  <div className="py-3 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eaf7f0] text-[#218653]">
                      <MailCheck className="h-7 w-7" aria-hidden="true" />
                    </div>
                    <h3 className="mt-5 text-2xl font-extrabold text-[#26364d]">
                      Confira seu e-mail
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#6b788c]">
                      O link de confirmação será enviado para
                      <span className="block font-bold text-[#405169]">{confirmationEmail}</span>
                    </p>
                    <p className="mt-3 text-xs leading-relaxed text-[#7a8799]">
                      O link expira em 30 minutos. Sua conta será criada somente após a confirmação.
                    </p>
                    <button
                      type="button"
                      onClick={handleResendConfirmation}
                      disabled={isResending}
                      className="mt-5 text-sm font-bold text-[#2f66d0] transition hover:text-[#2556b4] hover:underline disabled:cursor-wait disabled:opacity-60"
                    >
                      {isResending ? "Reenviando…" : "Reenviar link de confirmação"}
                    </button>
                    {resendMessage && (
                      <p className="mt-2 text-xs leading-relaxed text-[#56657a]" role="status">
                        {resendMessage}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => changeMode("login")}
                      className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#2f66d0] px-6 py-3.5 text-base font-bold text-white transition hover:bg-[#2556b4]"
                    >
                      Voltar para o acesso
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mb-7">
                      <h3 className="text-2xl font-extrabold text-[#26364d]">
                        Crie sua conta
                      </h3>
                    </div>

                    <form onSubmit={handleRegistration} noValidate>
                  <TextField
                    id="registration-name"
                    label="Nome completo"
                    value={registration.name}
                    onChange={(value) => updateRegistration("name", value)}
                    autoComplete="name"
                    placeholder="Seu nome completo"
                    icon={UserRound}
                    error={registrationErrors.name}
                  />

                  <TextField
                    id="registration-email"
                    label="E-mail"
                    type="email"
                    value={registration.email}
                    onChange={(value) => updateRegistration("email", value)}
                    autoComplete="email"
                    placeholder={
                      allowPersonalEmailRegistration
                        ? "nome@exemplo.com"
                        : "nome@municipio.estado.gov.br"
                    }
                    icon={Mail}
                    className="mt-5"
                    error={registrationErrors.email}
                    labelHint={
                      allowPersonalEmailRegistration
                        ? "Modo de teste: e-mails pessoais estão temporariamente liberados."
                        : "O município será identificado automaticamente pelo domínio do e-mail."
                    }
                  />

                  <PasswordField
                    id="registration-password"
                    label="Senha"
                    value={registration.password}
                    onChange={(value) => updateRegistration("password", value)}
                    showPassword={showPassword}
                    onToggle={() => setShowPassword((current) => !current)}
                    autoComplete="new-password"
                    className="mt-5"
                    error={registrationErrors.password}
                    labelHint="Use pelo menos 8 caracteres."
                  />

                  <PasswordField
                    id="registration-password-confirmation"
                    label="Confirme a senha"
                    value={registration.passwordConfirmation}
                    onChange={(value) => updateRegistration("passwordConfirmation", value)}
                    showPassword={showPassword}
                    onToggle={() => setShowPassword((current) => !current)}
                    autoComplete="new-password"
                    className="mt-5"
                    error={registrationErrors.passwordConfirmation}
                  />

                  <FormError message={loginError} />

                  <PrimaryButton disabled={isSubmitting}>
                    {isSubmitting ? "Criando conta…" : "Criar conta"}
                  </PrimaryButton>
                    </form>
                  </>
                )}
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => changeMode("login")}
                  className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[#66758a] transition hover:text-[#2f66d0]"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Voltar para o acesso
                </button>

                {recoverySent ? (
                  <div className="py-3 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eaf7f0] text-[#218653]">
                      <MailCheck className="h-7 w-7" aria-hidden="true" />
                    </div>
                    <h3 className="mt-5 text-2xl font-extrabold text-[#26364d]">
                      Confira seu e-mail
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#6b788c]">
                      Se houver uma conta vinculada a esse endereço, enviaremos um link para redefinir a senha.
                    </p>
                    <button
                      type="button"
                      onClick={() => changeMode("login")}
                      className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#2f66d0] px-6 py-3.5 text-base font-bold text-white transition hover:bg-[#2556b4]"
                    >
                      Voltar para o acesso
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mb-7">
                      <h3 className="text-2xl font-extrabold text-[#26364d]">
                        Recuperar senha
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-[#6b788c]">
                        Informe seu e-mail institucional para receber o link de redefinição.
                      </p>
                    </div>
                    <form onSubmit={handlePasswordRecovery} noValidate>
                      <TextField
                        id="recovery-email"
                        label="E-mail"
                        type="email"
                        value={recoveryEmail}
                        onChange={(value) => {
                          setRecoveryEmail(value);
                          setRecoveryError("");
                        }}
                        autoComplete="email"
                        placeholder="nome@municipio.estado.gov.br"
                        icon={Mail}
                        error={recoveryError}
                        labelHint="O município é identificado automaticamente pelo domínio do e-mail."
                      />
                      <PrimaryButton disabled={isSubmitting}>
                        {isSubmitting ? "Enviando…" : "Enviar link de recuperação"}
                      </PrimaryButton>
                    </form>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

const TextField = ({
  autoComplete,
  className = "",
  error,
  icon: Icon,
  id,
  label,
  labelHint,
  onChange,
  placeholder,
  type = "text",
  value,
}) => (
  <div className={className}>
    <div className="flex items-center gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-[#34445b]">
        {label}
      </label>
      {labelHint && (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="Informação sobre o e-mail institucional"
              className="inline-flex text-[#14a6d8] outline-none transition hover:text-[#0b8fbd] focus-visible:ring-2 focus-visible:ring-[#14a6d8] focus-visible:ring-offset-2"
            >
              <Info className="h-4 w-4" aria-hidden="true" />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="max-w-[280px] animate-none border-[#cceaf7] bg-white px-3 py-2 text-xs leading-relaxed text-[#405169] shadow-lg"
          >
            {labelHint}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
    <div className="relative mt-2">
      <Icon
        aria-hidden="true"
        className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7c8ba1]"
      />
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full rounded-xl border bg-white py-3 pl-12 pr-4 text-[#26364d] outline-none transition ${
          error
            ? "border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-100"
            : "border-[#ccd8e8] focus:border-[#2f66d0] focus:ring-4 focus:ring-[#2f66d0]/10"
        }`}
      />
    </div>
    <FieldError id={`${id}-error`} message={error} />
  </div>
);

const PasswordField = ({
  autoComplete,
  className = "",
  error,
  id,
  label,
  labelHint,
  onChange,
  onToggle,
  showPassword,
  value,
}) => (
  <div className={className}>
    <div className="flex items-center gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-[#34445b]">
        {label}
      </label>
      {labelHint && (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={`Informação sobre ${label.toLowerCase()}`}
              className="inline-flex text-[#14a6d8] outline-none transition hover:text-[#0b8fbd] focus-visible:ring-2 focus-visible:ring-[#14a6d8] focus-visible:ring-offset-2"
            >
              <Info className="h-4 w-4" aria-hidden="true" />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="max-w-[280px] animate-none border-[#cceaf7] bg-white px-3 py-2 text-xs leading-relaxed text-[#405169] shadow-lg"
          >
            {labelHint}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
    <div className="relative mt-2">
      <LockKeyhole
        aria-hidden="true"
        className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7c8ba1]"
      />
      <input
        id={id}
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        placeholder="Digite sua senha"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full rounded-xl border bg-white py-3 pl-12 pr-12 text-[#26364d] outline-none transition ${
          error
            ? "border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-100"
            : "border-[#ccd8e8] focus:border-[#2f66d0] focus:ring-4 focus:ring-[#2f66d0]/10"
        }`}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#66758a] transition hover:text-[#2f66d0]"
        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
      >
        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
    <FieldError id={`${id}-error`} message={error} />
  </div>
);

const FieldError = ({ id, message }) =>
  message ? (
    <p id={id} className="mt-1.5 text-xs font-semibold text-red-600">
      {message}
    </p>
  ) : null;

const FormError = ({ message }) =>
  message ? (
    <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">
      {message}
    </p>
  ) : null;

const PrimaryButton = ({ children, disabled }) => (
  <button
    type="submit"
    disabled={disabled}
    className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#2f66d0] px-6 py-3.5 text-base font-bold text-white transition hover:bg-[#2556b4] focus:outline-none focus:ring-4 focus:ring-[#2f66d0]/25 disabled:cursor-wait disabled:opacity-65"
  >
    {children}
  </button>
);

export default CityHallArea;
