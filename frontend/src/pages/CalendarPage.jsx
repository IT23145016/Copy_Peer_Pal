import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  Plus,
  Trash2,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import AddCampusEvent from "./addcampusevent";
import AddCalendarEvent from "./addcalendarevent";
import api from "../services/api";
import { clearStoredAuth, getStoredAuth } from "../utils/auth";

const DAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const monthDayFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit" });
const fullDayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "short",
  day: "numeric",
  year: "numeric",
});

const dateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const isSameDate = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const startOfWeek = (date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() - copy.getDay());
  return copy;
};

const addDays = (date, days) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
};

const addMonths = (date, months) => {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + months);
  return copy;
};

const monthCells = (date) => {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const start = startOfWeek(first);
  return Array.from({ length: 42 }, (_, idx) => {
    const current = addDays(start, idx);
    return {
      date: current,
      inMonth: current.getMonth() === date.getMonth(),
    };
  });
};

const monthBounds = (date) => ({
  start: dateKey(new Date(date.getFullYear(), date.getMonth(), 1)),
  end: dateKey(new Date(date.getFullYear(), date.getMonth() + 1, 0)),
});

const groupEventsByDate = (items) =>
  items.reduce((acc, item) => {
    if (!acc[item.date]) acc[item.date] = [];
    acc[item.date].push({
      id: item._id || item.id,
      title: item.title,
      type: item.type,
      time: item.time,
      endTime: item.endTime || "",
      sourceLabel: item.sourceLabel || "",
      sourceType: item.sourceType || "",
      group: item.group || "",
      participantsCount: item.participantsCount ?? 0,
      deletable: !!item.deletable,
      deleteRef: item.deleteRef || null,
      scopeLabel: item.scopeLabel || "",
      audienceScopeType: item.audienceScopeType || "",
      audienceScopeValue: item.audienceScopeValue || "",
      moduleCode: item.moduleCode || "",
      moduleName: item.moduleName || "",
      notes: item.notes || "",
      venue: item.venue || "",
      status: item.status || "",
    });
    return acc;
  }, {});

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

const initialQuickAddForm = (activeDate) => ({
  title: "",
  type: "study",
  moduleId: "",
  date: dateKey(activeDate),
  venue: "",
  startTime: "14:00",
  endTime: "15:00",
  notes: "",
});

const initialCampusEventForm = (activeDate) => ({
  title: "",
  date: dateKey(activeDate),
  venue: "",
  startTime: "10:00",
  endTime: "11:00",
  scopeType: "all",
  scopeValue: "",
  notes: "",
});

