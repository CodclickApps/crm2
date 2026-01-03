//script_mobile.js 5.0 
const supabaseUrl = 'https://rhigpgndgieeyrxrnoqq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoaWdwZ25kZ2llZXlyeHJub3FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMzM3NzIsImV4cCI6MjA2ODgwOTc3Mn0.I6gxBqbGCc3ZK2nYgSj-BYtUv0b-XPSRqGw1PatGskg';

const client = window.supabase.createClient(supabaseUrl, supabaseKey);

const statusOptions = [
    "A Prospectar", "PAP Potencial", "Primeiro Contato Feito", "Teste Abertura", "Aguardando Retorno", "Interessado", "Retornar Ligacao", "Concorrente", "Ligar Novamente", "Reuniao Marcada", "Proposta Enviada", "Fechado", "Sem Interesse", "Numero Invalido",
    "Nao Atendido", "Em Negociacao", "Cliente Potencial"
];

// Mapeamento de status para cores de fundo
const statusColors = {
    "A Prospectar": "#ffc107", // Amarelo
    "PAP Potencial": "#ffc107", // Amarelo
    "Teste Abertura": "#ffc107", //Amarelo 
    "Primeiro Contato Feito": "#007bff", // Azul
    "Aguardando Retorno": "#6c757d", // Cinza
    "Interessado": "#28a745", // Verde
    "Proposta Enviada": "#fd7e14", // Laranja
    "Fechado": "#20c997", // Verde Água
    "Sem Interesse": "#dc3545", // Vermelho
    "Numero Invalido": "#6610f2", // Roxo
    "Nao Atendido": "#17a2b8", // Ciano
    "Em Negociacao": "#e83e8c", // Rosa
    "Retornar Ligacao": "#ffc107", // Amarelo
    "Retornar Ligacao": "#b45000", // Amarelo
    "Ligar Novamente": "#ffc107", // Amarelo
    "Reuniao Marcada": "#6f42c1", // Roxo
    "Cliente Potencial": "#ffc107" // Amarelo
};

let leads = [];
let leadSelecionado = null;
let isNewLead = false;
let editingObsIndex = null; // Variável para controlar qual observação está sendo editada

// Elementos do DOM
const leadsContainer = document.getElementById('leadsContainer');
const statusFilterMobile = document.getElementById('statusFilterMobile');
const segmentoFilterMobile = document.getElementById('segmentoFilterMobile');
const searchInputMobile = document.getElementById('searchInputMobile');
// >>> MODIFICAÇÃO 1: Adicionar o novo elemento do DOM
const localFilterMobile = document.getElementById('localFilterMobile'); 
// <<< FIM MODIFICAÇÃO 1
const leadModal = document.getElementById('leadModal');
const substatusCheckboxesContainer = document.getElementById('substatusCheckboxes');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const modalButtons = document.getElementById('modalButtons');
const filtersPanel = document.getElementById('filtersPanel');

// Novos elementos do DOM para os filtros de data
const dateFieldFilter = document.getElementById('dateFieldFilter');
const monthFilter = document.getElementById('monthFilter');
const startDateFilter = document.getElementById('startDateFilter');
const endDateFilter = document.getElementById('endDateFilter');
const dateRangeLabel = document.getElementById('dateRangeLabel');

// Novos elementos para Observações
const novaObsForm = document.getElementById('novaObsForm');
const obsDateInput = document.getElementById('obsDateInput');
const obsTimeInput = document.getElementById('obsTimeInput');
const obsTextInput = document.getElementById('obsTextInput');
const historicoObservacoes = document.getElementById('historicoObservacoes');

// Adiciona listeners para todos os filtros
statusFilterMobile.addEventListener('change', filtrarLeadsMobile);
segmentoFilterMobile.addEventListener('change', filtrarLeadsMobile);
searchInputMobile.addEventListener('input', filtrarLeadsMobile);
// >>> MODIFICAÇÃO 2: Adicionar listener para o novo filtro
if (localFilterMobile) {
    localFilterMobile.addEventListener('input', filtrarLeadsMobile);
}
// <<< FIM MODIFICAÇÃO 2
dateFieldFilter.addEventListener('change', () => {
    updateDateRangeLabel();
    filtrarLeadsMobile();
});
monthFilter.addEventListener('change', filtrarLeadsMobile);
startDateFilter.addEventListener('change', filtrarLeadsMobile);
endDateFilter.addEventListener('change', filtrarLeadsMobile);

// --- Funções Auxiliares ---
function updateDateRangeLabel() {
    const selectedText = dateFieldFilter.options[dateFieldFilter.selectedIndex].text;
    dateRangeLabel.textContent = `${selectedText} - Período:`;
}

