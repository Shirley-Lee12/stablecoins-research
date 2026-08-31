const config = globalThis.CONNECTOR_CONFIG;
const views = ["loadingView", "disconnectedView", "captureView", "settingsView"];
const $ = (id) => document.getElementById(id);
let capture = null;
let currentJobId = null;
let connected = false;

function showView(id) {
  for (const view of views) $(view).classList.toggle("hidden", view !== id);
  $("errorBanner").classList.add("hidden");
}

function showError(message) {
  $("errorBanner").textContent = message;
  $("errorBanner").classList.remove("hidden");
}

async function storageGet(keys) {
  return chrome.storage.local.get(keys);
}

async function ensureClientId() {
  const stored = await storageGet(["connectorClientId"]);
  if (stored.connectorClientId) return stored.connectorClientId;
  const id = crypto.randomUUID();
  await chrome.storage.local.set({ connectorClientId: id });
  return id;
}

async function api(path, init = {}) {
  const response = await fetch(`${config.apiBaseUrl}/api${path}`, init);
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || `Request failed (${response.status})`);
  return data;
}

async function checkSession() {
  const stored = await storageGet(["connectorToken", "pairing"]);
  if (stored.connectorToken) {
    try {
      const session = await api("/connector/session", { headers: { Authorization: `Bearer ${stored.connectorToken}` } });
      connected = true;
      $("accountName").textContent = session.user?.name || session.user?.email || "已连接";
      showCaptureEmpty();
      showView("captureView");
      return;
    } catch {
      await chrome.storage.local.remove(["connectorToken", "connectorSessionId"]);
    }
  }
  if (stored.pairing) {
    $("pairingCode").textContent = stored.pairing.code;
    $("pairingPanel").classList.remove("hidden");
    await pollPairing(false);
  }
  showView("disconnectedView");
}

async function startPairing() {
  $("connectButton").disabled = true;
  try {
    const clientId = await ensureClientId();
    const platform = navigator.userAgentData?.platform || navigator.platform || "Browser";
    const pairing = await api("/connector/pairings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, clientName: `${platform} · Chrome/Edge Connector` }),
    });
    await chrome.storage.local.set({ pairing });
    $("pairingCode").textContent = pairing.code;
    $("pairingPanel").classList.remove("hidden");
    await chrome.tabs.create({ url: pairing.authorizeUrl });
  } catch (error) {
    showError(error instanceof Error ? error.message : String(error));
  } finally {
    $("connectButton").disabled = false;
  }
}

async function pollPairing(showPending = true) {
  const { pairing } = await storageGet(["pairing"]);
  if (!pairing) return false;
  try {
    const result = await api(`/connector/pairings/${pairing.pairingId}/poll`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pollSecret: pairing.pollSecret }),
    });
    if (result.status !== "authorized") {
      if (showPending) showError("网站授权尚未完成，请完成授权后再检查。 ");
      return false;
    }
    await chrome.storage.local.set({ connectorToken: result.token, connectorSessionId: result.sessionId });
    await chrome.storage.local.remove(["pairing"]);
    await checkSession();
    return true;
  } catch (error) {
    if (showPending) showError(error instanceof Error ? error.message : String(error));
    return false;
  }
}

function showCaptureEmpty() {
  capture = null;
  currentJobId = null;
  $("emptyCapture").classList.remove("hidden");
  $("previewPanel").classList.add("hidden");
  $("successPanel").classList.add("hidden");
}

function typeLabel(type) {
  return ({ journal_article: "期刊论文", working_paper: "工作论文", conference_paper: "会议论文", thesis: "学位论文", dataset: "数据集", report: "报告", gov_document: "法规/政府文件", news: "新闻" })[type] || type;
}

async function capturePage() {
  $("captureButton").disabled = true;
  $("recaptureButton").disabled = true;
  try {
    const response = await chrome.runtime.sendMessage({ type: "CAPTURE_ACTIVE_TAB" });
    if (!response?.ok) throw new Error(response?.error || "读取页面失败");
    capture = response.capture;
    const metadata = capture.metadata;
    $("previewTitle").textContent = metadata.title || "标题待 AI 识别";
    $("previewAuthors").textContent = metadata.authors.length ? metadata.authors.join("; ") : "待补全";
    $("previewDate").textContent = metadata.publishedDate || "待补全";
    $("previewDoi").textContent = metadata.doi || "未检测到";
    $("previewType").textContent = typeLabel(metadata.sourceType);
    const missing = [!metadata.title && "标题", !metadata.authors.length && "作者", !metadata.publishedDate && "日期", !metadata.abstract && "摘要"].filter(Boolean);
    $("aiNotice").textContent = missing.length
      ? `将使用 AI 补全：${missing.join("、")}。现有网页元数据不会被覆盖。`
      : `页面元数据完整；将跳过题录 AI 抽取，仅执行标签、去重与核对。`;
    $("emptyCapture").classList.add("hidden");
    $("successPanel").classList.add("hidden");
    $("previewPanel").classList.remove("hidden");
  } catch (error) {
    showError(error instanceof Error ? error.message : String(error));
  } finally {
    $("captureButton").disabled = false;
    $("recaptureButton").disabled = false;
  }
}

async function submitCapture() {
  if (!capture) return;
  $("submitButton").disabled = true;
  try {
    const { connectorToken } = await storageGet(["connectorToken"]);
    const result = await api("/resources/upload/jobs/browser-capture", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${connectorToken}` },
      body: JSON.stringify(capture),
    });
    currentJobId = result.jobId;
    $("successMessage").textContent = result.duplicateSubmission
      ? `此页面已有待处理任务 #${result.jobId}，已为你打开原任务。`
      : `任务 #${result.jobId} 正在进行标签、去重与完整性处理。`;
    $("previewPanel").classList.add("hidden");
    $("successPanel").classList.remove("hidden");
  } catch (error) {
    showError(error instanceof Error ? error.message : String(error));
  } finally {
    $("submitButton").disabled = false;
  }
}

async function disconnect() {
  const { connectorToken } = await storageGet(["connectorToken"]);
  if (connectorToken) {
    try {
      await api("/connector/session", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${connectorToken}` },
      });
    } catch {
      // Always remove a stale local credential, even if the server is temporarily unavailable.
    }
  }
  await chrome.storage.local.remove(["connectorToken", "connectorSessionId", "pairing"]);
  connected = false;
  showView("disconnectedView");
  $("pairingPanel").classList.add("hidden");
}

$("connectButton").addEventListener("click", startPairing);
$("checkPairingButton").addEventListener("click", () => pollPairing(true));
$("captureButton").addEventListener("click", capturePage);
$("recaptureButton").addEventListener("click", capturePage);
$("submitButton").addEventListener("click", submitCapture);
$("captureAnotherButton").addEventListener("click", showCaptureEmpty);
$("openReviewButton").addEventListener("click", () => chrome.tabs.create({ url: `${config.frontendUrl}/academic-resources?uploadJobId=${currentJobId || ""}` }));
$("settingsButton").addEventListener("click", () => { $("disconnectButton").classList.toggle("hidden", !connected); showView("settingsView"); });
$("backButton").addEventListener("click", () => connected ? (showCaptureEmpty(), showView("captureView")) : showView("disconnectedView"));
$("disconnectButton").addEventListener("click", disconnect);
$("versionLabel").textContent = config.version;
checkSession().catch((error) => { showView("disconnectedView"); showError(error instanceof Error ? error.message : String(error)); });
