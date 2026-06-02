const initialBills = [];

const fixedIncome = 0;
const baseProjectionPeriod = { month: 4, year: 2026 };
const legacyStorageKey = "jefferson-financas-bills";
const storageKey = "organik-bills-empty-v1";
const userBillsStoragePrefix = "organik-user-bills-empty-v1";
const userCardsStoragePrefix = "organik-user-cards-empty-v1";
const periodStorageKey = "jefferson-financas-period";
const sessionStorageKey = "jefferson-financas-session";
const correctedBills = [];
const creditCards = [];
const thirdPartyCards = [];
const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

const billList = document.querySelector("#billList");
const barChart = document.querySelector("#barChart");
const incomeDonut = document.querySelector("#incomeDonut");
const incomeUsage = document.querySelector("#incomeUsage");
const committedAmount = document.querySelector("#committedAmount");
const availableAmount = document.querySelector("#availableAmount");
const flowChart = document.querySelector("#flowChart");
const monthReading = document.querySelector("#monthReading");
const incomeTotal = document.querySelector("#incomeTotal");
const monthlyTotal = document.querySelector("#monthlyTotal");
const monthlyBalance = document.querySelector("#monthlyBalance");
const balanceDetail = document.querySelector("#balanceDetail");
const cardsLimitTotal = document.querySelector("#cardsLimitTotal");
const cardsUsedTotal = document.querySelector("#cardsUsedTotal");
const cardsAvailableTotal = document.querySelector("#cardsAvailableTotal");
const cardsRiskName = document.querySelector("#cardsRiskName");
const creditCardList = document.querySelector("#creditCardList");
const cardTimeline = document.querySelector("#cardTimeline");
const diagnosisPanel = document.querySelector("#diagnostico");
const diagnosisTitle = document.querySelector("#diagnosisTitle");
const diagnosisText = document.querySelector("#diagnosisText");
const diagnosisPercent = document.querySelector("#diagnosisPercent");
const largestBill = document.querySelector("#largestBill");
const largestBillDetail = document.querySelector("#largestBillDetail");
const billForm = document.querySelector("#billForm");
const resetData = document.querySelector("#resetData");
const commitmentsSummary = document.querySelector("#commitmentsSummary");
const periodMenuButton = document.querySelector("#periodMenuButton");
const periodMenu = document.querySelector("#periodMenu");
const selectedMonthLabel = document.querySelector("#selectedMonthLabel");
const selectedYearLabel = document.querySelector("#selectedYearLabel");
const previousYear = document.querySelector("#previousYear");
const nextYear = document.querySelector("#nextYear");
const periodMonthButtons = document.querySelectorAll("[data-month]");
const thirdPartySummary = document.querySelector("#thirdPartySummary");
const thirdPartyTable = document.querySelector("#thirdPartyTable");
const thirdPartyTotal = document.querySelector("#thirdPartyTotal");
const thirdPartyOwnTotal = document.querySelector("#thirdPartyOwnTotal");
const thirdPartyGeneralTotal = document.querySelector("#thirdPartyGeneralTotal");
const loginScreen = document.querySelector("#loginScreen");
const appShell = document.querySelector("#appShell");
const landingMain = document.querySelector("#landingMain");
const authStage = document.querySelector("#acesso");
const loginForm = document.querySelector("#loginForm");
const loginName = document.querySelector("#loginName");
const googleLoginButton = document.querySelector("#googleLoginButton");
const authStatus = document.querySelector("#authStatus");
const dashboardGreeting = document.querySelector("#dashboardGreeting");
const cardsSectionTitle = document.querySelector("#cardsSectionTitle");
const logoutButton = document.querySelector("#logoutButton");
const profileMenuButton = document.querySelector("#profileMenuButton");
const profileDropdown = document.querySelector("#profileDropdown");
const profileLogoutButton = document.querySelector("#profileLogoutButton");
const syncStatus = document.querySelector("#syncStatus");
const authOpenButtons = document.querySelectorAll("[data-open-auth]");
const sideNavList = document.querySelector(".side-nav nav");

buildSidebarNavigation();

