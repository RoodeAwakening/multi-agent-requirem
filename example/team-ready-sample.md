# Team-Ready Sample Requirements

Use this file to test the two-pass flow:
- First pass grades all requirements.
- Second pass (team-ready) should only generate stories for items graded A/B (readyForHandoff).

## Ready candidates (should produce team stories)

### REQ-READY-1
As a retail customer, I want to enable MFA on my profile so that my account stays secure during login.
Acceptance criteria:
1) Given a customer with a verified email, when they enable MFA, then the system prompts for an authenticator setup.
2) Given MFA is enabled, when the customer logs in, then they must pass MFA before account access is granted.
3) Given three consecutive MFA failures, when attempts occur, then the account is temporarily locked and an audit log is written.

### REQ-READY-2
As an ops lead, I want a weekly KPI dashboard for service availability so that I can track outages and recovery times.
Acceptance criteria:
1) Given last week’s incidents, when the dashboard loads, then it shows uptime %, MTTR, and incident count.
2) Given a selected date range, when KPIs are viewed, then the metrics recompute for that range.
3) Given an outage event, when details are expanded, then the root cause summary and duration are displayed.

## Not ready (should remain as notes only, no team story)

### REQ-NOTREADY-1
Improve performance for the app.
Missing: clear scope, metrics, and acceptance criteria.

### REQ-NOTREADY-2
Add more notifications.
Missing: user story, channels, triggers, and acceptance criteria.



Team-Level Output
NOTREADY-1
Needs Refinement
Improve performance for the app.
Not Ready: Not eligible for team review (Grade F): This is a high-level business or technical objective, not an actionable software requirement. To reach Grade A, it must be refined into a specific user story with a clearly defined scope (e.g., a specific page or action) and measurable acceptance criteria (e.g., 'reduce load time from X to Y').
NOTREADY-2
Needs Refinement
Add more notifications.
Not Ready: Not eligible for team review (Grade D): This requirement is graded as Poor because it's a single, vague sentence without a user story, acceptance criteria, or any defined scope. To reach Grade A, it needs a specific user story, a detailed list of acceptance criteria defining the new notifications (triggers, content, channels), and the scope of implementation.
READY-1
Needs Refinement
Acceptance criteria:
Not Ready: From a PO/Tech Lead perspective, this story is not ready. Key details are missing: 1) The type of MFA is not specified (e.g., Authenticator App, SMS, Email). 2) The account lockout mechanism is undefined (e.g., lock duration, user notification, unlock process). 3) Audit log requirements are not defined (what data to log, format, and destination). 4) The combined scope of enabling MFA, integrating it into login, and handling lockouts is too large, likely exceeding 8 points and should be split into smaller, more focused stories.
READY-2
Needs Refinement
Acceptance criteria:
Not Ready: PO: This scope is too large for a single story (likely >8 points) and needs to be split. The first story could focus on a single, well-defined KPI like Uptime %. The business logic for calculating 'Uptime %' and 'MTTR' must be explicitly defined. Tech Lead: Critical dependencies are missing. The data source for incidents and outages is not identified. Non-functional requirements for data freshness (e.g., real-time, hourly) and dashboard performance are required.
