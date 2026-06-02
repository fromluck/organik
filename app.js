const initialBills = [];

let fixedIncome = 0;
const baseProjectionPeriod = { month: 4, year: 2026 };
const legacyStorageKey = "jefferson-financas-bills";
const storageKey = "organik-bills-empty-v1";
const userBillsStoragePrefix = "organik-user-bills-empty-v1";
const userCardsStoragePrefix = "organik-user-cards-empty-v1";
const userProfileStoragePrefix = "organik-user-profile-v1";
const periodStorageKey = "jefferson-financas-period";
const sessionStorageKey = "jefferson-financas-session";
const correctedBills = [];
const creditCards = [];
const defaultProfile = {
  income: 0,
  accounts: [],
  budgets: [],
  goals: []
};
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
const authLogoBackButton = document.querySelector("#authLogoBackButton");
const googleLoginButton = document.querySelector("#googleLoginButton");
const existingAccountLoginButton = document.querySelector("#existingAccountLoginButton");
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
const dashboardExpandButton = document.querySelector("#dashboardExpandButton");
const configureBudgetButton = document.querySelector("#configureBudgetButton");
const addTransactionButton = document.querySelector("#addTransactionButton");
const sortTransactionsButton = document.querySelector("#sortTransactionsButton");
const exportButton = document.querySelector("#exportButton");
const transactionsExpandButton = document.querySelector("#transactionsExpandButton");
const newAccountButton = document.querySelector("#newAccountButton");
const newCardButton = document.querySelector("#newCardButton");
const addCategoryButton = document.querySelector("#addCategoryButton");
const newGoalButton = document.querySelector("#newGoalButton");
const settingsSaveButton = document.querySelector("#settingsSaveButton");
const settingsCancelButton = document.querySelector("#settingsCancelButton");
const actionModal = document.querySelector("#actionModal");
const actionModalTitle = document.querySelector("#actionModalTitle");
const actionModalText = document.querySelector("#actionModalText");
const actionModalForm = document.querySelector("#actionModalForm");
const modalCloseButton = document.querySelector("#modalCloseButton");
const appToast = document.querySelector("#appToast");
const accountsIncomeTotal = document.querySelector("#accountsIncomeTotal");
const accountsBalanceTotal = document.querySelector("#accountsBalanceTotal");
const mainAccountName = document.querySelector("#mainAccountName");
const accountsCount = document.querySelector("#accountsCount");
const accountsList = document.querySelector("#accountsList");
const budgetList = document.querySelector("#budgetList");
const goalsList = document.querySelector("#goalsList");

let bills = loadBills();
let supabaseClient = null;
let selectedPeriod = getInitialPeriod();
let activeBillsStorageKey = storageKey;
let activeCardsStorageKey = `${userCardsStoragePrefix}-local`;
let activeCreditCards = loadCreditCards(activeCardsStorageKey);
let activeProfileStorageKey = `${userProfileStoragePrefix}-local`;
let userProfile = loadProfile(activeProfileStorageKey);
fixedIncome = userProfile.income;
const urlParams = new URLSearchParams(window.location.search);
const isAuthPopup = urlParams.has("authPopup");

setupPeriodPicker();
setupSupabase();
setupSession();
setupPageNavigation();
setupActionButtons();

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

function loadProfile(key) {
  const saved = localStorage.getItem(key);
  if (!saved) return cloneDefaultProfile();

  try {
    const parsed = JSON.parse(saved);
    return {
      ...cloneDefaultProfile(),
      ...parsed,
      accounts: Array.isArray(parsed.accounts) ? parsed.accounts : [],
      budgets: Array.isArray(parsed.budgets) ? parsed.budgets : [],
      goals: Array.isArray(parsed.goals) ? parsed.goals : []
    };
  } catch {
    return cloneDefaultProfile();
  }
}

function saveProfile() {
  localStorage.setItem(activeProfileStorageKey, JSON.stringify(userProfile));
}

