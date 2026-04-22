import { useEffect, useMemo, useState } from "react";
import { Bookmark, CircleHelp, Download, Flag, Plus, Trash2, Trophy, Upload, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../services/api";
import { clearStoredAuth, getStoredAuth } from "../utils/auth";

const toDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const dataUrlToBlob = (dataUrl) => {
  const [meta, base64] = dataUrl.split(",");
  const mimeMatch = /data:(.*?);base64/.exec(meta || "");
  const mime = mimeMatch?.[1] || "application/octet-stream";
  const binary = atob(base64 || "");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
};

const openDataUrl = (fileData) => {
  const blob = dataUrlToBlob(fileData);
  const objectUrl = URL.createObjectURL(blob);
  window.open(objectUrl, "_blank", "noopener,noreferrer");
  setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
};

const downloadDataUrl = (fileData, fileName) => {
  const blob = dataUrlToBlob(fileData);
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName || "document";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(objectUrl);
};

const STATUS_COLORS = {
  open: { bg: "rgba(245,128,37,0.1)", color: "#c85a0a", label: "Open" },
  in_progress: { bg: "rgba(234,179,8,0.12)", color: "#92400e", label: "In Progress" },
  received: { bg: "rgba(22,163,74,0.1)", color: "#15803d", label: "Received" },
};

const ALLOWED_HELP_DOC_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const ALLOWED_HELP_DOC_EXTENSIONS = new Set(["pdf", "docx"]);

export default function HelpDeskPage() {
  const [profile, setProfile] = useState(null);
  const [modules, setModules] = useState([]);
  const [requests, setRequests] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [trustedUsers, setTrustedUsers] = useState([]);
  const [minTrustedDocs, setMinTrustedDocs] = useState(2);
  const [draft, setDraft] = useState({ moduleId: "", message: "", priority: "medium", status: "open" });
  const [editingId, setEditingId] = useState("");
  const [uploadingId, setUploadingId] = useState("");
  const [uploadFiles, setUploadFiles] = useState({});
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeView, setActiveView] = useState("requests");
  const [filters, setFilters] = useState({ moduleId: "", status: "" });
  const [showForm, setShowForm] = useState(false);
  const [isClearMode, setIsClearMode] = useState(false);
  const [selectedRequestIds, setSelectedRequestIds] = useState([]);
  const [confirmAction, setConfirmAction] = useState(null);
  const navigate = useNavigate();
  const auth = getStoredAuth();
  const role = profile?.role || auth?.user?.role || "user";
  const isAdmin = role === "admin";

  const canSubmit = useMemo(() => draft.moduleId && draft.message.trim(), [draft.message, draft.moduleId]);
  const filteredRequests = useMemo(() => {
    return requests.filter((item) => {
      const requestModuleId = item.moduleRef?._id || item.moduleRef || "";
      if (filters.moduleId && String(requestModuleId) !== filters.moduleId) return false;
      if (filters.status && item.status !== filters.status) return false;
      return true;
    });
  }, [requests, filters]);

  const receivedRequests = useMemo(
    () => filteredRequests.filter((item) => item.status === "received"),
    [filteredRequests]
  );
  const receivedRequestIds = useMemo(
    () => receivedRequests.map((item) => item._id),
    [receivedRequests]
  );
  const bookmarkedDocKeys = useMemo(
    () =>
      new Set(
        bookmarks.map((item) => `${String(item.sourceRequestId)}:${String(item.sourceDocumentId)}`)
      ),
    [bookmarks]
  );

  const loadData = async () => {
    try {
      const [bookmarksRes, meRes, modRes, reqRes, lbRes] = await Promise.all([
        api.get("/helpdesk/bookmarks"),
        api.get("/auth/me"),
        api.get("/modules"),
        api.get("/helpdesk"),
        api.get("/helpdesk/leaderboard"),
      ]);

      setBookmarks(bookmarksRes.data || []);
      setProfile(meRes.data);
      setModules(modRes.data);
      setRequests(reqRes.data);
      setLeaderboard(lbRes.data?.leaderboard || []);
      setTrustedUsers(lbRes.data?.trustedUsers || []);
      setMinTrustedDocs(lbRes.data?.minDocs || 2);
      setDraft((prev) => ({ ...prev, moduleId: prev.moduleId || modRes.data?.[0]?._id || "" }));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load help desk");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onLogout = () => {
    clearStoredAuth();
    navigate("/");
  };

  const onDraftChange = (e) => setDraft((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const clearDraft = () => {
    setEditingId("");
    setShowForm(false);
    setDraft({ moduleId: modules[0]?._id || "", message: "", priority: "medium", status: "open" });
  };

  const exitClearMode = () => {
    setIsClearMode(false);
    setSelectedRequestIds([]);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setStatus("");

    if (isAdmin) {
      setError("Admins can view help requests but cannot submit new ones.");
      return;
    }

    if (!canSubmit) {
      setError("Module and message are required");
      return;
    }

    try {
      setSaving(true);
      if (editingId) {
        await api.put(`/helpdesk/${editingId}`, draft);
        setStatus("Request updated");
      } else {
        await api.post("/helpdesk", draft);
        setStatus("Request posted");
      }
      clearDraft();
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save request");
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (item) => {
    setShowForm(true);
    setEditingId(item._id);
    setDraft({
      moduleId: item.moduleRef?._id || item.moduleRef || "",
      message: item.message || "",
      priority: item.priority || "medium",
      status: item.status || "open",
    });
  };

  const onDelete = async (id) => {
    try {
      setError("");
      setStatus("");
      await api.delete(`/helpdesk/${id}`);
      if (editingId === id) clearDraft();
      setSelectedRequestIds((prev) => prev.filter((item) => item !== id));
      setStatus("Request deleted");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete");
    }
  };

  const onClearForMe = async (id) => {
    try {
      setError("");
      setStatus("");
      await api.post(`/helpdesk/${id}/clear`);
      setSelectedRequestIds((prev) => prev.filter((item) => item !== id));
      setStatus("Note cleared from your dashboard");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to clear note");
    }
  };

  const onToggleRequestSelection = (requestId) => {
    setSelectedRequestIds((prev) =>
      prev.includes(requestId) ? prev.filter((id) => id !== requestId) : [...prev, requestId]
    );
  };

  const onSelectAllOwnRequests = () => {
    setSelectedRequestIds(receivedRequestIds);
  };

  const onClearSelectedRequests = async () => {
    try {
      setError("");
      setStatus("");
      await Promise.all(selectedRequestIds.map((id) => api.post(`/helpdesk/${id}/clear`)));
      setConfirmAction(null);
      setStatus(`${selectedRequestIds.length} note(s) cleared`);
      exitClearMode();
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to clear selected notes");
    }
  };

  const onClearAllOwnRequests = async () => {
    try {
      setError("");
      setStatus("");
      await Promise.all(receivedRequestIds.map((id) => api.post(`/helpdesk/${id}/clear`)));
      setConfirmAction(null);
      setStatus("All received notes were cleared from your dashboard");
      exitClearMode();
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to clear received notes");
    }
  };

  const onUploadDoc = async (id) => {
    const file = uploadFiles[id];
    try {
      if (!file) {
        setError("Choose a document first");
        return;
      }
      const extension = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "";
      if (!ALLOWED_HELP_DOC_EXTENSIONS.has(extension) || !ALLOWED_HELP_DOC_MIME_TYPES.has(file.type)) {
        setError("Only PDF and DOCX files are allowed");
        return;
      }
      if (file.size > 1024 * 1024 * 2) {
        setError("Document must be less than 2MB");
        return;
      }

      setError("");
      setStatus("");
      const fileData = await toDataUrl(file);
      setUploadingId(id);
      await api.post(`/helpdesk/${id}/documents`, { fileName: file.name, fileType: file.type, fileData });
      setUploadFiles((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setStatus("Document uploaded.");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload");
    } finally {
      setUploadingId("");
    }
  };

  const onApproveDoc = async (requestId, documentId) => {
    try {
      setError("");
      setStatus("");
      await api.post(`/helpdesk/${requestId}/documents/${documentId}/approve`);
      setStatus("Document approved.");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to approve");
    }
  };

  const onBookmarkRequestDocs = async (requestItem) => {
    const bookmarkableDocs = (requestItem.documents || []).filter(
      (doc) => !bookmarkedDocKeys.has(`${String(requestItem._id)}:${String(doc._id)}`)
    );

    if (!bookmarkableDocs.length) {
      return;
    }

    try {
      setError("");
      await Promise.all(
        bookmarkableDocs.map((doc) => api.post(`/helpdesk/${requestItem._id}/documents/${doc._id}/bookmark`))
      );
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to bookmark document");
    }
  };

  const onRemoveBookmark = async (bookmarkId) => {
    try {
      setError("");
      setStatus("");
      await api.delete(`/helpdesk/bookmarks/${bookmarkId}`);
      setStatus("Bookmark removed.");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove bookmark");
    }
  };

  const tabs = [
    { key: "requests", label: "Requests", icon: <CircleHelp size={15} /> },
    { key: "bookmarks", label: "Bookmarks", icon: <Bookmark size={15} /> },
    { key: "leaderboard", label: "Leaderboard", icon: <Trophy size={15} /> },
  ];

  return (
    <div className="pp-layout">
      <Sidebar profile={profile || auth?.user} onLogout={onLogout} />
      <main className="pp-main">
        <div className="hd-header">
          <div>
            <h1 className="hd-title">Help Desk</h1>
            <p className="pp-muted">
              {isAdmin ? "View help requests, review shared documents, and support users." : "Ask for help, share resources, and support your peers."}
            </p>
          </div>
          <div className="hd-header-actions">
            {activeView === "requests" ? (
              <button
                type="button"
                className={`hd-clear-btn ${isClearMode ? "active" : ""}`}
                onClick={() => {
                  if (isClearMode) {
                    exitClearMode();
                    return;
                  }
                  setIsClearMode(true);
                }}
                disabled={!receivedRequests.length}
              >
                <Trash2 size={16} /> {isClearMode ? "Cancel Clear" : "Clear Received"}
              </button>
            ) : null}
            {!isAdmin ? (
              <button
                type="button"
                className="hd-new-btn"
                onClick={() => {
                  setShowForm(true);
                  setEditingId("");
                  setDraft({ moduleId: modules[0]?._id || "", message: "", priority: "medium", status: "open" });
                }}
              >
                <Plus size={16} /> New Request
              </button>
            ) : null}
          </div>
        </div>

        <div className="hd-tabs">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`hd-tab ${activeView === t.key ? "active" : ""}`}
              onClick={() => {
                setActiveView(t.key);
                if (t.key !== "requests") {
                  exitClearMode();
                }
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {error ? <p className="error">{error}</p> : null}
        {status ? <p className="success">{status}</p> : null}

        {showForm && !isAdmin ? (
          <div className="hd-modal-overlay">
            <div className="hd-modal">
              <div className="hd-modal-head">
                <h3>{editingId ? "Edit Request" : "New Help Request"}</h3>
                <button type="button" className="hd-modal-close" onClick={clearDraft}>
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={onSubmit} noValidate className="hd-modal-form">
                <div className="aa-field">
                  <label>Module</label>
                  <select name="moduleId" value={draft.moduleId} onChange={onDraftChange}>
                    <option value="">Select Module</option>
                    {modules.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.moduleCode} - {m.moduleName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="aa-field">
                  <label>Message</label>
                  <textarea
                    name="message"
                    value={draft.message}
                    onChange={onDraftChange}
                    placeholder="e.g. I need past papers for ITPM module"
                    rows={4}
                  />
                </div>
                <div className="aa-field">
                  <label>Priority</label>
                  <div className="hd-priority-row">
                    {["medium", "urgent"].map((p) => (
                      <button
                        key={p}
                        type="button"
                        className={`hd-priority-btn ${draft.priority === p ? `active-${p}` : ""}`}
                        onClick={() => setDraft((prev) => ({ ...prev, priority: p }))}
                      >
                        <Flag size={13} /> {p.charAt(0).toUpperCase() + p.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="hd-modal-actions">
                  <button type="button" className="hd-cancel-btn" onClick={clearDraft}>
                    Cancel
                  </button>
                  <button type="submit" className="hd-submit-btn" disabled={!canSubmit || saving}>
                    {saving ? "Saving..." : editingId ? "Update" : "Post Request"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {activeView === "requests" ? (
          <>
            <div className="aa-filter-row hd-filter-row">
              <select
                name="moduleId"
                value={filters.moduleId}
                onChange={(e) => setFilters((prev) => ({ ...prev, moduleId: e.target.value }))}
              >
                <option value="">All Modules</option>
                {modules.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.moduleCode} - {m.moduleName}
                  </option>
                ))}
              </select>
              <select
                name="status"
                value={filters.status}
                onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              >
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="received">Received</option>
              </select>
              <button type="button" className="aa-filter-reset-btn" onClick={() => setFilters({ moduleId: "", status: "" })}>
                Reset
              </button>
            </div>

            {isClearMode ? (
              <div className="hd-clear-panel">
                <div>
                  <strong>Clear Received Notes</strong>
                  <p className="pp-muted">
                    Select from any received notes, or clear all received notes from your dashboard at once.
                  </p>
                </div>
                <div className="hd-clear-actions">
                  <button
                    type="button"
                    className="hd-clear-action-btn"
                    onClick={onSelectAllOwnRequests}
                    disabled={!receivedRequestIds.length}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    className="hd-clear-action-btn hd-clear-action-danger"
                    onClick={() => setConfirmAction({ type: "selected" })}
                    disabled={!selectedRequestIds.length}
                  >
                    Clear Selected
                  </button>
                  <button
                    type="button"
                    className="hd-clear-action-btn hd-clear-action-danger"
                    onClick={() => setConfirmAction({ type: "all" })}
                    disabled={!receivedRequestIds.length}
                  >
                    Clear All
                  </button>
                </div>
              </div>
            ) : null}

            <div className="hd-requests-grid">
            {filteredRequests.length ? (
              filteredRequests.map((item) => {
                const s = STATUS_COLORS[item.status] || STATUS_COLORS.open;
                const canEdit = item.isOwner && !item.hasDocuments;
                const isSelected = selectedRequestIds.includes(item._id);
                const canClearReceived = item.status === "received";
                const canDeleteRequest = item.isOwner;
                const showSelection = isClearMode && canClearReceived;
                const allRequestDocsBookmarked =
                  canClearReceived &&
                  item.documents?.length &&
                  item.documents.every((doc) => bookmarkedDocKeys.has(`${String(item._id)}:${String(doc._id)}`));

                return (
                  <article key={item._id} className={`hd-card ${isClearMode && isSelected ? "hd-card-selected" : ""}`}>
                    <div className="hd-card-top">
                      <div className="hd-card-meta">
                        {showSelection ? (
                          <label className="hd-select-note">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => onToggleRequestSelection(item._id)}
                            />
                            <span>Select</span>
                          </label>
                        ) : null}
                        <span className="hd-module-badge">{item.moduleCode}</span>
                        <span className="hd-card-by">by {item.createdBy?.name || "Unknown"}</span>
                      </div>
                      <div className="hd-card-badges">
                        {item.status === "open" ? (
                          <span
                            className="hd-priority-chip"
                            style={{
                              background: item.priority === "urgent" ? "rgba(239,68,68,0.1)" : "rgba(245,128,37,0.1)",
                              color: item.priority === "urgent" ? "#dc2626" : "#c85a0a",
                            }}
                          >
                            <Flag size={11} /> {item.priority}
                          </span>
                        ) : null}
                        <span className="hd-status-chip" style={{ background: s.bg, color: s.color }}>
                          {s.label}
                        </span>
                        {canClearReceived && item.documents?.length ? (
                          <button
                            type="button"
                            className={`hd-doc-btn hd-bookmark-icon-btn${allRequestDocsBookmarked ? " is-saved" : ""}`}
                            disabled={allRequestDocsBookmarked}
                            title={allRequestDocsBookmarked ? "All documents bookmarked" : "Bookmark received documents"}
                            aria-label={allRequestDocsBookmarked ? "All documents bookmarked" : "Bookmark received documents"}
                            onClick={() => onBookmarkRequestDocs(item)}
                          >
                            <Bookmark size={12} />
                          </button>
                        ) : null}
                      </div>
                    </div>

                    <p className="hd-card-msg">{item.message}</p>

                    <div className="hd-card-actions">
                      {canEdit ? (
                        <button type="button" className="hd-action-edit" onClick={() => onEdit(item)}>
                          Edit
                        </button>
                      ) : null}
                      {canDeleteRequest ? (
                        <button
                          type="button"
                          className="hd-action-delete"
                          onClick={() => setConfirmAction({ type: "delete", requestId: item._id })}
                        >
                          Delete Request
                        </button>
                      ) : null}
                      {canClearReceived ? (
                        <button
                          type="button"
                          className="hd-action-delete"
                          onClick={() => setConfirmAction({ type: "single", requestId: item._id })}
                        >
                          Clear Note
                        </button>
                      ) : null}
                    </div>

                    <div className="hd-upload-row">
                      <label className="hd-file-label">
                        <Upload size={13} /> {uploadFiles[item._id] ? uploadFiles[item._id].name : "Choose file"}
                        <input
                          type="file"
                          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          style={{ display: "none" }}
                          onChange={(e) =>
                            setUploadFiles((prev) => ({ ...prev, [item._id]: e.target.files?.[0] || undefined }))
                          }
                        />
                      </label>
                      <button type="button" className="hd-upload-btn" onClick={() => onUploadDoc(item._id)}>
                        {uploadingId === item._id ? "Uploading..." : "Upload"}
                      </button>
                    </div>

                    {item.documents?.length ? (
                      <div className="hd-doc-list">
                        {item.documents.map((doc) => (
                          <div key={doc._id} className="hd-doc-row">
                            <div className="hd-doc-main">
                              <span className="hd-doc-name">{doc.fileName}</span>
                            </div>
                            <div className="hd-doc-actions">
                              <button type="button" className="hd-doc-btn" onClick={() => openDataUrl(doc.fileData)}>
                                Open
                              </button>
                              <button
                                type="button"
                                className="hd-doc-btn"
                                onClick={() => downloadDataUrl(doc.fileData, doc.fileName)}
                              >
                                <Download size={12} />
                              </button>
                              {doc.approved ? (
                                <span className="hd-approved-chip">Approved</span>
                              ) : item.isOwner && String(doc.uploadedBy?._id || doc.uploadedBy) !== String(profile?._id) ? (
                                <button
                                  type="button"
                                  className="hd-doc-btn hd-approve-btn"
                                  onClick={() => onApproveDoc(item._id, doc._id)}
                                >
                                  Approve
                                </button>
                              ) : (
                                <span className="hd-pending-chip">Pending</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </article>
                );
              })
            ) : (
              <div className="hd-empty">
                <CircleHelp size={40} />
                <p>{isAdmin ? "No help requests match this filter." : "No requests match this filter yet."}</p>
              </div>
            )}
            </div>
          </>
        ) : null}

        {activeView === "bookmarks" ? (
          <div className="hd-leaderboard">
            <div className="aa-card">
              <div className="aa-card-head">
                <div className="aa-card-icon">
                  <Bookmark size={18} />
                </div>
                <div>
                  <h3>Bookmarked Documents</h3>
                  <p className="pp-muted">Save received documents now and download them later when you need them.</p>
                </div>
              </div>

              <div className="hd-doc-list">
                {bookmarks.length ? (
                  bookmarks.map((item) => (
                    <div key={item._id} className="hd-doc-row">
                      <div className="hd-doc-main">
                        <span className="hd-doc-name">{item.title}</span>
                        <span className="pp-muted" style={{ fontSize: "0.78rem" }}>
                          {item.moduleCode} - {item.moduleName} - {item.fileName}
                        </span>
                      </div>
                      <div className="hd-doc-actions">
                        <button type="button" className="hd-doc-btn" onClick={() => openDataUrl(item.fileData)}>
                          Open
                        </button>
                        <button type="button" className="hd-doc-btn" onClick={() => downloadDataUrl(item.fileData, item.fileName)}>
                          <Download size={12} />
                        </button>
                        <button type="button" className="hd-doc-btn hd-action-delete" onClick={() => onRemoveBookmark(item._id)}>
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="pp-muted">No bookmarked documents yet.</p>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {activeView === "leaderboard" ? (
          <div className="hd-leaderboard">
            <div className="aa-card">
              <div className="aa-card-head">
                <div className="aa-card-icon">
                  <Trophy size={18} />
                </div>
                <div>
                  <h3>Most Trusted Users</h3>
                  <p className="pp-muted">Minimum {minTrustedDocs} approved documents required.</p>
                </div>
              </div>
              {trustedUsers.length ? (
                <p className="pp-muted" style={{ marginBottom: 16 }}>
                  Current trusted users: {trustedUsers.map((item) => item.name).join(", ")}
                </p>
              ) : (
                <p className="pp-muted" style={{ marginBottom: 16 }}>
                  Current trusted users: none yet.
                </p>
              )}
              <div className="hd-lb-list">
                {leaderboard.length ? (
                  leaderboard.map((item, i) => (
                    <div key={item.userId} className="hd-lb-row">
                      <span className={`hd-lb-rank ${i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : ""}`}>
                        #{i + 1}
                      </span>
                      <div className="hd-lb-avatar">
                        {(item.name || "U")
                          .split(" ")
                          .map((p) => p[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="hd-lb-info">
                        <strong>{item.name}</strong>
                        <p className="pp-muted">
                          {item.approvedDocsCount} approved docs - helped {item.helpedRequestsCount} requests
                        </p>
                      </div>
                      <span className="hd-lb-points">{item.points} pts</span>
                    </div>
                  ))
                ) : (
                  <p className="pp-muted">No trusted users yet.</p>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {confirmAction ? (
          <div className="confirm-overlay">
            <div className="confirm-modal">
              <h3 className="confirm-title">
                {confirmAction.type === "all"
                  ? "Clear All Received Notes"
                  : confirmAction.type === "selected"
                    ? "Clear Selected Notes"
                    : confirmAction.type === "delete"
                      ? "Delete Request"
                      : "Clear Note"}
              </h3>
              <p className="confirm-msg">
                {confirmAction.type === "all"
                  ? "This will clear all received notes from your dashboard only."
                  : confirmAction.type === "selected"
                    ? `This will clear ${selectedRequestIds.length} selected received note(s) from your dashboard only.`
                    : confirmAction.type === "delete"
                      ? "This will permanently delete the request you posted."
                      : "This received note will be cleared from your dashboard only."}
              </p>
              <div className="confirm-actions">
                <button type="button" className="confirm-cancel" onClick={() => setConfirmAction(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="confirm-delete"
                  onClick={() => {
                    if (confirmAction.type === "all") {
                      onClearAllOwnRequests();
                      return;
                    }
                    if (confirmAction.type === "selected") {
                      onClearSelectedRequests();
                      return;
                    }
                    if (confirmAction.type === "delete") {
                      onDelete(confirmAction.requestId);
                      setConfirmAction(null);
                      return;
                    }
                    onClearForMe(confirmAction.requestId);
                    setConfirmAction(null);
                  }}
                >
                  {confirmAction.type === "delete" ? "Delete Request" : "Clear"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
