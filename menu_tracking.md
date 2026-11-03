# Navigation Menu Integration Tracking

This document serves as a tracking sheet for the implementation of RBAC (Role-Based Access Control) conditions and permissions across all CRM modules.

## Status Summary

### 1. Core Business Operations Scope (Excluding Analytics, Reports, System Administration, & Administration Group)

- Operational Core Items: **89**
- Fully Configured: **89**
- In Progress: **0**
- Pending Configuration: **0**
- Operational Completion Rate: **100%** 🟢

### 2. Core App Modules Scope (Excluding Analytics & Reports)

- Core Menu Items: **144**
- Fully Configured: **88**
- In Progress: **0**
- Pending Configuration: **56**
- Core Module Completion Rate: **61.1%** 🟡

### 3. Full System Scope (Including Analytics, Reports, System & General Admin)

- Total System Items: **196**
- Fully Configured: **131**
- In Progress: **0**
- Pending Configuration: **65**
- Overall System Completion Rate: **66.8%** 🟡

### Section-wise Breakdown

| Section / Module Group                                 | Total Items | Completed | Not Completed | Progress  |
| :----------------------------------------------------- | :---------: | :-------: | :-----------: | :-------: |
| **1. Dashboards Group**                                |      7      |     7     |       0       |  🟢 100%  |
| **2. Sales & CRM Group** _(incl. Analytics & Reports)_ |     71      |    61     |      10       | 🟡 85.9%  |
| **3. Marketing Group**                                 |      7      |     7     |       0       |  🟢 100%  |
| **4. Activities Group**                                |      4      |     4     |       0       |  🟢 100%  |
| **5. Presales Group**                                  |      6      |     6     |       0       |  🟢 100%  |
| **6. Project Management Group**                        |     30      |    30     |       0       |  🟢 100%  |
| **7. Quality Assurance Group**                         |      5      |     5     |       0       |  🟢 100%  |
| **8. Customer Success Group**                          |     11      |    11     |       0       |  🟢 100%  |
| **9. System Administration Group**                     |     28      |     0     |      28       |   🔴 0%   |
| **10. Administration Group**                           |     27      |     0     |      27       |   🔴 0%   |
| **TOTAL**                                              |   **196**   |  **131**  |    **65**     | **66.8%** |

---

## 1. Dashboards Group (7 items, 7 completed, 0 not completed)

| Menu / Sub-menu Label      | Path                           | Permission Code             | Status | Notes                        |
| :------------------------- | :----------------------------- | :-------------------------- | :----: | :--------------------------- |
| **Admin Dashboard**        | `/role-dashboard/admin`        | `RoleDashboard.Admin`       | `[x]`  | Fully integrated & Validated |
| **CEO Dashboard**          | `/role-dashboard/ceo`          | `RoleDashboard.CEO`         | `[x]`  | Fully integrated & Validated |
| **Delivery Dashboard**     | `/role-dashboard/delivery`     | `RoleDashboard.Delivery`    | `[x]`  | Fully integrated & Validated |
| **PM Dashboard**           | `/role-dashboard/pm`           | `RoleDashboard.PM`          | `[x]`  | Fully integrated & Validated |
| **Project Lead Dashboard** | `/role-dashboard/project-lead` | `RoleDashboard.ProjectLead` | `[x]`  | Fully integrated & Validated |
| **Test Lead Dashboard**    | `/role-dashboard/test-lead`    | `RoleDashboard.TestLead`    | `[x]`  | Fully integrated & Validated |
| **Developer Dashboard**    | `/role-dashboard/developer`    | `RoleDashboard.Developer`   | `[x]`  | Fully integrated & Validated |

---

## 2. Sales & CRM Group (71 items, 18 completed, 53 not completed)