const pageLinks = document.querySelectorAll("[data-page-link]");
const appPages = document.querySelectorAll(".app-page");
const pageTitle = document.querySelector("#pageTitle");
const cardsLimitTotalPage = document.querySelector("#cardsLimitTotalPage");
const cardsUsedTotalPage = document.querySelector("#cardsUsedTotalPage");
const cardsAvailableTotalPage = document.querySelector("#cardsAvailableTotalPage");
const cardsRiskNamePage = document.querySelector("#cardsRiskNamePage");
const creditCardListPage = document.querySelector("#creditCardListPage");

let bills = loadBills();
let supabaseClient = null;
let selectedPeriod = getInitialPeriod();
let activeBillsStorageKey = storageKey;
let activeCreditCards = [...creditCards];
const urlParams = new URLSearchParams(window.location.search);
const isAuthPopup = urlParams.has("authPopup");

setupPeriodPicker();
setupSupabase();
setupSession();
setupPageNavigation();

function loadBills(key = storageKey, options = {}) {
  const includeDefaults = options.includeDefaults ?? true;
  localStorage.removeItem(legacyStorageKey);
  const saved = localStorage.getItem(key);
  if (!saved) return includeDefaults ? cloneInitialBills() : [];

  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return includeDefaults ? cloneInitialBills() : [];

    const normalized = applyBillCorrections(normalizeSavedBills(parsed));
    return includeDefaults ? mergeMissingInitialBills(normalized) : normalized;
  } catch {
    return includeDefaults ? cloneInitialBills() : [];
  }
}

function saveBills() {
  localStorage.setItem(activeBillsStorageKey, JSON.stringify(bills));
}

function setupSupabase() {
  const config = window.ORGANIK_SUPABASE;
  if (!config?.url || !config?.anonKey || !window.supabase) {
    syncStatus.textContent = "Modo local";
    return;
  }

  supabaseClient = window.supabase.createClient(config.url, config.anonKey);
  syncStatus.textContent = "Supabase conectado";
}

function buildSidebarNavigation() {
  sideNavList.innerHTML = `
    <span class="nav-section">Controle</span>
    <a class="active" href="#dashboard" data-page-link="dashboard">Dashboard</a>
    <a href="#transacoes" data-page-link="transacoes">Transacoes</a>
    <a href="#recorrentes" data-page-link="recorrentes">Recorrentes</a>
    <a href="#contas" data-page-link="contas">Contas</a>
    <a href="#cartoes" data-page-link="cartoes">Cartoes</a>
    <a href="#categorias" data-page-link="categorias">Categorias</a>
    <a href="#organik-ia" data-page-link="organik-ia">Organik IA</a>
    <span class="nav-section">Organizacao</span>
    <a href="#limites" data-page-link="limites">Limites de gastos</a>
    <a href="#metas" data-page-link="metas">Metas</a>
    <a href="#investimentos" data-page-link="investimentos">Investimentos</a>
    <a href="#relatorios" data-page-link="relatorios">Relatorios</a>
    <a href="#configuracoes" data-page-link="configuracoes">Configuracoes</a>
  `;
}

function setupPageNavigation() {
  pageLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      showPage(link.dataset.pageLink);
    });
  });
}