function formatPhoneNumberForWhatsApp(phoneNumber) {
    if (!phoneNumber) return '';
    let cleanedNumber = phoneNumber.replace(/\D/g, '');
    if (!cleanedNumber.startsWith('55')) {
        cleanedNumber = '55' + cleanedNumber;
    }
    return cleanedNumber;
}

async function fetchSubstatusesForMainStatus(mainStatus) {
    if (!mainStatus) return [];
    try {
        const { data, error } = await client
            .from('status_substatus_mapping')
            .select('substatus_name')
            .eq('main_status', mainStatus)
            .eq('is_active', true)
            .order('order_index', { ascending: true });

        if (error) {
            console.error('Erro ao buscar sub-status:', error.message);
            return [];
        }
        return data.map(item => item.substatus_name);
    } catch (e) {
        console.error('Exceção ao buscar sub-status:', e.message);
        return [];
    }
}

// --- Funções de Fetch e Renderização ---

async function fetchLeadsMobile() {
    console.log("fetchLeadsMobile: Iniciando busca de leads.");
    const { data, error } = await client
        .from('leads_crm')
        .select('*, sub_statuses_marcados')
        .order('last_contact_date', { ascending: false });

    if (error) {
        console.error('Erro ao buscar leads:', error);
        return;
    }
    leads = data;
    console.log("fetchLeadsMobile: Leads carregados.", leads);

    preencherFiltrosMobile();
    updateDateRangeLabel();
    filtrarLeadsMobile();
}

function preencherFiltrosMobile() {
    // Salva valores atuais
    const statusValue = statusFilterMobile.value;
    const segmentoValue = segmentoFilterMobile.value;
    const monthValue = monthFilter.value;
    const searchValue = searchInputMobile.value;
    const dateFieldValue = dateFieldFilter.value;
    const startValue = startDateFilter.value;
    const endValue = endDateFilter.value;
    // >>> MODIFICAÇÃO 3a: Salvar o valor do novo filtro
    const localValue = localFilterMobile ? localFilterMobile.value : '';
    // <<< FIM MODIFICAÇÃO 3a

    // --- Preencher Status ---
    statusFilterMobile.innerHTML = '<option value="">Todos os Status</option>';
    statusOptions.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = s;
        statusFilterMobile.appendChild(opt);
    });

    // --- Preencher Segmentos ---
    const segmentos = [...new Set(leads.map(l => l.segmento).filter(Boolean))];
    segmentoFilterMobile.innerHTML = '<option value="">Todos os Segmentos</option>';
    segmentos.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = s;
        segmentoFilterMobile.appendChild(opt);
    });

    // --- Preencher Meses ---
    const meses = [
        { value: '', text: 'Todos os Meses' },
        { value: '1', text: 'Janeiro' },
        { value: '2', text: 'Fevereiro' },
        { value: '3', text: 'Março' },
        { value: '4', text: 'Abril' },
        { value: '5', text: 'Maio' },
        { value: '6', text: 'Junho' },
        { value: '7', text: 'Julho' },
        { value: '8', text: 'Agosto' },
        { value: '9', text: 'Setembro' },
        { value: '10', text: 'Outubro' },
        { value: '11', text: 'Novembro' },
        { value: '12', text: 'Dezembro' }
    ];
    monthFilter.innerHTML = '';
    meses.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.value;
        opt.textContent = m.text;
        monthFilter.appendChild(opt);
    });

    // --- Restaurar valores antigos ---
    if (statusValue) statusFilterMobile.value = statusValue;
    if (segmentoValue) segmentoFilterMobile.value = segmentoValue;
    if (monthValue) monthFilter.value = monthValue;
    if (searchValue) searchInputMobile.value = searchValue;
    if (dateFieldValue) dateFieldFilter.value = dateFieldValue;
    if (startValue) startDateFilter.value = startValue;
    if (endValue) endDateFilter.value = endValue;
    // >>> MODIFICAÇÃO 3b: Restaurar o valor do novo filtro
    if (localValue && localFilterMobile) localFilterMobile.value = localValue;
    // <<< FIM MODIFICAÇÃO 3b
}