| Menu / Sub-menu Label                    | Path                                                   | Permission Code                                                                | Status | Notes                          |
| :--------------------------------------- | :----------------------------------------------------- | :----------------------------------------------------------------------------- | :----: | :----------------------------- |
| **Leads**                                | `/marketing/leads`                                     | `Marketing.Leads`                                                              | `[x]`  | Conditioned & Validated (PASS) |
| **Company**                              | `/companies`                                           | `Companies.View`                                                               | `[x]`  | Conditioned & Validated (PASS) |
| **Contacts**                             | `/contacts`                                            | `Contacts.View`                                                                | `[x]`  | Conditioned & Validated (PASS) |
| **Deals**                                | `/Deal`                                                | `Deal.View`                                                                    | `[x]`  | Conditioned & Validated (PASS) |
| **Project Estimation**                   | `/project/estimations`                                 | `sales.project_estimation.overview`                                            | `[x]`  | Integrated & Validated (PASS)  |
| **Analytics**                            | `/analytics`                                           | `null`                                                                         | `[x]`  | Parent                         |
| ├─ **Social Media Analytics**            | `/analytics/socialmedia-report`                        | `analytic.social_media_analytics.overview`                                     | `[x]`  | Integrated & Validated (PASS)  |
| ├─ **Project Analytics**                 | `/analytics/project-analytics`                         | `analytics.project_analytics.overview`                                         | `[x]`  | Integrated & Validated (PASS)  |
| ├─ **Sales Analytics**                   | `/analytics/sales-analytics`                           | `analytics.sales_analytics.overview`                                           | `[x]`  | Integrated & Validated (PASS)  |
| ├─ **Trend & Forecast**                  | `/analytics/sales-trend`                               | `analytics.trend_forecast.overview`                                            | `[x]`  | Integrated & Validated (PASS)  |
| ├─ **Pipeline Analytics**                | `/analytics/pipeline-analytics`                        | `analytics.pipeline_analytics.overview`                                        | `[x]`  | Integrated & Validated (PASS)  |
| ├─ **Sales Performance**                 | `/analytics/sales-performance`                         | `analytics.sales_performance.overview`                                         | `[x]`  | Integrated & Validated (PASS)  |
| ├─ **Sales by Customer**                 | `/analytics/sales-by-customer`                         | `analytics.sales_by_customer.overview`                                         | `[x]`  | Integrated & Validated (PASS)  |
| ├─ **Activity Overview**                 | `/analytics/activity-overview`                         | `analytics.activity_overview.overview`                                         | `[x]`  | Integrated & Validated (PASS)  |
| ├─ **Sales KPI Dashboard**               | `/analytics/sales-kpi-dashboard`                       | `analytics.sales_kpi_dashboard.overview`                                       | `[x]`  | Integrated & Validated (PASS)  |
| ├─ **Monthly Retail Sales**              | `/analytics/monthly-retail-sales`                      | `analytics.monthly_retail_sales.overview`                                      | `[x]`  | Integrated & Validated (PASS)  |
| ├─ **Predictive Project Risk**           | `/analytics/predictive-project-risk`                   | `analytics.predictive_project_risk.overview`                                   | `[x]`  | Integrated & Validated (PASS)  |
| ├─ **Smart Resource Optimization**       | `/analytics/smart-resource-optimization`               | `analytics.smart_resource_optimization.overview`                               | `[x]`  | Integrated & Validated (PASS)  |
| ├─ **Budget & Cost Analytics**           | `/analytics/budget-cost-analytics`                     | `analytics.budget_cost_analytics.overview`                                     | `[x]`  | Integrated & Validated (PASS)  |
| ├─ **Lead Sources**                      | `/analytics/lead-sources`                              | `analytics.lead_sources.overview`                                              | `[x]`  | Integrated & Validated (PASS)  |
| ├─ **Opportunity Aging Analysis**        | `/opportunity-aging-analysis`                          | `analytics.opportunity_aging_analysis.overview`                                | `[x]`  | Integrated & Validated (PASS)  |
| ├─ **Lead Conversion Tracking**          | `/lead-conversatation-tracking`                        | `analytics.lead_conversion_tracking.overview`                                  | `[x]`  | Integrated & Validated (PASS)  |
| └─ **Revenue Forecast**                  | `/revenue-forecast`                                    | `analytics.revenue_forecast.overview`                                          | `[x]`  | Integrated & Validated (PASS)  |
| **Reports**                              | `#`                                                    | `null`                                                                         | `[x]`  | Parent                         |
| ├─ **Sales Performance**                 | `#`                                                    | `null`                                                                         | `[x]`  | Parent                         |
| │ └─ _Sales Pipeline Report_             | `/analytics/reports?report=sales-pipeline-report-perf` | `reports.sales_performance.sales_pipeline_report.overview`                     | `[x]`  | Checked via parent key         |
| ├─ **Lead and Opportunity Management**   | `#`                                                    | `null`                                                                         | `[x]`  | Parent                         |
| │ ├─ _Lead Conversion Report_            | `/analytics/reports?report=lead-conversion`            | `reports.lead_and_opportunity_management.lead_conversion_report.overview`      | `[x]`  | Checked via parent key         |
| │ ├─ _Opportunity Pipeline Report_       | `/analytics/reports?report=opp-pipeline`               | `reports.lead_and_opportunity_management.opportunity_pipeline_report.overview` | `[x]`  | Checked via parent key         |
| │ ├─ _Sales Funnel Report_               | `/analytics/reports?report=sales-funnel-report`        | `reports.lead_and_opportunity_management.sales_funnel_report.overview`         | `[x]`  | Checked via parent key         |
| │ ├─ _Lead Source Report_                | `/analytics/reports?report=lead-source`                | `reports.lead_and_opportunity_management.lead_source_reports.overview`         | `[x]`  | Checked via parent key         |
| │ └─ _Opportunity Aging Report_          | `/analytics/reports?report=opp-aging`                  | `reports.lead_and_opportunity_management.opportunity_aging_report.overview`    | `[x]`  | Checked via parent key         |
| ├─ **Customer Engagement**               | `#`                                                    | `null`                                                                         | `[x]`  | Parent                         |
| │ ├─ _Email Campaign Performance Report_ | `/analytics/reports?report=email-campaign`             | `reports.customer_engagement.email_campaign_performance_report.overview`       | `[x]`  | Checked via parent key         |
| │ └─ _Social Media Engagement Report_    | `/analytics/reports?report=social-media`               | `reports.customer_engagement.social_media_engagement_report.overview`          | `[x]`  | Checked via parent key         |
| ├─ **Marketing Effectiveness**           | `#`                                                    | `null`                                                                         | `[x]`  | Parent                         |
| │ ├─ _Lead Generation Report_            | `/analytics/reports?report=lead-generation`            | `reports.marketing_effectiveness.lead_generation_report.overview`              | `[x]`  | Checked via parent key         |
| │ └─ _Conversion Rate Report_            | `/analytics/reports?report=marketing-conversion-rate`  | `reports.marketing_effectiveness.conversion_rate_reports.overview`             | `[x]`  | Checked via parent key         |
| ├─ **Customer Retention**                | `#`                                                    | `null`                                                                         | `[x]`  | Parent                         |
| │ └─ _Customer Churn Report_             | `/analytics/reports?report=customer-churn-retention`   | `reports.customer_retention.customer_churn_report.overview`                     | `[x]`  | Checked via parent key         |
| ├─ **General Reports**                   | `#`                                                    | `null`                                                                         | `[x]`  | Parent                         |
| │ ├─ _Daily Sales Report_                | `/analytics/reports?report=daily-sales`                | `reports.general_reports.daily_sales_report.overview`                          | `[x]`  | Checked via parent key         |
| │ ├─ _Customer Churn Report_             | `/analytics/reports?report=customer-churn`             | `reports.general_reports.customer_churn_report.overview`                       | `[x]`  | Checked via parent key         |
| │ ├─ _Customer Addition Report_          | `/analytics/reports?report=customer-addition`          | `reports.general_reports.customer_addition_report.overview`                    | `[x]`  | Checked via parent key         |
| │ ├─ _Customer Retention Report_         | `/analytics/reports?report=customer-retention`         | `reports.general_reports.customer_retention_report.overview`                   | `[x]`  | Checked via parent key         |
| │ ├─ _Sales Rep Perform Report_          | `/analytics/reports?report=sales-rep-perform-gen`      | `reports.general_reports.sales_rep_perform_report.overview`                    | `[x]`  | Checked via parent key         |
| │ └─ _Lead And Opportunity Report_       | `/analytics/reports?report=lead-opp-report-gen`        | `reports.general_reports.lead_and_opportunity_report.overview`                 | `[x]`  | Checked via parent key         |
| └─ **Sales Funnel Reports**              | `#`                                                    | `null`                                                                         | `[x]`  | Parent                         |
|   ├─ _Sales Funnel Report_               | `/analytics/reports?report=sales-funnel`               | `reports.sales_funnel_report.sales_funnel_report.overview`                     | `[x]`  | Checked via parent key         |
|   ├─ _Pipeline Development Report_       | `/analytics/reports?report=pipeline-dev`               | `reports.sales_funnel_report.pipeline_development_reports.overview`            | `[x]`  | Checked via parent key         |
|   └─ _Stage Distribution CRM Report_     | `/analytics/reports?report=stage-dist`                 | `reports.sales_funnel_report.stage_distribution_crm_reports.overview`          | `[x]`  | Checked via parent key         |

