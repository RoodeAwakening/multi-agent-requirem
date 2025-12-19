# Team-Ready Sample Requirements

Use this file to test the two-pass flow:
- First pass grades all requirements.
- Second pass (team-ready) should only generate stories for items graded A/B (readyForHandoff).

## Ready candidates (should produce team stories)

### REQ-READY-1
As a retail customer, I want to enable time-based OTP MFA via authenticator app so that my account stays secure during login.
Acceptance criteria:
1) Given a verified customer, when they enable MFA, then they scan a TOTP QR code and must enter the generated code to confirm.
2) Given MFA is enabled, when the customer logs in with valid credentials, then they are challenged for TOTP and gain access only after a correct code.
3) Given three consecutive failed TOTP attempts, when the customer retries, then the account is locked for 15 minutes, an email is sent, and an audit log records userId, timestamp, IP, and reason.
4) Given an MFA-enabled account, when the customer disables MFA, then they must pass TOTP first and a confirmation email is sent.
Dependencies/notes: reuse existing audit log service; email uses SES template MFA_LOCKOUT_NOTICE.

### REQ-READY-2
As an ops lead, I want a weekly KPI dashboard for service availability so that I can track uptime and recovery times.
Acceptance criteria:
1) Given last week’s data, when the dashboard loads, then it shows Uptime % (calculated as total available minutes / total minutes), MTTR (avg resolution minutes for resolved incidents), and incident count for that period.
2) Given a selected date range, when the user changes the range, then KPIs recompute for that range and display a “last refreshed” timestamp.
3) Given an outage incident row, when the user expands it, then the modal shows start/end time, duration minutes, root cause summary, and impacted service.
4) Performance: dashboard loads KPI summary in ≤2s with cached data (refreshed hourly from incident datastore).
Dependencies/notes: data source is the incident service table `incidents_prod`; MTTR uses resolved incidents only.

## Not ready (should remain as notes only, no team story)

### REQ-NOTREADY-1
Improve performance for the app.
Missing: clear scope, metrics, and acceptance criteria.

### REQ-NOTREADY-2
Add more notifications.
Missing: user story, channels, triggers, and acceptance criteria.