function showPage(pageName) {
  appPages.forEach((page) => {
    page.classList.toggle("active", page.dataset.page === pageName);
  });

  pageLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.pageLink === pageName);
  });

  const activeLink = [...pageLinks].find((link) => link.dataset.pageLink === pageName);
  pageTitle.textContent = activeLink ? activeLink.textContent.replace("PRO", "").trim() : "Dashboard";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function setupSession() {
  if (supabaseClient) {
    const { data } = await supabaseClient.auth.getSession();
    if (isAuthPopup) {
      handleAuthPopupSession(data.session);
      return;
    }
    setAuthenticated(Boolean(data.session), data.session?.user);

    supabaseClient.auth.onAuthStateChange((_event, session) => {
      if (isAuthPopup) {
        handleAuthPopupSession(session);
        return;
      }
      setAuthenticated(Boolean(session), session?.user);
    });
  } else {
    const savedSession = localStorage.getItem(sessionStorageKey);
    if (savedSession) {
      try {
        const parsedSession = JSON.parse(savedSession);
        updateProfileName(parsedSession.name || "Usuario");
      } catch {
        updateProfileName("Usuario");
      }
    }
    setAuthenticated(Boolean(savedSession));
  }

  authOpenButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      showAuthStage();
    });
  });

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (supabaseClient) {
      setAuthStatus("Use o botao do Google para entrar com Supabase.");
      return;
    }

    const name = loginName.value.trim() || "Usuario";
    localStorage.setItem(sessionStorageKey, JSON.stringify({ name, loggedAt: new Date().toISOString() }));
    updateProfileName(name);
    setAuthenticated(true);
    render();
  });

  googleLoginButton?.addEventListener("click", signInWithGoogle);

  window.addEventListener("message", async (event) => {
    if (event.origin !== window.location.origin || event.data?.type !== "organik-auth-complete") return;
    if (!supabaseClient) return;

    const { data } = await supabaseClient.auth.getSession();
    setAuthenticated(Boolean(data.session), data.session?.user);
    setAuthStatus(data.session ? "Login concluido." : "Login concluido. Atualize a pagina se necessario.");
  });

  logoutButton.addEventListener("click", signOut);

  profileLogoutButton.addEventListener("click", signOut);

  profileMenuButton.addEventListener("click", () => {
    const isOpen = profileMenuButton.getAttribute("aria-expanded") === "true";
    profileMenuButton.setAttribute("aria-expanded", String(!isOpen));
    profileDropdown.classList.toggle("is-hidden", isOpen);
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".profile-menu")) {
      closeProfileMenu();
    }
  });
}

async function signInWithGoogle() {
  if (!supabaseClient) {
    setAuthStatus("Configure o Supabase para ativar o login com Google.");
    return;
  }

  const redirectUrl = new URL(window.location.origin + window.location.pathname);
  redirectUrl.searchParams.set("authPopup", "1");

  setAuthStatus("Abrindo janela do Google...");
  const { data, error } = await supabaseClient.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectUrl.href,
      skipBrowserRedirect: true
    }
  });

  if (error) {
    setAuthStatus(error.message);
    return;
  }

  const popup = window.open(
    data.url,
    "organikGoogleLogin",
    "width=520,height=680,left=120,top=80,menubar=no,toolbar=no,location=yes,status=no"
  );

  if (!popup) {
    setAuthStatus("Popup bloqueado. Permita popups para escolher a conta Google.");
    return;
  }

  popup.focus();
  const popupCheck = window.setInterval(() => {
    if (!popup.closed) return;
    window.clearInterval(popupCheck);
    setAuthStatus("Se o login foi concluido, carregando sua conta...");
    supabaseClient.auth.getSession().then(({ data: sessionData }) => {
      setAuthenticated(Boolean(sessionData.session), sessionData.session?.user);
    });
  }, 800);
}

function handleAuthPopupSession(session) {
  if (!session) {
    setAuthStatus("Finalizando login...");
    return;
  }

  window.opener?.postMessage({ type: "organik-auth-complete" }, window.location.origin);
  document.body.innerHTML = "<main style=\"font-family:Poppins,Arial,sans-serif;display:grid;min-height:100vh;place-items:center;color:#0f1715\">Login concluido. Fechando janela...</main>";
  window.setTimeout(() => window.close(), 600);
}

async function signOut() {
  if (supabaseClient) {
    await supabaseClient.auth.signOut();
  }
  localStorage.removeItem(sessionStorageKey);
  setAuthenticated(false);
  closeProfileMenu();
}

function setAuthenticated(isAuthenticated, user = null) {
  loginScreen.classList.toggle("is-hidden", isAuthenticated);
  appShell.classList.toggle("is-hidden", !isAuthenticated);
  if (!isAuthenticated) {
    loginScreen.classList.remove("is-auth-open");
    activeBillsStorageKey = storageKey;
    activeCreditCards = [...creditCards];
  }
  if (isAuthenticated && user) {
    loadUserFinancialData(user);
    updateProfileName(getUserDisplayName(user));
    render();
  }
}

function setAuthStatus(message) {
  if (authStatus) authStatus.textContent = message;
}