---

## 3. Invoice and Billings Group (7 items, 7 completed, 0 not completed)

| Menu / Sub-menu Label     | Path                    | Permission Code   | Status | Notes                         |
| :------------------------ | :---------------------- | :---------------- | :----: | :---------------------------- |
| **POS Invoice**           | `/pos-invoices`         | `null`            | `[x]`  | Parent                        |
| ├─ _POS Billing_          | `/pos-invoices/billing` | `null`            | `[x]`  | Fast checkout register        |
| └─ _POS Invoices List_    | `/pos-invoices`         | `null`            | `[x]`  | Thermal receipts & records    |
| **Invoices**              | `/invoice`              | `null`            | `[x]`  | Parent                        |
| ├─ _List of Invoices_     | `/invoice`              | `Invoice.List`    | `[x]`  | Conditioned & Validated       |
| ├─ _Pending Invoices_     | `/invoice/pending`      | `Invoice.Pending` | `[x]`  | Conditioned & Validated       |
| └─ _Create Invoice_       | `/invoice/create`       | `null`            | `[x]`  | Invoice builder               |
| **Loyalty**               | `/loyalty/rules`        | `null`            | `[x]`  | Parent                        |
| ├─ _Loyalty Rules_        | `/loyalty/rules`        | `null`            | `[x]`  | Accrual rules & bonus rates   |
| ├─ _Loyalty Transactions_ | `/loyalty/transactions` | `null`            | `[x]`  | Ledger of points earned/spent |
| └─ _Loyalty Wallet_       | `/loyalty/wallet`       | `null`            | `[x]`  | Member tiers & balances       |
| **Payment**               | `/payment`              | `null`            | `[x]`  | Parent                        |
| └─ _List of Payments_     | `/payment`              | `null`            | `[x]`  | Direct link                   |

