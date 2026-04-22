const HelpRequest = require("../models/HelpRequest");
const Module = require("../models/Module");
const User = require("../models/User");

const ALLOWED_HELP_DOC_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const ALLOWED_HELP_DOC_EXTENSIONS = new Set(["pdf", "docx"]);

const buildHelpBookmarkTitle = ({ moduleCode, fileName, bookmarkedAt }) => {
  const baseName = typeof fileName === "string" ? fileName.replace(/\.[^/.]+$/, "").trim() : "Document";
  const stamp = new Date(bookmarkedAt).toISOString().slice(0, 10);
  return `${moduleCode || "Module"} - ${baseName} - ${stamp}`;
};

const toResponse = (doc, currentUserId) => {
  const plain = doc.toObject ? doc.toObject() : doc;
  const ownerId = plain.createdBy?._id ? String(plain.createdBy._id) : String(plain.createdBy);
  const safeDocuments = Array.isArray(plain.documents)
    ? plain.documents.map((item) => ({
        _id: item._id,
        fileName: item.fileName,
        fileType: item.fileType,
        fileData: item.fileData,
        uploadedBy: item.uploadedBy,
        uploadedAt: item.uploadedAt,
        approved: !!item.approved,
        approvedBy: item.approvedBy || null,
        approvedAt: item.approvedAt || null,
      }))
    : [];
  return {
    ...plain,
    documents: safeDocuments,
    isOwner: ownerId === String(currentUserId),
    hasDocuments: safeDocuments.length > 0,
  };
};

const createHelpRequest = async (req, res) => {
  try {
    const { moduleId, message, priority, status } = req.body;
    const normalizedMessage = typeof message === "string" ? message.trim() : "";
    const normalizedPriority = priority === "urgent" ? "urgent" : "medium";
    const normalizedStatus = ["open", "in_progress", "received"].includes(status) ? status : "open";

    if (!moduleId || !normalizedMessage) {
      return res.status(400).json({ message: "moduleId and message are required" });
    }

    const moduleItem = await Module.findById(moduleId).select("moduleCode moduleName");
    if (!moduleItem) {
      return res.status(404).json({ message: "Module not found" });
    }

    const created = await HelpRequest.create({
      moduleRef: moduleItem._id,
      moduleCode: moduleItem.moduleCode,
      moduleName: moduleItem.moduleName,
      message: normalizedMessage,
      priority: normalizedPriority,
      status: normalizedStatus,
      createdBy: req.user.userId,
    });

    return res.status(201).json({ message: "Help request created", request: created });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create help request", error: error.message });
  }
};

const listHelpRequests = async (req, res) => {
  try {
    const requests = await HelpRequest.find({
      hiddenFor: { $ne: req.user.userId },
    })
      .populate("createdBy", "name email")
      .populate("documents.uploadedBy", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json(requests.map((item) => toResponse(item, req.user.userId)));
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch help requests", error: error.message });
  }
};

const listMyHelpRequests = async (req, res) => {
  try {
    const requests = await HelpRequest.find({
      createdBy: req.user.userId,
      hiddenFor: { $ne: req.user.userId },
    })
      .populate("createdBy", "name email")
      .populate("documents.uploadedBy", "name")
      .sort({ createdAt: -1 });
    return res.status(200).json(requests.map((item) => toResponse(item, req.user.userId)));
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch your help requests", error: error.message });
  }
};

const updateHelpRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await HelpRequest.findById(id);
    if (!existing) return res.status(404).json({ message: "Help request not found" });

    if (String(existing.createdBy) !== String(req.user.userId)) {
      return res.status(403).json({ message: "Only the request owner can edit this request" });
    }
    if (existing.documents.length > 0) {
      return res.status(400).json({ message: "Cannot edit request after documents are submitted" });
    }

    const { moduleId, message, priority, status } = req.body;
    const updates = {};

    if (moduleId) {
      const moduleItem = await Module.findById(moduleId).select("moduleCode moduleName");
      if (!moduleItem) return res.status(404).json({ message: "Module not found" });
      updates.moduleRef = moduleItem._id;
      updates.moduleCode = moduleItem.moduleCode;
      updates.moduleName = moduleItem.moduleName;
    }
    if (typeof message === "string" && message.trim()) {
      updates.message = message.trim();
    }
    if (["urgent", "medium"].includes(priority)) {
      updates.priority = priority;
    }
    if (["open", "in_progress", "received"].includes(status)) {
      updates.status = status;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields provided for update" });
    }

    const updated = await HelpRequest.findByIdAndUpdate(id, updates, { new: true })
      .populate("createdBy", "name email")
      .populate("documents.uploadedBy", "name");

    return res.status(200).json({ message: "Help request updated", request: toResponse(updated, req.user.userId) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update help request", error: error.message });
  }
};

const deleteHelpRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await HelpRequest.findById(id);
    if (!existing) return res.status(404).json({ message: "Help request not found" });

    const canDelete = String(existing.createdBy) === String(req.user.userId) || req.user.role === "admin";
    if (!canDelete) {
      return res.status(403).json({ message: "Only owner or admin can delete this request" });
    }

    await HelpRequest.findByIdAndDelete(id);
    return res.status(200).json({ message: "Help request deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete help request", error: error.message });
  }
};

