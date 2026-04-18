const CalendarEvent = require("../models/CalendarEvent");
const Assignment = require("../models/Assignment");
const Module = require("../models/Module");
const ProposedSession = require("../models/ProposedSession");
const StudySession = require("../models/StudySession");
const User = require("../models/User");
const { getSriLankaHolidayEvents } = require("../data/sriLankaHolidays");

const toDateOnly = (value) => {
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "";
  const year = dt.getFullYear();
  const month = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toTime12 = (value) => {
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "11:59 PM";
  return dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
};

const parseClockTime = (value) => {
  if (typeof value !== "string") return null;
  const text = value.trim().toUpperCase();
  if (!text) return null;

  const ampmMatch = text.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (ampmMatch) {
    let hour = Number(ampmMatch[1]);
    const minute = Number(ampmMatch[2]);
    const meridiem = ampmMatch[3];
    if (hour === 12) hour = 0;
    if (meridiem === "PM") hour += 12;
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) return hour * 60 + minute;
    return null;
  }

  const twentyFourMatch = text.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFourMatch) {
    const hour = Number(twentyFourMatch[1]);
    const minute = Number(twentyFourMatch[2]);
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) return hour * 60 + minute;
  }
  return null;
};

const toDateTime = (date, time) => {
  const minutes = parseClockTime(time);
  if (minutes === null) return null;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const hh = String(hours).padStart(2, "0");
  const mm = String(mins).padStart(2, "0");
  return new Date(`${date}T${hh}:${mm}:00`);
};

const normalizeText = (value) => (typeof value === "string" ? value.trim() : "");

const getCampusScopeLabel = (scopeType, scopeValue) => {
  if (scopeType === "semester" && scopeValue) return `Semester ${scopeValue}`;
  if (scopeType === "year" && scopeValue) return `Year ${scopeValue}`;
  return "All Students";
};

const isCampusEventVisibleToUser = (event, user) => {
  if (!event) return false;
  if (event.audienceScopeType === "all" || !event.audienceScopeType) return true;
  if (event.audienceScopeType === "year") {
    return String(user?.academicYear || "") === String(event.audienceScopeValue || "");
  }
  if (event.audienceScopeType === "semester") {
    return String(user?.semester || "") === String(event.audienceScopeValue || "");
  }
  return false;
};

const sortByDateTime = (items) =>
  items.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return (a.sortTime || a.time || "00:00").localeCompare(b.sortTime || b.time || "00:00");
  });

const getMostActiveDay = (items) => {
  const counts = Array(7).fill(0);
  items.forEach((item) => {
    const dt = new Date(`${item.date}T00:00:00`);
    if (!Number.isNaN(dt.getTime())) counts[dt.getDay()] += 1;
  });

  const labels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  let topIndex = 0;
  for (let i = 1; i < counts.length; i += 1) {
    if (counts[i] > counts[topIndex]) topIndex = i;
  }

  if (counts[topIndex] === 0) return { day: "N/A", count: 0 };
  return { day: labels[topIndex], count: counts[topIndex] };
};

const getWeekRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: toDateOnly(start), end: toDateOnly(end) };
};

const buildBatchContext = async (batch) => {
  if (!batch) return { batchUsers: [], academicPairs: [], userIds: [] };
  const batchUsers = await User.find({
    role: "user",
    batch,
    isActive: { $ne: false },
  })
    .select("_id academicYear semester batch")
    .lean();

  const userIds = batchUsers.map((user) => user._id);
  const academicPairs = Array.from(
    new Set(
      batchUsers
        .filter((user) => user.academicYear && user.semester)
        .map((user) => `${user.academicYear}-${user.semester}`)
    )
  );

  return { batchUsers, academicPairs, userIds };
};

const buildBatchFilterFromPairs = (academicPairs) => {
  if (!academicPairs.length) return { _id: null };
  return {
    $or: academicPairs.map((pair) => {
      const [academicYear, semester] = pair.split("-");
      return {
        academicYear: Number(academicYear),
        semester: Number(semester),
      };
    }),
  };
};