---

## 4. Marketing Group (7 items, 7 completed, 0 not completed)

| Menu / Sub-menu Label            | Path                                         | Permission Code                             | Status | Notes                         |
| :------------------------------- | :------------------------------------------- | :------------------------------------------ | :----: | :---------------------------- |
| **Campaigns**                    | `/marketing/campaigns`                       | `campaigns`                                 | `[x]`  | Integrated & Validated (PASS) |
| **Call Management**              | `/call-management`                           | `call_management`                           | `[x]`  | Parent                        |
| ├─ **Call Lists**                | `/call-management/call-lists`                | `call_management.call_lists`                | `[x]`  | Integrated & Validated (PASS) |
| ├─ **Call Assignment**           | `/call-management/call-assignment`           | `call_management.call_assignment`           | `[x]`  | Integrated & Validated (PASS) |
| ├─ **Today's Call List**         | `/call-management/todays-calls`              | `call_management.today_s_call_list`         | `[x]`  | Integrated & Validated (PASS) |
| ├─ **Call Summary**              | `/call-management/call-summary`              | `call_management.call_summary`              | `[x]`  | Integrated & Validated (PASS) |
| └─ **Employee Call Performance** | `/call-management/employee-call-performance` | `call_management.employee_call_performance` | `[x]`  | Integrated & Validated (PASS) |

---

## 4. Activities Group (4 items, 4 completed, 0 not completed)

| Menu / Sub-menu Label | Path                | Permission Code | Status | Notes                         |
| :-------------------- | :------------------ | :-------------- | :----: | :---------------------------- |
| **Task List**         | `/tasks/all-tasks`  | `task_list`     | `[x]`  | Integrated & Validated (PASS) |
| **Task Calendar**     | `/tasks/calendar`   | `task_calendar` | `[x]`  | Integrated & Validated (PASS) |
| **Task Status**       | `/tasks/track-task` | `task_status`   | `[x]`  | Integrated & Validated (PASS) |
| **Overdue Tasks**     | `/tasks/overdue`    | `overdue_tasks` | `[x]`  | Integrated & Validated (PASS) |