function filtrarLeadsMobile() {
    const statusFiltro = statusFilterMobile.value;
    const segmentoFiltro = segmentoFilterMobile.value;
    const searchTerm = searchInputMobile.value.toLowerCase();

    // >>> MODIFICAÇÃO 4a: Capturar o novo termo de pesquisa
    const localTerm = localFilterMobile ? localFilterMobile.value.toLowerCase() : '';
    // <<< FIM MODIFICAÇÃO 4a
    
    // Novas variáveis para os filtros de data
    const selectedDateField = dateFieldFilter.value;
    const selectedMonth = monthFilter.value;
    const startDate = startDateFilter.value;
    const endDate = endDateFilter.value;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const filtrados = leads.filter(lead => {
        const matchesStatus = (!statusFiltro || lead.status === statusFiltro);
        const matchesSegmento = (!segmentoFiltro || lead.segmento === segmentoFiltro);
        const matchesSearch =
            !searchTerm ||
            (lead.empresa && lead.empresa.toLowerCase().includes(searchTerm)) ||
            (lead.cnpj && lead.cnpj.toLowerCase().includes(searchTerm)) ||
            (lead.responsavel && lead.responsavel.toLowerCase().includes(searchTerm)) ||
            (lead.whatsapp && lead.whatsapp.toLowerCase().includes(searchTerm)) ||
            (lead.phone && lead.phone.toLowerCase().includes(searchTerm));

        // >>> MODIFICAÇÃO 4b: Nova lógica de filtro por Local/Endereço
        const matchesLocal = 
            !localTerm ||
            (lead.address && lead.address.toLowerCase().includes(localTerm));
        // <<< FIM MODIFICAÇÃO 4b

        // Lógica de filtro por data
        let matchesDateFilter = true;
        const leadDateValue = lead[selectedDateField];

        if (leadDateValue) {
            const dateToFilter = new Date(leadDateValue);

            // Filtro por mês
            if (selectedMonth) {
                const leadMonth = dateToFilter.getMonth() + 1; // getMonth() é 0-indexed
                if (leadMonth.toString() !== selectedMonth) {
                    matchesDateFilter = false;
                }
            }

            // Filtro por período de dias (início e fim)
            if (startDate && endDate) {
                // Cria as datas de forma robusta no fuso horário local
                const start = new Date(startDate + 'T00:00:00');
                const end = new Date(endDate + 'T00:00:00');
                end.setHours(23, 59, 59, 999); // Garante que a data final inclua o dia inteiro

                if (dateToFilter < start || dateToFilter > end) {
                    matchesDateFilter = false;
                }
            } else if (startDate && !endDate) {
                const start = new Date(startDate + 'T00:00:00');
                if (dateToFilter < start) {
                    matchesDateFilter = false;
                }
            } else if (!startDate && endDate) {
                const end = new Date(endDate + 'T23:59:59.999');
                if (dateToFilter > end) {
                    matchesDateFilter = false;
                }
            }
        } else {
            // Se o lead não tem a data selecionada, ele não deve ser mostrado no filtro de datas
            if (selectedMonth || startDate || endDate) {
                    matchesDateFilter = false;
            }
        }
        
        // >>> MODIFICAÇÃO 4c: Incluir o novo filtro no retorno
        return matchesStatus && matchesSegmento && matchesSearch && matchesLocal && matchesDateFilter;
        // <<< FIM MODIFICAÇÃO 4c
    });

// Atualizar contador de leads
const leadsCounter = document.getElementById('leadsCounter');
let label = '';

switch (selectedDateField) {
    case 'primeiro_contato':
        label = 'Prospecções';
        break;
    case 'last_contact_date':
        label = 'Leads Prospectados';
        break;
    case 'next_contact_date':
        label = 'Leads a Retornar';
        break;
    default:
        label = 'Leads';
}

// Conta apenas leads que têm o campo selecionado preenchido
const leadsComData = filtrados.filter(l => l[selectedDateField]);

leadsCounter.textContent = `(${leadsComData.length}) ${label}`;
    
    
    renderizarCardsLeads(filtrados);
}


function limparFiltrosDeData() {
    dateFieldFilter.value = 'next_contact_date';
    monthFilter.value = '';
    startDateFilter.value = '';
    endDateFilter.value = '';
    updateDateRangeLabel();
    filtrarLeadsMobile();
}

