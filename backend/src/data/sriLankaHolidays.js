const SRI_LANKA_HOLIDAYS_2026 = [
  { date: "2026-01-03", title: "Duruthu Full Moon Poya Day" },
  { date: "2026-01-15", title: "Tamil Thai Pongal Day" },
  { date: "2026-02-01", title: "Navam Full Moon Poya Day" },
  { date: "2026-02-04", title: "National Day" },
  { date: "2026-02-15", title: "Mahasivarathri Day" },
  { date: "2026-03-02", title: "Madin Full Moon Poya Day" },
  { date: "2026-03-21", title: "Id-Ul-Fitre (Ramazan Festival Day)" },
  { date: "2026-04-01", title: "Bak Full Moon Poya Day" },
  { date: "2026-04-03", title: "Good Friday" },
  { date: "2026-04-13", title: "Day prior to Sinhala & Tamil New Year Day" },
  { date: "2026-04-14", title: "Sinhala & Tamil New Year Day" },
  { date: "2026-05-01", title: "Vesak Full Moon Poya Day" },
  { date: "2026-05-01", title: "May Day (International Workers' Day)" },
  { date: "2026-05-02", title: "Day following Vesak Full Moon Poya Day" },
  { date: "2026-05-28", title: "Id-Ul-Allah (Hadji Festival Day)" },
  { date: "2026-05-30", title: "Adhi Poson Full Moon Poya Day" },
  { date: "2026-06-29", title: "Poson Full Moon Poya Day" },
  { date: "2026-07-29", title: "Esala Full Moon Poya Day" },
  { date: "2026-08-26", title: "Milad-Un-Nabi (Holy Prophet's Birthday)" },
  { date: "2026-08-27", title: "Nikini Full Moon Poya Day" },
  { date: "2026-09-26", title: "Binara Full Moon Poya Day" },
  { date: "2026-10-25", title: "Vap Full Moon Poya Day" },
  { date: "2026-11-08", title: "Deepawali Festival Day" },
  { date: "2026-11-24", title: "Ill Full Moon Poya Day" },
  { date: "2026-12-23", title: "Unduwap Full Moon Poya Day" },
  { date: "2026-12-25", title: "Christmas Day" },
];

const buildHolidayEvent = (item) => ({
  _id: `holiday-${item.date}-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
  title: item.title,
  group: "holiday",
  type: "holiday",
  date: item.date,
  time: "All day",
  endTime: "",
  sortTime: "00:00",
  sourceLabel: "Sri Lanka Holidays",
  sourceType: "holiday_calendar",
  participantsCount: 0,
  deletable: false,
  readOnly: true,
});

const getSriLankaHolidayEvents = ({ from = "", to = "" } = {}) => {
  return SRI_LANKA_HOLIDAYS_2026.filter((item) => {
    if (from && item.date < from) return false;
    if (to && item.date > to) return false;
    return true;
  }).map(buildHolidayEvent);
};

module.exports = {
  getSriLankaHolidayEvents,
  SRI_LANKA_HOLIDAYS_2026,
};