function updateProfileName(name) {
  const cleanName = name.trim() || "Usuario";
  const firstName = cleanName.split(" ")[0] || cleanName;
  const initial = firstName.charAt(0).toUpperCase() || "U";

  document.querySelectorAll(".side-profile strong").forEach((element) => {
    element.textContent = cleanName;
  });
  document.querySelectorAll(".profile-pill strong").forEach((element) => {
    element.textContent = firstName;
  });
  document.querySelectorAll("[data-profile-initial]").forEach((element) => {
    element.textContent = initial;
  });
  if (dashboardGreeting) {
    dashboardGreeting.textContent = `Ola, ${cleanName}!`;
  }
  if (cardsSectionTitle) {
    cardsSectionTitle.textContent = `Cartoes de ${firstName}`;
  }
  document.querySelectorAll("[data-settings-profile-name]").forEach((element) => {
    element.textContent = cleanName;
  });
  const settingsNameInput = document.querySelector("#settingsNameInput");
  if (settingsNameInput) {
    settingsNameInput.value = cleanName;
  }
}

function getUserDisplayName(user) {
  return (
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.user_metadata?.user_name ||
    user?.email?.split("@")[0] ||
    "Usuario"
  );
}

function loadUserFinancialData(user) {
  if (!user?.id) return;

  activeBillsStorageKey = `${userBillsStoragePrefix}-${user.id}`;
  bills = loadBills(activeBillsStorageKey, { includeDefaults: false });
  activeCreditCards = loadUserCreditCards(user.id);
}

function loadUserCreditCards(userId) {
  const saved = localStorage.getItem(`${userCardsStoragePrefix}-${userId}`);
  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function showAuthStage() {
  loginScreen.classList.add("is-auth-open");
  landingMain.classList.add("is-hidden");
  authStage.classList.remove("is-hidden");
  authStage.scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeProfileMenu() {
  profileMenuButton.setAttribute("aria-expanded", "false");
  profileDropdown.classList.add("is-hidden");
}

function setupPeriodPicker() {
  updatePeriodMenu();

  periodMenuButton?.addEventListener("click", () => {
    const isOpen = periodMenuButton.getAttribute("aria-expanded") === "true";
    periodMenuButton.setAttribute("aria-expanded", String(!isOpen));
    periodMenu?.classList.toggle("is-hidden", isOpen);
  });

  previousYear?.addEventListener("click", () => {
    selectedPeriod.year -= 1;
    handlePeriodChange();
  });

  nextYear?.addEventListener("click", () => {
    selectedPeriod.year += 1;
    handlePeriodChange();
  });

  periodMonthButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectedPeriod.month = Number(button.dataset.month);
      periodMenu?.classList.add("is-hidden");
      periodMenuButton?.setAttribute("aria-expanded", "false");
      handlePeriodChange();
    });
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".period-menu-wrap")) {
      periodMenu?.classList.add("is-hidden");
      periodMenuButton?.setAttribute("aria-expanded", "false");
    }
  });
}

function loadPeriod() {
  const saved = localStorage.getItem(periodStorageKey);
  if (!saved) return {};

  try {
    return JSON.parse(saved);
  } catch {
    return {};
  }
}

function savePeriod() {
  localStorage.setItem(periodStorageKey, JSON.stringify(selectedPeriod));
}

function handlePeriodChange() {
  savePeriod();
  updatePeriodMenu();
  render();
}

function getInitialPeriod() {
  const today = new Date();
  const savedPeriod = loadPeriod();
  return {
    month: Number.isInteger(savedPeriod.month) ? savedPeriod.month : today.getMonth(),
    year: Number.isInteger(savedPeriod.year) ? savedPeriod.year : today.getFullYear()
  };
}

function updatePeriodMenu() {
  const monthName = getMonthName(selectedPeriod.month);
  if (selectedMonthLabel) selectedMonthLabel.textContent = monthName;
  if (selectedYearLabel) selectedYearLabel.textContent = String(selectedPeriod.year);
  periodMonthButtons.forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.month) === selectedPeriod.month);
  });
}

function getMonthName(monthIndex) {
  return [
    "Janeiro",
    "Fevereiro",
    "Marco",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro"
  ][monthIndex] || "Maio";
}