function renderizarCardsLeads(leadsToRender) {
    leadsContainer.innerHTML = '';
    if (leadsToRender.length === 0) {
        leadsContainer.innerHTML = '<p class="no-leads-message">Nenhum lead encontrado com os filtros aplicados.</p>';
        return;
    }
    leadsToRender.forEach(lead => {
        const tel = lead.whatsapp || lead.phone || '';
        const formattedTel = formatPhoneNumberForWhatsApp(tel);
        const waUrl = formattedTel ? `https://wa.me/${formattedTel}` : '#';

        const statusClass = lead.status ? `status-${lead.status.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ /g, '-')}` : '';
        const statusDisplay = lead.status || 'Não Definido';

        let nextContactClass = '';
        let nextContactDisplay = lead.next_contact_date
            ? new Date(lead.next_contact_date).toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
            : '-';

        if (lead.next_contact_date) {
            const proximoContato = new Date(lead.next_contact_date);
            const agora = new Date();
            if (proximoContato.toDateString() === agora.toDateString()) {
                nextContactClass = 'next-contact-today';
            } else if (proximoContato.getTime() < agora.getTime()) {
                nextContactClass = 'next-contact-overdue';
            }
        }

        const lastContactDisplay = lead.last_contact_date
            ? new Date(lead.last_contact_date).toLocaleDateString() + ' ' +
              new Date(lead.last_contact_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            : '-';

        const card = document.createElement('div');
        card.classList.add('lead-card');
        const statusClassForCard = lead.status ? `status-${lead.status.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ /g, '-')}-card` : '';
        card.classList.add(statusClassForCard);

        card.innerHTML = `
            <span class="status-badge ${statusClass}">${statusDisplay}</span>
            <h3>${lead.empresa || 'Empresa Desconhecida'}</h3>
            ${tel ? `<p><strong>Contato:</strong> <a href="${waUrl}" target="_blank" class="whatsapp-link"><img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" class="whatsapp-icon">${tel}</a></p>` : ''}
            <p class="next-contact-info ${nextContactClass}"><strong>Próximo Contato:</strong> ${nextContactDisplay}</p>
            <p><strong>Último Contato:</strong> ${lastContactDisplay}</p>
            <button class="details-button" onclick="abrirModalDetalhes('${lead.id}')">Detalhes</button>
        `;
        leadsContainer.appendChild(card);
    });
}

// --- Funções de Modal ---
function toggleFiltersPanel() {
    filtersPanel.classList.toggle('active');
}

function closeFiltersPanel() {
    filtrarLeadsMobile();
    filtersPanel.classList.remove('active');
}

async function abrirModalDetalhes(id) {
    isNewLead = false;
    leadSelecionado = leads.find(l => l.id === id);
    if (!leadSelecionado) return;

    modalTitle.textContent = `${leadSelecionado.empresa || 'Lead'}`;
    renderModalForm(leadSelecionado);
    renderHistoricoObservacoes(leadSelecionado.historico_observacoes);

    substatusCheckboxesContainer.innerHTML = '';
    const currentMainStatus = leadSelecionado.status;
    const availableSubstatuses = await fetchSubstatusesForMainStatus(currentMainStatus);
    const selectedSubstatuses = leadSelecionado.sub_statuses_marcados || [];

    if (availableSubstatuses.length > 0) {
        const title = document.createElement('label');
        title.textContent = 'Sub-Status:';
        title.style.marginTop = '10px';
        title.style.marginBottom = '5px';
        title.style.fontWeight = 'bold';
        title.style.fontSize = '0.9em';
        title.style.color = '#555';
        substatusCheckboxesContainer.appendChild(title);

        availableSubstatuses.forEach(substatus => {
            const div = document.createElement('div');
            div.classList.add('substatus-item');

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `substatus-${substatus.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-')}`;
            checkbox.value = substatus;
            checkbox.name = 'substatus';

            if (selectedSubstatuses.includes(substatus)) {
                checkbox.checked = true;
            }

            const label = document.createElement('label');
            label.htmlFor = checkbox.id;
            label.textContent = substatus;
            label.style.display = 'inline-block';
            label.style.marginLeft = '5px';
            label.style.fontWeight = 'normal';
            label.style.fontSize = '1em';

            div.appendChild(checkbox);
            div.appendChild(label);
            substatusCheckboxesContainer.appendChild(div);
        });
    }
    leadModal.style.display = 'flex';
}

function abrirModalNovoLeadMobile() {
    isNewLead = true;
    leadSelecionado = null;
    modalTitle.textContent = 'Adicionar Novo Lead';
    renderModalForm(null);
    substatusCheckboxesContainer.innerHTML = '';
    leadModal.style.display = 'flex';
}

function renderModalForm(lead) {
    let nextContactDateFormattedForInput = '';
    if (lead && lead.next_contact_date) {
        nextContactDateFormattedForInput = lead.next_contact_date.slice(0, 16).replace(' ', 'T');
    }

    modalBody.innerHTML = `
        ${isNewLead ? `
            <label>Empresa:</label>
            <input id="empresaInput" type="text" value="${lead ? lead.empresa || '' : ''}" placeholder="Nome da Empresa" />
            <label>Segmento:</label>
            <input id="segmentoInput" type="text" value="${lead ? lead.segmento || '' : ''}" placeholder="Ex: Tecnologia, Varejo" />
        ` : `
            <p><strong>Empresa:</strong> ${lead.empresa || '-'}</p>
            <p><strong>Segmento:</strong> ${lead.segmento || '-'}</p>
        `}
        <label>Telefone:</label>
        <input id="phoneInput" type="text" value="${lead ? lead.phone || '' : ''}" placeholder="Telefone principal (Ex: 551130001000)" />
        <label>WhatsApp:</label>
        <input id="whatsappInput" type="text" value="${lead ? lead.whatsapp || '' : ''}" placeholder="WhatsApp (Ex: 5511987654321)" />

        <label>CNPJ:</label>
        <input id="cnpjInput" type="text" value="${lead ? lead.cnpj || '' : ''}" />

        <label>Responsável:</label>
        <input id="responsavelInput" type="text" value="${lead ? lead.responsavel || '' : ''}" />

        <label>Website:</label>
        <input id="websiteInput" type="text" value="${lead ? lead.website || '' : ''}" />

        <label>Idade (empresa):</label>
        <input id="idadeInput" type="number" value="${lead ? lead.idade || '' : ''}" />

        <label>Endereço:</label>
        <input id="enderecoInput" type="text" value="${lead ? lead.address || '' : ''}" />

        <label>Próximo Contato (Data e Hora):</label>
        <input id="nextContactDateInput" type="datetime-local" value="${nextContactDateFormattedForInput}" />

        <label>Próximo Contato (Assunto):</label>

        <input id="nextContactSubjectInput" type="text" value="${lead ? lead.next_contact_subject || '' : ''}" />



        <label>Observações:</label>

        <textarea id="observacoesInput">${lead ? lead.observacoes || '' : ''}</textarea>

    `;



// ...
    modalButtons.innerHTML = `
        <button class="primary" onclick="salvarLeadMobile()"> ${isNewLead ? 'Adicionar Lead' : 'Salvar'} </button>
        <button class="secondary" onclick="fecharModalMobile()">Cancelar</button>
        ${!isNewLead ? `
            <button class="primeiro-contato-button" onclick="registrarProspeccao('${lead.id}')">Registrar Prospecção</button>
            
            <button class="retorno-button" onclick="registrarRetorno('${lead.id}')">Registrar Retorno</button> 
            <button class="delete-button" onclick="deletarLeadMobile('${lead.id}')">Deletar Lead</button>
        ` : ''}
    `;


    if (!isNewLead && lead) {

        const statusColor = statusColors[lead.status] || '#f8f9fa'; // Pega a cor do mapeamento, ou um cinza claro se não houver

        const statusSelectHtml = `

            <label>Status:</label>

            <select id="statusSelectModal" onchange="updateStatusAndRenderMobile('${lead.id}', this.value)" style="background-color: ${statusColor}; border-color: ${statusColor}; color: #fff; font-weight: bold;">

                ${statusOptions.map(opt => `<option value="${opt}" ${opt === lead.status ? 'selected' : ''}>${opt}</option>`).join('')}

            </select>

        `;

        modalBody.insertAdjacentHTML('afterbegin', statusSelectHtml);

    }

}



// Nova função para exibir o formulário de observação

function adicionarNovaObservacaoForm() {

    novaObsForm.style.display = 'flex';

    const now = new Date();

    const today = now.toISOString().slice(0, 10);

    const time = now.toTimeString().slice(0, 5);

    obsDateInput.value = today;

    obsTimeInput.value = time;

    obsTextInput.value = '';

    editingObsIndex = null; // Reinicia a variável de edição

}



// Nova função para cancelar a observação

function cancelarObservacao() {

    novaObsForm.style.display = 'none';

    obsTextInput.value = '';

    editingObsIndex = null; // Reinicia a variável de edição

}


// --- Função Registrar Prospecção (CORRIGIDA E ATUALIZADA) ---
async function registrarProspeccao(leadId) {
  try {
    // 1. Buscar o lead atual
    const { data: lead, error: fetchError } = await client
      .from("leads_crm")
      .select("id, primeiro_contato, status, sub_statuses_marcados, observacoes, historico_observacoes")
      .eq("id", leadId)
      .single();

    if (fetchError) throw fetchError;

    const now = new Date();
    const brasiliaNow = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));

    // 2. Se não tem primeiro_contato, salvar
    if (!lead.primeiro_contato) {
      await client
        .from("leads_crm")
        .update({ primeiro_contato: brasiliaNow.toISOString() })
        .eq("id", leadId);
    }

    // 3. Inserir registro na tabela de prospecções
    const { error: insertError } = await client.from("prospeccoes_crm").insert([
      {
        lead_id: lead.id,
        data_hora: brasiliaNow.toISOString(),
        status: lead.status,
        substatus: (lead.sub_statuses_marcados || []).join(", "),
        observacoes: lead.observacoes || null,
        historico_observacoes: lead.historico_observacoes || null,
        tipo_registro: 'Prospecção' // CAMPO ADICIONADO
      }
    ]);
    
    if (insertError) throw insertError;

    // 4. Contar quantas interações (prospecções/retornos) foram feitas hoje
    const inicio = new Date(brasiliaNow);
    inicio.setHours(0, 0, 0, 0);
    const fim = new Date(brasiliaNow);
    fim.setHours(23, 59, 59, 999);

    const { count, error: countError } = await client
      .from("prospeccoes_crm")
      .select("*", { count: "exact", head: true })
      .gte("data_hora", inicio.toISOString())
      .lte("data_hora", fim.toISOString());

    if (countError) throw countError;

    alert(`Prospecção registrada com sucesso! Total de ${count} interações hoje.`);
  } catch (err) {
    console.error("Erro ao registrar prospecção:", err);
    alert("Erro ao registrar prospecção");
  }
} // FIM DA FUNÇÃO registrarProspeccao

