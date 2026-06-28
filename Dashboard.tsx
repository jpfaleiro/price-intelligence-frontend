"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  LayoutDashboard, 
  TrendingUp, 
  TrendingDown,
  Search, 
  Package, 
  CheckCircle,
  Lightbulb,
  ArrowUpRight,
  Store,
  FileSpreadsheet,
  ExternalLink,
  HelpCircle,
  History,
  FileText,
  Calendar,
  Clock,
  Layers,
  Image as ImageIcon,
  Tag,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Download,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Filter,
  SortAsc,
  Bot,
  Send,
  Sparkles,
  RefreshCw,
  FileDown,
  Zap,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, LineChart, Line } from "recharts";

const API_BASE = "https://price-intelligence-backend-production.up.railway.app";

interface ResumoIA {
  dataColeta: string;
  totalRegistros: number;
  ticketMedioGeral: string;
  canalLider: { marketplace: string; ticketMedio: string; share: string } | null;
  shareMarketplace: { marketplace: string; registros: number; share: string; ticketMedio: string }[];
  topCategorias: { categoria: string; registros: number; ticketMedio: string }[];
  topMarcas: { marca: string; registros: number }[];
}

interface AlertaIA {
  tipo: string;
  severidade: "CRITICO" | "ATENCAO" | "INFO";
  titulo: string;
  descricao: string;
}

interface MensagemChat {
  role: "user" | "ai";
  content: string;
  ts: string;
}