function render() {
  const projectedBills = getProjectedBills();
  const total = projectedBills.reduce((sum, bill) => sum + bill.amount, 0);
  const balance = fixedIncome - total;
  const committedPercent = fixedIncome > 0 ? (total / fixedIncome) * 100 : 0;
  const largest = [...projectedBills].sort((a, b) => b.amount - a.amount)[0];

  incomeTotal.textContent = currency.format(fixedIncome);
  monthlyTotal.textContent = currency.format(total);
  monthlyBalance.textContent = currency.format(balance);
  monthlyBalance.parentElement.classList.toggle("negative", balance < 0);
  monthlyBalance.parentElement.classList.toggle("positive", balance >= 0);
  balanceDetail.textContent = balance >= 0
    ? "Sobra estimada antes de outras contas."
    : "Faltante estimado antes de outras contas.";
  commitmentsSummary.textContent = `${projectedBills.length} compromissos reais neste mes - total ${currency.format(total)}`;
  renderCreditCards();
  renderDiagnosis(total, balance, committedPercent, projectedBills.length);
  renderInsightCharts(projectedBills, total, balance, committedPercent);
  renderThirdPartyTable();

  if (largest) {
    largestBill.textContent = largest.name;
    largestBillDetail.textContent = `${largest.type} de ${currency.format(largest.amount)}`;
  } else {
    largestBill.textContent = "-";
    largestBillDetail.textContent = "Nenhum compromisso cadastrado.";
  }

  billList.innerHTML = projectedBills.length
    ? projectedBills
    .map((bill) => {
      return `
        <div class="bill-row">
          <div>
            <div class="bill-name">${escapeHtml(bill.name)}</div>
            <span class="bill-type">${escapeHtml(bill.type)}</span>
            <span class="bill-installments">${escapeHtml(getInstallmentLabel(bill))}</span>
          </div>
          <div class="bill-amount">
            ${currency.format(bill.amount)}
            <small>${escapeHtml(getAmountHint(bill))}</small>
          </div>
          <button class="delete-button" type="button" data-delete="${bill.id}" title="Remover" aria-label="Remover ${escapeHtml(bill.name)}">x</button>
        </div>
      `;
    })
    .join("")
    : `
      <div class="empty-state">
        <strong>Nenhum compromisso cadastrado neste mes.</strong>
        <span>Adicione contas, parcelamentos ou despesas fixas para ver a gravidade da situacao.</span>
      </div>
    `;

  if (barChart) {
    barChart.innerHTML = projectedBills.length
      ? projectedBills
      .map((bill) => {
        const percent = total > 0 ? Math.max((bill.amount / total) * 100, 3) : 0;
        return `
          <div class="bar-item">
            <span>${escapeHtml(bill.name)} ${escapeHtml(bill.type)}</span>
            <div class="bar-track" title="${currency.format(bill.amount)}">
              <div class="bar-fill" style="width: ${percent}%"></div>
            </div>
          </div>
        `;
      })
      .join("")
      : `
        <div class="empty-state">
          <strong>Sem distribuicao ainda.</strong>
          <span>O grafico aparece depois do primeiro cadastro.</span>
        </div>
      `;
  }
}

