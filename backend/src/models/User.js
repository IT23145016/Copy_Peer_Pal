const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      immutable: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    academicYear: {
      type: Number,
      min: 1,
      max: 6,
      default: null,
    },
    semester: {
      type: Number,
      min: 1,
      max: 2,
      default: null,
    },
    batch: {
      type: String,
      trim: true,
      default: "",
    },
    avatar: {
      type: String,
      default: "",
    },
    isBatchTop: {
      type: Boolean,
      default: false,
    },
    isTalented: {
      type: Boolean,
      default: false,
    },
    moduleSpecialization: {
      type: String,
      trim: true,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    bookmarkedHelpDocs: [
      {
        sourceRequestId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "HelpRequest",
          required: true,
        },
        sourceDocumentId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        title: {
          type: String,
          required: true,
          trim: true,
        },
        moduleCode: {
          type: String,
          default: "",
          trim: true,
        },
        moduleName: {
          type: String,
          default: "",
          trim: true,
        },
        fileName: {
          type: String,
          required: true,
          trim: true,
        },
        fileType: {
          type: String,
          default: "",
          trim: true,
        },
        fileData: {
          type: String,
          required: true,
        },
        bookmarkedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    collection: "User",
  }
);

userSchema.index({ role: 1, academicYear: 1, semester: 1, batch: 1, isBatchTop: 1 });

module.exports = mongoose.model("User", userSchema);