export default function Dashboard() {
  const [termoBusca, setTermoBusca] = useState("");
  const [currentScenario, setCurrentScenario] = useState<any>(null);
  const [previousScenario, setPreviousScenario] = useState<any>(null);
  const [erroBusca, setErroBusca] = useState("");
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [buscando, setBuscando] = useState(false);
  const [historicoCenarios, setHistoricoCenarios] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [alertasCriticos, setAlertasCriticos] = useState<any[]>([]);
  const [ordenacaoMatriz, setOrdenacaoMatriz] = useState<string>("default");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [mostraComparativo, setMostraComparativo] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 5;

  // IA states
  const [resumoIA, setResumoIA] = useState<ResumoIA | null>(null);
  const [alertasIA, setAlertasIA] = useState<AlertaIA[]>([]);
  const [carregandoResumo, setCarregandoResumo] = useState(false);
  const [carregandoAlertas, setCarregandoAlertas] = useState(false);
  const [chatAberto, setChatAberto] = useState(false);
  const [mensagensChat, setMensagensChat] = useState<MensagemChat[]>([]);
  const [inputChat, setInputChat] = useState("");
  const [enviandoChat, setEnviandoChat] = useState(false);
  const [gerandoPDF, setGerandoPDF] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Autocomplete states
  const [sugestoes, setSugestoes] = useState<string[]>([]);
  const [mostraSugestoes, setMostraSugestoes] = useState(false);
  const [sugestaoIndex, setSugestaoIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const shareGondolaData = [
    { name: "Midea", value: 44 }, { name: "Brastemp", value: 17 }, { name: "Electrolux", value: 15 },
    { name: "Philco", value: 14 }, { name: "Consul", value: 4 }, { name: "Outros", value: 6 }
  ];
  const precoCanalData = [
    { name: "M. Livre", preco_medio: 1680 }, { name: "Carrefour", preco_medio: 1850 },
    { name: "Ponto", preco_medio: 1880 }, { name: "Magalu", preco_medio: 1890 }, { name: "Americanas", preco_medio: 1910 }
  ];

  useEffect(() => {
    try {
      const saved = localStorage.getItem('priceIntelHistorico');
      if (saved) setHistoricoCenarios(JSON.parse(saved).slice(0, 20));
    } catch (e) { console.warn("Erro ao carregar histórico:", e); }
  }, []);

  useEffect(() => {
    if (historicoCenarios.length > 0) {
      try { localStorage.setItem('priceIntelHistorico', JSON.stringify(historicoCenarios.slice(0, 20))); }
      catch (e) { console.warn("Erro ao salvar histórico:", e); }
    }
  }, [historicoCenarios]);

  useEffect(() => {
    fetch(`${API_BASE}/api/produtos?limit=1&page=1`)
      .then(res => res.json())
      .then(data => { setTotalRegistros(data.total || 0); verificarAlertasCriticos(data); })
      .catch(err => console.warn("Erro ao conectar com backend:", err.message));
    carregarResumoIA();
    carregarAlertasIA();
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [mensagensChat]);

  // ─── IA ──────────────────────────────────────────────────────────────────────

  const carregarResumoIA = async () => {
    setCarregandoResumo(true);
    try {
      const res = await fetch(`${API_BASE}/api/resumo`);
      if (res.ok) setResumoIA(await res.json());
    } catch (e) { console.warn("Erro resumo IA:", e); }
    finally { setCarregandoResumo(false); }
  };

  const carregarAlertasIA = async () => {
    setCarregandoAlertas(true);
    try {
      const res = await fetch(`${API_BASE}/api/alertas`);
      if (res.ok) { const d = await res.json(); setAlertasIA(d.alertas || []); }
    } catch (e) { console.warn("Erro alertas IA:", e); }
    finally { setCarregandoAlertas(false); }
  };

  const enviarMensagemChat = async (textoOverride?: string) => {
    const texto = textoOverride ?? inputChat.trim();
    if (!texto || enviandoChat) return;
    setInputChat("");
    setEnviandoChat(true);
    const ts = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    setMensagensChat(prev => [...prev, { role: "user", content: texto, ts }]);
    try {
      const historicoParaAPI = mensagensChat.slice(-8).map(m => ({
        role: m.role === "ai" ? "assistant" : "user",
        content: m.content,
      }));

      const response = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...historicoParaAPI, { role: "user", content: texto }],
          skuParam: currentScenario?.sku_name ?? "",
        }),
      });

      const data = await response.json();
      const resposta = data.resposta ?? "Não foi possível processar a resposta.";
      setMensagensChat(prev => [...prev, { role: "ai", content: resposta, ts: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) }]);
    } catch (e) {
      setMensagensChat(prev => [...prev, { role: "ai", content: "Erro ao conectar ao analista. Verifique sua conexão e tente novamente.", ts: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) }]);
    } finally { setEnviandoChat(false); }
  };

  const gerarPDFComIA = async () => {
    if (gerandoPDF) return;
    setGerandoPDF(true);
    try {
      const skuParam = currentScenario?.sku_name ? `sku=${encodeURIComponent(currentScenario.sku_name)}` : "";
      const ctxRes = await fetch(`${API_BASE}/api/contexto-ia?${skuParam}`);
      const ctxData = ctxRes.ok ? await ctxRes.json() : null;
      const systemPrompt = ctxData?.systemPrompt ?? "Você é um analista de mercado de eletrodomésticos no Brasil.";
      const prompt = currentScenario
        ? `Gere um relatório executivo completo em HTML para o cenário "${currentScenario.titulo}". Inclua: 1) Situação do mercado, 2) Principais riscos identificados, 3) Oportunidades detectadas, 4) Recomendações estratégicas com ações concretas. Use os dados do contexto fornecido. Formato: HTML simples com estilos inline, pronto para impressão.`
        : `Gere um relatório executivo completo do mercado de eletrodomésticos em HTML. Inclua: 1) Panorama geral, 2) Análise de canais, 3) Riscos e oportunidades, 4) Recomendações estratégicas. Use os dados do contexto. Formato: HTML simples com estilos inline, pronto para impressão.`;

      const response = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          skuParam: currentScenario?.sku_name ?? "",
        }),
      });
      const data = await response.json();
      const conteudo = data.resposta ?? "";
      const titulo = currentScenario?.titulo ?? "Relatório de Mercado";
      const printWindow = window.open("", "_blank");
      if (!printWindow) return;
      printWindow.document.write(`<html><head><title>Relatório Executivo IA — ${titulo}</title>
        <style>body{font-family:Arial,sans-serif;padding:32px;color:#1e293b;max-width:900px;margin:0 auto}h1{color:#1e40af;font-size:22px;border-bottom:2px solid #1e40af;padding-bottom:8px}h2{color:#334155;font-size:16px;margin-top:24px}.badge{display:inline-block;background:#dbeafe;color:#1e40af;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:bold;margin-bottom:16px}.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:16px 0}.metric{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px}.metric-label{font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.05em}.metric-value{font-size:20px;font-weight:bold;color:#1e40af;margin-top:4px}p{line-height:1.7;color:#334155}@media print{body{padding:16px}}</style>
        </head><body>
        <div class="badge">Gerado por IA · Price-Intel · ${new Date().toLocaleDateString("pt-BR")}</div>
        <h1>${titulo}</h1>
        ${resumoIA ? `<div class="metrics"><div class="metric"><div class="metric-label">Ticket Médio</div><div class="metric-value">R$ ${parseFloat(resumoIA.ticketMedioGeral).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div></div><div class="metric"><div class="metric-label">Canal Líder</div><div class="metric-value" style="font-size:15px">${resumoIA.canalLider?.marketplace ?? "—"}</div></div><div class="metric"><div class="metric-label">Registros</div><div class="metric-value">${resumoIA.totalRegistros.toLocaleString()}</div></div></div>` : ""}
        ${conteudo}</body></html>`);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 600);
    } catch (e) { alert("Erro ao gerar relatório. Tente novamente."); }
    finally { setGerandoPDF(false); }
  };

  // ─── FUNÇÕES EXISTENTES ───────────────────────────────────────────────────────

  const verificarAlertasCriticos = async (data: any) => {
    try {
      const res = await fetch(`${API_BASE}/api/produtos?q=midea&limit=100`);
      if (!res.ok) return;
      const json = await res.json();
      const itens = json.data || [];
      const precosVista = itens.map((p: any) => parseFloat(p["PIX PRICE"] || p["SPOT PRICE OF MARKETPLACE"] || 0)).filter((v: number) => v > 0);
      if (precosVista.length > 0) {
        const media = precosVista.reduce((a: number, b: number) => a + b, 0) / precosVista.length;
        setAlertasCriticos(itens.filter((p: any) => { const v = parseFloat(p["PIX PRICE"] || p["SPOT PRICE OF MARKETPLACE"] || 0); return v > 0 && v < media * 0.85; }).slice(0, 3).map((p: any) => ({ produto: p["PRODUCT"] || p["TITLE OF MARKETPLACE"], marketplace: p["MARKETPLACE"], preco: parseFloat(p["PIX PRICE"] || p["SPOT PRICE OF MARKETPLACE"] || 0), desvio: "Crítico" })));
      }
    } catch (e) {}
  };

  const normalizarTexto = (texto: any): string => {
    if (!texto) return "";
    return String(texto).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  };

  const buscarSugestoes = async (termo: string) => {
    if (termo.length < 3) { setSugestoes([]); setMostraSugestoes(false); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/produtos?q=${encodeURIComponent(normalizarTexto(termo))}&limit=30`);
        if (!res.ok) return;
        const json = await res.json();
        const itens: any[] = json.data || [];
        const seen = new Set<string>();
        const nomes: string[] = [];
        for (const it of itens) {
          const nome = (it["PRODUCT"] || it["TITLE OF MARKETPLACE"] || "").trim();
          if (nome && !seen.has(nome)) { seen.add(nome); nomes.push(nome); }
          if (nomes.length >= 8) break;
        }
        setSugestoes(nomes);
        setMostraSugestoes(nomes.length > 0);
        setSugestaoIndex(-1);
      } catch {}
    }, 250);
  };

  const handleTermoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setTermoBusca(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => buscarSugestoes(v), 250);
  };

  const selecionarSugestao = (nome: string) => { setTermoBusca(nome); setSugestoes([]); setMostraSugestoes(false); executarBusca(nome); };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!mostraSugestoes || sugestoes.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setSugestaoIndex(i => Math.min(i + 1, sugestoes.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSugestaoIndex(i => Math.max(i - 1, -1)); }
    else if (e.key === "Enter" && sugestaoIndex >= 0) { e.preventDefault(); selecionarSugestao(sugestoes[sugestaoIndex]); }
    else if (e.key === "Escape") { setMostraSugestoes(false); setSugestaoIndex(-1); }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) && inputRef.current && !inputRef.current.contains(e.target as Node)) setMostraSugestoes(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const exportarCSV = (cenario: any) => {
    if (!cenario?.relatorioItens) return;
    const headers = ["Nº","Título","Produto","SKU","Marca","Família","Categoria","Subcategoria","Data Coleta","Hora Coleta","Preço Pix","Preço Spot","Preço De","Parcelas","Valor Parcela","Marketplace","Lojista","Cor","Status Mercado","URL"];
    const rows = cenario.relatorioItens.map((item: any) => [item.num,item.titleOfMarketplace,item.product,item.sku,item.brand,item.family,item.category,item.subcategory,item.collectionDate,item.collectionHour,item.pixPrice,item.spotPriceOfMarketplace,item.priceFromOfMarketplace,item.numberOfInstallments,item.installmentValue,item.marketplace,item.sellerOfMarketplace,item.colorOfMarketplace,item.posMercado,item.offerUrl]);
    const csvContent = [headers, ...rows].map(row => row.map((cell: any) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_${cenario.titulo.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportarPDF = (cenario: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`<html><head><title>Relatório - ${cenario.titulo}</title><style>body{font-family:Arial,sans-serif;padding:20px;color:#333}h1{color:#1e40af;font-size:20px}.header{border-bottom:2px solid #1e40af;padding-bottom:10px;margin-bottom:20px}.metric{display:inline-block;margin:10px 20px 10px 0}.metric-label{font-size:10px;color:#666;text-transform:uppercase}.metric-value{font-size:18px;font-weight:bold;color:#1e40af}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#1e40af;color:white;padding:8px;text-align:left;font-size:11px}td{padding:8px;border-bottom:1px solid #ddd;font-size:11px}@media print{body{margin:0}}</style></head><body><div class="header"><h1>${cenario.titulo}</h1><p>${cenario.meta}</p></div><div><div class="metric"><div class="metric-label">Preço Médio</div><div class="metric-value">R$ ${(cenario.preco_praticado||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}</div></div><div class="metric"><div class="metric-label">Conformidade</div><div class="metric-value">${cenario.conformidade_pct||100}%</div></div><div class="metric"><div class="metric-label">Total Itens</div><div class="metric-value">${cenario.relatorioItens?.length||0}</div></div></div><div><h3>Diagnóstico</h3><p>${cenario.diagnostico}</p><p><strong>Recomendação:</strong> ${cenario.recomendacao}</p></div><table><thead><tr><th>Nº</th><th>Produto</th><th>SKU</th><th>Preço</th><th>Marketplace</th><th>Status</th></tr></thead><tbody>${(cenario.relatorioItens||[]).slice(0,50).map((item:any)=>`<tr><td>${item.num}</td><td>${item.product}</td><td>${item.sku}</td><td>R$ ${(item.pixPrice||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}</td><td>${item.marketplace}</td><td>${item.posMercado}</td></tr>`).join('')}</tbody></table></body></html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  const executarBusca = async (termo: string) => {
    const query = normalizarTexto(termo);
    if (!query) { setErroBusca("Por favor, digite um termo para pesquisar."); return; }
    setBuscando(true); setErroBusca("");
    try {
      const res = await fetch(`${API_BASE}/api/produtos?q=${encodeURIComponent(query)}&limit=2000`);
      if (!res.ok) throw new Error("Erro na resposta do servidor.");
      const json = await res.json();
      const itensCorrespondentes: any[] = json.data || [];
      if (itensCorrespondentes.length === 0) { setErroBusca("Nenhum registro encontrado para o termo inserido nesta janela de auditoria."); setBuscando(false); return; }
      setPaginaAtual(1);
      const base = itensCorrespondentes[0];
      const nomeBase = base["PRODUCT"] || base["TITLE OF MARKETPLACE"] || `Grupo SKU: ${base["SKU"]}`;
      const precosVistaGerais = itensCorrespondentes.map(prod => parseFloat(prod["PIX PRICE"] || prod["SPOT PRICE OF MARKETPLACE"] || 0)).filter(v => v > 0);
      const mediaPreco = precosVistaGerais.length > 0 ? precosVistaGerais.reduce((a, b) => a + b, 0) / precosVistaGerais.length : 0;
      const matrizMapeada = itensCorrespondentes.map((prod: any) => {
        const v = parseFloat(prod["PIX PRICE"] || prod["SPOT PRICE OF MARKETPLACE"] || 0) || 0;
        const p = parseFloat(prod["FORWARD PRICE OF MARKETPLACE"]) || 0;
        let status = "No Valor Correto"; let statusColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
        if (v > 0 && v < mediaPreco * 0.95) { status = "Abaixo do Valor"; statusColor = "bg-red-500/10 text-red-400 border-red-500/20"; }
        else if (v > mediaPreco * 1.05) { status = "Acima do Valor"; statusColor = "bg-blue-500/10 text-blue-400 border-blue-500/20"; }
        return { marketplace: prod["MARKETPLACE"] || prod["TITLE OF MARKETPLACE"]?.split(" ")[0] || "Marketplace", seller: prod["SELLER OF MARKETPLACE"] || "Lojista Não Identificado", vista: v, parcelado: p || v, status, statusColor, impacto: "Item indexado via auditoria unificada", url: prod["OFFER URL"] || "#" };
      });
      const precosVista = matrizMapeada.map(m => m.vista).filter(v => v > 0);
      const menorPreco = precosVista.length > 0 ? Math.min(...precosVista) : 0;
      const maiorPreco = precosVista.length > 0 ? Math.max(...precosVista) : 0;
      const possuiInfratores = matrizMapeada.some(m => m.status === "Abaixo do Valor");
      const totalAbaixo = matrizMapeada.filter(m => m.status === "Abaixo do Valor").length;
      const totalAcima = matrizMapeada.filter(m => m.status === "Acima do Valor").length;
      let diagnosticoRelatorio = possuiInfratores
        ? `⚠️ Atenção: Dos ${itensCorrespondentes.length} anúncios mapeados, ${totalAbaixo} estão com preço abaixo da margem recomendada (risco de canibalização). Menor preço encontrado: R$ ${menorPreco.toLocaleString('pt-BR')}. Sellers críticos: ${matrizMapeada.filter(m => m.status === "Abaixo do Valor").slice(0, 3).map(m => m.seller).join(", ")}. Recomendamos acionar o time de trade marketing para notificação imediata.`
        : `✅ Cenário saudável: Todos os ${itensCorrespondentes.length} anúncios operam dentro da faixa de conformidade. Menor preço: R$ ${menorPreco.toLocaleString('pt-BR')} | Maior preço: R$ ${maiorPreco.toLocaleString('pt-BR')}. Monitoramento padrão mantido.`;
      const seen = new Set<string>();
      const itensDeduplicados = itensCorrespondentes.filter((prod: any) => {
        const chave = `${prod["SKU"]||""}_${prod["MARKETPLACE"]||""}_${prod["SELLER OF MARKETPLACE"]||""}_${prod["PIX PRICE"]||prod["SPOT PRICE OF MARKETPLACE"]||""}`;
        if (seen.has(chave)) return false; seen.add(chave); return true;
      });
      const novoCenarioDinamico = {
        id: `cenario-${Date.now()}`, sku_name: base["SKU"] || "Filtro Ativo", seller_match: base["SELLER OF MARKETPLACE"] || "Multi-Sellers",
        titulo: nomeBase, meta: `Resultados obtidos da busca: "${termo}" • ${itensCorrespondentes.length} registros auditados em tempo real`,
        posicionamento: possuiInfratores ? "Desvio Detectado" : "Conformidade Total", preco_praticado: mediaPreco,
        msrp: maiorPreco || mediaPreco * 1.15, desvio: maiorPreco ? `${(((mediaPreco - maiorPreco) / maiorPreco) * 100).toFixed(1)}%` : "0,0%",
        share: `${itensCorrespondentes.length} anúncios ativos`, sensibilidade: "Dinamizada por Filtro CSV",
        risco: possuiInfratores ? "Alto" : "Baixo", riscoColor: possuiInfratores ? "text-red-400" : "text-emerald-400",
        badgeColor: possuiInfratores ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        diagnostico: diagnosticoRelatorio, recomendacao: possuiInfratores ? "Disparar notificações preventivas automáticas de quebra de margem." : "Monitoramento padrão em background ativo.",
        map_alvo: mediaPreco * 1.05, conformidade_pct: possuiInfratores ? Math.round((matrizMapeada.filter(m => m.status !== "Abaixo do Valor").length / matrizMapeada.length) * 100) : 100,
        pdp_link: base["OFFER URL"] || "#", matriz: matrizMapeada, totalItens: itensCorrespondentes.length, totalAbaixo, totalAcima, menorPreco, maiorPreco,
        relatorioItens: itensDeduplicados.map((prod: any, idx: number) => {
          const v = parseFloat(prod["PIX PRICE"] || prod["SPOT PRICE OF MARKETPLACE"] || 0) || 0;
          let posMercado = "No Valor Correto"; let posMercadoColor = "bg-emerald-500/10 text-emerald-400";
          if (v > 0 && v < mediaPreco * 0.95) { posMercado = "Abaixo do Valor"; posMercadoColor = "bg-red-500/10 text-red-400"; }
          else if (v > mediaPreco * 1.05) { posMercado = "Acima do Valor"; posMercadoColor = "bg-blue-500/10 text-blue-400"; }
          return { num: idx + 1, titleOfMarketplace: prod["TITLE OF MARKETPLACE"] || "N/A", product: prod["PRODUCT"] || "N/A", sku: prod["SKU"] || "N/A", family: prod["FAMILY"] || "N/A", collectionDate: prod["COLLECTION DATE"] || "N/A", collectionHour: prod["COLLECTION HOUR"] || "N/A", executionHour: prod["EXECUTION HOUR"] || "N/A", spotPriceOfMarketplace: parseFloat(prod["SPOT PRICE OF MARKETPLACE"]) || 0, forwardPriceOfMarketplace: parseFloat(prod["FORWARD PRICE OF MARKETPLACE"]) || 0, priceFromOfMarketplace: parseFloat(prod["PRICE FROM OF MARKETPLACE"]) || 0, numberOfInstallments: prod["NUMBER OF INSTALLMENTS"] || "N/A", installmentValue: prod["INSTALLMENT VALUE"] || "N/A", brand: prod["BRAND"] || "N/A", marketplace: prod["MARKETPLACE"] || "N/A", category: prod["CATEGORY"] || "N/A", subcategory: prod["SUBCATEGORY"] || "N/A", sellerOfMarketplace: prod["SELLER OF MARKETPLACE"] || "N/A", colorOfMarketplace: prod["COLOR OF MARKETPLACE"] || "N/A", offerUrl: prod["OFFER URL"] || "#", screenshotUrl: prod["SCREENSHOT URL"] || "", pixPrice: v, idField: prod["ID"] || "N/A", posMercado, posMercadoColor };
        })
      };
      if (currentScenario?.sku_name) setPreviousScenario(currentScenario);
      setCurrentScenario(novoCenarioDinamico); setErroBusca(""); setSidebarOpen(false); setMostraComparativo(false);
      setHistoricoCenarios(prev => [{ ...novoCenarioDinamico, termoPesquisado: termo, timestamp: new Date().toLocaleTimeString() }, ...prev].slice(0, 20));
    } catch (err: any) { setErroBusca("Erro ao conectar com o backend: " + err.message); }
    finally { setBuscando(false); }
  };

  const lidarComBuscaForm = (e: React.FormEvent) => { e.preventDefault(); executarBusca(termoBusca); };
  const ordenarMatriz = (criterio: string) => setOrdenacaoMatriz(criterio);
  const getMatrizOrdenada = () => {
    if (!currentScenario?.matriz) return [];
    let matriz = [...currentScenario.matriz];
    if (filtroStatus === "abaixo") matriz = matriz.filter((m: any) => m.status === "Abaixo do Valor");
    else if (filtroStatus === "acima") matriz = matriz.filter((m: any) => m.status === "Acima do Valor");
    else if (filtroStatus === "normal") matriz = matriz.filter((m: any) => m.status === "No Valor Correto");
    if (ordenacaoMatriz === "preco_asc") matriz.sort((a: any, b: any) => a.vista - b.vista);
    else if (ordenacaoMatriz === "preco_desc") matriz.sort((a: any, b: any) => b.vista - a.vista);
    else if (ordenacaoMatriz === "marketplace") matriz.sort((a: any, b: any) => a.marketplace.localeCompare(b.marketplace));
    return matriz;
  };

  const totalItens = currentScenario?.relatorioItens?.length || 0;
  const totalPaginas = Math.ceil(totalItens / itensPorPagina);
  const indiceInicial = (paginaAtual - 1) * itensPorPagina;
  const itensPaginados = currentScenario?.relatorioItens?.slice(indiceInicial, indiceInicial + itensPorPagina) || [];

  const calcularTendencia = () => {
    if (!previousScenario || !currentScenario) return null;
    const precoAtual = currentScenario.preco_praticado || 0;
    const precoAnterior = previousScenario.preco_praticado || 0;
    if (precoAnterior === 0) return null;
    const variacao = ((precoAtual - precoAnterior) / precoAnterior) * 100;
    return { variacao, direcao: variacao > 0 ? 'up' : 'down', absoluto: Math.abs(variacao).toFixed(1) };
  };
  const tendencia = calcularTendencia();

  const corSeveridade = (s: string) => {
    if (s === "CRITICO") return "bg-red-500/10 text-red-400 border-red-500/20";
    if (s === "ATENCAO") return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    return "bg-blue-500/10 text-blue-400 border-blue-500/20";
  };
  const iconeAlerta = (tipo: string) => {
    if (tipo === "GUERRA_TARIFARIA") return "⚔️";
    if (tipo === "PRESSAO_MARGEM") return "📉";
    if (tipo === "VARIACAO_PRECO") return "🔀";
    return "💡";
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans antialiased">

      {alertasCriticos.length > 0 && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2">
          <div className="flex items-center gap-2 text-xs">
            <AlertTriangle size={14} className="text-red-400 shrink-0" />
            <span className="text-red-400 font-bold">ALERTA CRÍTICO:</span>
            <span className="text-red-300">
              {alertasCriticos.length} produto(s) com desvio de preço detectado(s) nas últimas 24h.{" "}
              {alertasCriticos.map((a: any, i: number) => (<span key={i} className="ml-1">{a.produto} no {a.marketplace} a R$ {a.preco?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}{i < alertasCriticos.length - 1 ? ', ' : ''}</span>))}
            </span>
          </div>
        </div>
      )}

      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#1e293b] border-b border-slate-800 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="text-blue-500 w-5 h-5" />
          <span className="text-sm font-black tracking-wider text-white uppercase">PRICE-INTEL</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-2 py-0.5 border rounded-full text-[10px] font-bold uppercase flex items-center gap-1 ${totalRegistros > 0 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${totalRegistros > 0 ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />{totalRegistros > 0 ? "Online" : "Offline"}
          </span>
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"><Menu size={18} /></button>
        </div>
      </header>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-[#1e293b] p-6 flex flex-col gap-6 border-r border-slate-800 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2"><LayoutDashboard className="text-blue-500 w-5 h-5" /><h2 className="text-sm font-black tracking-wider text-white uppercase">PRICE-INTEL</h2></div>
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700"><X size={16} /></button>
            </div>
            <SidebarContent historicoCenarios={historicoCenarios} currentScenario={currentScenario} setCurrentScenario={setCurrentScenario} setPaginaAtual={setPaginaAtual} setSidebarOpen={setSidebarOpen} />
          </aside>
        </div>
      )}

      <div className="flex">
        <aside className="hidden lg:flex w-64 bg-[#1e293b]/40 m-4 rounded-2xl p-6 flex-col gap-6 border border-slate-800/80 sticky top-4 h-[calc(100vh-2rem)] overflow-y-auto">
          <div className="flex flex-col gap-1 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2"><LayoutDashboard className="text-blue-500 w-6 h-6" /><h2 className="text-base font-black tracking-wider text-white uppercase">PRICE-INTEL</h2></div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Market Intelligence Panel</span>
          </div>
          <SidebarContent historicoCenarios={historicoCenarios} currentScenario={currentScenario} setCurrentScenario={setCurrentScenario} setPaginaAtual={setPaginaAtual} setSidebarOpen={setSidebarOpen} />
        </aside>

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto min-w-0">

          <header className="hidden lg:flex mb-8 justify-between items-start">
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Mercado de Eletrodomésticos — Linha Branca & Ar Condicionado</h1>
              <p className="text-sm text-slate-400 mt-1">Visão geral do mercado monitorado no Brasil · Junho de 2026</p>
            </div>
            <span className={`px-3 py-1 border rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0 ml-4 ${totalRegistros > 0 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
              <span className={`w-2 h-2 rounded-full ${totalRegistros > 0 ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />{totalRegistros > 0 ? "Backend Conectado" : "Backend Offline"}
            </span>
          </header>

          <div className="lg:hidden mb-5">
            <h1 className="text-lg font-black text-white tracking-tight leading-tight">Mercado de Eletrodomésticos</h1>
            <p className="text-xs text-slate-400 mt-0.5">Linha Branca & Ar Condicionado · Jun/2026</p>
          </div>

          {totalRegistros === 0 && (
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs font-medium">
              ⚠️ Não foi possível conectar ao backend. Verifique se o servidor Express está rodando.
            </div>
          )}

          {/* ── RESUMO EXECUTIVO IA ── */}
          {(resumoIA || carregandoResumo) && (
            <div className="mb-6 lg:mb-8 bg-[#1e293b]/50 border border-blue-500/20 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 lg:px-6 py-3 border-b border-slate-800 bg-blue-500/5">
                <div className="flex items-center gap-2">
                  <Sparkles size={15} className="text-blue-400" />
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Resumo Executivo — IA</span>
                  {resumoIA && <span className="text-[10px] text-slate-500">· {resumoIA.dataColeta}</span>}
                </div>
                <button onClick={carregarResumoIA} disabled={carregandoResumo} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-40" title="Atualizar resumo">
                  <RefreshCw size={13} className={carregandoResumo ? "animate-spin" : ""} />
                </button>
              </div>
              {carregandoResumo ? (
                <div className="flex items-center gap-3 px-6 py-4 text-slate-500 text-xs">
                  <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />Analisando dados do mercado…
                </div>
              ) : resumoIA ? (
                <div className="p-4 lg:p-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Ticket médio real</div>
                      <div className="text-lg font-black text-white font-mono">R$ {parseFloat(resumoIA.ticketMedioGeral).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                    </div>
                    <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Canal líder</div>
                      <div className="text-base font-black text-blue-400 truncate">{resumoIA.canalLider?.marketplace ?? "—"}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{resumoIA.canalLider?.share}% do share</div>
                    </div>
                    <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Registros ativos</div>
                      <div className="text-lg font-black text-white">{resumoIA.totalRegistros.toLocaleString()}</div>
                    </div>
                    <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Top categoria</div>
                      <div className="text-base font-black text-emerald-400 truncate">{resumoIA.topCategorias[0]?.categoria ?? "—"}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{resumoIA.topCategorias[0]?.registros} registros</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Preço médio por canal</div>
                      <div className="space-y-1.5">
                        {resumoIA.shareMarketplace.slice(0, 5).map((c) => (
                          <div key={c.marketplace} className="flex items-center gap-2 text-xs">
                            <span className="text-slate-400 w-24 truncate">{c.marketplace}</span>
                            <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (parseFloat(c.ticketMedio) / parseFloat(resumoIA.shareMarketplace[0]?.ticketMedio || "1")) * 100)}%` }} />
                            </div>
                            <span className="text-slate-300 font-mono text-[11px] w-20 text-right">R$ {parseFloat(c.ticketMedio).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                            <span className="text-slate-500 text-[10px] w-10 text-right">{c.share}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Top categorias monitoradas</div>
                      <div className="space-y-1.5">
                        {resumoIA.topCategorias.slice(0, 5).map((c) => (
                          <div key={c.categoria} className="flex items-center justify-between text-xs">
                            <span className="text-slate-400 truncate flex-1">{c.categoria}</span>
                            <span className="text-slate-300 font-mono text-[11px] ml-2">R$ {parseFloat(c.ticketMedio).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                            <span className="text-slate-500 text-[10px] ml-3 w-16 text-right">{c.registros} reg.</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* ── ALERTAS IA ── */}
          {(alertasIA.length > 0 || carregandoAlertas) && (
            <div className="mb-6 lg:mb-8">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-amber-400" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alertas Inteligentes</span>
                  {!carregandoAlertas && <span className="text-[10px] text-slate-600">· {alertasIA.length} detectados</span>}
                </div>
                <button onClick={carregarAlertasIA} disabled={carregandoAlertas} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-40">
                  <RefreshCw size={13} className={carregandoAlertas ? "animate-spin" : ""} />
                </button>
              </div>
              {carregandoAlertas ? (
                <div className="flex items-center gap-3 p-4 bg-[#1e293b]/50 border border-slate-800 rounded-xl text-slate-500 text-xs">
                  <span className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />Processando alertas com IA…
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {alertasIA.map((alerta, idx) => (
                    <div key={idx} className={`p-4 rounded-xl border ${corSeveridade(alerta.severidade)}`}>
                      <div className="flex items-start gap-2">
                        <span className="text-base shrink-0">{iconeAlerta(alerta.tipo)}</span>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold">{alerta.titulo}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase ${corSeveridade(alerta.severidade)}`}>{alerta.severidade}</span>
                          </div>
                          <p className="text-[11px] leading-relaxed opacity-90">{alerta.descricao}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-6 lg:mb-8">
            <div className="bg-[#1e293b]/50 border border-slate-800/80 p-4 lg:p-5 rounded-xl shadow-sm">
              <span className="text-slate-400 text-[10px] lg:text-xs font-bold uppercase tracking-wider block">Registros Prontos</span>
              <div className="text-2xl lg:text-3xl font-black text-white mt-2">{totalRegistros.toLocaleString()}</div>
              <span className="text-[10px] lg:text-[11px] text-slate-500 font-medium mt-1 block">Carregados do backend</span>
            </div>
            <div className="bg-[#1e293b]/50 border border-slate-800/80 p-4 lg:p-5 rounded-xl shadow-sm">
              <span className="text-slate-400 text-[10px] lg:text-xs font-bold uppercase tracking-wider block">Ticket Médio</span>
              <div className="text-2xl lg:text-3xl font-black text-white mt-2">{resumoIA ? `R$ ${parseFloat(resumoIA.ticketMedioGeral).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "R$ 1.782"}</div>
              <span className="text-[10px] lg:text-[11px] text-emerald-400 font-bold mt-1 flex items-center gap-0.5">{resumoIA ? `${resumoIA.totalRegistros.toLocaleString()} registros` : "+4,3% vs. mai/26"}</span>
            </div>
            <div className="bg-[#1e293b]/50 border border-slate-800/80 p-4 lg:p-5 rounded-xl shadow-sm">
              <span className="text-slate-400 text-[10px] lg:text-xs font-bold uppercase tracking-wider block">Quebra de Preço</span>
              <div className="text-2xl lg:text-3xl font-black text-amber-400 mt-2">14.210</div>
              <span className="text-[10px] lg:text-[11px] text-amber-500/80 font-medium mt-1 block">Em tempo real</span>
            </div>
            <div className="bg-[#1e293b]/50 border border-slate-800/80 p-4 lg:p-5 rounded-xl shadow-sm">
              <span className="text-slate-400 text-[10px] lg:text-xs font-bold uppercase tracking-wider block">Canal Líder</span>
              <div className="text-2xl lg:text-3xl font-black text-blue-400 mt-2">{resumoIA?.canalLider ? `R$ ${parseFloat(resumoIA.canalLider.ticketMedio).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "R$ 1.680"}</div>
              <span className="text-[10px] lg:text-[11px] text-slate-500 font-medium mt-1 block">{resumoIA?.canalLider?.marketplace ?? "Mercado Livre"}</span>
            </div>
          </div>

          {/* Search */}
          <div className="bg-[#1e293b]/50 p-4 lg:p-6 rounded-2xl mb-6 lg:mb-8 border border-slate-800 relative z-30">
            <div className="flex flex-col justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2"><Package className="text-blue-400 w-4 h-4 shrink-0" /> Análise de Produto — Engine Multi-Search</h3>
                <p className="text-xs text-slate-400 mt-0.5">Pesquise por nome ou SKU para gerar o relatório de auditoria.</p>
              </div>
            </div>
            <form onSubmit={lidarComBuscaForm} className="flex flex-col gap-2 mb-4 relative">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 pointer-events-none" />
                  <input ref={inputRef} type="text" placeholder="Ex: midea, lavadora, ar-condicionado..." value={termoBusca} onChange={handleTermoChange} onKeyDown={handleKeyDown} onFocus={() => sugestoes.length > 0 && setMostraSugestoes(true)} autoComplete="off" className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-300 font-sans focus:outline-none focus:border-blue-500 transition-all" />
                  {mostraSugestoes && sugestoes.length > 0 && (
                    <div ref={dropdownRef} className="absolute left-0 right-0 top-full mt-1 bg-[#1e293b] border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                      {sugestoes.map((nome, idx) => (
                        <button key={idx} type="button" onMouseDown={(e) => { e.preventDefault(); selecionarSugestao(nome); }} className={`w-full text-left px-4 py-2.5 text-xs flex items-center gap-2 transition-colors border-b border-slate-800/60 last:border-0 ${idx === sugestaoIndex ? "bg-blue-600/20 text-blue-300" : "text-slate-300 hover:bg-slate-800"}`}>
                          <Search size={11} className="text-slate-500 shrink-0" /><span className="truncate">{nome}</span>
                        </button>
                      ))}
                      <div className="px-3 py-1.5 bg-slate-900/60 border-t border-slate-800"><span className="text-[9px] text-slate-600 uppercase tracking-wider">↑↓ navegar · Enter selecionar · Esc fechar</span></div>
                    </div>
                  )}
                </div>
                <button type="submit" disabled={buscando} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 whitespace-nowrap">
                  {buscando ? (<><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Buscando...</>) : "Buscar & Gerar Cenário"}
                </button>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 px-1 mt-0.5"><HelpCircle size={12} className="text-slate-400 shrink-0" /><span>Insira o termo e clique em "Buscar" para processar a base.</span></div>
            </form>
            {erroBusca && <p className="text-xs text-red-400 mt-2 font-medium bg-red-500/10 border border-red-500/20 p-2 rounded-xl">{erroBusca}</p>}
            {currentScenario && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 lg:p-5 shadow-inner mt-4">
                <div className="flex flex-col lg:grid lg:grid-cols-12 gap-5">
                  <div className="lg:col-span-5 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800/80 pb-4 lg:pb-0 lg:pr-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 border rounded text-[10px] font-bold tracking-wider uppercase ${currentScenario.badgeColor || "bg-blue-500/10 text-blue-400 border-blue-500/20"}`}>{currentScenario.posicionamento}</span>
                        {tendencia && (<span className={`px-2 py-0.5 border rounded text-[10px] font-bold tracking-wider uppercase flex items-center gap-1 ${tendencia.direcao === 'up' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>{tendencia.direcao === 'up' ? <ArrowUp size={10} /> : <ArrowDown size={10} />}{tendencia.absoluto}%</span>)}
                      </div>
                      <h4 className="text-sm lg:text-base font-bold text-white tracking-tight leading-snug">{currentScenario.titulo}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{currentScenario.meta}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="bg-[#0f172a]/60 p-3 rounded-lg border border-slate-800/60"><span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Média Grupo</span><p className="text-base lg:text-lg font-mono font-black text-white mt-0.5">R$ {(currentScenario.preco_praticado || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p></div>
                      <div className="bg-[#0f172a]/60 p-3 rounded-lg border border-slate-800/60"><span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Desvio Médio</span><p className={`text-base lg:text-lg font-mono font-black mt-0.5 ${currentScenario.riscoColor || "text-blue-400"}`}>{currentScenario.desvio}</p></div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      <button onClick={() => exportarCSV(currentScenario)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-all text-[10px] font-bold"><Download size={11} /> Exportar CSV</button>
                      <button onClick={() => exportarPDF(currentScenario)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-all text-[10px] font-bold"><FileText size={11} /> PDF Rápido</button>
                      <button onClick={gerarPDFComIA} disabled={gerandoPDF} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/20 transition-all text-[10px] font-bold disabled:opacity-50">
                        {gerandoPDF ? <span className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" /> : <FileDown size={11} />}{gerandoPDF ? "Gerando…" : "PDF Executivo IA"}
                      </button>
                      {previousScenario && (<button onClick={() => setMostraComparativo(!mostraComparativo)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-all text-[10px] font-bold">{mostraComparativo ? 'Ocultar Comparativo' : 'Comparar com Anterior'}</button>)}
                    </div>
                  </div>
                  <div className="lg:col-span-7 flex flex-col justify-between lg:pl-2">
                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1"><Lightbulb size={12} className="text-amber-400" /> Diagnóstico do Cenário</span>
                        <p className="text-xs text-slate-300 leading-relaxed mt-1 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">{currentScenario.diagnostico}</p>
                      </div>
                      {mostraComparativo && previousScenario && (
                        <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-3">
                          <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Comparativo com Último Cenário</span>
                          <div className="grid grid-cols-2 gap-2 mt-2 text-[11px]">
                            <div><span className="text-slate-500">Preço Anterior:</span><span className="text-slate-300 ml-1 font-mono">R$ {(previousScenario.preco_praticado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
                            <div><span className="text-slate-500">Preço Atual:</span><span className="text-slate-300 ml-1 font-mono">R$ {(currentScenario.preco_praticado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
                            <div><span className="text-slate-500">Conformidade Anterior:</span><span className="text-slate-300 ml-1">{previousScenario.conformidade_pct || 0}%</span></div>
                            <div><span className="text-slate-500">Conformidade Atual:</span><span className="text-slate-300 ml-1">{currentScenario.conformidade_pct || 0}%</span></div>
                          </div>
                        </div>
                      )}
                      <div className="flex flex-col sm:flex-row sm:items-start gap-1.5 text-xs">
                        <span className="text-slate-400 font-semibold shrink-0">Recomendação:</span>
                        <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20 rounded">{currentScenario.recomendacao}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {currentScenario && (
            <div className="flex flex-col xl:grid xl:grid-cols-3 gap-6 lg:gap-8 mb-6 lg:mb-8">
              <div className="bg-[#1e293b]/50 border border-slate-800 p-4 lg:p-6 rounded-2xl xl:col-span-2">
                <div className="mb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div><h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2"><Store className="text-blue-400 w-4 h-4 shrink-0" /> Matriz Multicritério de Ofertas</h3><p className="text-xs text-slate-400 mt-0.5">Todos os lojistas e ofertas agrupados na pesquisa atual.</p></div>
                    <div className="flex items-center gap-2">
                      <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[10px] text-slate-300 font-medium"><option value="todos">Todos os Status</option><option value="abaixo">Abaixo do Valor</option><option value="normal">No Valor Correto</option><option value="acima">Acima do Valor</option></select>
                      <select value={ordenacaoMatriz} onChange={(e) => ordenarMatriz(e.target.value)} className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[10px] text-slate-300 font-medium"><option value="default">Ordenar por</option><option value="preco_asc">Menor Preço</option><option value="preco_desc">Maior Preço</option><option value="marketplace">Marketplace A-Z</option></select>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-800/80 max-h-[400px] overflow-y-auto -mx-1 px-1">
                  <table className="w-full text-left border-collapse text-xs min-w-[520px]">
                    <thead className="sticky top-0 bg-slate-900 z-10 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="p-3 cursor-pointer hover:text-white transition-colors" onClick={() => ordenarMatriz('marketplace')}><div className="flex items-center gap-1">Marketplace <SortAsc size={10} /></div></th>
                        <th className="p-3">Lojista</th>
                        <th className="p-3 text-right cursor-pointer hover:text-white transition-colors" onClick={() => ordenarMatriz('preco_asc')}><div className="flex items-center justify-end gap-1">À Vista <SortAsc size={10} /></div></th>
                        <th className="p-3 text-right">Parcelado</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3">Link</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-950/20">
                      {getMatrizOrdenada().length > 0 ? getMatrizOrdenada().slice(0, 50).map((row: any, i: number) => {
                        const isMenorPreco = currentScenario.menorPreco && row.vista === currentScenario.menorPreco;
                        const isMaiorPreco = currentScenario.maiorPreco && row.vista === currentScenario.maiorPreco;
                        return (
                          <tr key={i} className={`hover:bg-slate-800/30 transition-colors ${isMenorPreco ? 'bg-emerald-500/5 border-l-2 border-emerald-500' : ''} ${isMaiorPreco ? 'bg-red-500/5 border-l-2 border-red-500' : ''}`}>
                            <td className="p-3 font-bold text-slate-200">{row.marketplace}{isMenorPreco && <span className="ml-1 text-[9px] text-emerald-400">🏆</span>}</td>
                            <td className="p-3 text-slate-300 font-medium max-w-[120px] truncate">{row.seller}</td>
                            <td className={`p-3 text-right font-mono font-bold whitespace-nowrap ${isMenorPreco ? 'text-emerald-400' : 'text-white'}`}>R$ {row.vista ? row.vista.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "0,00"}</td>
                            <td className="p-3 text-right text-slate-400 font-mono whitespace-nowrap">R$ {row.parcelado ? row.parcelado.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "0,00"}</td>
                            <td className="p-3 text-center"><span className={`px-2 py-0.5 border rounded text-[10px] font-bold tracking-wide uppercase inline-block whitespace-nowrap ${row.statusColor}`}>{row.status}</span></td>
                            <td className="p-3"><a href={row.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-semibold transition-colors whitespace-nowrap">Ver <ExternalLink size={11} /></a></td>
                          </tr>
                        );
                      }) : <tr><td colSpan={6} className="p-4 text-center text-slate-500 italic">Nenhum lojista anexado à matriz deste cenário com os filtros atuais.</td></tr>}
                    </tbody>
                  </table>
                </div>
                {getMatrizOrdenada().length > 50 && <p className="text-[10px] text-slate-500 mt-2 text-right">Visualizando as primeiras 50 de {getMatrizOrdenada().length} ofertas.</p>}
              </div>
              <div className="bg-[#1e293b]/50 border border-slate-800 p-4 lg:p-6 rounded-2xl flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-1"><FileSpreadsheet className="text-emerald-400 w-4 h-4 shrink-0" /> Metadados Consolidados</h3>
                  <p className="text-[11px] text-slate-400 mb-4">Consolidado baseado no agrupamento sob análise.</p>
                  <div className="space-y-4 text-xs">
                    <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                      <div className="flex justify-between items-center mb-1"><span className="text-slate-400 font-medium">Preço Praticado Médio</span><span className="text-white font-mono font-bold">R$ {currentScenario?.preco_praticado ? currentScenario.preco_praticado.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "0,00"}</span></div>
                      <div className="flex justify-between items-center"><span className="text-slate-400 font-medium">Preço Teto Mapeado</span><span className="text-amber-400 font-mono font-bold">R$ {currentScenario?.msrp ? currentScenario.msrp.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "0,00"}</span></div>
                    </div>
                    <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-400 font-medium block mb-1">Índice de Conformidade</span>
                      <div className="flex items-center gap-3"><div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${currentScenario?.conformidade_pct || 100}%` }} /></div><span className="text-blue-400 font-black font-mono">{currentScenario?.conformidade_pct || 100}%</span></div>
                    </div>
                    <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-400 font-medium block mb-1">Resumo de Desvios</span>
                      <div className="flex justify-between text-[11px]"><span className="text-red-400">🔻 Abaixo: {currentScenario?.totalAbaixo || 0}</span><span className="text-emerald-400">✅ Normal: {(currentScenario?.totalItens || 0) - (currentScenario?.totalAbaixo || 0) - (currentScenario?.totalAcima || 0)}</span><span className="text-blue-400">🔺 Acima: {currentScenario?.totalAcima || 0}</span></div>
                    </div>
                    <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800 space-y-2">
                      <div className="text-[11px] font-bold text-slate-200 uppercase tracking-wide border-b border-slate-800 pb-1">Link de Origem Principal</div>
                      <div className="pt-1"><a href={currentScenario?.pdp_link || "#"} target="_blank" rel="noopener noreferrer" className="w-full justify-center text-xs font-bold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 px-3 py-2 rounded-xl flex items-center gap-2 transition-all">Analisar Link Fonte <ExternalLink size={12} /></a></div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/60 text-[11px] text-emerald-400 font-medium flex items-center gap-1.5"><CheckCircle size={12} /> Mapeamento do histórico gerado</div>
              </div>
            </div>
          )}

          {currentScenario?.relatorioItens && totalItens > 0 && (
            <div className="bg-[#1e293b]/40 border border-slate-800 p-4 lg:p-6 rounded-2xl mb-6 lg:mb-8 relative z-10">
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><FileText size={15} className="text-blue-500 shrink-0" /> Relatório Executivo Analítico (22 Campos · Sem Duplicatas)</h3>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-[11px] text-slate-400 whitespace-nowrap"><strong>{indiceInicial + 1}-{Math.min(indiceInicial + itensPorPagina, totalItens)}</strong> / <strong>{totalItens}</strong></span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPaginaAtual(prev => Math.max(prev - 1, 1))} disabled={paginaAtual === 1} className="p-1.5 bg-slate-900 border border-slate-800 rounded hover:bg-slate-800 disabled:opacity-30 text-slate-300"><ChevronLeft size={14} /></button>
                    <span className="text-[11px] px-2 font-mono text-white">{paginaAtual}/{totalPaginas || 1}</span>
                    <button onClick={() => setPaginaAtual(prev => Math.min(prev + 1, totalPaginas))} disabled={paginaAtual === totalPaginas || totalPaginas === 0} className="p-1.5 bg-slate-900 border border-slate-800 rounded hover:bg-slate-800 disabled:opacity-30 text-slate-300"><ChevronRight size={14} /></button>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-4 lg:gap-6">
                {itensPaginados.map((item: any) => (
                  <div key={item.num} className={`bg-slate-950/70 border rounded-xl overflow-hidden shadow-md transition-all hover:shadow-lg ${item.posMercado === "Abaixo do Valor" ? 'border-red-500/30 hover:border-red-500/50' : item.posMercado === "Acima do Valor" ? 'border-blue-500/30 hover:border-blue-500/50' : 'border-slate-800 hover:border-slate-700'}`}>
                    <div className="bg-slate-900/60 p-3 lg:p-4 border-b border-slate-800/80 flex flex-col gap-2">
                      <div className="flex items-start gap-2">
                        <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black font-mono shrink-0 mt-0.5 ${item.posMercado === "Abaixo do Valor" ? 'bg-red-500/10 text-red-400' : item.posMercado === "Acima do Valor" ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>{item.num}</span>
                        <span className="font-bold text-white text-xs leading-snug">{item.titleOfMarketplace}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded-md font-mono font-bold flex items-center gap-1"><Store size={10} /> {item.marketplace}</span>
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-mono">ID: {item.idField}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${item.posMercadoColor || 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>{item.posMercado}</span>
                      </div>
                    </div>
                    <div className="p-3 lg:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[11px]">
                      <div className="space-y-1.5 bg-slate-900/20 p-2.5 rounded-lg border border-slate-800/40"><div className="text-slate-500 font-bold uppercase text-[9px] tracking-wider flex items-center gap-1"><Tag size={10} /> Identificação</div><div><span className="text-slate-400">Produto: </span><strong className="text-slate-200">{item.product}</strong></div><div><span className="text-slate-400">SKU: </span><strong className="text-slate-200 font-mono">{item.sku}</strong></div><div><span className="text-slate-400">Marca: </span><strong className="text-slate-200">{item.brand}</strong></div></div>
                      <div className="space-y-1.5 bg-slate-900/20 p-2.5 rounded-lg border border-slate-800/40"><div className="text-slate-500 font-bold uppercase text-[9px] tracking-wider flex items-center gap-1"><Layers size={10} /> Categorização</div><div><span className="text-slate-400">Família: </span><strong className="text-slate-200">{item.family}</strong></div><div><span className="text-slate-400">Categoria: </span><strong className="text-slate-200">{item.category}</strong></div><div><span className="text-slate-400">Subcategoria: </span><strong className="text-slate-200">{item.subcategory}</strong></div></div>
                      <div className="space-y-1.5 bg-slate-900/20 p-2.5 rounded-lg border border-slate-800/40"><div className="text-slate-500 font-bold uppercase text-[9px] tracking-wider flex items-center gap-1"><Calendar size={10} /> Janela Histórica</div><div><span className="text-slate-400">Data Coleta: </span><strong className="text-slate-300 font-mono">{item.collectionDate}</strong></div><div><span className="text-slate-400">Hora Coleta: </span><strong className="text-slate-300 font-mono">{item.collectionHour}</strong></div><div><span className="text-slate-400">Exec. Engine: </span><strong className="text-slate-300 font-mono">{item.executionHour}</strong></div></div>
                      <div className={`space-y-1.5 p-2.5 rounded-lg border ${item.posMercado === "Abaixo do Valor" ? 'bg-red-500/5 border-red-500/10' : 'bg-emerald-500/5 border-emerald-500/10'}`}><div className={`font-bold uppercase text-[9px] tracking-wider flex items-center gap-1 ${item.posMercado === "Abaixo do Valor" ? 'text-red-500' : 'text-emerald-500'}`}><Clock size={10} /> Precificação</div><div><span className="text-slate-400">Pix: </span><strong className={`font-mono font-bold ${item.posMercado === "Abaixo do Valor" ? 'text-red-400' : 'text-emerald-400'}`}>R$ {(item.pixPrice || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong></div><div><span className="text-slate-400">Spot: </span><strong className="text-slate-200 font-mono">R$ {(item.spotPriceOfMarketplace || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong></div><div><span className="text-slate-400">De: </span><strong className="text-slate-500 font-mono line-through">R$ {(item.priceFromOfMarketplace || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong></div></div>
                    </div>
                    <div className="bg-slate-900/30 p-3 px-3 lg:px-4 border-t border-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px]">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 text-slate-400 flex-wrap">
                        <div>Lojista: <strong className="text-slate-300 font-medium">{item.sellerOfMarketplace}</strong></div>
                        <div>Condição: <strong className="text-blue-400 font-mono">{item.numberOfInstallments}x de R$ {parseFloat(item.installmentValue || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong></div>
                        <div>Cor: <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">{item.colorOfMarketplace || "N/A"}</span></div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {item.screenshotUrl && item.screenshotUrl !== "N/A" && (<a href={item.screenshotUrl} target="_blank" rel="noopener noreferrer" className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-all flex items-center gap-1 text-[10px]"><ImageIcon size={11} /> Evidência</a>)}
                        <a href={item.offerUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all flex items-center gap-1 font-bold text-[10px] shadow-sm">Auditar URL <ExternalLink size={11} /></a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 relative z-10">
            <div className="bg-[#1e293b]/40 border border-slate-800/80 p-4 lg:p-6 rounded-2xl">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><TrendingUp size={14} className="text-blue-500 shrink-0" /> Share de Gôndola Digital</h3>
              <p className="text-[11px] text-slate-500 mb-4 lg:mb-6">Distribuição percentual de anúncios ativos mapeados.</p>
              <div className="h-48 lg:h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={shareGondolaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} vertical={false} /><XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} /><YAxis stroke="#64748b" fontSize={10} tickLine={false} /><Tooltip cursor={{ fill: '#334155', opacity: 0.2 }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '11px' }} /><Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} /></BarChart></ResponsiveContainer></div>
            </div>
            <div className="bg-[#1e293b]/40 border border-slate-800/80 p-4 lg:p-6 rounded-2xl">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><ArrowUpRight size={14} className="text-emerald-500 shrink-0" /> Preço Médio por Canal Digital</h3>
              <p className="text-[11px] text-slate-500 mb-4 lg:mb-6">Mapeamento dinâmico do ticket em canais parceiros.</p>
              <div className="h-48 lg:h-56"><ResponsiveContainer width="100%" height="100%"><AreaChart data={precoCanalData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}><defs><linearGradient id="colorPreco" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.2} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} vertical={false} /><XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} /><YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={['auto', 'auto']} /><Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '11px' }} /><Area type="monotone" dataKey="preco_medio" stroke="#10b981" fill="url(#colorPreco)" fillOpacity={1} strokeWidth={2} /></AreaChart></ResponsiveContainer></div>
            </div>
          </div>
        </main>
      </div>

      {/* ── CHAT ANALISTA VIRTUAL (floating) ── */}
      <button onClick={() => setChatAberto(prev => !prev)} className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all ${chatAberto ? "bg-slate-700 text-slate-300" : "bg-blue-600 text-white"}`} title="Analista virtual">
        {chatAberto ? <X size={22} /> : <Bot size={22} />}
        {!chatAberto && mensagensChat.length === 0 && (<span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center text-[9px] font-black text-slate-900">IA</span>)}
      </button>

      {chatAberto && (
        <div className="fixed bottom-24 right-6 z-50 w-[340px] sm:w-[400px] bg-[#1e293b] border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ maxHeight: "70vh" }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/60 shrink-0">
            <div className="flex items-center gap-2">
              <Bot size={16} className="text-blue-400" />
              <div><div className="text-xs font-bold text-white">Analista Virtual</div><div className="text-[10px] text-slate-500">Powered by Claude · dados reais</div></div>
            </div>
            <button onClick={() => setChatAberto(false)} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"><X size={14} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {mensagensChat.length === 0 && (
              <div className="text-center py-6">
                <Bot size={32} className="text-slate-700 mx-auto mb-3" />
                <p className="text-xs text-slate-500 mb-4">Pergunte sobre SKUs, canais ou estratégia de preço.</p>
                <div className="space-y-2">
                  {["Qual canal está pressionando a margem?","Quais SKUs apresentam maior risco?","Análise do cenário atual"].map((s) => (
                    <button key={s} onClick={() => enviarMensagemChat(s)} className="w-full text-left text-[11px] text-blue-400 border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 rounded-lg px-3 py-2 transition-colors">{s}</button>
                  ))}
                </div>
              </div>
            )}
            {mensagensChat.map((msg, idx) => (
              <div key={idx} className={`flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${msg.role === "user" ? "bg-blue-600 text-white rounded-br-sm" : "bg-slate-800 text-slate-200 rounded-bl-sm"}`}>{msg.content}</div>
                <span className="text-[9px] text-slate-600">{msg.ts}</span>
              </div>
            ))}
            {enviandoChat && (<div className="flex items-center gap-2 text-slate-500 text-[11px]"><span className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" />Analisando…</div>)}
            <div ref={chatEndRef} />
          </div>
          <div className="p-3 border-t border-slate-800 shrink-0">
            <div className="flex gap-2">
              <input type="text" value={inputChat} onChange={e => setInputChat(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && enviarMensagemChat()} placeholder="Pergunte ao analista…" className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors" />
              <button onClick={() => enviarMensagemChat()} disabled={enviandoChat || !inputChat.trim()} className="p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl transition-colors"><Send size={14} /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarContent({ historicoCenarios, currentScenario, setCurrentScenario, setPaginaAtual, setSidebarOpen }: any) {
  return (
    <>
      <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 mb-2"><History size={12} className="text-blue-400" /> Cenários ({historicoCenarios.length})</span>
        {historicoCenarios.length === 0 ? (<span className="text-[11px] text-slate-600 italic">Nenhum cenário pesquisado ainda.</span>) : (
          <div className="flex flex-col gap-2">
            {historicoCenarios.map((cen: any, idx: number) => (
              <button key={idx} type="button" onClick={() => { setCurrentScenario(cen); setPaginaAtual(1); setSidebarOpen(false); }} className={`text-left p-2 rounded-xl border text-[11px] transition-all flex flex-col gap-0.5 ${currentScenario?.id === cen.id ? "bg-blue-600/10 border-blue-500 text-blue-300 font-semibold" : "bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800"}`}>
                <span className="truncate text-white block font-medium">{cen.titulo}</span>
                <span className="text-[9px] text-slate-500">{cen.timestamp} · {cen.matriz?.length} itens</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="mt-auto pt-4 border-t border-slate-800/60 text-[11px] text-slate-500 font-medium">MKT Intel · Brasil<br />Janela: Jun/2026</div>
    </>
  );
}