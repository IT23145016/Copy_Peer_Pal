import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  Plus,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
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

const groupEventsByDate = (items) =>
  items.reduce((acc, item) => {
    if (!acc[item.date]) acc[item.date] = [];
    acc[item.date].push({
      id: item._id,
      title: item.title,
      type: item.type,
      time: item.time,
      endTime: item.endTime || "",
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

export default function CalendarPage() {
  const navigate = useNavigate();
  const auth = getStoredAuth();
  const today = new Date();
  const [view, setView] = useState("week");
  const [activeDate, setActiveDate] = useState(today);
  const [eventsByDate, setEventsByDate] = useState({});
  const [modules, setModules] = useState([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddForm, setQuickAddForm] = useState(() => initialQuickAddForm(today));
  const [quickAddError, setQuickAddError] = useState("");

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

  useEffect(() => {
    loadEvents();
    loadModules();
  }, []);

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

  const titleText = useMemo(() => {
    if (view === "day") return fullDayFormatter.format(activeDate);
    if (view === "week") return `${monthDayFormatter.format(weekDates[0])} - ${monthDayFormatter.format(weekDates[6])}`;
    return activeDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [activeDate, view, weekDates]);

  const timeRangeError = useMemo(() => {
    const start = parseClockTime(quickAddForm.startTime);
    const end = parseClockTime(quickAddForm.endTime);
    if (start === null || end === null) return "";
    if (end <= start) return "End time cannot be before start time";
    return "";
  }, [quickAddForm.endTime, quickAddForm.startTime]);

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
    if (view === "day") return setActiveDate((prev) => addDays(prev, -1));
    if (view === "week") return setActiveDate((prev) => addDays(prev, -7));
    return setActiveDate((prev) => addMonths(prev, -1));
  };

  const onNext = () => {
    if (view === "day") return setActiveDate((prev) => addDays(prev, 1));
    if (view === "week") return setActiveDate((prev) => addDays(prev, 7));
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
