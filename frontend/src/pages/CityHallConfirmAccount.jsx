import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { saveCityHallAuth } from "@/lib/cityHallAuth";

const CityHallConfirmAccount = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Confirmando seu e-mail…");

  useEffect(() => {
    const token = searchParams.get("token") || "";
    if (!token) {
      setStatus("error");
      setMessage("O link de confirmação está incompleto.");
      return;
    }

    const controller = new AbortController();
    const confirmAccount = async () => {
      try {
        const response = await fetch("/api/auth/register/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
          signal: controller.signal,
          credentials: "include",
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || "Não foi possível confirmar sua conta.");
        }

        saveCityHallAuth(data, false);
        setStatus("success");
        setMessage("Sua conta foi confirmada e já está pronta para uso.");
      } catch (error) {
        if (error.name === "AbortError") return;
        setStatus("error");
        setMessage(error.message || "Não foi possível confirmar sua conta.");
      }
    };

    confirmAccount();
    return () => controller.abort();
  }, [searchParams]);

  return (
    <section className="flex min-h-[620px] items-center justify-center bg-[#f6f9fe] px-6 py-16">
      <div className="w-full max-w-[480px] rounded-3xl border border-[#dce6f5] bg-white p-8 text-center shadow-[0_18px_50px_rgba(39,72,125,0.12)]">
        <div
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
            status === "success"
              ? "bg-[#eaf7f0] text-[#218653]"
              : status === "error"
                ? "bg-red-50 text-red-600"
                : "bg-[#edf4ff] text-[#2f66d0]"
          }`}
        >
          {status === "success" ? (
            <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
          ) : status === "error" ? (
            <AlertCircle className="h-8 w-8" aria-hidden="true" />
          ) : (
            <LoaderCircle className="h-8 w-8 animate-spin" aria-hidden="true" />
          )}
        </div>

        <h1 className="mt-6 text-2xl font-extrabold text-[#26364d]">
          {status === "success"
            ? "Conta confirmada"
            : status === "error"
              ? "Não foi possível confirmar"
              : "Confirmando sua conta"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[#6b788c]">{message}</p>

        {status !== "loading" && (
          <button
            type="button"
            onClick={() =>
              navigate(status === "success" ? "/prefeitura/pos-login" : "/prefeitura")
            }
            className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-[#2f66d0] px-6 py-3.5 text-base font-bold text-white transition hover:bg-[#2556b4]"
          >
            {status === "success" ? "Acessar formulários" : "Voltar para o acesso"}
          </button>
        )}
      </div>
    </section>
  );
};

export default CityHallConfirmAccount;