const buildCalendarOverview = async (req) => {
  const batch = normalizeText(req.query.batch);
  const requestedEventType = normalizeText(req.query.eventType) || "all";
  const allowedEventTypes = new Set(["all", "assignment", "study_room", "timetable", "holiday", "campus"]);
  const eventType = allowedEventTypes.has(requestedEventType) ? requestedEventType : "all";
  const from = normalizeText(req.query.from);
  const to = normalizeText(req.query.to);
  const { batchUsers, academicPairs, userIds } = await buildBatchContext(batch);
  const weekRange = getWeekRange();

  const batchOptions = await User.distinct("batch", {
    role: "user",
    batch: { $nin: ["", null] },
  }).then((items) => items.filter(Boolean).sort((a, b) => a.localeCompare(b)));

  const wantsAssignments = eventType === "all" || eventType === "assignment";
  const wantsStudyRooms = eventType === "all" || eventType === "study_room";
  const wantsTimetable = eventType === "all" || eventType === "timetable";
  const wantsHolidays = eventType === "all" || eventType === "holiday";
  const wantsCampus = eventType === "all" || eventType === "campus";

  const assignmentFilter = {};
  if (batch) Object.assign(assignmentFilter, buildBatchFilterFromPairs(academicPairs));
  if (from || to) {
    assignmentFilter.deadline = {};
    if (from) assignmentFilter.deadline.$gte = new Date(`${from}T00:00:00.000Z`);
    if (to) assignmentFilter.deadline.$lte = new Date(`${to}T23:59:59.999Z`);
  }

  const studyCreatedFilter = {};
  if (batch && userIds.length) {
    studyCreatedFilter.createdBy = { $in: userIds };
  } else if (batch) {
    studyCreatedFilter._id = null;
  }
  studyCreatedFilter.linkedStudySession = null;
  if (from || to) {
    studyCreatedFilter.date = {};
    if (from) studyCreatedFilter.date.$gte = from;
    if (to) studyCreatedFilter.date.$lte = to;
  }

  const studySessionFilter = {};
  if (batch && userIds.length) {
    studySessionFilter.$or = [{ initiatedBy: { $in: userIds } }, { participants: { $in: userIds } }];
  } else if (batch) {
    studySessionFilter._id = null;
  }
  if (from || to) {
    studySessionFilter.date = {};
    if (from) studySessionFilter.date.$gte = from;
    if (to) studySessionFilter.date.$lte = to;
  }

  const timetableFilter = {};
  if (batch && userIds.length) {
    timetableFilter.userId = { $in: userIds };
  } else if (batch) {
    timetableFilter._id = null;
  }
  timetableFilter.type = { $ne: "campus" };
  if (from || to) {
    timetableFilter.date = {};
    if (from) timetableFilter.date.$gte = from;
    if (to) timetableFilter.date.$lte = to;
  }

  const [assignments, studyCreatedSessions, studySessions, timetableEvents, campusEvents] = await Promise.all([
    wantsAssignments ? Assignment.find(assignmentFilter).sort({ deadline: 1, createdAt: -1 }).lean() : Promise.resolve([]),
    wantsStudyRooms ? ProposedSession.find(studyCreatedFilter).sort({ date: 1, startTime: 1, createdAt: -1 }).lean() : Promise.resolve([]),
    wantsStudyRooms ? StudySession.find(studySessionFilter).sort({ date: 1, startTime: 1, createdAt: -1 }).lean() : Promise.resolve([]),
    wantsTimetable ? CalendarEvent.find(timetableFilter).sort({ date: 1, time: 1, createdAt: -1 }).lean() : Promise.resolve([]),
    wantsCampus ? CalendarEvent.find({ type: "campus", ...(from || to ? { date: { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) } } : {}) }).sort({ date: 1, time: 1, createdAt: -1 }).lean() : Promise.resolve([]),
  ]);

  const holidayEvents = wantsHolidays ? getSriLankaHolidayEvents({ from, to }) : [];

  const events = [
    ...assignments.map((item) => ({
      id: String(item._id),
      title: item.assignmentName,
      group: "assignment",
      type: "assignment",
      date: toDateOnly(item.deadline),
      time: toTime12(item.deadline),
      sortTime: toTime12(item.deadline),
      sourceLabel: "Assignment Module",
      sourceType: "assignment_module",
      moduleCode: item.moduleCode,
      moduleName: item.moduleName,
      academicYear: item.academicYear,
      semester: item.semester,
      participantsCount: 0,
      deletable: false,
    })),
    ...studyCreatedSessions.map((item) => ({
      id: String(item._id),
      title: `${item.moduleCode} Study Room`,
      group: "study_room",
      type: "study",
      date: item.date,
      time: item.startTime,
      endTime: item.endTime,
      sortTime: item.startTime,
      sourceLabel: "Calendar",
      sourceType: "calendar",
      moduleCode: item.moduleCode,
      moduleName: item.moduleName,
      participantsCount: 0,
      deletable: true,
      deleteRef: { kind: "proposed", id: String(item._id) },
      status: item.status,
      description: item.description,
    })),
    ...studySessions.map((item) => ({
      id: String(item._id),
      title: `${item.moduleCode} Study Session`,
      group: "study_room",
      type: "study",
      date: item.date,
      time: item.startTime,
      endTime: item.endTime,
      sortTime: item.startTime,
      sourceLabel: "Study Room Module",
      sourceType: "study_room_module",
      moduleCode: item.moduleCode,
      moduleName: item.moduleName,
      participantsCount: Array.isArray(item.participants) ? item.participants.length : 0,
      deletable: true,
      deleteRef: { kind: "study", id: String(item._id) },
      meetingLink: item.meetingLink,
    })),
    ...timetableEvents.map((item) => ({
      id: String(item._id),
      title: item.title,
      group: "timetable",
      type: "personal",
      date: item.date,
      time: item.time,
      endTime: item.endTime || "",
      sortTime: item.time,
      sourceLabel: "Calendar",
      sourceType: "calendar",
      venue: item.venue,
      notes: item.notes,
      participantsCount: 0,
      deletable: false,
    })),
    ...campusEvents.map((item) => ({
      id: String(item._id),
      title: item.title,
      group: "campus",
      type: "campus",
      date: item.date,
      time: item.time,
      endTime: item.endTime || "",
      sortTime: item.time,
      sourceLabel: "Campus Events",
      sourceType: "campus_event",
      venue: item.venue,
      notes: item.notes,
      audienceScopeType: item.audienceScopeType || "all",
      audienceScopeValue: item.audienceScopeValue || "",
      scopeLabel: getCampusScopeLabel(item.audienceScopeType || "all", item.audienceScopeValue || ""),
      participantsCount: 0,
      deletable: false,
    })),
    ...holidayEvents,
  ];

  const sortedEvents = sortByDateTime(events);
  const totalEvents = sortedEvents.length;
  const eventsThisWeek = sortedEvents.filter((item) => item.date >= weekRange.start && item.date <= weekRange.end).length;
  const mostActiveDay = getMostActiveDay(sortedEvents);
  const typeCounts = sortedEvents.reduce(
    (acc, item) => {
      acc[item.group] = (acc[item.group] || 0) + 1;
      return acc;
    },
    { assignment: 0, study_room: 0, timetable: 0, holiday: 0, campus: 0 }
  );

  return {
    filters: { batch, eventType, from, to },
    batchOptions,
    summary: {
      totalAssignments: typeCounts.assignment,
      totalStudySessions: typeCounts.study_room,
      totalTimetableEvents: typeCounts.timetable,
      totalHolidayEvents: typeCounts.holiday,
      totalCampusEvents: typeCounts.campus,
      totalEvents,
      eventsThisWeek,
      mostActiveDay,
      weekRange,
    },
    events: sortedEvents,
    batchUsers,
  };
};

