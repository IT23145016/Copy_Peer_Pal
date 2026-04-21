import { useMemo, useState } from "react";
import { Bot, MessageCircle, Send, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { getStoredAuth } from "../utils/auth";

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
      "The Study Sessions area lets users view upcoming sessions, propose new ones, and request sessions. If a proposal gains support, it can be turned into an actual study session with a meeting link.",
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

    const topic = findBestTopic(trimmed);
    const userMessage = { id: `u-${Date.now()}`, role: "user", text: trimmed };
    const botMessage = topic
      ? {
          id: `b-${Date.now() + 1}`,
          role: "bot",
          text: topic.answer,
          route: topic.route,
          routeLabel: topic.routeLabel,
        }
      : { id: `b-${Date.now() + 1}`, role: "bot", text: DEFAULT_REPLY };

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