---

## 5. Presales Group (6 items, 6 completed, 0 not completed)

| Menu / Sub-menu Label    | Path                                | Permission Code                                | Status | Notes                         |
| :----------------------- | :---------------------------------- | :--------------------------------------------- | :----: | :---------------------------- |
| **Presales Document**    | `/documentations`                   | `presales_document`                            | `[x]`  | Parent                        |
| ├─ **Generate BRD**      | `/documentations/brds`              | `presales_document.generate_brd_document`      | `[x]`  | Integrated & Validated (PASS) |
| ├─ **Generate FRD**      | `/documentations/FRDs`              | `presales_document.generate_frd_document`      | `[x]`  | Integrated & Validated (PASS) |
| ├─ **Generate SRS**      | `/documentations/srs`               | `presales_document.generate_srs_document`      | `[x]`  | Integrated & Validated (PASS) |
| ├─ **Generate Scope**    | `/documentations/scope-document`    | `presales_document.generate_scope_document`    | `[x]`  | Integrated & Validated (PASS) |
| └─ **Generate Proposal** | `/documentations/proposal-document` | `presales_document.generate_proposal_document` | `[x]`  | Integrated & Validated (PASS) |

---

## 6. Project Management Group (30 items, 30 completed, 0 not completed)

| Menu / Sub-menu Label          | Path                                    | Permission Code                                     | Status | Notes                         |
| :----------------------------- | :-------------------------------------- | :-------------------------------------------------- | :----: | :---------------------------- |
| **Projects**                   | `/project`                              | `projects`                                          | `[x]`  | Parent                        |
| ├─ **Track Project**           | `/project/track`                        | `projects.track_project`                            | `[x]`  | Integrated & Validated (PASS) |
| ├─ **All Projects**            | `/project`                              | `projects.all_projects`                             | `[x]`  | Integrated & Validated (PASS) |
| ├─ **Milestone Tracker**       | `/project/Milestone-Tracker`            | `projects.milestone_tracker`                        | `[x]`  | Integrated & Validated (PASS) |
| ├─ **Milestones**              | `/project/milestones`                   | `projects.milestones`                               | `[x]`  | Integrated & Validated (PASS) |
| ├─ **Deliverables**            | `/project/deliverables`                 | `projects.deliverables`                             | `[x]`  | Integrated & Validated (PASS) |
| ├─ **Project Task Allocation** | `/project/project-task-allocation`      | `projects.project_task_allocation`                  | `[x]`  | Integrated & Validated (PASS) |
| ├─ **Predict Completion**      | `/project/predict`                      | `projects.predict_completion`                       | `[x]`  | Integrated & Validated (PASS) |
| └─ **Gantt Chart**             | `/project/gantt`                        | `projects.gantt_chart`                              | `[x]`  | Integrated & Validated (PASS) |
| **Project Plan Document**      | `#`                                     | `project_plan_document`                             | `[x]`  | Parent                        |
| ├─ **Project Initiation Doc**  | `/documentations/project-initiation`    | `project_plan_document.project_initiation_document` | `[x]`  | Integrated & Validated (PASS) |
| ├─ **Work Breakdown Struct**   | `/Document/WBS-document`                | `project_plan_document.work_break_down_structure`   | `[x]`  | Integrated & Validated (PASS) |
| ├─ **Resource Plan**           | `/documentations/resource-plan`         | `project_plan_document.resource_plan`               | `[x]`  | Integrated & Validated (PASS) |
| └─ **Project Plan Document**   | `/documentations/project-plan`          | `project_plan_document.project_plan_document`       | `[x]`  | Integrated & Validated (PASS) |
| **Design Documents**           | `#`                                     | `null`                                              | `[x]`  | Parent                        |
| ├─ **Solution Architecture**   | `/project/SAD`                          | `design_documents.solution_architecture_document`   | `[x]`  | Integrated & Validated (PASS) |
| ├─ **SOW Document**            | `/Document/SOW-document`                | `design_documents.sow_document`                     | `[x]`  | Integrated & Validated (PASS) |
| ├─ **HLD Document**            | `/Document/HLD-document`                | `design_documents.hld_document`                     | `[x]`  | Integrated & Validated (PASS) |
| ├─ **LLD Document**            | `/Document/LLD-document`                | `design_documents.lld_document`                     | `[x]`  | Integrated & Validated (PASS) |
| └─ **Database Design**         | `/project/database-design`              | `design_documents.database_design_document`         | `[x]`  | Integrated & Validated (PASS) |
| **Resource Management**        | `/resource-master`                      | `null`                                              | `[x]`  | Parent                        |
| ├─ **Resource List**           | `/resource-master/resource-list`        | `resource_management.resource_list`                 | `[x]`  | Integrated & Validated (PASS) |
| ├─ **Resource Allocation**     | `/resource-master/resource-allocation`  | `resource_management.resource_allocation`           | `[x]`  | Integrated & Validated (PASS) |
| ├─ **Resource Utilisation**    | `/resource-master/resource-utilisation` | `resource_management.resource_utilisation`          | `[x]`  | Integrated & Validated (PASS) |
| └─ **Resource Tracking**       | `/resource-master/resource-tracking`    | `resource_management.resource_tracking`             | `[x]`  | Integrated & Validated (PASS) |
| **Sprint**                     | `/project/sprint`                       | `sprint`                                            | `[x]`  | Integrated & Validated (PASS) |
| **Timesheet**                  | `/timesheet`                            | `timesheet`                                         | `[x]`  | Integrated & Validated (PASS) |
| **Scrum Meeting**              | `/Scrum-Meetings`                       | `scrum_meeting`                                     | `[x]`  | Integrated & Validated (PASS) |
| **Bench Management**           | `/administration/bench-management`      | `bench_management`                                  | `[x]`  | Integrated & Validated (PASS) |
| **Competitor Tracking**        | `/administration/competitor-tracking`   | `competitor_tracking`                               | `[x]`  | Integrated & Validated (PASS) |

