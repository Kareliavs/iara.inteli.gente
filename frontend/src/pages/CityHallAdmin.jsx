import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  LoaderCircle,
  LogOut,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  clearCityHallAuth,
  getCityHallAuth,
  logoutCityHall,
} from "@/lib/cityHallAuth";

const STATUSES = ["PENDENTE", "APROVADA", "REJEITADA"];
const statusLabels = {
  PENDENTE: "Pendentes",
  APROVADA: "Aprovadas",
  REJEITADA: "Rejeitadas",
};
const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

const CityHallAdmin = () => {
  const navigate = useNavigate();
  const [submissionGroups, setSubmissionGroups] = useState({
    PENDENTE: [],
    APROVADA: [],
    REJEITADA: [],
  });
  const [activeStatus, setActiveStatus] = useState("PENDENTE");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isActing, setIsActing] = useState(false);
  const [actionError, setActionError] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const auth = getCityHallAuth();

  const handleUnauthorized = useCallback(() => {
    clearCityHallAuth();
    navigate("/prefeitura", { replace: true });
  }, [navigate]);

  const loadSubmissions = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const responses = await Promise.all(
        STATUSES.map((status) =>
          fetch(`/api/formularios/autodeclaracao/submissoes?status=${status}`, {
            credentials: "include",
          }),
        ),
      );
      if (responses.some((response) => response.status === 401)) {
        handleUnauthorized();
        return;
      }

      const payloads = await Promise.all(
        responses.map((response) => response.json().catch(() => ({}))),
      );
      const failedIndex = responses.findIndex((response) => !response.ok);
      if (failedIndex !== -1) {
        throw new Error(
          payloads[failedIndex].error || "Não foi possível carregar as submissões.",
        );
      }

      setSubmissionGroups(
        Object.fromEntries(
          STATUSES.map((status, index) => [
            status,
            Array.isArray(payloads[index].submissoes) ? payloads[index].submissoes : [],
          ]),
        ),
      );
    } catch (requestError) {
      setError(requestError.message || "Não foi possível carregar as submissões.");
    } finally {
      setIsLoading(false);
    }
  }, [handleUnauthorized]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const submissions = submissionGroups[activeStatus] || [];
  const summary = useMemo(
    () => ({
      approved: submissionGroups.APROVADA.length,
      pending: submissionGroups.PENDENTE.length,
      rejected: submissionGroups.REJEITADA.length,
    }),
    [submissionGroups],
  );

  const openReview = async (submission) => {
    setSelectedSubmission(submission);
    setIsReviewOpen(true);
    setIsLoadingDetails(true);
    setActionError("");
    setRejectionReason("");
    try {
      const response = await fetch(
        `/api/formularios/autodeclaracao/submissoes/${submission.submissao_id}`,
        { credentials: "include" },
      );
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!response.ok) {
        throw new Error(data.error || "Não foi possível carregar os detalhes.");
      }
      setSelectedSubmission(data);
    } catch (requestError) {
      setActionError(requestError.message || "Não foi possível carregar os detalhes.");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const validateSubmission = async (action) => {
    if (!selectedSubmission || isActing) return;
    const rejecting = action === "rejeitar";
    if (rejecting && rejectionReason.trim().length < 3) {
      setActionError("Informe o motivo da rejeição com pelo menos 3 caracteres.");
      return;
    }

    setIsActing(true);
    setActionError("");
    try {
      const response = await fetch(
        `/api/formularios/autodeclaracao/submissoes/${selectedSubmission.submissao_id}/${action}`,
        {
          method: "PATCH",
          headers: rejecting ? { "Content-Type": "application/json" } : undefined,
          credentials: "include",
          body: rejecting ? JSON.stringify({ motivo: rejectionReason.trim() }) : undefined,
        },
      );
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!response.ok) {
        throw new Error(data.error || "Não foi possível validar a submissão.");
      }
      setIsReviewOpen(false);
      setSelectedSubmission(null);
      await loadSubmissions();
    } catch (requestError) {
      setActionError(requestError.message || "Não foi possível validar a submissão.");
    } finally {
      setIsActing(false);
    }
  };

  const handleLogout = async () => {
    await logoutCityHall();
    navigate("/prefeitura", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#f5f8fc]">
      <section className="city-search-hero-gradient py-12 md:py-16">
        <div className="mx-auto flex max-w-[1300px] flex-col gap-6 px-6 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="text-sm font-bold uppercase tracking-[0.18em] text-white/75">
              Administração da plataforma
            </span>
            <h1 className="mt-3 text-3xl font-extrabold text-white md:text-5xl">
              Validação de formulários
            </h1>
            <p className="mt-4 max-w-[780px] text-base leading-relaxed text-white/90 md:text-lg">
              Revise as respostas enviadas antes de publicá-las na base definitiva.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-white/45 px-4 py-2 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10 md:self-end"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sair
          </button>
        </div>
      </section>

      <main className="mx-auto max-w-[1200px] px-6 py-8 md:py-12">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-[#2f66d0]">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              Acesso administrativo
            </div>
            <h2 className="mt-2 text-2xl font-extrabold text-[#26364d] md:text-3xl">
              Fila de validação
            </h2>
            <p className="mt-2 text-sm text-[#6b788c]">
              Sessão de {auth?.usuario?.usuario_nome || "Administrador"}
            </p>
          </div>
          <button
            type="button"
            onClick={loadSubmissions}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#cbd8e8] bg-white px-4 py-2.5 text-sm font-bold text-[#405169] transition hover:border-[#2f66d0] hover:text-[#2f66d0] disabled:cursor-wait disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} aria-hidden="true" />
            Atualizar dados
          </button>
        </div>

        <section className="grid gap-4 md:grid-cols-3" aria-label="Resumo das submissões">
          <SummaryCard icon={Clock3} label="Aguardando validação" value={summary.pending} tone="pending" />
          <SummaryCard icon={CheckCircle2} label="Aprovadas" value={summary.approved} tone="approved" />
          <SummaryCard icon={XCircle} label="Rejeitadas" value={summary.rejected} tone="rejected" />
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border border-[#dbe5f1] bg-white shadow-[0_8px_25px_rgba(39,72,125,0.06)]">
          <div className="border-b border-[#e1e8f2] px-5 pt-5 md:px-7">
            <h3 className="text-lg font-extrabold text-[#26364d]">Submissões</h3>
            <p className="mt-1 text-sm text-[#6b788c]">
              Uma aprovação grava as respostas na tabela definitiva em uma única transação.
            </p>
            <div className="mt-5 flex gap-5 overflow-x-auto" role="tablist" aria-label="Status das submissões">
              {STATUSES.map((status) => (
                <button
                  key={status}
                  type="button"
                  role="tab"
                  aria-selected={activeStatus === status}
                  onClick={() => setActiveStatus(status)}
                  className={`whitespace-nowrap border-b-2 pb-3 text-sm font-bold transition ${
                    activeStatus === status
                      ? "border-[#2f66d0] text-[#2f66d0]"
                      : "border-transparent text-[#748196] hover:text-[#405169]"
                  }`}
                >
                  {statusLabels[status]} ({submissionGroups[status].length})
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex min-h-[260px] items-center justify-center text-[#2f66d0]">
              <LoaderCircle className="h-8 w-8 animate-spin" aria-label="Carregando submissões" />
            </div>
          ) : error ? (
            <div className="m-6 flex items-start gap-3 rounded-xl bg-red-50 px-4 py-4 text-sm font-medium text-red-700" role="alert">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              {error}
            </div>
          ) : submissions.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <FileText className="mx-auto h-10 w-10 text-[#a2afc0]" aria-hidden="true" />
              <p className="mt-4 font-bold text-[#405169]">
                Nenhuma submissão {statusLabels[activeStatus].toLowerCase()}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-left text-sm">
                <thead className="bg-[#f7f9fc] text-xs uppercase tracking-[0.08em] text-[#6b788c]">
                  <tr>
                    <th className="px-6 py-3.5 font-bold">Município</th>
                    <th className="px-6 py-3.5 font-bold">Responsável</th>
                    <th className="px-6 py-3.5 font-bold">Ano</th>
                    <th className="px-6 py-3.5 font-bold">Variáveis</th>
                    <th className="px-6 py-3.5 font-bold">Envio</th>
                    <th className="px-6 py-3.5 font-bold">Status</th>
                    <th className="px-6 py-3.5 text-right font-bold">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8eef6] text-[#405169]">
                  {submissions.map((submission) => (
                    <tr key={submission.submissao_id} className="transition hover:bg-[#f9fbfe]">
                      <td className="px-6 py-4 font-bold text-[#26364d]">
                        {submission.municipio_nome} - {submission.estado_sigla}
                      </td>
                      <td className="px-6 py-4">
                        <span className="block font-semibold">{submission.usuario_nome || "Não informado"}</span>
                        <span className="mt-0.5 block text-xs text-[#7a8799]">{submission.usuario_login}</span>
                      </td>
                      <td className="px-6 py-4">{submission.ano}</td>
                      <td className="px-6 py-4">{submission.variaveis_total}</td>
                      <td className="px-6 py-4">
                        {submission.enviado_em ? dateFormatter.format(new Date(submission.enviado_em)) : "—"}
                      </td>
                      <td className="px-6 py-4"><StatusBadge status={submission.status} /></td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => openReview(submission)}
                          className="inline-flex items-center gap-2 rounded-full border border-[#cbd8e8] px-3.5 py-2 text-xs font-bold text-[#405169] transition hover:border-[#2f66d0] hover:text-[#2f66d0]"
                        >
                          <Eye className="h-4 w-4" aria-hidden="true" />
                          {submission.status === "PENDENTE" ? "Revisar" : "Ver detalhes"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      <Dialog
        open={isReviewOpen}
        onOpenChange={(open) => {
          if (isActing) return;
          setIsReviewOpen(open);
          if (!open) setSelectedSubmission(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-3xl border-[#dbe5f1] bg-white sm:max-w-[760px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold text-[#26364d]">Revisão do formulário</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-[#6b788c]">
              Confira os dados da staging antes de decidir se eles devem ser publicados.
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="mt-3 grid gap-3 rounded-2xl bg-[#f5f8fc] p-4 text-sm sm:grid-cols-3">
              <Metadata label="Município" value={`${selectedSubmission.municipio_nome} - ${selectedSubmission.estado_sigla}`} />
              <Metadata label="Ano" value={selectedSubmission.ano} />
              <Metadata label="Status" value={statusLabels[selectedSubmission.status]} />
              <div className="sm:col-span-3">
                <Metadata label="Responsável" value={`${selectedSubmission.usuario_nome || "Não informado"} (${selectedSubmission.usuario_login})`} />
              </div>
            </div>
          )}

          {isLoadingDetails ? (
            <div className="flex min-h-[220px] items-center justify-center text-[#2f66d0]">
              <LoaderCircle className="h-7 w-7 animate-spin" aria-label="Carregando respostas" />
            </div>
          ) : selectedSubmission?.variaveis ? (
            <div className="mt-5">
              <h4 className="font-extrabold text-[#26364d]">Respostas armazenadas na staging</h4>
              <div className="mt-3 max-h-[320px] overflow-y-auto rounded-xl border border-[#dbe5f1]">
                {selectedSubmission.variaveis.map((variable) => (
                  <div key={variable.variavel_sigla} className="flex items-start justify-between gap-5 border-b border-[#e8eef6] px-4 py-3 text-sm last:border-b-0">
                    <span className="font-bold text-[#405169]">{variable.variavel_sigla}</span>
                    <span className="text-right text-[#6b788c]">{formatVariableValue(variable)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {selectedSubmission?.motivo_rejeicao && (
            <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              <strong>Motivo da rejeição:</strong> {selectedSubmission.motivo_rejeicao}
            </div>
          )}

          {selectedSubmission?.status === "PENDENTE" && !isLoadingDetails && (
            <div className="mt-5">
              <label htmlFor="rejection-reason" className="text-sm font-bold text-[#405169]">
                Motivo da rejeição
              </label>
              <textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(event) => {
                  setRejectionReason(event.target.value);
                  setActionError("");
                }}
                maxLength={1000}
                rows={3}
                placeholder="Preencha este campo somente se o formulário for rejeitado."
                className="mt-2 w-full resize-y rounded-xl border border-[#ccd8e8] px-4 py-3 text-sm text-[#26364d] outline-none transition focus:border-[#2f66d0] focus:ring-4 focus:ring-[#2f66d0]/10"
              />
            </div>
          )}

          {actionError && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{actionError}</p>
          )}

          {selectedSubmission?.status === "PENDENTE" && !isLoadingDetails && (
            <DialogFooter className="mt-6 gap-3 sm:space-x-0">
              <button
                type="button"
                onClick={() => validateSubmission("rejeitar")}
                disabled={isActing}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-red-200 bg-white px-5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-60"
              >
                <XCircle className="h-4 w-4" aria-hidden="true" />
                Rejeitar
              </button>
              <button
                type="button"
                onClick={() => validateSubmission("aprovar")}
                disabled={isActing}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#218653] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#176d43] disabled:cursor-wait disabled:opacity-60"
              >
                {isActing ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
                Aprovar e publicar no BD
              </button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const SummaryCard = ({ icon: Icon, label, tone, value }) => {
  const tones = {
    approved: "bg-[#eaf7f0] text-[#218653]",
    pending: "bg-amber-50 text-amber-600",
    rejected: "bg-red-50 text-red-600",
  };
  return (
    <article className="rounded-2xl border border-[#dbe5f1] bg-white p-5 shadow-[0_8px_25px_rgba(39,72,125,0.06)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#6b788c]">{label}</p>
          <p className="mt-2 text-3xl font-extrabold text-[#26364d]">{value}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
    </article>
  );
};

const StatusBadge = ({ status }) => {
  const styles = {
    APROVADA: "bg-[#eaf7f0] text-[#218653]",
    PENDENTE: "bg-amber-50 text-amber-700",
    REJEITADA: "bg-red-50 text-red-600",
  };
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${styles[status]}`}>{statusLabels[status]}</span>;
};

const Metadata = ({ label, value }) => (
  <div>
    <span className="block text-xs font-bold uppercase tracking-[0.08em] text-[#8190a5]">{label}</span>
    <span className="mt-1 block font-semibold text-[#405169]">{value}</span>
  </div>
);

const formatVariableValue = (variable) => {
  if (variable.variavel_valor_textual != null) return variable.variavel_valor_textual;
  return Number(variable.variavel_valor) === 1 ? "Sim (1)" : "Não (0)";
};

export default CityHallAdmin;
