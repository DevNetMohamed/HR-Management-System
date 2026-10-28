# Time configuration backend

## Module structure

The module follows the same dependency direction as `Employee` on `dev`:

- `domain/` contains calendar-date, holiday-occurrence and shift-schedule rules with no database dependency.
- `application/dto/` contains request contracts; `application/use-cases/` checks permissions and coordinates commands and reads.
- `application/ports/` defines the repository interfaces used by the use cases.
- `infrastructure/persistence/` implements those ports with transactional PostgreSQL queries.
- `presentation/controllers/` maps HTTP routes to the use cases.

`time-configuration.module.ts` binds the ports to their SQL implementations.

This module adds workweeks, attendance policies, holidays and shifts. Workweeks
and attendance policies may have a branch override, which takes priority over
the company default on an effective date. It uses
half-open effective periods (`from` included, `to` excluded). Holiday start and end
dates are both included. ISO weekdays are 1=Monday through 7=Sunday.

## Setup

Run the TypeORM migrations after the existing company, branch and employee tables
have been provisioned. Create one company holiday calendar, a workweek and an
attendance policy before calling the day resolver. Mutating endpoints require the
`time_configuration.manage` permission.

The repository currently supplies a development-only principal through
`x-user-id`, `x-company-id` and `x-permissions` headers. Replace it with verified
authentication before exposing these endpoints to users.

## Main endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/time-configuration/calendar` | Create the company calendar with name and IANA timezone |
| GET | `/time-configuration/calendar` | Read the company calendar |
| POST | `/time-configuration/workweeks` | Set a workweek from an effective date |
| POST | `/time-configuration/attendance-policies` | Publish an attendance policy from an effective date |
| GET | `/time-configuration/effective?date=YYYY-MM-DD&branchId=...` | Read effective workweek and policy with branch fallback |
| POST | `/time-configuration/holidays` | Create one-time or yearly holiday |
| GET | `/time-configuration/holidays?from=YYYY-MM-DD&to=YYYY-MM-DD&branchId=...` | Expand applicable holidays |
| PUT | `/time-configuration/holidays/:id` | Edit a future holiday or create a future annual version |
| PUT | `/time-configuration/holidays/:id/occurrence` | Modify or cancel one annual occurrence |
| POST | `/time-configuration/holidays/:id/cancel` | Cancel future occurrences with a reason |
| GET | `/time-configuration/day?date=YYYY-MM-DD&employeeId=...` | Resolve working day, applicable holidays, policy and assigned shift |
| POST | `/shifts` | Create shift and first version |
| POST | `/shifts/:id/versions` | Create effective-dated shift version |
| GET | `/shifts?date=YYYY-MM-DD` | List shift versions |
| POST | `/shifts/:id/branches` | Assign shift version to branch |
| POST | `/shifts/employee-assignments` | Assign shift version to employee |
| PATCH | `/shifts/branch-assignments/:id/end` | End branch assignment |
| PATCH | `/shifts/employee-assignments/:id/end` | End employee assignment |
| POST | `/shifts/:id/retire` | Retire a shift after ending active assignments |
| GET | `/shifts/employees/:employeeId?date=YYYY-MM-DD` | Resolve employee shift |

Yearly Labour Day for one branch:

```json
{
  "name": "عيد العمال",
  "branchId": "<branch UUID>",
  "recurrence": "yearly",
  "startMonth": 5,
  "startDay": 1,
  "durationDays": 1,
  "firstYear": 2026
}
```

For a company-wide holiday, omit `branchId`. For a one-time multi-day holiday,
use `recurrence: "once"` and `startDate`/`endDate`. A yearly holiday can be
rescheduled or cancelled for just one year through the occurrence endpoint.
Editing a recurring series with a later `firstYear` creates a new rule and
closes the previous rule, preserving prior occurrences.

Branch-specific holidays and branch policy/workweek overrides follow the revised
Company Setup Wizard. They extend the linked ERD, which originally defines
company-wide time configuration. The company calendar is still the base; a
branch holiday adds an applicable exception for that branch. Shifts remain
independent of policies, which resolve from company/branch and effective date.
