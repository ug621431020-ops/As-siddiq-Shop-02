/**
 * Google Calendar API Service
 * Manages courier pickup appointments, logistics dispatch schedules,
 * and packing deadlines on the user's primary Google Calendar.
 */

export interface CalendarEventItem {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  status?: string;
  courierTag?: string;
}

export interface NewEventPayload {
  summary: string;
  description?: string;
  location?: string;
  startDateTime: string; // ISO String
  endDateTime: string;   // ISO String
  courierId?: string;
}

/**
 * Fetch upcoming events from the user's primary calendar
 */
export async function listUpcomingEvents(
  accessToken: string,
  timeMin?: string,
  timeMax?: string
): Promise<CalendarEventItem[]> {
  const minTime = timeMin || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  let url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(
    minTime
  )}&maxResults=50`;

  if (timeMax) {
    url += `&timeMax=${encodeURIComponent(timeMax)}`;
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Google Calendar API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.items || [];
}

/**
 * Create a new courier pickup or packing schedule event in Google Calendar
 */
export async function createCalendarEvent(
  accessToken: string,
  payload: NewEventPayload
): Promise<CalendarEventItem> {
  const body = {
    summary: payload.summary,
    description: payload.description,
    location: payload.location || 'คลังแพ็คสินค้า PackSpace',
    start: {
      dateTime: payload.startDateTime,
    },
    end: {
      dateTime: payload.endDateTime,
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 30 },
        { method: 'popup', minutes: 10 },
      ],
    },
  };

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to create calendar event: ${res.status} - ${errText}`);
  }

  return await res.json();
}

/**
 * Delete an event from Google Calendar.
 * WARNING: The caller MUST always show an explicit confirmation dialog before executing.
 */
export async function deleteCalendarEvent(accessToken: string, eventId: string): Promise<void> {
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok && res.status !== 204) {
    throw new Error(`Failed to delete event from Google Calendar: ${res.status}`);
  }
}