function renderCreditCards() {
  const cards = activeCreditCards;
  const totalLimit = cards.reduce((sum, card) => sum + card.limit, 0);
  const totalUsed = cards.reduce((sum, card) => sum + card.used, 0);
  const totalAvailable = cards.reduce((sum, card) => sum + card.available, 0);
  const riskiestCard = [...cards].sort((a, b) => getCardUsagePercent(b) - getCardUsagePercent(a))[0];

  cardsLimitTotal.textContent = currency.format(totalLimit);
  cardsUsedTotal.textContent = currency.format(totalUsed);
  cardsAvailableTotal.textContent = currency.format(totalAvailable);
  cardsRiskName.textContent = riskiestCard ? riskiestCard.name : "-";
  cardsLimitTotalPage.textContent = currency.format(totalLimit);
  cardsUsedTotalPage.textContent = currency.format(totalUsed);
  cardsAvailableTotalPage.textContent = currency.format(totalAvailable);
  cardsRiskNamePage.textContent = riskiestCard ? riskiestCard.name : "-";

  const creditCardMarkup = cards.length ? cards.map((card) => {
    const usedPercent = getCardUsagePercent(card);
    const isCritical = usedPercent >= 98 || card.status === "Critico";
    const limitLabel = card.limit > 0 ? `${Math.round(usedPercent)}% do limite usado` : "Limite nao cadastrado";
    return `
      <article class="credit-card-item">
        <div class="credit-card-top">
          <div>
            <h3>${escapeHtml(card.name)}</h3>
            <span class="credit-card-label">${limitLabel}</span>
          </div>
          <span class="risk-pill ${isCritical ? "critical" : ""}">${escapeHtml(card.status)}</span>
        </div>
        <div class="limit-track">
          <div class="limit-fill ${usedPercent >= 90 ? "near-limit" : ""}" style="width: ${Math.min(usedPercent, 100)}%"></div>
        </div>
        <div class="card-number-grid">
          <div>
            <span class="credit-card-label">Limite</span>
            <strong>${currency.format(card.limit)}</strong>
          </div>
          <div>
            <span class="credit-card-label">Usado</span>
            <strong>${currency.format(card.used)}</strong>
          </div>
          <div>
            <span class="credit-card-label">Livre</span>
            <strong>${currency.format(card.available)}</strong>
          </div>
        </div>
        <div class="card-number-grid">
          <div>
            <span class="credit-card-label">Fatura atual</span>
            <strong>${currency.format(card.currentInvoice)}</strong>
          </div>
          <div>
            <span class="credit-card-label">Abertas/futuras</span>
            <strong>${currency.format(card.openInvoice + card.futureInvoices)}</strong>
          </div>
          <div>
            <span class="credit-card-label">Ate quando</span>
            <strong>${escapeHtml(card.lastChargeMonth)}</strong>
          </div>
        </div>
        <p class="card-note">${escapeHtml(card.note)}</p>
        <ul class="purchase-list">
          ${card.purchases.map((purchase) => `<li>${escapeHtml(purchase)}</li>`).join("")}
        </ul>
      </article>
    `;
  }).join("") : `
    <div class="empty-state">
      <strong>Nenhum cartao cadastrado.</strong>
      <span>Cadastre seus limites e faturas para acompanhar risco, uso e vencimentos.</span>
    </div>
  `;

  creditCardList.innerHTML = creditCardMarkup;
  creditCardListPage.innerHTML = creditCardMarkup;

  cardTimeline.innerHTML = cards.length ? cards.map((card) => {
    return `
      <article class="timeline-card">
        <h3>${escapeHtml(card.name)}</h3>
        ${card.invoices.map((invoice) => `
          <div class="timeline-row">
            <div>
              <span class="timeline-month">${escapeHtml(invoice.month)}</span>
              <span>${escapeHtml(invoice.status)}</span>
            </div>
            <strong>${currency.format(invoice.amount)}</strong>
          </div>
        `).join("")}
      </article>
    `;
  }).join("") : `
    <div class="empty-state">
      <strong>Nenhuma fatura futura.</strong>
      <span>A linha do tempo aparece depois que um cartao for cadastrado.</span>
    </div>
  `;
}

function getCardUsagePercent(card) {
  return card.limit > 0 ? (card.used / card.limit) * 100 : 0;
}

function renderDiagnosis(total, balance, committedPercent, activeCount) {
  const roundedPercent = Math.round(committedPercent);
  const level = getSeverityLevel(committedPercent, activeCount);
  const levelText = {
    empty: {
      title: "Cadastre os compromissos para medir a gravidade",
      text: "O app fica mais util quando voce informa os gastos que realmente saem do seu bolso."
    },
    safe: {
      title: "Situacao controlada",
      text: `Voce ainda tem ${currency.format(balance)} de folga estimada. O foco agora e manter os gastos dentro desse limite.`
    },
    attention: {
      title: "Atencao: pouca folga",
      text: `Os compromissos ja usam ${roundedPercent}% do salario. Ainda sobra ${currency.format(balance)}, mas qualquer gasto extra pode apertar o mes.`
    },
    warning: {
      title: "Alerta: salario quase todo comprometido",
      text: `Os compromissos chegaram a ${roundedPercent}% do salario. Priorize o que vence primeiro e evite criar novas parcelas.`
    },
    critical: {
      title: "Critico: falta dinheiro no mes",
      text: `Faltam ${currency.format(Math.abs(balance))} para cobrir os compromissos deste mes. E hora de negociar, cortar ou adiar o que for possivel.`
    }
  };

  diagnosisPanel.classList.remove("is-empty", "is-safe", "is-attention", "is-warning", "is-critical");
  diagnosisPanel.classList.add(`is-${level}`);
  diagnosisTitle.textContent = levelText[level].title;
  diagnosisText.textContent = levelText[level].text;
  diagnosisPercent.textContent = `${roundedPercent}%`;
}