// --- Função Registrar Retorno (NOVA - DEVE ESTAR NO NÍVEL GLOBAL) ---
async function registrarRetorno(leadId) {
  try {
    // 1. Buscar o lead atual
    const { data: lead, error: fetchError } = await client
      .from("leads_crm")
      .select("id, status, sub_statuses_marcados, observacoes, historico_observacoes")
      .eq("id", leadId)
      .single();

    if (fetchError) throw fetchError;

    const now = new Date();
    const brasiliaNow = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));

    // 2. Inserir registro na tabela de prospecções com tipo 'Retorno'
    const { error: insertError } = await client.from("prospeccoes_crm").insert([
      {
        lead_id: lead.id,
        data_hora: brasiliaNow.toISOString(),
        status: lead.status,
        substatus: (lead.sub_statuses_marcados || []).join(", "),
        observacoes: lead.observacoes || null,
        historico_observacoes: lead.historico_observacoes || null,
        tipo_registro: 'Retorno' // DIFERENÇA PRINCIPAL
      }
    ]);

    if (insertError) throw insertError;

    // 3. Contar quantas interações (prospecções/retornos) foram feitas hoje
    const inicio = new Date(brasiliaNow);
    inicio.setHours(0, 0, 0, 0);
    const fim = new Date(brasiliaNow);
    fim.setHours(23, 59, 59, 999);

    const { count, error: countError } = await client
      .from("prospeccoes_crm")
      .select("*", { count: "exact", head: true })
      .gte("data_hora", inicio.toISOString())
      .lte("data_hora", fim.toISOString());

    if (countError) throw countError;

    alert(`Retorno registrado com sucesso! Total de ${count} interações hoje.`);
  } catch (err) {
    console.error("Erro ao registrar retorno:", err);
    alert("Erro ao registrar retorno");
  }
} // FIM DA FUNÇÃO registrarRetorno