const clearHelpRequestForMe = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await HelpRequest.findById(id);
    if (!existing) return res.status(404).json({ message: "Help request not found" });
    if (existing.status !== "received") {
      return res.status(400).json({ message: "Only received notes can be cleared from your dashboard" });
    }

    await HelpRequest.findByIdAndUpdate(id, {
      $addToSet: { hiddenFor: req.user.userId },
    });

    return res.status(200).json({ message: "Help request cleared from your dashboard" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to clear help request", error: error.message });
  }
};

const uploadHelpDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { fileName, fileType, fileData } = req.body;
    const normalizedName = typeof fileName === "string" ? fileName.trim() : "";
    const normalizedType = typeof fileType === "string" ? fileType.trim() : "";
    const normalizedData = typeof fileData === "string" ? fileData : "";
    const extension = normalizedName.includes(".") ? normalizedName.split(".").pop().toLowerCase() : "";

    if (!normalizedName || !normalizedData) {
      return res.status(400).json({ message: "fileName and fileData are required" });
    }
    if (!ALLOWED_HELP_DOC_EXTENSIONS.has(extension) || !ALLOWED_HELP_DOC_MIME_TYPES.has(normalizedType)) {
      return res.status(400).json({ message: "Only PDF and DOCX files are allowed" });
    }
    if (normalizedData.length > 2_000_000) {
      return res.status(400).json({ message: "Document is too large" });
    }

    const request = await HelpRequest.findById(id);
    if (!request) return res.status(404).json({ message: "Help request not found" });

    request.documents.push({
      fileName: normalizedName,
      fileType: normalizedType,
      fileData: normalizedData,
      uploadedBy: req.user.userId,
      approved: false,
      approvedBy: null,
      approvedAt: null,
    });
    request.status = "received";
    await request.save();

    const populated = await HelpRequest.findById(id)
      .populate("createdBy", "name email")
      .populate("documents.uploadedBy", "name");

    return res.status(200).json({
      message: "Document uploaded. Request marked as received.",
      request: toResponse(populated, req.user.userId),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to upload document", error: error.message });
  }
};

const listBookmarkedHelpDocuments = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("bookmarkedHelpDocs");
    if (!user) return res.status(404).json({ message: "User not found" });

    const bookmarks = [...(user.bookmarkedHelpDocs || [])]
      .sort((a, b) => new Date(b.bookmarkedAt).getTime() - new Date(a.bookmarkedAt).getTime())
      .map((item) => ({
        _id: item._id,
        sourceRequestId: item.sourceRequestId,
        sourceDocumentId: item.sourceDocumentId,
        title: item.title,
        moduleCode: item.moduleCode,
        moduleName: item.moduleName,
        fileName: item.fileName,
        fileType: item.fileType,
        fileData: item.fileData,
        bookmarkedAt: item.bookmarkedAt,
      }));

    return res.status(200).json(bookmarks);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch bookmarked documents", error: error.message });
  }
};