function getSeverityLevel(committedPercent, activeCount) {
  if (activeCount === 0) return "empty";
  if (committedPercent <= 60) return "safe";
  if (committedPercent <= 80) return "attention";
  if (committedPercent <= 100) return "warning";
  return "critical";
}

function renderThirdPartyTable() {
  const totalThirdParty = thirdPartyCards.reduce((sum, item) => sum + item.thirdParty, 0);
  const totalGeneral = thirdPartyCards.reduce((sum, item) => sum + item.total, 0);
  const totalOwn = thirdPartyCards.reduce((sum, item) => sum + item.own, 0);

  thirdPartySummary.textContent = "Esses valores ficam fora do salario comprometido e fora dos compromissos reais.";
  thirdPartyTotal.textContent = currency.format(totalThirdParty);
  thirdPartyOwnTotal.textContent = currency.format(totalOwn);
  thirdPartyGeneralTotal.textContent = currency.format(totalGeneral);
  thirdPartyTable.innerHTML = thirdPartyCards.map((item) => {
    const isNegative = item.thirdParty < 0;
    return `
      <tr>
        <td>${escapeHtml(item.account)}</td>
        <td>${currency.format(item.total)}</td>
        <td>${currency.format(item.own)}</td>
        <td class="third-party-value ${isNegative ? "negative" : ""}">${currency.format(item.thirdParty)}</td>
      </tr>
    `;
  }).join("");
}

function renderInsightCharts(projectedBills, total, balance, committedPercent) {
  const safeBalance = Math.max(balance, 0);
  const donutDegrees = Math.min(committedPercent, 100) * 3.6;
  const dangerColor = committedPercent >= 90 ? "var(--red)" : committedPercent >= 70 ? "var(--gold)" : "var(--green)";
  const maxFlow = Math.max(fixedIncome, total, safeBalance, 1);

  incomeUsage.textContent = `${Math.round(committedPercent)}%`;
  incomeDonut.style.background = `conic-gradient(${dangerColor} 0deg ${donutDegrees}deg, #e8eee9 ${donutDegrees}deg 360deg)`;
  committedAmount.textContent = currency.format(total);
  availableAmount.textContent = currency.format(balance);

  flowChart.innerHTML = [
    { label: "Salario fixo", value: fixedIncome, className: "income" },
    { label: "Compromissos", value: total, className: "committed" },
    { label: balance >= 0 ? "Sobra estimada" : "Faltante", value: Math.abs(balance), className: "balance" }
  ].map((item) => {
    const width = Math.max((item.value / maxFlow) * 100, item.value > 0 ? 3 : 0);
    return `
      <div class="flow-row">
        <div class="flow-meta">
          <span class="flow-label">${item.label}</span>
          <span class="flow-value">${currency.format(item.value)}</span>
        </div>
        <div class="flow-track">
          <div class="flow-fill ${item.className}" style="width: ${width}%"></div>
        </div>
      </div>
    `;
  }).join("");

  monthReading.innerHTML = `
    <div class="reading-line ${balance < 0 ? "warning" : ""}">
      <strong>${balance >= 0 ? "Sobra no mes" : "Falta no mes"}: ${currency.format(Math.abs(balance))}</strong>
      <span>Considerando apenas sua parte real e os gastos fixos do mes selecionado.</span>
    </div>
    <div class="reading-line">
      <strong>${projectedBills.length} compromissos ativos</strong>
      <span>Parcelamentos aparecem somente enquanto ainda faltam parcelas.</span>
    </div>
    <div class="reading-line">
      <strong>Terceiros ficam fora</strong>
      <span>Valores usados por outras pessoas aparecem apenas na tabela de faturas.</span>
    </div>
  `;
}

