import { CalendarCheck2, MapPin, Save, X } from "lucide-react";

function CampusEventFormBody({ form, error, timeRangeError, onClose, onFieldChange, onSubmit, editMode, batchOptions = [] }) {
  return (
    <>
      <div className="quickadd-header">
        <div className="quickadd-title-wrap">
          <div className="quickadd-title-icon">
            <CalendarCheck2 size={18} />
          </div>
          <div>
            <h3>{editMode ? "Edit Campus Event" : "Add Campus Event"}</h3>
            <p>Create an event for one semester, one year, or all students</p>
          </div>
        </div>
        <button type="button" className="quickadd-close" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <form className="quickadd-body" onSubmit={onSubmit}>
        <div className="quickadd-grid">
          <div className="quickadd-field quickadd-field-full">
            <label>Event Title</label>
            <input
              type="text"
              placeholder="e.g. Guest Lecture on AI"
              value={form.title}
              onChange={(e) => onFieldChange("title", e.target.value)}
              required
            />
          </div>

          <div className="quickadd-field">
            <label>Date</label>
            <input type="date" value={form.date} min={new Date().toISOString().split("T")[0]} onChange={(e) => onFieldChange("date", e.target.value)} required />
          </div>

          <div className="quickadd-field">
            <label>Venue / Room</label>
            <div className="quickadd-input-icon">
              <MapPin size={14} />
              <input
                type="text"
                placeholder="e.g. Main Auditorium"
                value={form.venue}
                onChange={(e) => onFieldChange("venue", e.target.value)}
              />
            </div>
          </div>

          <div className="quickadd-field">
            <label>Start Time</label>
            <input type="time" value={form.startTime} onChange={(e) => onFieldChange("startTime", e.target.value)} required />
          </div>

          <div className="quickadd-field">
            <label>End Time</label>
            <input
              type="time"
              className={timeRangeError ? "input-error" : ""}
              value={form.endTime}
              onChange={(e) => onFieldChange("endTime", e.target.value)}
              required
            />
            {timeRangeError ? <p className="quickadd-inline-error">{timeRangeError}</p> : null}
          </div>

          <div className="quickadd-field quickadd-field-full">
            <label>Audience</label>
            <select value={form.scopeType} onChange={(e) => onFieldChange("scopeType", e.target.value)}>
              <option value="all">All Students</option>
              <option value="batch">By Batch</option>
            </select>
          </div>

          {form.scopeType === "batch" ? (
            <>
              <div className="quickadd-field quickadd-field-full">
                <label>Batch</label>
                <select value={form.scopeBatch} onChange={(e) => onFieldChange("scopeBatch", e.target.value)} required>
                  <option value="">Select Batch</option>
                  {batchOptions.map((batch) => (
                    <option key={batch} value={batch}>
                      {batch}
                    </option>
                  ))}
                </select>
              </div>
              <div className="quickadd-field">
                <label>Year</label>
                <select value={form.scopeYear} onChange={(e) => onFieldChange("scopeYear", e.target.value)} required>
                  <option value="">Select Year</option>
                  {[1, 2, 3, 4, 5, 6].map((year) => (
                    <option key={year} value={year}>
                      Year {year}
                    </option>
                  ))}
                </select>
              </div>
              <div className="quickadd-field">
                <label>Semester</label>
                <select value={form.scopeSemester} onChange={(e) => onFieldChange("scopeSemester", e.target.value)} required>
                  <option value="">Select Semester</option>
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                </select>
              </div>
            </>
          ) : null}

          {form.scopeType !== "batch" && form.scopeType !== "all" ? (
            <div className="quickadd-field quickadd-field-full">
              <label>Scope Value</label>
              <select value={form.scopeValue} onChange={(e) => onFieldChange("scopeValue", e.target.value)} required>
                <option value="">Select Value</option>
                {[1, 2, 3, 4, 5, 6].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="quickadd-field quickadd-field-full">
            <label>Additional Notes (Optional)</label>
            <textarea
              rows={2}
              placeholder="Speaker, agenda, registration details, etc."
              value={form.notes}
              onChange={(e) => onFieldChange("notes", e.target.value)}
            />
          </div>
        </div>

        {error ? <p className="error">{error}</p> : null}

        <div className="quickadd-footer">
          <button type="button" className="quickadd-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="quickadd-save">
            <Save size={14} />
            {editMode ? "Update Campus Event" : "Save Campus Event"}
          </button>
        </div>
      </form>
    </>
  );
}

export default function AddCampusEvent({
  isOpen,
  form,
  batchOptions = [],
  error,
  timeRangeError,
  onClose,
  onFieldChange,
  onSubmit,
  editMode,
}) {
  if (!isOpen) return null;

  return (
    <section className="pp-card calendar-campus-form-card" style={{ marginTop: "0.75rem", overflow: "hidden" }}>
      <CampusEventFormBody
        form={form}
        batchOptions={batchOptions}
        error={error}
        timeRangeError={timeRangeError}
        onClose={onClose}
        onFieldChange={onFieldChange}
        onSubmit={onSubmit}
        editMode={editMode}
      />
    </section>
  );
}