const bookmarkHelpDocument = async (req, res) => {
  try {
    const { id, documentId } = req.params;
    const request = await HelpRequest.findById(id);
    if (!request) return res.status(404).json({ message: "Help request not found" });
    if (request.status !== "received") {
      return res.status(400).json({ message: "Only received documents can be bookmarked" });
    }
    if (request.hiddenFor.some((userId) => String(userId) === String(req.user.userId))) {
      return res.status(403).json({ message: "This help request is hidden from your dashboard" });
    }

    const targetDoc = request.documents.id(documentId);
    if (!targetDoc) return res.status(404).json({ message: "Document not found" });

    const user = await User.findById(req.user.userId).select("bookmarkedHelpDocs");
    if (!user) return res.status(404).json({ message: "User not found" });

    const existing = user.bookmarkedHelpDocs.find(
      (item) => String(item.sourceDocumentId) === String(documentId) && String(item.sourceRequestId) === String(id)
    );
    if (existing) {
      return res.status(409).json({ message: "Document already bookmarked", bookmark: existing });
    }

    const bookmarkedAt = new Date();
    const bookmark = {
      sourceRequestId: request._id,
      sourceDocumentId: targetDoc._id,
      title: buildHelpBookmarkTitle({
        moduleCode: request.moduleCode,
        fileName: targetDoc.fileName,
        bookmarkedAt,
      }),
      moduleCode: request.moduleCode,
      moduleName: request.moduleName,
      fileName: targetDoc.fileName,
      fileType: targetDoc.fileType,
      fileData: targetDoc.fileData,
      bookmarkedAt,
    };

    user.bookmarkedHelpDocs.push(bookmark);
    await user.save();

    const savedBookmark = user.bookmarkedHelpDocs[user.bookmarkedHelpDocs.length - 1];

    return res.status(201).json({
      message: "Document bookmarked",
      bookmark: {
        _id: savedBookmark._id,
        sourceRequestId: savedBookmark.sourceRequestId,
        sourceDocumentId: savedBookmark.sourceDocumentId,
        title: savedBookmark.title,
        moduleCode: savedBookmark.moduleCode,
        moduleName: savedBookmark.moduleName,
        fileName: savedBookmark.fileName,
        fileType: savedBookmark.fileType,
        fileData: savedBookmark.fileData,
        bookmarkedAt: savedBookmark.bookmarkedAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to bookmark document", error: error.message });
  }
};

const removeBookmarkedHelpDocument = async (req, res) => {
  try {
    const { bookmarkId } = req.params;
    const user = await User.findById(req.user.userId).select("bookmarkedHelpDocs");
    if (!user) return res.status(404).json({ message: "User not found" });

    const existing = user.bookmarkedHelpDocs.id(bookmarkId);
    if (!existing) return res.status(404).json({ message: "Bookmark not found" });

    existing.deleteOne();
    await user.save();

    return res.status(200).json({ message: "Bookmark removed" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to remove bookmark", error: error.message });
  }
};

const approveHelpDocument = async (req, res) => {
  try {
    const { id, documentId } = req.params;
    const request = await HelpRequest.findById(id);
    if (!request) return res.status(404).json({ message: "Help request not found" });

    const isOwner = String(request.createdBy) === String(req.user.userId);
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Only request owner or admin can approve documents" });
    }

    const targetDoc = request.documents.id(documentId);
    if (!targetDoc) return res.status(404).json({ message: "Document not found" });

    if (String(targetDoc.uploadedBy) === String(req.user.userId)) {
      return res.status(400).json({ message: "Uploader cannot approve their own document" });
    }

    targetDoc.approved = true;
    targetDoc.approvedBy = req.user.userId;
    targetDoc.approvedAt = new Date();
    request.status = "received";
    await request.save();

    const populated = await HelpRequest.findById(id)
      .populate("createdBy", "name email")
      .populate("documents.uploadedBy", "name")
      .populate("documents.approvedBy", "name");

    return res.status(200).json({
      message: "Document approved successfully",
      request: toResponse(populated, req.user.userId),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to approve document", error: error.message });
  }
};

const getLeaderboard = async (req, res) => {
  try {
    const minDocs = Number(req.query.minDocs) || 2;

    const leaderboard = await HelpRequest.aggregate([
      { $unwind: "$documents" },
      {
        $match: {
          "documents.approved": true,
        },
      },
      {
        $match: {
          $expr: { $ne: ["$documents.uploadedBy", "$createdBy"] },
        },
      },
      {
        $group: {
          _id: "$documents.uploadedBy",
          approvedDocsCount: { $sum: 1 },
          helpedRequestsCount: { $addToSet: "$_id" },
          lastApprovedAt: { $max: "$documents.approvedAt" },
        },
      },
      {
        $project: {
          approvedDocsCount: 1,
          helpedRequestsCount: { $size: "$helpedRequestsCount" },
          lastApprovedAt: 1,
          points: { $multiply: ["$approvedDocsCount", 10] },
        },
      },
      {
        $match: {
          approvedDocsCount: { $gte: minDocs },
        },
      },
      {
        $lookup: {
          from: "User",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          userId: "$_id",
          name: "$user.name",
          email: "$user.email",
          avatar: "$user.avatar",
          approvedDocsCount: 1,
          helpedRequestsCount: 1,
          points: 1,
          lastApprovedAt: 1,
        },
      },
      { $sort: { points: -1, approvedDocsCount: -1, lastApprovedAt: -1 } },
      { $limit: 20 },
    ]);

    return res.status(200).json({
      minDocs,
      leaderboard,
      trustedUsers: leaderboard.map((item) => ({
        userId: item.userId,
        name: item.name,
        approvedDocsCount: item.approvedDocsCount,
      })),
      trustedUsersCount: leaderboard.length,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch leaderboard", error: error.message });
  }
};

module.exports = {
  createHelpRequest,
  listHelpRequests,
  listMyHelpRequests,
  updateHelpRequest,
  deleteHelpRequest,
  clearHelpRequestForMe,
  uploadHelpDocument,
  listBookmarkedHelpDocuments,
  bookmarkHelpDocument,
  removeBookmarkedHelpDocument,
  approveHelpDocument,
  getLeaderboard,
};
