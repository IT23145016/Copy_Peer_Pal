import { useMemo, useState } from "react";
import { Bot, MessageCircle, Send, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { getStoredAuth } from "../utils/auth";

const SYSTEM_FACTS = {
  studySessions: {
    proposalApprovalLikes: 2,
    batchTopRequestThreshold: 1,
  },
  helpDesk: {
    allowedDocumentTypes: "PDF and DOCX",
    maxDocumentSizeMb: 2,
    trustedUserMinimumApprovedDocs: 2,
    trustedUserPointsPerApprovedDoc: 10,
  },
  assignments: {
    publishedDatePastAllowedOnCreate: false,
    trackerStatuses: ["done", "not_completed"],
  },
  modules: {
    moduleCodeExample: "IT2030",
  },
  auth: {
    passwordMinLength: 8,
    tokenExpiry: "1 day",
  },
};

const HELP_TOPICS = [
  {
    id: "add-module",
    match: ["add module", "create module", "new module", "module"],
    title: "Add a module",
    answer:
      "Admins can add a module from Admin Dashboard > Modules > Add Module. Fill in the module code, module name, academic year, and semester, then save it.",
    route: "/admin/modules/add",
    routeLabel: "Open Add Module",
  },
  {
    id: "add-assignment",
    match: ["add assignment", "publish assignment", "new assignment", "assignment"],
    title: "Publish an assignment",
    answer:
      "Admins can publish an assignment from Admin Dashboard > Assignments > Add Assignment. First choose the module, then enter the assignment name, published date, deadline date and time, confirm the deadline, and publish it.",
    route: "/admin/assignments/add",
    routeLabel: "Open Add Assignment",
  },
  {
    id: "dashboard",
    match: ["dashboard", "student dashboard", "admin dashboard"],
    title: "Understand the dashboard",
    answer:
      "Students use the dashboard to track assignments, mark work as done or not done, and view their modules. Admins use the admin dashboard to manage modules, assignments, and students.",
    route: "/dashboard",
    routeLabel: "Open Dashboard",
  },
  {
    id: "helpdesk",
    match: ["help desk", "helpdesk", "note", "request help", "upload document"],
    title: "Use Help Desk",
    answer:
      "In Help Desk, you can post a request, upload supporting documents, approve shared documents, and manage received notes. Senders can delete their own requests, and received notes can be cleared from a user's dashboard.",
    route: "/helpdesk",
    routeLabel: "Open Help Desk",
  },
  {
    id: "calendar",
    match: ["calendar", "event", "schedule", "campus event"],
    title: "Use the calendar",
    answer:
      "The calendar combines personal events, study sessions, assignment deadlines, holidays, and campus events. Users can add quick events, while admins can also manage campus-wide events.",
    route: "/calendar",
    routeLabel: "Open Calendar",
  },
  {
    id: "study-sessions",
    match: ["study session", "study sessions", "propose session", "request session"],
    title: "Use study sessions",
    answer:
      `The Study Sessions area lets users view upcoming sessions, propose new ones, and request sessions. A proposal is approved once it reaches ${SYSTEM_FACTS.studySessions.proposalApprovalLikes} likes, then the proposal creator can create the actual study session with a meeting link.`,
    route: "/study-sessions",
    routeLabel: "Open Study Sessions",
  },
  {
    id: "profile",
    match: ["profile", "edit profile", "account"],
    title: "Manage your profile",
    answer:
      "You can update your personal details from the Profile page. That includes your name, email, academic year, semester, batch, and profile image.",
    route: "/profile",
    routeLabel: "Open Profile",
  },
  {
    id: "login-register",
    match: ["register", "sign up", "login", "log in", "account create"],
    title: "Login and registration",
    answer:
      "New users register with name, email, password, academic year, semester, and batch. After logging in, the system sends users to the correct dashboard based on their role.",
    route: "/register",
    routeLabel: "Open Register",
  },
];

const DEFAULT_REPLY =
  "I can help explain the system. Try asking things like: how to add a module, how to publish an assignment, how Help Desk works, how to use the calendar, or how study sessions work.";

const normalizeText = (value) => value.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();

const includesAny = (text, terms) => terms.some((term) => text.includes(term));

const getCurrentSuggestions = (pathname, role) => {
  if (pathname.startsWith("/admin")) {
    return ["How do I add a module?", "How do I publish an assignment?", "How do I manage students?"];
  }
  if (pathname === "/helpdesk") {
    return ["How does Help Desk work?", "How do I upload a document?", "How do I clear a received note?"];
  }
  if (pathname === "/calendar") {
    return ["How do I add an event?", "What shows in the calendar?", "Who can add campus events?"];
  }
  if (pathname.startsWith("/study-sessions")) {
    return ["How do study sessions work?", "How do I propose a session?", "How do I request a session?"];
  }
  if (role === "admin") {
    return ["How do I add a module?", "How do I publish an assignment?", "How does Help Desk work?"];
  }
  return ["How does this system work?", "How does Help Desk work?", "How do I use the calendar?"];
};

const findBestTopic = (text) => {
  const normalized = text.toLowerCase().trim();
  if (!normalized) return null;

  let best = null;
  let bestScore = 0;

  HELP_TOPICS.forEach((topic) => {
    const score = topic.match.reduce((total, phrase) => (normalized.includes(phrase) ? total + phrase.length : total), 0);
    if (score > bestScore) {
      best = topic;
      bestScore = score;
    }
  });

  return best;
};

const buildStudySessionsReply = (prompt) => {
  const normalized = normalizeText(prompt);
  const isAboutStudySessions = includesAny(normalized, [
    "study session",
    "study sessions",
    "proposal",
    "propose",
    "request session",
    "like",
    "likes",
    "vote",
    "votes",
  ]);

  if (!isAboutStudySessions) return null;

  const asksApprovalThreshold =
    includesAny(normalized, ["approve", "approved", "approval"]) &&
    includesAny(normalized, ["like", "likes", "vote", "votes", "support"]);

  if (asksApprovalThreshold) {
    return {
      text: `A study session proposal needs ${SYSTEM_FACTS.studySessions.proposalApprovalLikes} likes to be approved. Once it reaches ${SYSTEM_FACTS.studySessions.proposalApprovalLikes} likes, its status changes to approved and the proposal creator can create the actual session with a meeting link.`,
      route: "/study-sessions",
      routeLabel: "Open Study Sessions",
    };
  }

  if (includesAny(normalized, ["who can vote", "can vote", "vote"])) {
    return {
      text: "Users can vote on other people's study session proposals, but they cannot vote on their own proposal, and each user can vote only once per proposal.",
      route: "/study-sessions",
      routeLabel: "Open Study Sessions",
    };
  }

  if (includesAny(normalized, ["create session", "meeting link", "after approval"])) {
    return {
      text: "After a proposal is approved, the proposal creator can create the actual study session by adding the meeting link. The users who liked that proposal become the session participants.",
      route: "/study-sessions",
      routeLabel: "Open Study Sessions",
    };
  }

  if (includesAny(normalized, ["edit", "delete", "remove", "cancel"])) {
    return {
      text: "Pending proposals can be edited by the proposal creator or an admin. Approved proposals can only be deleted by an admin. Created study sessions can be edited or cancelled by the session creator or an admin.",
      route: "/study-sessions",
      routeLabel: "Open Study Sessions",
    };
  }

  if (includesAny(normalized, ["batch top", "request"])) {
    return {
      text: `A Batch Top session can start once there is at least ${SYSTEM_FACTS.studySessions.batchTopRequestThreshold} pending request for that Batch Top and module.`,
      route: "/study-sessions/request",
      routeLabel: "Open Request Session",
    };
  }

  return {
    text: `You can propose a study session, other users can like or dislike it, and once it reaches ${SYSTEM_FACTS.studySessions.proposalApprovalLikes} likes it becomes approved. After that, the proposal creator can create the actual session with a meeting link.`,
    route: "/study-sessions",
    routeLabel: "Open Study Sessions",
  };
};

const buildHelpDeskReply = (prompt) => {
  const normalized = normalizeText(prompt);
  const isAboutHelpDesk = includesAny(normalized, [
    "help desk",
    "helpdesk",
    "request",
    "document",
    "documents",
    "bookmark",
    "bookmarks",
    "approve",
    "approved",
    "leaderboard",
    "trusted",
    "note",
  ]);

  if (!isAboutHelpDesk) return null;

  if (includesAny(normalized, [
    "file type",
    "file types",
    "type of file",
    "type of files",
    "type of doc",
    "type of docs",
    "document type",
    "document types",
    "what can i upload",
    "what docs can i upload",
    "what documents can i upload",
    "upload type",
    "pdf",
    "docx",
    "size",
    "mb",
  ])) {
    return {
      text: `Help Desk uploads only allow ${SYSTEM_FACTS.helpDesk.allowedDocumentTypes} files, and each document must be under ${SYSTEM_FACTS.helpDesk.maxDocumentSizeMb}MB.`,
      route: "/helpdesk",
      routeLabel: "Open Help Desk",
    };
  }

  if (includesAny(normalized, ["who can approve", "approve document", "approve documents", "approval"])) {
    return {
      text: "Only the help request owner or an admin can approve a document, and the person who uploaded that document cannot approve their own upload.",
      route: "/helpdesk",
      routeLabel: "Open Help Desk",
    };
  }

  if (includesAny(normalized, ["edit request", "edit my request", "change request"])) {
    return {
      text: "A help request can only be edited by its owner, and only before any documents have been submitted to that request.",
      route: "/helpdesk",
      routeLabel: "Open Help Desk",
    };
  }

  if (includesAny(normalized, ["clear note", "clear received", "remove note", "clear dashboard"])) {
    return {
      text: "Only received notes can be cleared from your dashboard. Clearing hides that note for you, but it does not delete the original help request for everyone else.",
      route: "/helpdesk",
      routeLabel: "Open Help Desk",
    };
  }

  if (includesAny(normalized, ["bookmark", "bookmarks", "save document"])) {
    return {
      text: "You can bookmark received Help Desk documents so you can reopen or download them later. A document cannot be bookmarked twice, and hidden requests cannot be bookmarked.",
      route: "/helpdesk",
      routeLabel: "Open Help Desk",
    };
  }

  if (includesAny(normalized, ["leaderboard", "trusted user", "trusted users", "points"])) {
    return {
      text: `Trusted users need at least ${SYSTEM_FACTS.helpDesk.trustedUserMinimumApprovedDocs} approved documents to appear on the leaderboard. Each approved document is worth ${SYSTEM_FACTS.helpDesk.trustedUserPointsPerApprovedDoc} points, and self-approved uploads do not count.`,
      route: "/helpdesk",
      routeLabel: "Open Help Desk",
    };
  }

  return {
    text: "In Help Desk, students can post requests, upload supporting documents, approve useful responses, bookmark received documents, and clear received notes from their own dashboard.",
    route: "/helpdesk",
    routeLabel: "Open Help Desk",
  };
};

const buildAssignmentsReply = (prompt) => {
  const normalized = normalizeText(prompt);
  const isAboutAssignments = includesAny(normalized, [
    "assignment",
    "assignments",
    "deadline",
    "publish assignment",
    "tracker",
    "mark done",
    "not done",
    "not completed",
  ]);

  if (!isAboutAssignments) return null;

  if (includesAny(normalized, ["published date", "past", "deadline before"])) {
    return {
      text: "When creating an assignment, module, assignment name, published date, and deadline are required. The deadline must be on or after the published date, and the published date cannot be in the past when creating a new assignment.",
      route: "/admin/assignments/add",
      routeLabel: "Open Add Assignment",
    };
  }

  if (includesAny(normalized, ["mark done", "tracker status", "not completed", "not done", "progress"])) {
    return {
      text: `Students can update assignment tracker status to ${SYSTEM_FACTS.assignments.trackerStatuses.join(" or ")}. The dashboard then uses that status to show pending, completed, and due soon work.`,
      route: "/dashboard?tab=tracker",
      routeLabel: "Open Assignment Tracker",
    };
  }

  if (includesAny(normalized, ["who can see", "who sees", "year", "semester"])) {
    return {
      text: "Students only see assignments that match their own academic year and semester. Admins can see all assignments and can also filter them by year and semester.",
      route: "/dashboard",
      routeLabel: "Open Dashboard",
    };
  }

  if (includesAny(normalized, ["deadline extended", "email", "notification", "due soon"])) {
    return {
      text: "When an assignment is published, the system can notify matching students. If the deadline is very close, it is treated as a due-soon notification, and if an admin later extends the deadline, the system can send a deadline extension notice as well.",
      route: "/admin/assignments/add",
      routeLabel: "Open Add Assignment",
    };
  }

  return {
    text: "Assignments are published under a module, shown to students in the matching year and semester, and can be tracked by each student as done or not completed.",
    route: "/dashboard",
    routeLabel: "Open Dashboard",
  };
};

const buildCalendarReply = (prompt, role) => {
  const normalized = normalizeText(prompt);
  const isAboutCalendar = includesAny(normalized, [
    "calendar",
    "event",
    "campus event",
    "quick add",
    "holiday",
    "personal event",
    "study room",
  ]);

  if (!isAboutCalendar) return null;

  if (includesAny(normalized, ["who can add campus events", "campus event", "campus events", "admin only"])) {
    return {
      text: "Only admins can create or update campus events. Campus events can be targeted to all students, a specific batch, a year, or a semester.",
      route: "/calendar",
      routeLabel: "Open Calendar",
    };
  }

  if (includesAny(normalized, ["what shows", "what appears", "calendar include", "shows in the calendar"])) {
    return {
      text: "The calendar combines personal events, assignment deadlines, proposed study sessions, campus events, and Sri Lankan holiday events. Students only see campus events that match their own audience scope.",
      route: "/calendar",
      routeLabel: "Open Calendar",
    };
  }

  if (includesAny(normalized, ["time", "end time", "after time", "date format"])) {
    return {
      text: "Calendar entries require a title, date, and start time. Dates must use YYYY-MM-DD, times must be valid, and if an end time is provided it must be later than the start time.",
      route: "/calendar",
      routeLabel: "Open Calendar",
    };
  }

  if (includesAny(normalized, ["quick add", "edit quick add", "delete quick add"])) {
    return {
      text: "Users can edit or delete their own quick-add personal events and their own proposed study-session quick adds. Campus events are managed separately by admins.",
      route: "/calendar",
      routeLabel: "Open Calendar",
    };
  }

  if (includesAny(normalized, ["assignment from calendar", "study session from calendar", "create assignment in calendar"])) {
    return {
      text: "From calendar quick add, creating an assignment needs a module and a future deadline, while creating a study-session entry needs a module and an end time and becomes a pending proposed session.",
      route: "/calendar",
      routeLabel: "Open Calendar",
    };
  }

  return {
    text: role === "admin"
      ? "The admin calendar view combines assignments, study sessions, timetable items, holidays, and campus events, with filters for batch, year, semester, and event type."
      : "Your calendar combines personal events, assignment deadlines, proposed study sessions, holidays, and any campus events that are visible to your batch, year, or semester.",
    route: "/calendar",
    routeLabel: "Open Calendar",
  };
};

const buildModulesReply = (prompt, role) => {
  const normalized = normalizeText(prompt);
  const isAboutModules = includesAny(normalized, ["module", "modules", "module code"]);
  if (!isAboutModules) return null;

  if (includesAny(normalized, ["module code", "format", "example"])) {
    return {
      text: `Module codes must follow the module pattern like ${SYSTEM_FACTS.modules.moduleCodeExample}, which means 2 to 5 uppercase letters followed by 3 or 4 digits.`,
      route: role === "admin" ? "/admin/modules/add" : "/dashboard?tab=modules",
      routeLabel: role === "admin" ? "Open Add Module" : "Open My Modules",
    };
  }

  if (includesAny(normalized, ["who can add", "create module", "add module"])) {
    return {
      text: "Admins can create modules. Each module needs a unique module code, a module name, an academic year, and a semester.",
      route: "/admin/modules/add",
      routeLabel: "Open Add Module",
    };
  }

  if (includesAny(normalized, ["who can see", "my modules", "module list"])) {
    return {
      text: "Students only see modules that match their own academic year and semester. Admins can view all modules and filter them by year or semester.",
      route: role === "admin" ? "/admin/dashboard?tab=modules" : "/dashboard?tab=modules",
      routeLabel: role === "admin" ? "Open Modules" : "Open My Modules",
    };
  }

  return {
    text: "Modules organize assignments and study support by module code, module name, academic year, and semester.",
    route: role === "admin" ? "/admin/dashboard?tab=modules" : "/dashboard?tab=modules",
    routeLabel: role === "admin" ? "Open Modules" : "Open My Modules",
  };
};

const buildProfileReply = (prompt) => {
  const normalized = normalizeText(prompt);
  const isAboutProfile = includesAny(normalized, ["profile", "avatar", "account", "name", "email", "batch"]);
  if (!isAboutProfile) return null;

  if (includesAny(normalized, ["avatar", "image", "profile image", "size"])) {
    return {
      text: "You can update your avatar from the Profile page. The profile image data must stay under 2MB.",
      route: "/profile",
      routeLabel: "Open Profile",
    };
  }

  if (includesAny(normalized, ["change email", "email exists", "duplicate email"])) {
    return {
      text: "You can update your email from the Profile page, but it must be a valid email address and it cannot already belong to another account.",
      route: "/profile",
      routeLabel: "Open Profile",
    };
  }

  if (includesAny(normalized, ["change year", "change semester", "change batch", "academic year"])) {
    return {
      text: "Your profile lets you update academic year, semester, and batch. Academic year must be between 1 and 6, and semester must be 1 or 2.",
      route: "/profile",
      routeLabel: "Open Profile",
    };
  }

  return {
    text: "From Profile, you can update your name, email, avatar, academic year, semester, and batch.",
    route: "/profile",
    routeLabel: "Open Profile",
  };
};

const buildAuthReply = (prompt) => {
  const normalized = normalizeText(prompt);
  const isAboutAuth = includesAny(normalized, ["login", "log in", "register", "sign up", "password", "account"]);
  if (!isAboutAuth) return null;

  if (includesAny(normalized, ["password", "strong password", "password rules"])) {
    return {
      text: `Passwords must be at least ${SYSTEM_FACTS.auth.passwordMinLength} characters long and include an uppercase letter, a lowercase letter, and a number.`,
      route: "/register",
      routeLabel: "Open Register",
    };
  }

  if (includesAny(normalized, ["token", "session", "how long", "expire", "expires"])) {
    return {
      text: `After login, the system issues an auth token that expires in ${SYSTEM_FACTS.auth.tokenExpiry}.`,
      route: "/login",
      routeLabel: "Open Login",
    };
  }

  if (includesAny(normalized, ["deactivated", "account disabled", "cannot login"])) {
    return {
      text: "If an account is deactivated, login is blocked and the user is told to contact an admin.",
      route: "/login",
      routeLabel: "Open Login",
    };
  }

  return {
    text: "Registration requires name, email, password, confirm password, academic year, semester, and batch. After login, users are sent to the correct dashboard for their role.",
    route: "/register",
    routeLabel: "Open Register",
  };
};

const buildDashboardReply = (prompt, role) => {
  const normalized = normalizeText(prompt);
  const isAboutDashboard = includesAny(normalized, ["dashboard", "overview", "student dashboard", "admin dashboard"]);
  if (!isAboutDashboard) return null;

  if (includesAny(normalized, ["student dashboard", "my dashboard"])) {
    return {
      text: "The student dashboard shows assignment overview, due-soon work, the assignment tracker, and your modules.",
      route: "/dashboard",
      routeLabel: "Open Dashboard",
    };
  }

  if (includesAny(normalized, ["admin dashboard", "manage students", "admin"])) {
    return {
      text: "The admin dashboard is for managing assignments, modules, and users, with quick actions for publishing new content and reviewing platform activity.",
      route: "/admin/dashboard",
      routeLabel: "Open Admin Dashboard",
    };
  }

  return {
    text: role === "admin"
      ? "Your admin dashboard is the control center for modules, assignments, and users."
      : "Your dashboard gives you a quick academic overview, including assignments, tracker progress, and modules.",
    route: role === "admin" ? "/admin/dashboard" : "/dashboard",
    routeLabel: role === "admin" ? "Open Admin Dashboard" : "Open Dashboard",
  };
};

const buildSmartReply = (prompt, role) => {
  const studySessionsReply = buildStudySessionsReply(prompt);
  if (studySessionsReply) return studySessionsReply;

  const helpDeskReply = buildHelpDeskReply(prompt);
  if (helpDeskReply) return helpDeskReply;

  const assignmentsReply = buildAssignmentsReply(prompt);
  if (assignmentsReply) return assignmentsReply;

  const calendarReply = buildCalendarReply(prompt, role);
  if (calendarReply) return calendarReply;

  const modulesReply = buildModulesReply(prompt, role);
  if (modulesReply) return modulesReply;

  const profileReply = buildProfileReply(prompt);
  if (profileReply) return profileReply;

  const authReply = buildAuthReply(prompt);
  if (authReply) return authReply;

  const dashboardReply = buildDashboardReply(prompt, role);
  if (dashboardReply) return dashboardReply;

  const topic = findBestTopic(prompt);
  if (topic) {
    return {
      text: topic.answer,
      route: topic.route,
      routeLabel: topic.routeLabel,
    };
  }

  return { text: DEFAULT_REPLY };
};

export default function SystemGuideChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const auth = getStoredAuth();

  const suggestions = useMemo(
    () => getCurrentSuggestions(location.pathname, auth?.user?.role),
    [location.pathname, auth?.user?.role]
  );

  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "bot",
      text: "Hi, I'm the system guide. Ask me how to use a feature and I'll explain it simply.",
    },
  ]);

  const replyToPrompt = (prompt) => {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    const userMessage = { id: `u-${Date.now()}`, role: "user", text: trimmed };
    const reply = buildSmartReply(trimmed, auth?.user?.role);
    const botMessage = {
      id: `b-${Date.now() + 1}`,
      role: "bot",
      text: reply.text,
      route: reply.route,
      routeLabel: reply.routeLabel,
    };

    setMessages((prev) => [...prev, userMessage, botMessage]);
    setInput("");
  };

  return (
    <div className="sysbot-wrap">
      {isOpen ? (
        <div className="sysbot-panel">
          <div className="sysbot-head">
            <div className="sysbot-head-copy">
              <div className="sysbot-head-icon">
                <Bot size={18} />
              </div>
              <div>
                <strong>System Guide</strong>
                <span>Quick help for new users</span>
              </div>
            </div>
            <button type="button" className="sysbot-close" onClick={() => setIsOpen(false)} aria-label="Close guide">
              <X size={16} />
            </button>
          </div>

          <div className="sysbot-messages">
            {messages.map((message) => (
              <div key={message.id} className={`sysbot-message ${message.role === "user" ? "user" : "bot"}`}>
                <p>{message.text}</p>
                {message.route ? (
                  <button type="button" className="sysbot-link" onClick={() => navigate(message.route)}>
                    {message.routeLabel || "Open"}
                  </button>
                ) : null}
              </div>
            ))}
          </div>

          <div className="sysbot-suggestions">
            {suggestions.map((suggestion) => (
              <button key={suggestion} type="button" className="sysbot-chip" onClick={() => replyToPrompt(suggestion)}>
                {suggestion}
              </button>
            ))}
          </div>

          <form
            className="sysbot-form"
            onSubmit={(e) => {
              e.preventDefault();
              replyToPrompt(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask how something works..."
            />
            <button type="submit" aria-label="Send question">
              <Send size={16} />
            </button>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        className="sysbot-launch"
        onClick={() => setIsOpen((current) => !current)}
        aria-label="Open system guide chatbot"
      >
        <MessageCircle size={20} />
      </button>
    </div>
  );
}