---

## 7. Quality Assurance Group (5 items, 5 completed, 0 not completed)

| Menu / Sub-menu Label | Path                         | Permission Code | Status | Notes                         |
| :-------------------- | :--------------------------- | :-------------- | :----: | :---------------------------- |
| **Test Plan**         | `/project/test-plan`         | `test_plan`     | `[x]`  | Integrated & Validated (PASS) |
| **Test Case**         | `/project/test-case`         | `test_case`     | `[x]`  | Integrated & Validated (PASS) |
| **Defects**           | `/defect-management/defects` | `defects`       | `[x]`  | Integrated & Validated (PASS) |
| **SLA**               | `/project/sla`               | `sla`           | `[x]`  | Integrated & Validated (PASS) |
| **Test Reports**      | `#`                          | `test_reports`  | `[x]`  | Integrated                    |

---

## 8. Customer Success Group (11 items, 11 completed, 0 not completed)

| Menu / Sub-menu Label           | Path                                         | Permission Code                             | Status | Notes                         |
| :------------------------------ | :------------------------------------------- | :------------------------------------------ | :----: | :---------------------------- |
| **Service & Support**           | `#`                                          | `service_support`                           | `[x]`  | Parent                        |
| ├─ **Tickets**                  | `/tickets`                                   | `service_support.tickets`                   | `[x]`  | Integrated & Validated (PASS) |
| ├─ **Incident**                 | `/Settings/Incident`                         | `service_support.incident`                  | `[x]`  | Integrated & Validated (PASS) |
| └─ **Knowledge Base**           | `/Settings/knowledge-base`                   | `service_support.knowledge_base`            | `[x]`  | Integrated & Validated (PASS) |
| **Customer Success**            | `/customer-success`                          | `customer_success`                          | `[x]`  | Parent                        |
| ├─ **Customer Retention**       | `/customer-success/customer-retention`       | `customer_success.customer_retention`       | `[x]`  | Integrated & Validated (PASS) |
| ├─ **Customer Retention Setup** | `/customer-success/customer-retention-setup` | `customer_success.customer_retention_setup` | `[x]`  | Integrated & Validated (PASS) |
| ├─ **Client Onboarding**        | `/customer-success/client-onboarding`        | `customer_success.client_onboarding`        | `[x]`  | Integrated & Validated (PASS) |
| └─ **Customer Churn**           | `/Settings/Customer_churn`                   | `customer_success.customer_churn`           | `[x]`  | Integrated & Validated (PASS) |
| **Feedback Management**         | `/feedback-management`                       | `feedback_management`                       | `[x]`  | Parent                        |
| └─ **Feedbacks**                | `/feedback-management/feedbacks`             | `feedback_management.feedbacks`             | `[x]`  | Integrated & Validated (PASS) |