function cloneDefaultProfile() {
  return {
    income: defaultProfile.income,
    accounts: [],
    budgets: [],
    goals: []
  };
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

function setupActionButtons() {
  dashboardExpandButton?.addEventListener("click", () => {
    document.querySelector("#commitmentsSummary")?.scrollIntoView({ behavior: "smooth", block: "center" });
    showToast("Rolei para os compromissos atuais do mes.");
  });
  configureBudgetButton?.addEventListener("click", () => openActionModal(fixedIncome > 0 ? "budget" : "income"));
  incomeTotal?.parentElement?.addEventListener("click", () => openActionModal("income"));
  addTransactionButton?.addEventListener("click", () => openActionModal("transaction"));
  newAccountButton?.addEventListener("click", () => openActionModal("account"));
  newCardButton?.addEventListener("click", () => openActionModal("card"));
  newGoalButton?.addEventListener("click", () => openActionModal("goal"));
  addCategoryButton?.addEventListener("click", () => openActionModal("category"));
  settingsSaveButton?.addEventListener("click", saveSettings);
  settingsCancelButton?.addEventListener("click", () => {
    updateProfileName(document.querySelector(".side-profile strong")?.textContent || "Usuario");
    showToast("Alteracoes descartadas.");
  });
  sortTransactionsButton?.addEventListener("click", () => {
    bills.sort((a, b) => b.amount - a.amount);
    saveBills();
    render();
    showToast("Lancamentos ordenados pelo maior valor.");
  });
  exportButton?.addEventListener("click", exportFinancialData);
  transactionsExpandButton?.addEventListener("click", () => openActionModal("transaction"));
  modalCloseButton?.addEventListener("click", closeActionModal);
  actionModal?.addEventListener("click", (event) => {
    if (event.target === actionModal) closeActionModal();
  });
  actionModalForm?.addEventListener("submit", handleActionSubmit);
  accountsList?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-account]");
    if (!button) return;
    userProfile.accounts = userProfile.accounts.filter((account) => account.id !== button.dataset.deleteAccount);
    saveProfile();
    render();
    showToast("Conta removida.");
  });
  document.querySelectorAll(".ai-card button").forEach((button) => {
    button.addEventListener("click", () => showPage(button.textContent.includes("cart") ? "cartoes" : "dashboard"));
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

function openActionModal(type) {
  const config = getModalConfig(type);
  if (!config || !actionModal || !actionModalForm) return;

  actionModal.dataset.type = type;
  actionModalTitle.textContent = config.title;
  actionModalText.textContent = config.text;
  actionModalForm.innerHTML = config.fields + `
    <div class="modal-actions">
      <button class="secondary-button" type="button" data-close-modal>Cancelar</button>
      <button class="primary-button" type="submit">${config.submit}</button>
    </div>
  `;
  actionModalForm.querySelector("[data-close-modal]")?.addEventListener("click", closeActionModal);
  actionModal.classList.remove("is-hidden");
  actionModalForm.querySelector("input, select")?.focus();
}

function closeActionModal() {
  actionModal?.classList.add("is-hidden");
  if (actionModalForm) actionModalForm.innerHTML = "";
}

function getModalConfig(type) {
  const moneyInput = (name, label, value = "") => `
    <label>${label}<input name="${name}" inputmode="decimal" placeholder="0,00" value="${value}"></label>
  `;
  const configs = {
    income: {
      title: "Configurar renda",
      text: "Informe quanto entra fixo por mes. Isso ajuda o Organik a medir o que esta comprometido.",
      submit: "Salvar renda",
      fields: moneyInput("income", "Renda fixa mensal")
    },
    budget: {
      title: "Configurar orçamento",
      text: "Crie um limite por categoria. Exemplo: alimentacao, moradia, lazer ou transporte.",
      submit: "Salvar limite",
      fields: `
        <label>Categoria<input name="category" placeholder="Ex.: Alimentacao"></label>
        ${moneyInput("limit", "Limite mensal")}
        ${moneyInput("used", "Ja usado neste mes", "0,00")}
      `
    },
    account: {
      title: "Adicionar conta",
      text: "Cadastre onde seu dinheiro fica: banco, carteira, caixa ou conta digital.",
      submit: "Salvar conta",
      fields: `
        <label>Nome da conta<input name="name" placeholder="Ex.: Nubank, Caixa, Carteira"></label>
        <label>Tipo<select name="type"><option>Banco</option><option>Carteira</option><option>Conta digital</option><option>Poupanca</option></select></label>
        ${moneyInput("balance", "Saldo atual")}
      `
    },
    card: {
      title: "Adicionar cartão",
      text: "Informe limite, usado e fatura. O Organik calcula risco e disponibilidade.",
      submit: "Salvar cartao",
      fields: `
        <label>Nome do cartao<input name="name" placeholder="Ex.: Nubank"></label>
        ${moneyInput("limit", "Limite total")}
        ${moneyInput("used", "Valor usado")}
        ${moneyInput("currentInvoice", "Fatura atual")}
        <label>Ate quando existem parcelas?<input name="lastChargeMonth" placeholder="Ex.: Agosto/2026"></label>
      `
    },
    transaction: {
      title: "Adicionar transação",
      text: "Registre uma conta, fatura ou parcela que sai do seu bolso.",
      submit: "Salvar transacao",
      fields: `
        <label>Descricao<input name="name" placeholder="Ex.: Aluguel, feira, fatura"></label>
        <label>Tipo<select name="type"><option>Conta fixa</option><option>Fatura</option><option>Parcelamento</option><option>Essencial</option><option>Outro</option></select></label>
        ${moneyInput("amount", "Valor")}
        <label>Parcelas restantes<input name="installments" inputmode="numeric" placeholder="Deixe vazio se for mensal"></label>
      `
    },
    category: {
      title: "Adicionar categoria",
      text: "Categorias ajudam a entender para onde o dinheiro esta indo.",
      submit: "Salvar categoria",
      fields: `<label>Nome da categoria<input name="category" placeholder="Ex.: Saude, transporte"></label>`
    },
    goal: {
      title: "Nova meta",
      text: "Crie um objetivo financeiro simples para acompanhar seu progresso.",
      submit: "Salvar meta",
      fields: `
        <label>Nome da meta<input name="name" placeholder="Ex.: Reserva de emergencia"></label>
        ${moneyInput("target", "Valor da meta")}
        ${moneyInput("saved", "Valor ja guardado", "0,00")}
      `
    }
  };
  return configs[type];
}

function handleActionSubmit(event) {
  event.preventDefault();
  const type = actionModal.dataset.type;
  const formData = new FormData(actionModalForm);

  if (type === "income") {
    fixedIncome = parseMoney(formData.get("income"));
    userProfile.income = fixedIncome;
    saveProfile();
    showToast("Renda fixa salva.");
  }

  if (type === "budget") {
    userProfile.budgets.push({
      id: crypto.randomUUID(),
      category: String(formData.get("category")).trim() || "Categoria",
      limit: parseMoney(formData.get("limit")),
      used: parseMoney(formData.get("used"))
    });
    saveProfile();
    showToast("Limite de gasto cadastrado.");
  }

  if (type === "account") {
    userProfile.accounts.push({
      id: crypto.randomUUID(),
      name: String(formData.get("name")).trim() || "Conta",
      type: String(formData.get("type")),
      balance: parseMoney(formData.get("balance"))
    });
    saveProfile();
    showToast("Conta cadastrada.");
  }

  if (type === "card") {
    const limit = parseMoney(formData.get("limit"));
    const used = parseMoney(formData.get("used"));
    activeCreditCards.push({
      name: String(formData.get("name")).trim() || "Cartao",
      limit,
      used,
      available: Math.max(limit - used, 0),
      currentInvoice: parseMoney(formData.get("currentInvoice")),
      openInvoice: 0,
      futureInvoices: 0,
      lastChargeMonth: String(formData.get("lastChargeMonth")).trim() || "A definir",
      status: used >= limit && limit > 0 ? "Critico" : "Controle",
      note: "Cartao cadastrado manualmente.",
      purchases: [],
      invoices: []
    });
    saveCreditCards();
    showToast("Cartao cadastrado.");
  }

  if (type === "transaction") {
    const amount = parseMoney(formData.get("amount"));
    if (amount <= 0) {
      showToast("Informe um valor maior que zero.");
      return;
    }
    const installments = Number(formData.get("installments"));
    bills.push({
      id: crypto.randomUUID(),
      name: String(formData.get("name")).trim() || "Transacao",
      type: String(formData.get("type")),
      amount,
      startMonth: getSelectedPeriod().month,
      startYear: getSelectedPeriod().year,
      ...(installments > 0 ? { installmentsLeft: installments } : {})
    });
    saveBills();
    showToast("Transacao cadastrada.");
  }

  if (type === "category") {
    showToast(`Categoria "${String(formData.get("category")).trim() || "nova"}" criada para uso futuro.`);
  }

  if (type === "goal") {
    userProfile.goals.push({
      id: crypto.randomUUID(),
      name: String(formData.get("name")).trim() || "Meta",
      target: parseMoney(formData.get("target")),
      saved: parseMoney(formData.get("saved"))
    });
    saveProfile();
    showToast("Meta cadastrada.");
  }

  closeActionModal();
  render();
}

function parseMoney(value) {
  const normalized = String(value ?? "")
    .replace(/\s/g, "")
    .replace("R$", "")
    .replace(/\./g, "")
    .replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function saveSettings() {
  const settingsNameInput = document.querySelector("#settingsNameInput");
  const name = settingsNameInput?.value?.trim();
  if (name) updateProfileName(name);
  showToast("Configuracoes salvas.");
}

function exportFinancialData() {
  const payload = {
    renda: fixedIncome,
    contas: userProfile.accounts,
    compromissos: bills,
    cartoes: activeCreditCards,
    limites: userProfile.budgets,
    metas: userProfile.goals,
    exportadoEm: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "organik-dados.json";
  link.click();
  URL.revokeObjectURL(url);
  showToast("Exportacao gerada.");
}

function showToast(message) {
  if (!appToast) return;
  appToast.textContent = message;
  appToast.classList.remove("is-hidden");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => appToast.classList.add("is-hidden"), 2600);
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
  existingAccountLoginButton?.addEventListener("click", signInWithGoogle);
  authLogoBackButton?.addEventListener("click", showLandingStage);

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
    activeCardsStorageKey = `${userCardsStoragePrefix}-local`;
    activeProfileStorageKey = `${userProfileStoragePrefix}-local`;
    userProfile = loadProfile(activeProfileStorageKey);
    fixedIncome = userProfile.income;
    activeCreditCards = loadCreditCards(activeCardsStorageKey);
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
  activeCardsStorageKey = `${userCardsStoragePrefix}-${user.id}`;
  activeProfileStorageKey = `${userProfileStoragePrefix}-${user.id}`;
  bills = loadBills(activeBillsStorageKey, { includeDefaults: false });
  activeCreditCards = loadUserCreditCards(user.id);
  userProfile = loadProfile(activeProfileStorageKey);
  fixedIncome = userProfile.income;
}

function loadUserCreditCards(userId) {
  return loadCreditCards(`${userCardsStoragePrefix}-${userId}`);
}

function loadCreditCards(key) {
  const saved = localStorage.getItem(key);
  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCreditCards() {
  localStorage.setItem(activeCardsStorageKey, JSON.stringify(activeCreditCards));
}

function showAuthStage() {
  loginScreen.classList.add("is-auth-open");
  landingMain.classList.add("is-hidden");
  authStage.classList.remove("is-hidden");
  authStage.scrollIntoView({ behavior: "smooth", block: "start" });
}

function showLandingStage() {
  loginScreen.classList.remove("is-auth-open");
  authStage.classList.add("is-hidden");
  landingMain.classList.remove("is-hidden");
  setAuthStatus("");
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  window.scrollTo({ top: 0, behavior: "smooth" });
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
  renderAccounts();
  renderBudgets();
  renderGoals();
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

function renderAccounts() {
  if (accountsIncomeTotal) accountsIncomeTotal.textContent = currency.format(fixedIncome);
  const totalBalance = userProfile.accounts.reduce((sum, account) => sum + account.balance, 0);
  if (accountsBalanceTotal) accountsBalanceTotal.textContent = currency.format(totalBalance);
  if (mainAccountName) mainAccountName.textContent = userProfile.accounts[0]?.name || "A definir";
  if (accountsCount) accountsCount.textContent = String(userProfile.accounts.length);

  if (!accountsList) return;
  accountsList.innerHTML = userProfile.accounts.length ? userProfile.accounts.map((account) => `
    <article class="credit-card-item compact-item">
      <div class="credit-card-top">
        <div>
          <h3>${escapeHtml(account.name)}</h3>
          <span class="credit-card-label">${escapeHtml(account.type)}</span>
        </div>
        <strong>${currency.format(account.balance)}</strong>
      </div>
      <button class="delete-button" type="button" data-delete-account="${account.id}" title="Remover conta">x</button>
    </article>
  `).join("") : `
    <div class="empty-state">
      <strong>Nenhuma conta cadastrada.</strong>
      <span>Clique em Nova conta para informar onde seu dinheiro entra ou fica guardado.</span>
    </div>
  `;
}

function renderBudgets() {
  if (!budgetList) return;
  budgetList.innerHTML = userProfile.budgets.length ? userProfile.budgets.map((budget) => {
    const percent = budget.limit > 0 ? Math.min((budget.used / budget.limit) * 100, 100) : 0;
    return `
      <div class="budget-row">
        <span>${escapeHtml(budget.category)}</span>
        <strong>${currency.format(budget.used)} / ${currency.format(budget.limit)}</strong>
        <div><i style="width:${percent}%"></i></div>
      </div>
    `;
  }).join("") : `
    <div class="empty-state">
      <strong>Nenhum limite configurado.</strong>
      <span>Defina limites simples, como alimentacao, moradia ou lazer.</span>
    </div>
  `;
}

function renderGoals() {
  if (!goalsList) return;
  goalsList.innerHTML = userProfile.goals.length ? userProfile.goals.map((goal) => {
    const percent = goal.target > 0 ? Math.min((goal.saved / goal.target) * 100, 100) : 0;
    return `
      <div class="panel goal-card">
        <strong>${escapeHtml(goal.name)}</strong>
        <p>${currency.format(goal.saved)} guardados de ${currency.format(goal.target)}.</p>
        <div class="limit-track"><div class="limit-fill" style="width:${percent}%"></div></div>
      </div>
    `;
  }).join("") : `
    <div class="empty-state"><strong>Nenhuma meta cadastrada.</strong><span>Crie uma meta para acompanhar quanto falta guardar.</span></div>
  `;
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
  userProfile = cloneDefaultProfile();
  fixedIncome = 0;
  activeCreditCards = [];
  saveBills();
  saveProfile();
  saveCreditCards();
  render();
  showToast("Todos os cadastros foram zerados.");
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
