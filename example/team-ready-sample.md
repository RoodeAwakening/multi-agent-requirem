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