// **Função para Salvar/Editar a observação (modificada)**

async function salvarObservacao() {

    const obsText = obsTextInput.value.trim();

    if (!obsText) {

        alert('A observação não pode estar vazia.');

        return;

    }



    const obsDate = obsDateInput.value;

    const obsTime = obsTimeInput.value;



    const observationToSave = {

        data: obsDate,

        hora: obsTime,

        texto: obsText

    };



    let historico = leadSelecionado.historico_observacoes || [];



    if (editingObsIndex !== null) {

        // Editando uma observação existente

        historico[editingObsIndex] = observationToSave;

    } else {

        // Adicionando uma nova observação

        historico.push(observationToSave);

    }

    

    const { error } = await client

        .from('leads_crm')

        .update({ historico_observacoes: historico })

        .eq('id', leadSelecionado.id);



    if (error) {

        console.error('Erro ao salvar observação:', error);

        alert('Erro ao salvar observação.');

    } else {

        alert('Observação salva com sucesso!');

        leadSelecionado.historico_observacoes = historico;

        renderHistoricoObservacoes(historico);

        cancelarObservacao();

    }

}



// **Função para Deletar a observação**

async function deletarObservacao(index) {

    if (!confirm('Tem certeza que deseja deletar esta observação?')) {

        return;

    }

    

    let historico = leadSelecionado.historico_observacoes || [];

    historico.splice(index, 1); // Remove a observação do array



    const { error } = await client

        .from('leads_crm')

        .update({ historico_observacoes: historico })

        .eq('id', leadSelecionado.id);



    if (error) {

        console.error('Erro ao deletar observação:', error);

        alert('Erro ao deletar observação.');

    } else {

        alert('Observação deletada com sucesso!');

        leadSelecionado.historico_observacoes = historico;

        renderHistoricoObservacoes(historico);

    }

}



// **Função para Editar a observação**

function editarObservacao(index) {

    const obsToEdit = leadSelecionado.historico_observacoes[index];

    if (obsToEdit) {

        novaObsForm.style.display = 'flex';

        obsDateInput.value = obsToEdit.data;

        obsTimeInput.value = obsToEdit.hora;

        obsTextInput.value = obsToEdit.texto;

        editingObsIndex = index; // Armazena o índice da observação que está sendo editada

    }

}





