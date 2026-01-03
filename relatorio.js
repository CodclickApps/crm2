// relatorio.js
const supabaseUrl = 'https://rhigpgndgieeyrxrnoqq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoaWdwZ25kZ2llZXlyeHJub3FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMzM3NzIsImV4cCI6MjA2ODgwOTc3Mn0.I6gxBqbGCc3ZK2nYgSj-BYtUv0b-XPSRqGw1PatGskg';
const client = window.supabase.createClient(supabaseUrl, supabaseKey);

// Elementos
const dateFieldFilter = document.getElementById("dateFieldFilter");
const monthFilter = document.getElementById("monthFilter");
const startDateFilter = document.getElementById("startDateFilter");
const endDateFilter = document.getElementById("endDateFilter");
const relatorioResumo = document.getElementById("relatorioResumo");
const relatorioContainer = document.getElementById("relatorioContainer");

// Gerar relatório
async function gerarRelatorio() {
  const selectedField = dateFieldFilter.value;
  const startDate = startDateFilter.value;
  const endDate = endDateFilter.value;
  const month = monthFilter.value;

let query = client.from("prospeccoes_crm")
    .select(`
      id, data_hora, status, substatus, observacoes, historico_observacoes, tipo_registro, 
      leads_crm (empresa)
    `)
    .order("data_hora", { ascending: true });
    
  // Filtro por período
  if (startDate && endDate) {
    query = query.gte("data_hora", startDate + "T00:00:00")
                 .lte("data_hora", endDate + "T23:59:59");
  }

  const { data, error } = await query;

  if (error) {
    console.error("Erro ao gerar relatório:", error);
    alert("Erro ao gerar relatório");
    return;
  }

  // Se quiser aplicar filtro adicional de mês
  let filtrados = data;
  if (month) {
    filtrados = filtrados.filter(p => {
      const m = new Date(p.data_hora).getMonth() + 1;
      return m == month;
    });
  }

  // >>> NOVO PROCESSAMENTO DE CONTAGEM <<<
  const totalProspeccoes = filtrados.filter(p => p.tipo_registro === 'Prospecção').length;
  const totalRetornos = filtrados.filter(p => p.tipo_registro === 'Retorno').length;

  // Exibe resumo atualizado
  relatorioResumo.innerHTML = `
    <p><strong>Total de Interações:</strong> ${filtrados.length}</p>
    <p><strong>Total de Prospecções:</strong> ${totalProspeccoes}</p>
    <p><strong>Total de Retornos:</strong> ${totalRetornos}</p>
  `;
  // >>> FIM NOVO PROCESSAMENTO DE CONTAGEM <<<

  // Renderiza relatório
  if (!filtrados.length) {
    relatorioContainer.innerHTML = "<p>Nenhuma prospecção encontrada.</p>";
    return;
  }

  relatorioContainer.innerHTML = `
    <ul class="relatorio-lista">
      ${filtrados.map(p => `
        <li>
          <strong>Tipo:</strong> ${p.tipo_registro || 'Não Definido'}<br>
          <strong>Data:</strong> ${new Date(p.data_hora).toLocaleString("pt-BR")}<br>
          <strong>Empresa:</strong> ${p.leads_crm?.empresa || "Empresa desconhecida"}<br>
          <strong>Status:</strong> ${p.status || "-"}<br>
          <strong>Substatus:</strong> ${p.substatus || "-"}<br>
          <strong>Observações:</strong> ${p.observacoes || "-"}<br>
          <strong>Histórico:</strong><br>
          ${Array.isArray(p.historico_observacoes) 
              ? `<ul>${p.historico_observacoes.map(obs => `
                    <li>${obs.data} ${obs.hora} - ${obs.texto}</li>
                 `).join("")}</ul>`
              : (p.historico_observacoes ? JSON.stringify(p.historico_observacoes) : "-")
          }
        </li>
      `).join("")}
    </ul>
  `;
}
// ... // <-- FECHAMENTO CORRETO DA FUNÇÃO gerarRelatorio

// Enviar relatório para n8n
async function enviarRelatorio() {
  const { data, error } = await client
    .from("prospeccoes_crm")
    .select(`
      id, data_hora, status, substatus, observacoes, historico_observacoes,
      leads_crm (empresa)
    `);

  if (error) {
    console.error("Erro ao buscar dados:", error);
    alert("Erro ao enviar relatório");
    return;
  }

  try {
    await fetch("https://n8n-n8n-start.yh11mi.easypanel.host/webhook/relatorio_crm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ relatorio: data })
    });
    alert("Relatório enviado com sucesso!");
  } catch (err) {
    console.error("Erro ao enviar relatório:", err);
    alert("Falha ao enviar relatório");
  }
}