export default function CalendarPage() {
  const navigate = useNavigate();
  const auth = getStoredAuth();
  const isAdmin = auth?.user?.role === "admin";
  const today = new Date();
  const [view, setView] = useState("week");
  const [activeDate, setActiveDate] = useState(today);
  const [eventsByDate, setEventsByDate] = useState({});
  const [modules, setModules] = useState([]);
  const [adminOverview, setAdminOverview] = useState({ summary: null, events: [], batchOptions: [], filters: null });
  const [adminFilters, setAdminFilters] = useState({
    batch: "",
    eventType: "all",
    from: "",
    to: "",
  });
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddForm, setQuickAddForm] = useState(() => initialQuickAddForm(today));
  const [quickAddError, setQuickAddError] = useState("");
  const [isCampusEventOpen, setIsCampusEventOpen] = useState(false);
  const [campusEventForm, setCampusEventForm] = useState(() => initialCampusEventForm(today));
  const [campusEventError, setCampusEventError] = useState("");

  const onLogout = () => {
    clearStoredAuth();
    navigate("/");
  };

  const loadEvents = async () => {
    try {
      setError("");
      const response = await api.get("/calendar-events");
      setEventsByDate(groupEventsByDate(response.data || []));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load calendar events");
    }
  };

  const loadModules = async () => {
    try {
      const response = await api.get("/modules");
      setModules(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load modules");
    }
  };

  const loadAdminOverview = async (filters = adminFilters, viewDate = activeDate) => {
    try {
      setError("");
      const params = new URLSearchParams();
      if (filters.batch) params.set("batch", filters.batch);
      if (filters.eventType && filters.eventType !== "all") params.set("eventType", filters.eventType);
      const bounds = monthBounds(viewDate);
      const from = filters.from ? (filters.from > bounds.start ? filters.from : bounds.start) : bounds.start;
      const to = filters.to ? (filters.to < bounds.end ? filters.to : bounds.end) : bounds.end;
      params.set("from", from);
      params.set("to", to);
      const query = params.toString();
      const response = await api.get(`/calendar-events/admin/overview${query ? `?${query}` : ""}`);
      setAdminOverview({
        summary: response.data?.summary || null,
        events: response.data?.events || [],
        batchOptions: response.data?.batchOptions || [],
        filters: response.data?.filters || filters,
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load admin calendar overview");
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadAdminOverview(adminFilters, activeDate);
      return;
    }
    loadEvents();
    loadModules();
  }, [isAdmin, activeDate, adminFilters.batch, adminFilters.eventType, adminFilters.from, adminFilters.to]);

  const weekDates = useMemo(() => {
    const start = startOfWeek(activeDate);
    return Array.from({ length: 7 }, (_, idx) => addDays(start, idx));
  }, [activeDate]);

  const todayKey = dateKey(today);
  const selectedEvents = eventsByDate[dateKey(activeDate)] || [];
  const focusDays = useMemo(
    () => new Set(Object.keys(eventsByDate).filter((key) => (eventsByDate[key] || []).length === 1)),
    [eventsByDate]
  );

  const focusDayHighlight = useMemo(() => {
    const ranked = weekDates
      .map((date) => ({
        date,
        count: (eventsByDate[dateKey(date)] || []).length,
      }))
      .sort((a, b) => a.count - b.count);
    const pick = ranked[0];
    if (!pick) return null;

    const weekday = pick.date.toLocaleDateString("en-US", { weekday: "long" });
    const insight =
      pick.count === 0
        ? "No items scheduled. This is a great deep-work slot."
        : `${pick.count} item(s) scheduled. Lighter than other days this week.`;

    return { weekday, insight };
  }, [eventsByDate, weekDates]);

  const upcomingDeadlines = useMemo(() => {
    const nowKey = dateKey(today);
    const all = Object.entries(eventsByDate).flatMap(([date, events]) =>
      (events || [])
        .filter((event) => event.type === "assignment")
        .map((event) => ({ ...event, date }))
    );

    return all
      .filter((item) => item.date >= nowKey)
      .sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)))
      .slice(0, 5);
  }, [eventsByDate, today]);

  const pendingAssignmentsCount = useMemo(
    () =>
      Object.entries(eventsByDate)
        .filter(([date]) => date >= todayKey)
        .flatMap(([, events]) => events || [])
        .filter((event) => event.type === "assignment").length,
    [eventsByDate, todayKey]
  );

  const weeklyStudyHours = useMemo(() => {
    const totalMinutes = weekDates.reduce((sum, date) => {
      const events = eventsByDate[dateKey(date)] || [];
      const studyMinutes = events
        .filter((event) => event.type === "study")
        .reduce((inner, event) => {
          const start = parseClockTime(event.time);
          const end = parseClockTime(event.endTime);
          if (start !== null && end !== null && end > start) {
            return inner + (end - start);
          }
          return inner + 60;
        }, 0);
      return sum + studyMinutes;
    }, 0);

    return (totalMinutes / 60).toFixed(1);
  }, [eventsByDate, weekDates]);

  const monthlyEventCount = useMemo(() => {
    const y = activeDate.getFullYear();
    const m = activeDate.getMonth();
    return Object.entries(eventsByDate)
      .filter(([date]) => {
        const dt = new Date(`${date}T00:00:00`);
        return dt.getFullYear() === y && dt.getMonth() === m;
      })
      .reduce((count, [, events]) => count + (events?.length || 0), 0);
  }, [activeDate, eventsByDate]);

  const calendarMode = isAdmin ? "month" : view;

  const titleText = useMemo(() => {
    if (calendarMode === "day") return fullDayFormatter.format(activeDate);
    if (calendarMode === "week") return `${monthDayFormatter.format(weekDates[0])} - ${monthDayFormatter.format(weekDates[6])}`;
    return activeDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [activeDate, calendarMode, weekDates]);

  const timeRangeError = useMemo(() => {
    const start = parseClockTime(quickAddForm.startTime);
    const end = parseClockTime(quickAddForm.endTime);
    if (start === null || end === null) return "";
    if (end <= start) return "End time cannot be before start time";
    return "";
  }, [quickAddForm.endTime, quickAddForm.startTime]);

  const campusTimeRangeError = useMemo(() => {
    const start = parseClockTime(campusEventForm.startTime);
    const end = parseClockTime(campusEventForm.endTime);
    if (start === null || end === null) return "";
    if (end <= start) return "End time must be after start time";
    return "";
  }, [campusEventForm.startTime, campusEventForm.endTime]);

  const conflictingEvent = useMemo(() => {
    const events = eventsByDate[quickAddForm.date] || [];
    const newStart = parseClockTime(quickAddForm.startTime);
    const newEnd = parseClockTime(quickAddForm.endTime);
    if (newStart === null || newEnd === null || newEnd <= newStart) return null;

    return (
      events.find((event) => {
        const existingStart = parseClockTime(event.time);
        if (existingStart === null) return false;
        const existingEnd = parseClockTime(event.endTime);
        const normalizedExistingEnd =
          existingEnd !== null && existingEnd > existingStart ? existingEnd : existingStart + 60;
        return newStart < normalizedExistingEnd && newEnd > existingStart;
      }) || null
    );
  }, [eventsByDate, quickAddForm.date, quickAddForm.endTime, quickAddForm.startTime]);

  const onPrev = () => {
    if (calendarMode === "day") return setActiveDate((prev) => addDays(prev, -1));
    if (calendarMode === "week") return setActiveDate((prev) => addDays(prev, -7));
    return setActiveDate((prev) => addMonths(prev, -1));
  };

  const onNext = () => {
    if (calendarMode === "day") return setActiveDate((prev) => addDays(prev, 1));
    if (calendarMode === "week") return setActiveDate((prev) => addDays(prev, 7));
    return setActiveDate((prev) => addMonths(prev, 1));
  };

  const onQuickAdd = async () => {
    setQuickAddError("");
    const defaults = initialQuickAddForm(activeDate);
    if (modules.length > 0) defaults.moduleId = modules[0]._id;
    setQuickAddForm(defaults);
    setIsQuickAddOpen(true);
  };

  const closeQuickAdd = () => {
    setIsQuickAddOpen(false);
    setQuickAddError("");
  };

  const onAdminFilterChange = (field, value) => {
    setAdminFilters((prev) => ({ ...prev, [field]: value }));
  };

  const onCampusEventFieldChange = (field, value) => {
    setCampusEventForm((prev) => ({ ...prev, [field]: value }));
  };

  const openCampusEventModal = () => {
    setCampusEventError("");
    setCampusEventForm(initialCampusEventForm(activeDate));
    setIsCampusEventOpen(true);
  };

  const closeCampusEventModal = () => {
    setIsCampusEventOpen(false);
    setCampusEventError("");
  };

  const adminCalendarEvents = useMemo(
    () =>
      (adminOverview.events || [])
        .filter((item) => item.group === "assignment" || item.group === "study_room" || item.group === "holiday" || item.group === "campus")
        .map((item) => ({
          ...item,
          sourceLabel: item.sourceLabel || "",
          participantsCount: item.participantsCount ?? 0,
          deletable: !!item.deletable,
          deleteRef: item.deleteRef || null,
        })),
    [adminOverview.events]
  );

  const adminEventsByDate = useMemo(() => groupEventsByDate(adminCalendarEvents), [adminCalendarEvents]);
  const adminCalendarView = "month";
  const adminMonthCells = useMemo(() => monthCells(activeDate), [activeDate]);
  const adminMonthMetrics = useMemo(() => {
    return {
      totalStudySessions: adminCalendarEvents.filter((event) => event.group === "study_room").length,
      totalAssignments: adminCalendarEvents.filter((event) => event.group === "assignment").length,
      eventsThisMonth: adminCalendarEvents.length,
    };
  }, [adminCalendarEvents]);
  const adminAssignments = useMemo(() => adminCalendarEvents.filter((event) => event.group === "assignment"), [adminCalendarEvents]);
  const adminStudyRooms = useMemo(() => adminCalendarEvents.filter((event) => event.group === "study_room"), [adminCalendarEvents]);
  const adminHolidays = useMemo(() => adminCalendarEvents.filter((event) => event.group === "holiday"), [adminCalendarEvents]);
  const adminCampusEvents = useMemo(() => adminCalendarEvents.filter((event) => event.group === "campus"), [adminCalendarEvents]);

  const handleAdminDeleteStudyRoom = async (event) => {
    if (!event?.deleteRef) return;
    try {
      setError("");
      await api.delete(`/calendar-events/admin/study-room/${event.deleteRef.kind}/${event.deleteRef.id}`);
      await loadAdminOverview(adminFilters);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete study room session");
    }
  };

  const submitCampusEvent = async (e) => {
    e.preventDefault();
    if (!campusEventForm.title.trim()) {
      setCampusEventError("Campus event title is required");
      return;
    }
    if (!campusEventForm.date) {
      setCampusEventError("Campus event date is required");
      return;
    }
    const todayStr = dateKey(new Date());
    if (campusEventForm.date < todayStr) {
      setCampusEventError("Event date cannot be in the past");
      return;
    }
    if (!campusEventForm.startTime) {
      setCampusEventError("Start time is required");
      return;
    }
    if (!campusEventForm.endTime) {
      setCampusEventError("End time is required");
      return;
    }
    if (campusTimeRangeError) {
      setCampusEventError(campusTimeRangeError);
      return;
    }
    if (campusEventForm.scopeType === "batch" && !campusEventForm.scopeValue.trim()) {
      setCampusEventError("Please enter a batch");
      return;
    }

    try {
      setCampusEventError("");
      setError("");
      await api.post("/calendar-events", {
        title: campusEventForm.title.trim(),
        type: "campus",
        date: campusEventForm.date,
        time: campusEventForm.startTime,
        endTime: campusEventForm.endTime,
        venue: campusEventForm.venue.trim(),
        notes: campusEventForm.notes.trim(),
        scopeType: campusEventForm.scopeType,
        scopeValue: campusEventForm.scopeValue,
      });
      setStatus("Campus event added");
      setIsCampusEventOpen(false);
      await loadAdminOverview(adminFilters, activeDate);
    } catch (err) {
      setCampusEventError(err.response?.data?.message || "Failed to save campus event");
    }
  };

  if (isAdmin) {
    const summaryCards = [
      {
        label: "Total Study Sessions",
        value: adminMonthMetrics.totalStudySessions,
        note: "Study room sessions in this month",
        icon: <CalendarDays size={22} />,
        tone: "adm-stat-soft",
      },
      {
        label: "Total Assignments",
        value: adminMonthMetrics.totalAssignments,
        note: "Assignment deadlines in this month",
        icon: <ClipboardList size={22} />,
        tone: "adm-stat-orange",
      },
      {
        label: "Events This Month",
        value: adminMonthMetrics.eventsThisMonth,
        note: "All events in this month",
        icon: <CalendarCheck2 size={22} />,
        tone: "adm-stat-soft",
      },
    ];

    const eventTypeLabels = {
      all: "All Events",
      assignment: "Assignment",
      study_room: "Study Room",
      holiday: "Holiday",
      campus: "Campus Event",
    };

    return (
      <div className="pp-layout">
        <Sidebar profile={auth?.user} onLogout={onLogout} />
        <main className="pp-main" style={{ gap: "0.8rem" }}>
          <div className="pp-welcome">
            <div>
              <h1 className="pp-welcome-name">
                <CalendarDays size={22} style={{ verticalAlign: "middle", marginRight: "0.4rem" }} />
                Calendar Overview
              </h1>
              <p className="pp-welcome-sub">See everything in one place: assignments, study room sessions, and the overall calendar view.</p>
            </div>
            <div className="pp-stat-pills">
              <span className="pp-pill"><ClipboardList size={14} /> {adminMonthMetrics.totalAssignments} assignments</span>
              <span className="pp-pill pp-pill-green"><CalendarCheck2 size={14} /> {adminMonthMetrics.eventsThisMonth} this month</span>
              <span className="pp-pill pp-pill-soft"><Clock3 size={14} /> {adminMonthMetrics.totalStudySessions} study sessions</span>
            </div>
          </div>

          {error ? <p className="error">{error}</p> : null}

          <div className="adm-dashboard">
            <div className="aa-view-topbar" style={{ flexWrap: "wrap", gap: "0.75rem" }}>
              <div>
                <p className="pp-muted">Filter by batch, event source and date range.</p>
              </div>
              <div className="usr-filter-row" style={{ flexWrap: "wrap" }}>
                <select value={adminFilters.batch} onChange={(e) => onAdminFilterChange("batch", e.target.value)}>
                  <option value="">All Batches</option>
                  {(adminOverview.batchOptions || []).map((batch) => (
                    <option key={batch} value={batch}>
                      {batch}
                    </option>
                  ))}
                </select>
                <select value={adminFilters.eventType} onChange={(e) => onAdminFilterChange("eventType", e.target.value)}>
                  {Object.entries(eventTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <input type="date" value={adminFilters.from} onChange={(e) => onAdminFilterChange("from", e.target.value)} />
                <input type="date" value={adminFilters.to} onChange={(e) => onAdminFilterChange("to", e.target.value)} />
                <button type="button" className="aa-edit-btn" style={{ padding: "0.5rem 1rem" }} onClick={() => setAdminFilters({ batch: "", eventType: "all", from: "", to: "" })}>
                  Reset
                </button>
              </div>
            </div>

            <div className="adm-stats-row">
              {summaryCards.map((card) => (
                <article key={card.label} className={`adm-stat-card ${card.tone}`}>
                  <div className="adm-stat-icon">{card.icon}</div>
                  <div>
                    <p className="adm-stat-label">{card.label}</p>
                    <p className="adm-stat-num">{card.value}</p>
                    <p className="pp-muted" style={{ margin: "0.25rem 0 0" }}>{card.note}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="aa-view-topbar" style={{ flexWrap: "wrap", gap: "0.75rem", marginTop: "0.75rem" }}>
              <div className="calendar-nav">
                <button type="button" className="icon-action-btn" onClick={onPrev} aria-label="Previous month">
                  <ChevronLeft size={16} />
                </button>
                <h3 style={{ margin: 0, color: "var(--pp-accent, #1E40AF)", fontSize: "1rem" }}>{titleText}</h3>
                <button type="button" className="icon-action-btn" onClick={onNext} aria-label="Next month">
                  <ChevronRight size={16} />
                </button>
              </div>
              <button type="button" className="aa-add-btn" onClick={openCampusEventModal} style={{ boxShadow: "0 10px 24px rgba(14, 165, 233, 0.2)" }}>
                <Plus size={16} /> Add Campus Event
              </button>
            </div>

            <AddCampusEvent
              isOpen={isCampusEventOpen}
              inline
              form={campusEventForm}
              error={campusEventError}
              timeRangeError={campusTimeRangeError}
              onClose={closeCampusEventModal}
              onFieldChange={onCampusEventFieldChange}
              onSubmit={submitCampusEvent}
            />

            <div className="calendar-admin-stack" style={{ marginTop: "0.5rem" }}>
              <div className="calendar-left-stack">
                <div className={`pp-card calendar-shell${adminCalendarView === "month" ? " month-view" : ""}`} style={{ padding: 0 }}>
                  <div className="calendar-toolbar">
                  <div className="calendar-legend">
                    <span><i className="dot assignment" />Assignment</span>
                    <span><i className="dot study" />Study Room</span>
                    <span><i className="dot holiday" />Holiday</span>
                    <span><i className="dot campus" />Campus</span>
                  </div>
                </div>

                  <div className="calendar-grid calendar-grid-month">
                    {DAY_LABELS.map((day) => <div key={day} className="calendar-head-cell">{day}</div>)}
                    {adminMonthCells.map(({ date, inMonth }) => {
                      const key = dateKey(date);
                      const events = adminEventsByDate[key] || [];
                      return (
                        <div key={key} className={`calendar-day-cell${inMonth ? "" : " muted"}${key === todayKey ? " current-day-cell" : ""}`}>
                          {isSameDate(date, today) ? <span className="day-badge">{String(date.getDate()).padStart(2, "0")}</span> : <span className="day-number">{String(date.getDate()).padStart(2, "0")}</span>}
                          {events.slice(0, 2).map((event) => (
                            <div key={`${event.id}-${event.time}`} className={`calendar-event ${event.type}`} title={event.sourceLabel}>
                              <strong>{event.title}</strong>
                              <span style={{ display: "block", fontSize: "0.68rem", opacity: 0.82 }}>{event.sourceLabel}</span>
                            </div>
                          ))}
                          {events.length > 2 ? <div className="calendar-more-events">+{events.length - 2} more</div> : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="calendar-admin-card-grid">
                <section className="upcoming-deadlines-card calendar-side-card">
                  <div className="upcoming-deadlines-head">
                    <h3>Assignment Deadlines</h3>
                    <span>{adminAssignments.length}</span>
                  </div>
                  <div className="upcoming-deadlines-list">
                    {adminAssignments.length ? adminAssignments.map((item) => (
                      <article key={`assignment-${item.id}`} className="deadline-item">
                        <div className="deadline-icon"><ClipboardList size={16} /></div>
                        <div className="deadline-copy">
                          <h4>{item.title}</h4>
                          <p>{item.sourceLabel} - {item.date} - {item.time}</p>
                        </div>
                      </article>
                    )) : <p className="pp-muted">No assignment deadlines in the selected view.</p>}
                  </div>
                </section>

                <section className="upcoming-deadlines-card calendar-side-card">
                  <div className="upcoming-deadlines-head">
                    <h3>Study Room Sessions</h3>
                    <span>{adminStudyRooms.length}</span>
                  </div>
                  <div className="upcoming-deadlines-list">
                    {adminStudyRooms.length ? adminStudyRooms.map((item) => (
                      <article key={`study-${item.id}`} className="deadline-item">
                        <div className="deadline-icon"><CalendarDays size={16} /></div>
                        <div className="deadline-copy" style={{ flex: 1 }}>
                          <h4>{item.title}</h4>
                          <p>{item.sourceLabel} - {item.date} - {item.time}{item.endTime ? ` to ${item.endTime}` : ""}</p>
                          <p className="pp-muted" style={{ fontSize: "0.78rem", margin: "0.15rem 0 0" }}>
                            {item.participantsCount} participant(s)
                          </p>
                        </div>
                        {item.deletable ? (
                          <button type="button" className="aa-delete-btn calendar-study-delete-btn" onClick={() => handleAdminDeleteStudyRoom(item)} title="Delete study room session">
                            <Trash2 size={12} />
                          </button>
                        ) : null}
                      </article>
                    )) : <p className="pp-muted">No study room sessions in the selected view.</p>}
                  </div>
                </section>

                <section className="upcoming-deadlines-card calendar-side-card">
                  <div className="upcoming-deadlines-head">
                    <h3>Campus Events</h3>
                    <span>{adminCampusEvents.length}</span>
                  </div>
                  <div className="upcoming-deadlines-list">
                    {adminCampusEvents.length ? adminCampusEvents.map((item) => (
                      <article key={`campus-${item.id}`} className="deadline-item">
                        <div className="deadline-icon"><CalendarCheck2 size={16} /></div>
                        <div className="deadline-copy" style={{ flex: 1 }}>
                          <h4>{item.title}</h4>
                          <p>{item.sourceLabel} - {item.date} - {item.time}{item.endTime ? ` to ${item.endTime}` : ""}</p>
                          <p className="pp-muted" style={{ fontSize: "0.78rem", margin: "0.15rem 0 0" }}>
                            {item.scopeLabel || "All Students"}
                          </p>
                        </div>
                      </article>
                    )) : <p className="pp-muted">No campus events in the selected month.</p>}
                  </div>
                </section>

                <section className="upcoming-deadlines-card calendar-side-card">
                  <div className="upcoming-deadlines-head">
                    <h3>Sri Lanka Holidays</h3>
                    <span>{adminHolidays.length}</span>
                  </div>
                  <div className="upcoming-deadlines-list">
                    {adminHolidays.length ? adminHolidays.map((item) => (
                      <article key={`holiday-${item.id}`} className="deadline-item">
                        <div className="deadline-icon"><CalendarCheck2 size={16} /></div>
                        <div className="deadline-copy">
                          <h4>{item.title}</h4>
                          <p>{item.sourceLabel} - {item.date}</p>
                        </div>
                      </article>
                    )) : <p className="pp-muted">No holidays in the selected month.</p>}
                  </div>
                </section>

              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const onQuickAddFieldChange = (field, value) => {
    setQuickAddForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitQuickAdd = async (e) => {
    e.preventDefault();
    if (!quickAddForm.title.trim()) {
      setQuickAddError("Subject or session name is required");
      return;
    }
    if (!quickAddForm.date) {
      setQuickAddError("Date is required");
      return;
    }
    if (timeRangeError) {
      setQuickAddError(timeRangeError);
      return;
    }
    if (quickAddForm.type === "study" && !quickAddForm.moduleId) {
      setQuickAddError("Module is required for study session entries");
      return;
    }

    try {
      setQuickAddError("");
      setError("");
      setStatus("");
      await api.post("/calendar-events", {
        title: quickAddForm.title.trim(),
        type: quickAddForm.type,
        moduleId: quickAddForm.moduleId,
        date: quickAddForm.date,
        time: quickAddForm.startTime,
        endTime: quickAddForm.endTime,
        venue: quickAddForm.venue.trim(),
        notes: quickAddForm.notes.trim(),
      });
      setStatus("Event added");
      setIsQuickAddOpen(false);
      await loadEvents();
    } catch (err) {
      setQuickAddError(err.response?.data?.message || "Failed to save entry");
    }
  };

  return (
    <div className="pp-layout">
      <Sidebar profile={auth?.user} onLogout={onLogout} />
      <main className="pp-main" style={{gap: "0.8rem"}}>

        <div className="pp-welcome">
          <div>
            <h1 className="pp-welcome-name"><CalendarDays size={22} style={{verticalAlign:"middle",marginRight:"0.4rem"}} />Calendar</h1>
            <p className="pp-welcome-sub">Manage your events, study sessions and deadlines.</p>
          </div>
          <div className="pp-stat-pills">
            <span className="pp-pill"><ClipboardList size={14} /> {pendingAssignmentsCount} assignments</span>
            <span className="pp-pill pp-pill-green"><Clock3 size={14} /> {weeklyStudyHours}h study</span>
            <span className="pp-pill pp-pill-soft"><CalendarCheck2 size={14} /> {monthlyEventCount} this month</span>
          </div>
        </div>

        <div className="adm-dashboard">
          {/* Toolbar */}
          <div className="aa-view-topbar">
            <div className="calendar-nav">
              <button type="button" className="icon-action-btn" onClick={onPrev}><ChevronLeft size={16} /></button>
              <h3 style={{margin:0,color:"var(--pp-accent, #1E40AF)",fontSize:"1rem"}}>{titleText}</h3>
              <button type="button" className="icon-action-btn" onClick={onNext}><ChevronRight size={16} /></button>
            </div>
            <div style={{display:"flex",gap:"0.5rem",alignItems:"center"}}>
              <div className="calendar-view-toggle">
                {["day","week","month"].map((v) => (
                  <button key={v} type="button" className={`calendar-view-btn${view===v?" active":""}`} onClick={() => setView(v)}>
                    {v.charAt(0).toUpperCase()+v.slice(1)}
                  </button>
                ))}
              </div>
              <button type="button" className="aa-add-btn" onClick={onQuickAdd}>
                <Plus size={16} /> Quick Add
              </button>
            </div>
          </div>

          {error ? <p className="error">{error}</p> : null}
          {status ? <p className="success">{status}</p> : null}

          {/* Calendar + sidebar */}
          <div className="calendar-main-grid">
            <div className="calendar-left-stack">
              {/* Calendar grid */}
              <div className={`pp-card calendar-shell${view === "month" ? " month-view" : ""}`} style={{padding:0}}>
                <div className="calendar-toolbar">
                  <div className="calendar-legend">
                    <span><i className="dot personal" />Personal</span>
                    <span><i className="dot study" />Study</span>
                    <span><i className="dot assignment" />Assignments</span>
                    <span><i className="dot holiday" />Holidays</span>
                  </div>
                </div>

                {view === "day" ? (
                  <div className="calendar-day-agenda">
                    <p className={`calendar-day-label${dateKey(activeDate)===todayKey?" current-day-label":""}`}>
                      {fullDayFormatter.format(activeDate)}
                    </p>
                    <ul className="list">
                      {selectedEvents.length ? selectedEvents.map((event) => (
                        <li key={`${event.id}-${event.time}`}>
                          <strong>{event.title}</strong>
                          <p>{event.time}{event.endTime ? ` - ${event.endTime}` : ""}</p>
                          <div className={`calendar-event ${event.type}`}>{event.type}</div>
                        </li>
                      )) : <li>No events scheduled for this day.</li>}
                    </ul>
                  </div>
                ) : null}

                {view === "week" ? (
                  <div className="calendar-grid">
                    {DAY_LABELS.map((day) => <div key={day} className="calendar-head-cell">{day}</div>)}
                    {weekDates.map((date) => {
                      const key = dateKey(date);
                      const events = eventsByDate[key] || [];
                      return (
                        <div key={key} className={`calendar-day-cell${focusDays.has(key)?" focus-day":""}${key===todayKey?" current-day-cell":""}` }>
                          {isSameDate(date,today) ? <span className="day-badge">{String(date.getDate()).padStart(2,"0")}</span> : <span className="day-number">{String(date.getDate()).padStart(2,"0")}</span>}
                          {focusDays.has(key) ? <p className="focus-tag">Focus Day</p> : null}
                          {events.map((event) => <div key={`${event.id}-${event.time}`} className={`calendar-event ${event.type}`}>{event.title}</div>)}
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                {view === "month" ? (
                  <div className="calendar-grid calendar-grid-month">
                    {DAY_LABELS.map((day) => <div key={day} className="calendar-head-cell">{day}</div>)}
                    {monthCells(activeDate).map(({ date, inMonth }) => {
                      const key = dateKey(date);
                      const events = eventsByDate[key] || [];
                      return (
                        <div key={key} className={`calendar-day-cell${inMonth?"":" muted"}${focusDays.has(key)?" focus-day":""}${key===todayKey?" current-day-cell":""}` }>
                          {isSameDate(date,today) ? <span className="day-badge">{String(date.getDate()).padStart(2,"0")}</span> : <span className="day-number">{String(date.getDate()).padStart(2,"0")}</span>}
                          {events.slice(0,2).map((event) => <div key={`${event.id}-${event.time}`} className={`calendar-event ${event.type}`}>{event.title}</div>)}
                          {events.length > 2 ? <div className="calendar-more-events">+{events.length-2} more</div> : null}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              {/* Stat cards */}
              {view !== "month" ? <div className="adm-stats-row">
                <article className="adm-stat-card adm-stat-orange">
                  <div className="adm-stat-icon"><ClipboardList size={22} /></div>
                  <div><p className="adm-stat-label">Pending Assignments</p><p className="adm-stat-num">{pendingAssignmentsCount}</p></div>
                </article>
                <article className="adm-stat-card adm-stat-soft">
                  <div className="adm-stat-icon"><Clock3 size={22} /></div>
                  <div><p className="adm-stat-label">Weekly Study Hours</p><p className="adm-stat-num">{weeklyStudyHours}h</p></div>
                </article>
                <article className="adm-stat-card adm-stat-green">
                  <div className="adm-stat-icon"><CalendarCheck2 size={22} /></div>
                  <div><p className="adm-stat-label">Monthly Events</p><p className="adm-stat-num">{monthlyEventCount}</p></div>
                </article>
              </div> : null}
            </div>

            <aside className="calendar-side-stack">
              {focusDayHighlight ? (
                <section className="focus-highlight-card">
                  <p className="focus-highlight-label">Focus Day Highlight</p>
                  <div className="focus-highlight-head">
                    <div className="focus-highlight-icon"><CalendarDays size={20} /></div>
                    <div>
                      <h3>{focusDayHighlight.weekday}</h3>
                      <p>{focusDayHighlight.insight}</p>
                    </div>
                  </div>
                  <div className="focus-highlight-quote">"Use this lighter slot to finish your highest-priority task."</div>
                  <button type="button" className="focus-highlight-btn" onClick={() => navigate("/study-sessions")}>
                    <Zap size={16} /> Book Study Room
                  </button>
                </section>
              ) : null}

              <section className="upcoming-deadlines-card">
                <div className="upcoming-deadlines-head">
                  <h3>Upcoming Deadlines</h3>
                  <button type="button" onClick={() => navigate("/dashboard?tab=tracker")}>See All</button>
                </div>
                <div className="upcoming-deadlines-list">
                  {upcomingDeadlines.length ? upcomingDeadlines.map((item) => (
                    <article key={`${item.id}-${item.date}-${item.time}`} className="deadline-item">
                      <div className="deadline-icon"><ClipboardList size={16} /></div>
                      <div className="deadline-copy">
                        <h4>{item.title}</h4>
                        <p>{item.date === todayKey ? "Today" : item.date} • {item.time}</p>
                      </div>
                    </article>
                  )) : <p className="pp-muted">No upcoming deadlines.</p>}
                </div>
              </section>
              </aside>
            </div>
          </div>

        <AddCalendarEvent
          isOpen={isQuickAddOpen}
          form={quickAddForm}
          modules={modules}
          conflictingEvent={conflictingEvent}
          timeRangeError={timeRangeError}
          error={quickAddError}
          onClose={closeQuickAdd}
          onFieldChange={onQuickAddFieldChange}
          onSubmit={submitQuickAdd}
        />

      </main>
    </div>
  );
}