// **Função para renderizar o histórico de observações (modificada)**

function renderHistoricoObservacoes(historico) {

    historicoObservacoes.innerHTML = '';

    if (!historico || historico.length === 0) {

        historicoObservacoes.innerHTML = '<p style="font-style: italic; color: #888;">Nenhuma observação registrada.</p>';

        return;

    }

    

    // Inverte a ordem para mostrar as mais recentes primeiro

    historico.slice().reverse().forEach((obs, index) => {

        // O `index` aqui é o índice no array `reverse()`

        // Precisamos mapear para o índice original no array `historico`

        const originalIndex = historico.length - 1 - index;



        const obsItem = document.createElement('div');

        obsItem.classList.add('observacao-item');

        obsItem.innerHTML = `

            <p>${obs.texto}</p>

            <p class="obs-meta">Registrado em ${obs.data} às ${obs.hora}</p>

            <div class="observacao-botoes">

                <button class="editar-obs-button" onclick="editarObservacao(${originalIndex})">Editar</button>

                <button class="deletar-obs-button" onclick="deletarObservacao(${originalIndex})">Excluir</button>

            </div>

        `;

        historicoObservacoes.appendChild(obsItem);

    });

}





async function salvarLeadMobile() {

    const oldNextContactDate = leadSelecionado ? leadSelecionado.next_contact_date : null;



    const nextContactDateInput = document.getElementById('nextContactDateInput').value;

    let nextContactDateForDb = null;



    if (nextContactDateInput) {

        const tempDate = new Date(nextContactDateInput);

        const year = tempDate.getFullYear();

        const month = (tempDate.getMonth() + 1).toString().padStart(2, '0');

        const day = tempDate.getDate().toString().padStart(2, '0');

        const hours = tempDate.getHours().toString().padStart(2, '0');

        const minutes = tempDate.getMinutes().toString().padStart(2, '0');

        const seconds = tempDate.getSeconds().toString().padStart(2, '0');



        nextContactDateForDb = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    }



    const now = new Date();

    const lastContactYear = now.getFullYear();

    const lastContactMonth = (now.getMonth() + 1).toString().padStart(2, '0');

    const lastContactDay = now.getDate().toString().padStart(2, '0');

    const lastContactHours = now.getHours().toString().padStart(2, '0');

    const lastContactMinutes = now.getMinutes().toString().padStart(2, '0');

    const lastContactSeconds = now.getSeconds().toString().padStart(2, '0');

    const lastContactDateForDb = `${lastContactYear}-${lastContactMonth}-${lastContactDay} ${lastContactHours}:${lastContactMinutes}:${lastContactSeconds}`;



    const selectedSubstatuses = [];

    const checkboxes = substatusCheckboxesContainer.querySelectorAll('input[name="substatus"]:checked');

    checkboxes.forEach(checkbox => {

        selectedSubstatuses.push(checkbox.value);

    });



    const dataToSave = {

        phone: document.getElementById('phoneInput').value || null,

        whatsapp: document.getElementById('whatsappInput').value || null,

        cnpj: document.getElementById('cnpjInput').value,

        responsavel: document.getElementById('responsavelInput').value,

        website: document.getElementById('websiteInput').value,

        idade: parseInt(document.getElementById('idadeInput').value) || null,

        address: document.getElementById('enderecoInput').value,

        observacoes: document.getElementById('observacoesInput').value,

        next_contact_date: nextContactDateForDb,

        next_contact_subject: document.getElementById('nextContactSubjectInput').value || null,

        last_contact_date: lastContactDateForDb,

        sub_statuses_marcados: selectedSubstatuses

    };



    let error = null;

    let savedLeadId = null;



    if (isNewLead) {

        dataToSave.empresa = document.getElementById('empresaInput').value;

        dataToSave.segmento = document.getElementById('segmentoInput').value;

        dataToSave.status = "A Prospectar";



        if (!dataToSave.empresa || (!dataToSave.whatsapp && !dataToSave.phone)) {

            alert('Nome da Empresa e pelo menos um telefone (Telefone ou WhatsApp) são obrigatórios para um novo lead.');

            return;

        }



        const { data: insertedData, error: insertError } = await client

            .from('leads_crm')

            .insert([dataToSave])

            .select();

        error = insertError;

        if (insertedData && insertedData.length > 0) {

            savedLeadId = insertedData[0].id;

        }

    } else {

        const { data: updatedData, error: updateError } = await client

            .from('leads_crm')

            .update(dataToSave)

            .eq('id', leadSelecionado.id)

            .select();

        error = updateError;

        if (updatedData && updatedData.length > 0) {

            savedLeadId = updatedData[0].id;

        }

    }



    if (error) {

        console.error('Erro ao salvar informações:', error);

        alert('Erro ao salvar informações: ' + error.message);

    } else {

        if (isNewLead) {

            alert('Novo lead adicionado com sucesso!');

        } else {

            alert('Informações salvas com sucesso!');

        }



        await fetchLeadsMobile();



        const currentLeadData = leads.find(l => l.id === savedLeadId);

        const newNextContactDate = dataToSave.next_contact_date;

        const isDateChanged = oldNextContactDate !== newNextContactDate;



        if (currentLeadData && (isNewLead || isDateChanged)) {

            console.log('Enviando dados para o n8n webhook...');

            try {

                const webhookUrl = 'https://n8n-n8n-start.yh11mi.easypanel.host/webhook/crm';

                const response = await fetch(webhookUrl, {

                    method: 'POST',

                    headers: {

                        'Content-Type': 'application/json',

                    },

                    body: JSON.stringify(currentLeadData),

                });

                if (response.ok) {

                    console.log('Dados do lead enviados com sucesso para o n8n!');

                } else {

                    console.error('Erro ao enviar dados para o n8n:', response.status, response.statusText);

                    alert('Erro ao enviar dados para o n8n.');

                }

            } catch (webhookError) {

                console.error('Erro na requisição do webhook do n8n:', webhookError);

                alert('Erro de conexão ao webhook do n8n.');

            }

        }

        fecharModalMobile();

    }

}