---

## 9. System Administration Group (28 items, 28 completed, 0 not completed)

| Menu / Sub-menu Label        | Path                              | Permission Code                | Status | Notes                         |
| :--------------------------- | :-------------------------------- | :----------------------------- | :----: | :---------------------------- |
| **Asset List**               | `/assets/list`                    | `Assets.List`                  | `[x]`  | Integrated & Validated (PASS) |
| **Asset Vendor**             | `/assets/vendor`                  | `Assets.List`                  | `[x]`  | Integrated & Validated (PASS) |
| **Assets Request**           | `/assets/request`                 | `Assets.Request`               | `[x]`  | Integrated & Validated (PASS) |
| **Assets Allocation**        | `/assets/allocation`              | `Assets.Allocation`            | `[x]`  | Integrated & Validated (PASS) |
| **Asset Maintenance**        | `/assets/maintenance`             | `Assets.Maintenance`           | `[x]`  | Integrated & Validated (PASS) |
| **Customization**            | ``                                | `null`                         | `[x]`  | Parent                        |
| ├─ **Customize Forms**       | `/customization/customize-forms`  | `null`                         | `[x]`  | Integrated & Validated (PASS) |
| └─ **Templates**             | `/Templates`                      | `null`                         | `[x]`  | Integrated & Validated (PASS) |
| **Roles & Users**            | ``                                | `null`                         | `[x]`  | Parent                        |
| ├─ **Roles**                 | `/system/roles`                   | `null`                         | `[x]`  | Integrated & Validated (PASS) |
| ├─ **User Management**       | `#`                               | `null`                         | `[x]`  | Parent                        |
| │ ├─ _User List_             | `/user-management/user-list`      | `null`                         | `[x]`  | Integrated & Validated (PASS) |
| │ ├─ _Teams_                 | `/system/teams`                   | `null`                         | `[x]`  | Integrated & Validated (PASS) |
| │ └─ _User Groups_           | `/system/user-groups`             | `null`                         | `[x]`  | Integrated & Validated (PASS) |
| └─ **User History**          | `/system/user-history`            | `null`                         | `[x]`  | Integrated & Validated (PASS) |
| **Settings**                 | `/Settings`                       | `null`                         | `[x]`  | Parent                        |
| ├─ **Deal Factor**           | `/Settings/deal-factor-setup`     | `Settings.DealFactor`          | `[x]`  | Integrated & Validated (PASS) |
| ├─ **Deal Prediction**       | `/Settings/deal-prediction`       | `Settings.DealPrediction`      | `[x]`  | Integrated & Validated (PASS) |
| ├─ **Deal Prediction Setup** | `/Settings/deal-prediction-setup` | `Settings.DealPredictionSetup` | `[x]`  | Integrated & Validated (PASS) |
| ├─ **Deal Probability**      | `/Settings/deal-probability`      | `Settings.DealProbability`     | `[x]`  | Integrated & Validated (PASS) |
| ├─ **Deal Weightage**        | `/Settings/deal-weightage`        | `Settings.DealWeightage`       | `[x]`  | Integrated & Validated (PASS) |
| ├─ **Privileges**            | `/Settings/privileges`            | `Settings.Privileges`          | `[x]`  | Integrated & Validated (PASS) |
| ├─ **Map Settings**          | `/Settings/map-setting`           | `null`                         | `[x]`  | Integrated & Validated (PASS) |
| ├─ **Mail Box Settings**     | `/Settings/mail-box-setting`      | `null`                         | `[x]`  | Integrated & Validated (PASS) |
| ├─ **LinkedIn Settings**     | `/Settings/linkedin-setting`      | `null`                         | `[x]`  | Integrated & Validated (PASS) |
| ├─ **Facebook Setting**      | `/Settings/facebook-setting`      | `null`                         | `[x]`  | Integrated & Validated (PASS) |
| ├─ **Instagram Setting**     | `/Settings/instagram-setting`     | `null`                         | `[x]`  | Integrated & Validated (PASS) |
| └─ **Notification Rule**     | `/Settings/notification-rule`     | `null`                         | `[x]`  | Integrated & Validated (PASS) |

