import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@services/api";
import { FileSpreadsheet, Download, Upload } from "lucide-react";

type ImportCreditCardModalProps = {
  open: boolean;
  onClose: () => void;
};

type ImportResult = {
  imported: number;
  total: number;
  errors: string[];
};

/** Planilha de exemplo para download (mesmo formato do backend) */
const TEMPLATE_CSV = `Data,Plataforma,Cartão,Valor da parcela,Quantidade de parcelas,Parcelas pagas,Fechamento na próxima fatura
27/07/2025,Mercado Livre,Cartão Nubank,54.56,6,2,0
03/11/2025,Shopee,Cartão Nubank,90.51,7,0,1
15/08/2025,Natura,Cartão Inter,193.00,3,3,0
01/01/2025,Netflix,Cartão Inter,55.90,12,5,0
10/09/2025,Magalu,Cartão Visa,120.00,4,1,1
20/10/2025,Amazon,Cartão Visa,89.99,2,0,0`;

export function ImportCreditCardModal({
  open,
  onClose,
}: ImportCreditCardModalProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const importMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await api.post<ImportResult>(
        "/credit-card/import",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      return res.data;
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["credit-card"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-charts"] });
      if (data.imported > 0) setFile(null);
    },
  });

  const handleDownloadTemplate = () => {
    const bom = "\uFEFF";
    const blob = new Blob([bom + TEMPLATE_CSV], {
      type: "text/csv;charset=utf-8",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "modelo_cartao_credito.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    importMutation.mutate(formData);
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    importMutation.reset();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFile(f ?? null);
    setResult(null);
    e.target.value = "";
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 dark:bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md min-w-[22rem] rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Importar planilha
          </h3>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
          >
            <Download className="h-4 w-4 shrink-0" />
            Baixar planilha com exemplos
          </button>

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              id="credit-card-import-file"
            />
            <label
              htmlFor="credit-card-import-file"
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-500 bg-slate-50/50 dark:bg-slate-700/30 px-4 py-3 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4 shrink-0" />
              {file ? file.name : "Selecionar arquivo CSV ou Excel"}
            </label>
          </div>

          {result && (
            <div
              className={`rounded-xl border px-3 py-2.5 text-sm ${
                result.imported > 0
                  ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200"
                  : "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200"
              }`}
            >
              <p className="font-medium">
                {result.imported} de {result.total} registro(s) importado(s).
              </p>
              {result.errors.length > 0 && (
                <ul className="mt-1.5 list-disc list-inside text-xs opacity-90">
                  {result.errors.slice(0, 5).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                  {result.errors.length > 5 && (
                    <li>… e mais {result.errors.length - 5} erro(s)</li>
                  )}
                </ul>
              )}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 min-w-[6rem]"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={!file || importMutation.isPending}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-500 dark:hover:bg-indigo-400 disabled:opacity-50 min-w-[6rem]"
            >
              {importMutation.isPending ? (
                "Importando..."
              ) : (
                <>
                  <Upload className="h-4 w-4 shrink-0" />
                  Importar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