async function deletarLeadMobile(id) {

    if (!confirm('Tem certeza que deseja deletar este lead? Esta ação é irreversível.')) {

        return;

    }

    const { error } = await client

        .from('leads_crm')

        .delete()

        .eq('id', id);



    if (error) {

        console.error('Erro ao deletar lead:', error);

        alert('Erro ao deletar lead: ' + error.message);

    } else {

        alert('Lead deletado com sucesso!');

        fecharModalMobile();

        await fetchLeadsMobile();

    }

}



async function updateStatusAndRenderMobile(id, novoStatus) {

    const { data: updatedLead, error: fetchError } = await client

        .from('leads_crm')

        .select('*')

        .eq('id', id)

        .single();

    if (fetchError) {

        console.error('Erro ao buscar lead para atualização de status:', fetchError.message);

        alert('Erro ao carregar detalhes do lead para atualização.');

        return;

    }

    const { error } = await client

        .from('leads_crm')

        .update({ status: novoStatus })

        .eq('id', id);

    if (error) {

        alert('Erro ao atualizar status');

    } else {

        console.log('Status atualizado');

        const leadIndex = leads.findIndex(l => l.id === id);

        if (leadIndex !== -1) {

            leads[leadIndex].status = novoStatus;

        }

        filtrarLeadsMobile();

        if (leadModal.style.display === 'flex' && leadSelecionado && leadSelecionado.id === id) {

            leadSelecionado.status = novoStatus;

            substatusCheckboxesContainer.innerHTML = '';

            const availableSubstatuses = await fetchSubstatusesForMainStatus(novoStatus);

            const selectedSubstatuses = updatedLead.sub_statuses_marcados || [];

            if (availableSubstatuses.length > 0) {

                const title = document.createElement('label');

                title.textContent = 'Sub-Status:';

                title.style.marginTop = '10px';

                title.style.marginBottom = '5px';

                title.style.fontWeight = 'bold';

                title.style.fontSize = '0.9em';

                title.style.color = '#555';

                substatusCheckboxesContainer.appendChild(title);



                availableSubstatuses.forEach(substatus => {

                    const div = document.createElement('div');

                    div.classList.add('substatus-item');

                    const checkbox = document.createElement('input');

                    checkbox.type = 'checkbox';

                    checkbox.id = `substatus-${substatus.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-')}`;

                    checkbox.value = substatus;

                    checkbox.name = 'substatus';

                    if (selectedSubstatuses.includes(substatus)) {

                        checkbox.checked = true;

                    }

                    const label = document.createElement('label');

                    label.htmlFor = checkbox.id;

                    label.textContent = substatus;

                    label.style.display = 'inline-block';

                    label.style.marginLeft = '5px';

                    label.style.fontWeight = 'normal';

                    label.style.fontSize = '1em';

                    div.appendChild(checkbox);

                    div.appendChild(label);

                    substatusCheckboxesContainer.appendChild(div);

                });

            }

        }

    }

}



function fecharModalMobile() {

    leadModal.style.display = 'none';

    leadSelecionado = null;

    isNewLead = false;

    editingObsIndex = null; // Reinicia a variável de edição ao fechar o modal

}



// Inicializa o fetch dos leads ao carregar a página

fetchLeadsMobile();        