---

## 10. Administration Group (27 items, 27 completed, 0 not completed)

| Menu / Sub-menu Label             | Path                                            | Permission Code                    | Status | Notes                         |
| :-------------------------------- | :---------------------------------------------- | :--------------------------------- | :----: | :---------------------------- |
| **Workflow Rules**                | `/workflow-rule`                                | `Administration.WorkflowRules`     | `[x]`  | Integrated & Validated (PASS) |
| ├─ **Workflow Modules**           | `/workflow-rule/workflow-module`                | `null`                             | `[x]`  | Governed by parent            |
| ├─ **Workflow Events**            | `/workflow-rule/workflow-event`                 | `null`                             | `[x]`  | Governed by parent            |
| ├─ **Workflow Rules**             | `/workflow-rule/workflow-rule-creation`         | `null`                             | `[x]`  | Governed by parent            |
| ├─ **Conditions**                 | `/workflow-rule/workflow-condition`             | `null`                             | `[x]`  | Governed by parent            |
| ├─ **Actions**                    | `/workflow-rule/workflow-action`                | `null`                             | `[x]`  | Governed by parent            |
| ├─ **Email Templates**            | `/workflow-rule/email-template`                 | `null`                             | `[x]`  | Governed by parent            |
| ├─ **Notification Templates**     | `/workflow-rule/workflow-notification-template` | `null`                             | `[x]`  | Governed by parent            |
| ├─ **Notifications**              | `/workflow-rule/workflow-notification`          | `null`                             | `[x]`  | Governed by parent            |
| ├─ **Executions**                 | `/workflow-rule/workflow-execution`             | `null`                             | `[x]`  | Governed by parent            |
| └─ **Notification Logs**          | `/workflow-rule/workflow-notification-log`      | `null`                             | `[x]`  | Governed by parent            |
| **Lead Scoring**                  | `/administration/lead-score`                    | `Administration.LeadScore`         | `[x]`  | Integrated & Validated (PASS) |
| **Organisation**                  | `/administration/organisation`                  | `null`                             | `[x]`  | Integrated & Validated (PASS) |
| **Add-ons**                       | `/add-ons`                                      | `null`                             | `[x]`  | Parent                        |
| ├─ **Add-on Purchase Request**    | `/add-ons/add-on-purchase`                      | `null`                             | `[x]`  | Integrated & Validated (PASS) |
| ├─ **Additional Storage Request** | `/add-ons/additional-storage`                   | `null`                             | `[x]`  | Integrated & Validated (PASS) |
| ├─ **Renewal Request**            | `/add-ons/renewal-request`                      | `null`                             | `[x]`  | Integrated & Validated (PASS) |
| └─ **Add or Reduce Users**        | `/add-ons/add-reduce-users`                     | `null`                             | `[x]`  | Integrated & Validated (PASS) |
| **Problem Management**            | `/problem-management`                           | `null`                             | `[x]`  | Parent                        |
| ├─ **Problem**                    | `/problem-management/problem`                   | `null`                             | `[x]`  | Integrated & Validated (PASS) |
| ├─ **Problem Category**           | `/problem-management/problem-category`          | `null`                             | `[x]`  | Integrated & Validated (PASS) |
| └─ **Troubleshoot Guide**         | `/problem-management/troubleshoot-guide`        | `null`                             | `[x]`  | Integrated & Validated (PASS) |
| **Customer Segmentation**         | `/customer-segmentation`                        | `Settings.CustomerSegmentation`    | `[x]`  | Integrated & Validated (PASS) |
| **Dropdown Values**               | `/dropdown-values`                              | `Settings.DropdownValues`          | `[x]`  | Integrated & Validated (PASS) |
| **Notification Preferences**      | `/notification-preference`                      | `Settings.NotificationPreferences` | `[x]`  | Integrated & Validated (PASS) |
| **Notification Rule**             | `/Settings/notification-rule`                   | `null`                             | `[x]`  | Integrated & Validated (PASS) |
| **Payment Terms & Conditions**    | `/Settings/payment-terms`                       | `null`                             | `[x]`  | Integrated & Validated (PASS) |