function getProjectedBills() {
  const selectedPeriod = getSelectedPeriod();

  return bills
    .map((bill) => {
      const startPeriod = {
        month: bill.startMonth ?? baseProjectionPeriod.month,
        year: bill.startYear ?? baseProjectionPeriod.year
      };
      const monthOffset = getMonthOffset(startPeriod, selectedPeriod);

      if (bill.installmentsLeft) {
        const currentInstallmentsLeft = bill.installmentsLeft - monthOffset;
        if (monthOffset < 0 || currentInstallmentsLeft <= 0) return null;
        return { ...bill, currentInstallmentsLeft };
      }

      if (monthOffset < 0) return null;
      return bill;
    })
    .filter(Boolean);
}

function getSelectedPeriod() {
  return selectedPeriod;
}

function getMonthOffset(startPeriod, selectedPeriod) {
  return ((selectedPeriod.year - startPeriod.year) * 12) + (selectedPeriod.month - startPeriod.month);
}

billForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(billForm);
  const amount = Number(formData.get("amount"));
  const installments = Number(formData.get("installments"));

  if (!amount || amount <= 0) return;

  const nextBill = {
    id: crypto.randomUUID(),
    name: String(formData.get("name")).trim(),
    type: String(formData.get("type")),
    amount,
    startMonth: getSelectedPeriod().month,
    startYear: getSelectedPeriod().year
  };

  if (installments > 0) {
    nextBill.installmentsLeft = installments;
  }

  bills.push(nextBill);

  saveBills();
  billForm.reset();
  render();
});

billList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-delete]");
  if (!button) return;

  bills = bills.filter((bill) => bill.id !== button.dataset.delete);
  saveBills();
  render();
});

resetData?.addEventListener("click", () => {
  bills = activeBillsStorageKey === storageKey ? cloneInitialBills() : [];
  saveBills();
  render();
});

function cloneInitialBills() {
  return initialBills.map((bill) => ({
    ...bill,
    id: crypto.randomUUID(),
    startMonth: baseProjectionPeriod.month,
    startYear: baseProjectionPeriod.year
  }));
}

function mergeMissingInitialBills(savedBills) {
  const mergedBills = savedBills.map((bill) => ({
    ...bill,
    startMonth: bill.startMonth ?? baseProjectionPeriod.month,
    startYear: bill.startYear ?? baseProjectionPeriod.year
  }));

  initialBills.forEach((initialBill) => {
    const alreadySaved = mergedBills.some((bill) => bill.name === initialBill.name && bill.type === initialBill.type);
    if (!alreadySaved) {
      mergedBills.push({
        ...initialBill,
        id: crypto.randomUUID(),
        startMonth: baseProjectionPeriod.month,
        startYear: baseProjectionPeriod.year
      });
    }
  });

  return mergedBills;
}

function applyBillCorrections(savedBills) {
  return savedBills.map((bill) => {
    const correction = correctedBills.find((item) => item.name === bill.name && item.type === bill.type);
    return correction ? { ...bill, amount: correction.amount, installmentsLeft: correction.installmentsLeft } : bill;
  });
}

function normalizeSavedBills(savedBills) {
  return savedBills;
}

function getInstallmentLabel(bill) {
  if (bill.type === "Pago hoje") {
    return "pago hoje";
  }

  const remaining = bill.currentInstallmentsLeft ?? bill.installmentsLeft;
  if (remaining) {
    return `${remaining}x ${remaining === 1 ? "restante" : "restantes"}`;
  }

  return "mensal recorrente";
}

function getAmountHint(bill) {
  if (bill.type === "Pago hoje") {
    return "quitado neste mes";
  }

  const remaining = bill.currentInstallmentsLeft ?? bill.installmentsLeft;
  if (remaining) {
    return `${remaining}x de ${currency.format(bill.amount)}`;
  }

  return "valor mensal";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

render();
