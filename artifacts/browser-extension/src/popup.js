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
      await chrome.storage.local.remove(["pairing"]);
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
    if (await pollPairing(false)) return;
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

function splitList(value, limit, itemLength) {
  return [...new Set(value.split(/[\n;；,，|]+/u).map((item) => item.trim().slice(0, itemLength)).filter(Boolean))].slice(0, limit);
}

function renderCapture() {
  const metadata = capture.metadata;
  $("editTitle").value = metadata.title || "";
  $("editAuthors").value = metadata.authors.join("; ");
  $("editDate").value = metadata.publishedDate || "";
  $("editDoi").value = metadata.doi || "";
  $("editType").value = metadata.sourceType || "journal_article";
  $("editUrl").value = capture.pageUrl || "";
  $("editAbstract").value = metadata.abstract || "";
  $("editKeywords").value = metadata.keywords.join("; ");
  const missing = [!metadata.title && "标题", !metadata.authors.length && "作者", !metadata.publishedDate && "日期", !metadata.abstract && "摘要"].filter(Boolean);
  $("aiNotice").textContent = missing.length
    ? `提交后将使用 AI 补全：${missing.join("、")}。您填写的内容不会被覆盖。`
    : "页面元数据完整；将跳过题录 AI 抽取，仅执行标签、去重与核对。";
}

function applyEdits() {
  if (!capture) return;
  capture.pageUrl = $("editUrl").value.trim();
  capture.metadata.title = $("editTitle").value.trim();
  capture.metadata.authors = splitList($("editAuthors").value, 50, 300);
  capture.metadata.publishedDate = $("editDate").value.trim();
  capture.metadata.doi = $("editDoi").value.trim();
  capture.metadata.sourceType = $("editType").value;
  capture.metadata.abstract = $("editAbstract").value.trim();
  capture.metadata.keywords = splitList($("editKeywords").value, 30, 200);
}

async function capturePage() {
  $("captureButton").disabled = true;
  $("recaptureButton").disabled = true;
  $("captureButton").textContent = "读取中…";
  $("readStatus").textContent = "正在读取…";
  $("recaptureButton").textContent = "读取中…";
  $("errorBanner").classList.add("hidden");
  try {
    const response = await Promise.race([
      chrome.runtime.sendMessage({ type: "CAPTURE_ACTIVE_TAB" }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("读取页面超时，请刷新网页后重试。")), 12_000)),
    ]);
    if (!response?.ok) throw new Error(response?.error || "读取页面失败");
    capture = response.capture;
    renderCapture();
    $("readStatus").textContent = `已读取 ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`;
    $("emptyCapture").classList.add("hidden");
    $("successPanel").classList.add("hidden");
    $("previewPanel").classList.remove("hidden");
  } catch (error) {
    $("readStatus").textContent = "读取失败";
    showError(error instanceof Error ? error.message : String(error));
  } finally {
    $("captureButton").disabled = false;
    $("captureButton").textContent = "读取当前页面";
    $("recaptureButton").disabled = false;
    $("recaptureButton").textContent = "重新读取";
  }
}

async function submitCapture() {
  if (!capture) return;
  applyEdits();
  if (!capture.pageUrl) { showError("请填写网页链接。 "); return; }
  if (!capture.metadata.title) { showError("请填写标题，或重新读取页面。 "); return; }
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