const getCalendarAdminOverview = async (req, res) => {
  try {
    const overview = await buildCalendarOverview(req);
    return res.status(200).json(overview);
  } catch (error) {
    return res.status(500).json({ message: "Failed to load admin calendar overview", error: error.message });
  }
};

const deleteAdminStudyRoomEvent = async (req, res) => {
  try {
    const { source, id } = req.params;
    if (!["proposed", "study"].includes(source)) {
      return res.status(400).json({ message: "source must be proposed or study" });
    }

    if (source === "proposed") {
      const proposed = await ProposedSession.findById(id);
      if (!proposed) return res.status(404).json({ message: "Study room session not found" });
      await ProposedSession.deleteOne({ _id: id });
      return res.status(200).json({ message: "Study room session deleted", deletedId: id, source });
    }

    const session = await StudySession.findById(id);
    if (!session) return res.status(404).json({ message: "Study room session not found" });

    await Promise.all([
      StudySession.deleteOne({ _id: id }),
      ProposedSession.updateMany({ linkedStudySession: id }, { $set: { linkedStudySession: null } }),
    ]);

    return res.status(200).json({ message: "Study room session deleted", deletedId: id, source });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete study room session", error: error.message });
  }
};

const listCalendarEvents = async (req, res) => {
  try {
    const from = typeof req.query.from === "string" ? req.query.from.trim() : "";
    const to = typeof req.query.to === "string" ? req.query.to.trim() : "";
    const filter = { userId: req.user.userId };

    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to) filter.date.$lte = to;
    }

    const manualEvents = await CalendarEvent.find({ ...filter, type: { $ne: "campus" } }).sort({ date: 1, time: 1, createdAt: -1 });

    let assignmentFilter = {};
    if (req.user.role !== "admin") {
      const user = await User.findById(req.user.userId).select("academicYear semester");
      if (!user?.academicYear || !user?.semester) {
        assignmentFilter = { _id: null };
      } else {
        assignmentFilter = { academicYear: user.academicYear, semester: user.semester };
      }
    }

    if (from || to) {
      assignmentFilter.deadline = {};
      if (from) assignmentFilter.deadline.$gte = new Date(`${from}T00:00:00.000Z`);
      if (to) assignmentFilter.deadline.$lte = new Date(`${to}T23:59:59.999Z`);
    }

    const assignments = await Assignment.find(assignmentFilter).sort({ deadline: 1, createdAt: -1 });
    const assignmentEvents = assignments.map((item) => ({
      _id: `assignment-${item._id}`,
      userId: req.user.userId,
      title: item.assignmentName,
      type: "assignment",
      date: toDateOnly(item.deadline),
      time: toTime12(item.deadline),
      source: "assignment_deadline",
      assignmentId: item._id,
      moduleCode: item.moduleCode,
      moduleName: item.moduleName,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    const proposedFilter = {};
    if (from || to) {
      proposedFilter.date = {};
      if (from) proposedFilter.date.$gte = from;
      if (to) proposedFilter.date.$lte = to;
    }

    const proposedSessions = await ProposedSession.find(proposedFilter).sort({ date: 1, startTime: 1, createdAt: -1 });
    const proposedSessionEvents = proposedSessions.map((item) => ({
      _id: `proposed-${item._id}`,
      userId: req.user.userId,
      title: `${item.moduleCode} Proposed Session`,
      type: "study",
      date: item.date,
      time: item.startTime,
      endTime: item.endTime,
      source: "proposed_session",
      proposedSessionId: item._id,
      moduleCode: item.moduleCode,
      moduleName: item.moduleName,
      description: item.description,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    const holidayEvents = getSriLankaHolidayEvents({ from, to });
    const campusEvents = await CalendarEvent.find({
      type: "campus",
      ...(from || to ? { date: { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) } } : {}),
    }).sort({ date: 1, time: 1, createdAt: -1 });

    const merged = [
      ...manualEvents.map((item) => ({ ...item.toObject(), source: "manual" })),
      ...assignmentEvents,
      ...proposedSessionEvents,
      ...holidayEvents,
      ...campusEvents.map((item) => ({
        id: String(item._id),
        title: item.title,
        group: "campus",
        type: "campus",
        date: item.date,
        time: item.time,
        endTime: item.endTime || "",
        sortTime: item.time,
        source: "campus_event",
        sourceLabel: "Campus Events",
        audienceScopeType: item.audienceScopeType || "all",
        audienceScopeValue: item.audienceScopeValue || "",
        scopeLabel: getCampusScopeLabel(item.audienceScopeType || "all", item.audienceScopeValue || ""),
        venue: item.venue,
        notes: item.notes,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
    ].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return (a.sortTime || a.time || "00:00").localeCompare(b.sortTime || b.time || "00:00");
    });

    const user = req.user.role === "admin" ? null : await User.findById(req.user.userId).select("academicYear semester").lean();
    const visible = req.user.role === "admin"
      ? merged
      : merged.filter((item) => item.group !== "campus" || isCampusEventVisibleToUser(item, user));

    return res.status(200).json(visible);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch calendar events", error: error.message });
  }
};

const createCalendarEvent = async (req, res) => {
  try {
    const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
    const type = typeof req.body.type === "string" ? req.body.type.trim() : "";
    const date = typeof req.body.date === "string" ? req.body.date.trim() : "";
    const time = typeof req.body.time === "string" ? req.body.time.trim() : "";
    const endTime = typeof req.body.endTime === "string" ? req.body.endTime.trim() : "";
    const venue = typeof req.body.venue === "string" ? req.body.venue.trim() : "";
    const notes = typeof req.body.notes === "string" ? req.body.notes.trim() : "";
    const moduleId = typeof req.body.moduleId === "string" ? req.body.moduleId.trim() : "";
    const scopeType = typeof req.body.scopeType === "string" ? req.body.scopeType.trim() : "all";
    const scopeValue = typeof req.body.scopeValue === "string" ? req.body.scopeValue.trim() : "";

    if (!title || !date || !time) {
      return res.status(400).json({ message: "title, date and time are required" });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: "date must be in YYYY-MM-DD format" });
    }
    if (type && !["personal", "study", "assignment", "campus"].includes(type)) {
      return res.status(400).json({ message: "type must be personal, study, assignment or campus" });
    }
    const startMinutes = parseClockTime(time);
    if (startMinutes === null) {
      return res.status(400).json({ message: "time must be a valid time" });
    }
    if (endTime) {
      const endMinutes = parseClockTime(endTime);
      if (endMinutes === null) {
        return res.status(400).json({ message: "endTime must be a valid time" });
      }
      if (endMinutes <= startMinutes) {
        return res.status(400).json({ message: "endTime must be after time" });
      }
    }

    const normalizedType = type || "study";

    if (normalizedType === "campus") {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Only admins can create campus events" });
      }
      if (!["all", "semester", "year"].includes(scopeType)) {
        return res.status(400).json({ message: "scopeType must be all, semester or year" });
      }
      if (scopeType !== "all") {
        if (!scopeValue) {
          return res.status(400).json({ message: "scopeValue is required for semester or year campus events" });
        }
        const numericScope = Number(scopeValue);
        if (!Number.isInteger(numericScope)) {
          return res.status(400).json({ message: "scopeValue must be a whole number" });
        }
        if (scopeType === "semester" && !(numericScope >= 1 && numericScope <= 2)) {
          return res.status(400).json({ message: "semester scopeValue must be 1 or 2" });
        }
        if (scopeType === "year" && !(numericScope >= 1 && numericScope <= 6)) {
          return res.status(400).json({ message: "year scopeValue must be between 1 and 6" });
        }
      }

      const created = await CalendarEvent.create({
        userId: req.user.userId,
        title,
        type: "campus",
        date,
        time,
        endTime,
        venue,
        notes,
        audienceScopeType: scopeType,
        audienceScopeValue: scopeType === "all" ? "" : scopeValue,
      });

      return res.status(201).json({ message: "Campus event created", event: created, targetTable: "CalendarEvent" });
    }

    if (normalizedType === "assignment") {
      if (!moduleId) return res.status(400).json({ message: "moduleId is required for assignment entries" });
      const moduleItem = await Module.findById(moduleId);
      if (!moduleItem) return res.status(404).json({ message: "Module not found" });

      const publishedDate = new Date();
      const deadline = toDateTime(date, endTime || time);
      if (!deadline || Number.isNaN(deadline.getTime())) {
        return res.status(400).json({ message: "Invalid deadline date/time" });
      }
      if (deadline < publishedDate) {
        return res.status(400).json({ message: "Deadline must be in the future" });
      }

      const created = await Assignment.create({
        moduleRef: moduleItem._id,
        moduleCode: moduleItem.moduleCode,
        moduleName: moduleItem.moduleName,
        assignmentName: title,
        publishedDate,
        deadline,
        academicYear: moduleItem.academicYear,
        semester: moduleItem.semester,
        createdBy: req.user.userId,
      });
      return res.status(201).json({ message: "Assignment deadline created", event: created, targetTable: "Assignment" });
    }

    if (normalizedType === "study") {
      if (!moduleId) return res.status(400).json({ message: "moduleId is required for study session entries" });
      if (!endTime) return res.status(400).json({ message: "endTime is required for study session entries" });

      const moduleItem = await Module.findById(moduleId);
      if (!moduleItem) return res.status(404).json({ message: "Module not found" });

      const created = await ProposedSession.create({
        createdBy: req.user.userId,
        moduleRef: moduleItem._id,
        moduleCode: moduleItem.moduleCode,
        moduleName: moduleItem.moduleName,
        description: notes || title,
        date,
        startTime: time,
        endTime,
        likes: 0,
        dislikes: 0,
        status: "pending",
      });

      return res.status(201).json({ message: "Proposed study session created", event: created, targetTable: "ProposedSession" });
    }

    const created = await CalendarEvent.create({
      userId: req.user.userId,
      title,
      type: normalizedType,
      date,
      time,
      endTime,
      venue,
      notes,
    });

    return res.status(201).json({ message: "Personal calendar event created", event: created, targetTable: "CalendarEvent" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create calendar event", error: error.message });
  }
};

module.exports = {
  listCalendarEvents,
  createCalendarEvent,
  getCalendarAdminOverview,
  deleteAdminStudyRoomEvent,
};
