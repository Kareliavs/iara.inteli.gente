import { useState } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

const CityHallResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [requestError, setRequestError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const token = searchParams.get("token") || "";

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};

    if (!password) nextErrors.password = "Informe a nova senha.";
    else if (password.length < 8) nextErrors.password = "A senha deve possuir pelo menos 8 caracteres.";
    if (!confirmation) nextErrors.confirmation = "Confirme a nova senha.";
    else if (password !== confirmation) nextErrors.confirmation = "As senhas informadas não coincidem.";
    if (!token) setRequestError("O link de redefinição está incompleto.");

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !token) return;

    setRequestError("");
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, senha: password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Não foi possível redefinir sua senha.");
      }
      setIsComplete(true);
    } catch (error) {
      setRequestError(error.message || "Não foi possível redefinir sua senha.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="flex min-h-[620px] items-center justify-center bg-[#f6f9fe] px-6 py-16">
      <div className="w-full max-w-[480px] rounded-3xl border border-[#dce6f5] bg-white p-8 shadow-[0_18px_50px_rgba(39,72,125,0.12)]">
        {isComplete ? (
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eaf7f0] text-[#218653]">
              <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
            </div>
            <h1 className="mt-6 text-2xl font-extrabold text-[#26364d]">Senha redefinida</h1>
            <p className="mt-3 text-sm leading-relaxed text-[#6b788c]">
              Sua nova senha já pode ser utilizada para acessar a plataforma.
            </p>
            <button
              type="button"
              onClick={() => navigate("/prefeitura")}
              className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-[#2f66d0] px-6 py-3.5 text-base font-bold text-white transition hover:bg-[#2556b4]"
            >
              Voltar para o acesso
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-extrabold text-[#26364d]">Defina uma nova senha</h1>
            <p className="mt-2 text-sm leading-relaxed text-[#6b788c]">
              Use pelo menos 8 caracteres. Ao concluir, as sessões anteriores serão encerradas.
            </p>

            <form onSubmit={handleSubmit} className="mt-7" noValidate>
              <PasswordInput
                id="new-password"
                label="Nova senha"
                value={password}
                onChange={(value) => {
                  setPassword(value);
                  setErrors((current) => ({ ...current, password: undefined }));
                }}
                showPassword={showPassword}
                onToggle={() => setShowPassword((current) => !current)}
                error={errors.password}
              />
              <PasswordInput
                id="new-password-confirmation"
                label="Confirme a nova senha"
                value={confirmation}
                onChange={(value) => {
                  setConfirmation(value);
                  setErrors((current) => ({ ...current, confirmation: undefined }));
                }}
                showPassword={showPassword}
                onToggle={() => setShowPassword((current) => !current)}
                error={errors.confirmation}
                className="mt-5"
              />

              {requestError && (
                <p className="mt-5 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {requestError}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#2f66d0] px-6 py-3.5 text-base font-bold text-white transition hover:bg-[#2556b4] disabled:cursor-wait disabled:opacity-65"
              >
                {isSubmitting ? "Redefinindo…" : "Redefinir senha"}
              </button>
            </form>
          </>
        )}
      </div>
    </section>
  );
};

const PasswordInput = ({ className = "", error, id, label, onChange, onToggle, showPassword, value }) => (
  <div className={className}>
    <label htmlFor={id} className="text-sm font-semibold text-[#34445b]">{label}</label>
    <div className="relative mt-2">
      <LockKeyhole className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7c8ba1]" aria-hidden="true" />
      <input
        id={id}
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="new-password"
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
    {error && <p id={`${id}-error`} className="mt-1.5 text-xs font-semibold text-red-600">{error}</p>}
  </div>
);

export default CityHallResetPassword;
