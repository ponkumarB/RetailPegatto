# Navigation Menu Structure (Active & Valid Items)

This document lists all active and valid sidebar menu groups, items, sub-items, and their permission codes as defined in [Navigation.tsx](file:///d:/abdul/GIT/NEXT_pegatto/New%20folder/nextjs-pegatto/src/components/layout/Navigation.tsx) (commented-out items are excluded).

---

## 1. Dashboards

- **Admin Dashboard**
  - Path: `/role-dashboard/admin`
  - Permission: `RoleDashboard.Admin`
- **CEO Dashboard**
  - Path: `/role-dashboard/ceo`
  - Permission: `RoleDashboard.CEO`
- **Delivery Dashboard**
  - Path: `/role-dashboard/delivery`
  - Permission: `RoleDashboard.Delivery`
- **PM Dashboard**
  - Path: `/role-dashboard/pm`
  - Permission: `RoleDashboard.PM`
- **Project Lead Dashboard**
  - Path: `/role-dashboard/project-lead`
  - Permission: `RoleDashboard.ProjectLead`
- **Test Lead Dashboard**
  - Path: `/role-dashboard/test-lead`
  - Permission: `RoleDashboard.TestLead`
- **Developer Dashboard**
  - Path: `/role-dashboard/developer`
  - Permission: `RoleDashboard.Developer`

---

## 2. Sales & CRM

- **Leads**
  - Path: `/marketing/leads`
  - Permission: `Marketing.Leads`
- **Company**
  - Path: `/companies`
  - Permission: `Companies.View`
- **Contacts**
  - Path: `/contacts`
  - Permission: `Contacts.View`
- **Deals**
  - Path: `/Deal`
  - Permission: `Deal.View`
- **Project Estimation**
  - Path: `/project/estimations`
  - Permission: `sales.project_estimation.overview`

---

## 3. Invoice and Billings

- **POS Invoice** (Permission: `null`)
  - **POS Billing**
    - Path: `/pos-invoices/billing`
    - Permission: `null`
  - **POS Invoices List**
    - Path: `/pos-invoices`
    - Permission: `null`
- **Invoices** (Permission: `null`)
  - **List of Invoices**
    - Path: `/invoice`
    - Permission: `Invoice.List`
  - **Pending Invoices**
    - Path: `/invoice/pending`
    - Permission: `Invoice.Pending`
  - **Create Invoice**
    - Path: `/invoice/create`
    - Permission: `null`
- **Loyalty** (Permission: `null`)
  - **Loyalty Rules**
    - Path: `/loyalty/rules`
    - Permission: `null`
  - **Loyalty Transactions**
    - Path: `/loyalty/transactions`
    - Permission: `null`
  - **Loyalty Wallet**
    - Path: `/loyalty/wallet`
    - Permission: `null`
- **Payment** (Permission: `null`)
  - **List of Payments**
    - Path: `/payment`
    - Permission: `null`
- **Analytics** (Permission: `null`)
  - **Social Media Analytics**
    - Path: `/analytics/socialmedia-report`
    - Permission: `Analytics.SocialMedia`
  - **Project Analytics**
    - Path: `/analytics/project-analytics`
    - Permission: `Analytics.Project`
  - **Sales Analytics**
    - Path: `/analytics/sales-analytics`
    - Permission: `Analytics.Sales`
  - **Trend & Forecast**
    - Path: `/analytics/sales-trend`
    - Permission: `Analytics.Trend`
  - **Pipeline Analytics**
    - Path: `/analytics/pipeline-analytics`
    - Permission: `Analytics.Pipeline`
  - **Sales Performance**
    - Path: `/analytics/sales-performance`
    - Permission: `Analytics.Performance`
  - **Sales by Customer** (Path: `/analytics/sales-by-customer`, Permission: `null`)
  - **Activity Overview** (Path: `/analytics/activity-overview`, Permission: `null`)
  - **Sales KPI Dashboard** (Path: `/analytics/sales-kpi-dashboard`, Permission: `null`)
  - **Monthly Retail Sales** (Path: `/analytics/monthly-retail-sales`, Permission: `null`)
  - **Predictive Project Risk** (Path: `/analytics/predictive-project-risk`, Permission: `null`)
  - **Smart Resource Optimization** (Path: `/analytics/smart-resource-optimization`, Permission: `null`)
  - **Budget & Cost Analytics** (Path: `/analytics/budget-cost-analytics`, Permission: `null`)
  - **Lead Sources** (Path: `/analytics/lead-sources`, Permission: `null`)
  - **Opportunity Aging Analysis**
    - Path: `/opportunity-aging-analysis`
    - Permission: `Settings.OpportunityAgingAnalysis`
  - **Lead Conversion Tracking**
    - Path: `/lead-conversatation-tracking`
    - Permission: `Settings.LeadConversionTracking`
  - **Revenue Forecast**
    - Path: `/revenue-forecast`
    - Permission: `Settings.RevenueForecast`
- **Reports** (Path: `#`, Permission: `Forecasts.View`)
  - **Sales Performance** (Path: `#`)
    - **Sales Pipeline Report** (Path: `/analytics/reports?report=sales-pipeline-report-perf`)
  - **Lead and Opportunity Management** (Path: `#`)
    - **Lead Conversion Report** (Path: `/analytics/reports?report=lead-conversion`)
    - **Opportunity Pipeline Report** (Path: `/analytics/reports?report=opp-pipeline`)
    - **Sales Funnel Report** (Path: `/analytics/reports?report=sales-funnel-report`)
    - **Lead Source Report** (Path: `/analytics/reports?report=lead-source`)
    - **Opportunity Aging Report** (Path: `/analytics/reports?report=opp-aging`)
  - **Customer Engagement** (Path: `#`)
    - **Email Campaign Performance Report** (Path: `/analytics/reports?report=email-campaign`)
    - **Social Media Engagement Report** (Path: `/analytics/reports?report=social-media`)
  - **Marketing Effectiveness** (Path: `#`)
    - **Lead Generation Report** (Path: `/analytics/reports?report=lead-generation`)
    - **Conversion Rate Report** (Path: `/analytics/reports?report=marketing-conversion-rate`)
  - **Customer Retention** (Path: `#`)
    - **Customer Churn Report** (Path: `/analytics/reports?report=customer-churn-retention`)
  - **General Reports** (Path: `#`)
    - **Daily Sales Report** (Path: `/analytics/reports?report=daily-sales`)
    - **Customer Churn Report** (Path: `/analytics/reports?report=customer-churn`)
    - **Customer Addition Report** (Path: `/analytics/reports?report=customer-addition`)
    - **Customer Retention Report** (Path: `/analytics/reports?report=customer-retention`)
    - **Sales Rep Perform Report** (Path: `/analytics/reports?report=sales-rep-perform-gen`)
    - **Lead And Opportunity Report** (Path: `/analytics/reports?report=lead-opp-report-gen`)
  - **Sales Funnel Reports** (Path: `#`)
    - **Sales Funnel Report** (Path: `/analytics/reports?report=sales-funnel`)
    - **Pipeline Development Report** (Path: `/analytics/reports?report=pipeline-dev`)
    - **Stage Distribution CRM Report** (Path: `/analytics/reports?report=stage-dist`)

---

## Orders Management

- **Orders Management** (Permission: `null`)
  - **Customer Enquiry**
    - Path: `/sales/customer-enquiry`
    - Permission: `OrderManagement.CustomerEnquiry`
  - **Quotation**
    - Path: `/sales/quotation`
    - Permission: `OrderManagement.Quotation`
  - **Sales Order**
    - Path: `/sales/sales-order`
    - Permission: `OrderManagement.SalesOrder`
  - **Schedule**
    - Path: `/sales/schedule`
    - Permission: `OrderManagement.Schedule`
  - **Shipment**
    - Path: `/sales/shipment`
    - Permission: `OrderManagement.Shipment`
  - **Shipment Calendar**
    - Path: `/sales/shipment-calendar`
    - Permission: `OrderManagement.ShipmentCalender`
  - **Delivery Confirmation**
    - Path: `/sales/delivery-confirmation`
    - Permission: `OrderManagement.DeliveryConfirmation`
  - **Invoice**
    - Path: `/invoice`
    - Permission: `OrderManagement.Invoice`
  - **Payments**
    - Path: `/payment`
    - Permission: `OrderManagement.Payments`

---

## Offers Management

- **Offers Management** (Permission: `null`)
  - **Offers**
    - Path: `/offers-management`
    - Permission: `PriceManagement.Offers`
  - **Product Price**
    - Path: `/sales-Manage-price`
    - Permission: `PriceManagement.ProductPrice`
  - **Discount**
    - Path: `/sales-discount`
    - Permission: `PriceManagement.Discount`
  - **Coupons**
    - Path: `/coupons`
    - Permission: `InvoiceBilling.Coupons`

---

## 3. Marketing

- **Campaigns**
  - Path: `/marketing/campaigns`
  - Permission: `Marketing.Campaigns`
- **Call Management** (Path: `/call-management`, Permission: `null`)
  - **Call Lists** (Path: `/call-management/call-lists`)
  - **Call Assignment** (Path: `/call-management/call-assignment`)
  - **Today's Call List** (Path: `/call-management/todays-calls`)
  - **Call Summary** (Path: `/call-management/call-summary`)
  - **Employee Call Performance** (Path: `/call-management/employee-call-performance`)

---

## 4. Activities

- **Task List**
  - Path: `/tasks/all-tasks`
  - Permission: `Tasks.All`
- **Task Calendar**
  - Path: `/tasks/calendar`
  - Permission: `Tasks.Calendar`
- **Task Status**
  - Path: `/tasks/track-task`
  - Permission: `Tasks.Track`
- **Overdue Tasks**
  - Path: `/tasks/overdue`
  - Permission: `Tasks.Overdue`

---

## 5. Presales

- **Presales Document** (Path: `/documentations`, Permission: `null`)
  - **Generate BRD Document**
    - Path: `/documentations/brds`
    - Permission: `Documentations.BRD`
  - **Generate FRD Document**
    - Path: `/documentations/FRDs`
    - Permission: `Documentations.FRD`
  - **Generate SRS Document**
    - Path: `/documentations/srs`
    - Permission: `Documentations.SRS`
  - **Generate Scope Document**
    - Path: `/documentations/scope-document`
    - Permission: `Documentations.Scope`
  - **Generate Proposal Document**
    - Path: `/documentations/proposal-document`
    - Permission: `Documentations.Proposal`

---

## 6. Project Management

- **Projects** (Path: `/project`, Permission: `null`)
  - **Track Project**
    - Path: `/project/track`
    - Permission: `Projects.Track`
  - **All Projects**
    - Path: `/project`
    - Permission: `Projects.All`
  - **Milestone Tracker**
    - Path: `/project/Milestone-Tracker`
    - Permission: `Projects.MilestoneTracker`
  - **Milestones**
    - Path: `/project/milestones`
    - Permission: `Projects.Milestones`
  - **Deliverables**
    - Path: `/project/deliverables`
    - Permission: `Projects.Milestones`
  - **Project Task Allocation**
    - Path: `/project/project-task-allocation`
    - Permission: `Projects.ProjectTaskAllocation`
  - **Predict Completion** (Path: `/project/predict`, Permission: `null`)
  - **Gantt Chart**
    - Path: `/project/gantt`
    - Permission: `Projects.Gantt`
- **Project Plan Document** (Path: `#`, Permission: `null`)
  - **Project Initiation Document**
    - Path: `/documentations/project-initiation`
    - Permission: `Documentations.BRD`
  - **Work Break down Structure**
    - Path: `/Document/WBS-document`
    - Permission: `Documentations.WBS`
  - **Resource Plan**
    - Path: `/documentations/resource-plan`
    - Permission: `Documentations.SRS`
  - **Project Plan Document**
    - Path: `/documentations/project-plan`
    - Permission: `Documentations.FRD`
- **Design Documents** (Path: `#`, Permission: `null`)
  - **Solution Architecture Document**
    - Path: `/project/SAD`
    - Permission: `Documentations.BRD`
  - **SOW Document**
    - Path: `/Document/SOW-document`
    - Permission: `Documentations.SOW`
  - **HLD Document**
    - Path: `/Document/HLD-document`
    - Permission: `Documentations.FRD`
  - **LLD Document**
    - Path: `/Document/LLD-document`
    - Permission: `Documentations.SRS`
  - **Database Design Document**
    - Path: `/project/database-design`
    - Permission: `Documentations.SRS`
- **Resource Management** (Path: `/resource-master`, Permission: `null`)
  - **Resource List**
    - Path: `/resource-master/resource-list`
    - Permission: `Resource.List`
  - **Resource Allocation** (Path: `/resource-master/resource-allocation`, Permission: `null`)
  - **Resource Utilisation**
    - Path: `/resource-master/resource-utilisation`
    - Permission: `Resource.Utilisation`
  - **Resource Tracking**
    - Path: `/resource-master/resource-tracking`
    - Permission: `Resource.Tracking`
- **Sprint**
  - Path: `/project/sprint`
  - Permission: `Projects.Sprint`
- **Timesheet**
  - Path: `/timesheet`
  - Permission: `Timesheets.View`
- **Scrum Meeting**
  - Path: `/Scrum-Meetings`
  - Permission: `ScrumMeetings.View`

---

## 7. Quality Assurance

- **Test Plan**
  - Path: `/project/test-plan`
  - Permission: `Projects.TestPlan`
- **Test Case**
  - Path: `/project/test-case`
  - Permission: `Projects.TestCase`
- **Defects**
  - Path: `/defect-management/defects`
  - Permission: `Defect.View`
- **SLA**
  - Path: `/project/sla`
  - Permission: `null`
- **Test Reports**
  - Path: `#`
  - Permission: `null`

---

## 8. Customer Success

- **Service & Support** (Path: `#`, Permission: `null`)
  - **Tickets**
    - Path: `/tickets`
    - Permission: `Tickets.View`
  - **Incident**
    - Path: `/Settings/Incident`
    - Permission: `Settings.Incident`
- **Customer Success** (Path: `/customer-success`, Permission: `null`)
  - **Customer Retention**
    - Path: `/customer-success/customer-retention`
    - Permission: `CustomerSuccess.Retention`
  - **Customer Retention Setup**
    - Path: `/customer-success/customer-retention-setup`
    - Permission: `CustomerSuccess.Setup`
  - **Client Onboarding**
    - Path: `/customer-success/client-onboarding`
    - Permission: `CustomerSuccess.Onboarding`
  - **Customer Churn**
    - Path: `/Settings/Customer_churn`
    - Permission: `Settings.CustomerChurn`
- **Feedback Management** (Path: `/feedback-management`, Permission: `null`)
  - **Feedbacks**
    - Path: `/feedback-management/feedbacks`
    - Permission: `Feedback.View`

---

## 9. System Administration

- **Asset List**
  - Path: `/assets/list`
  - Permission: `Assets.List`
- **Asset Vendor**
  - Path: `/assets/vendor`
  - Permission: `Assets.List`
- **Assets Request**
  - Path: `/assets/request`
  - Permission: `Assets.Request`
- **Assets Allocation**
  - Path: `/assets/allocation`
  - Permission: `Assets.Allocation`
- **Asset Maintenance**
  - Path: `/assets/maintenance`
  - Permission: `Assets.Maintenance`
- **Customization** (Path: ``, Permission: `null`)
  - **Customize Forms** (Path: `/customization/customize-forms`)
  - **Templates** (Path: `/Templates`)
- **Roles & Users** (Path: ``, Permission: `null`)
  - **Roles**
    - Path: `/system/roles`
  - **User Management** (Path: `#`, Permission: `null`)
    - **User List** (Path: `/user-management/user-list`, Permission: `null`)
    - **Teams** (Path: `/system/teams`, Permission: `null`)
    - **User Groups** (Path: `/system/user-groups`, Permission: `null`)
  - **User History**
    - Path: `/system/user-history`
- **Settings** (Path: `/Settings`, Permission: `null`)
  - **Deal Factor**
    - Path: `/Settings/deal-factor-setup`
    - Permission: `Settings.DealFactor`
  - **Deal Prediction**
    - Path: `/Settings/deal-prediction`
    - Permission: `Settings.DealPrediction`
  - **Deal Prediction Setup**
    - Path: `/Settings/deal-prediction-setup`
    - Permission: `Settings.DealPredictionSetup`
  - **Deal Probability**
    - Path: `/Settings/deal-probability`
    - Permission: `Settings.DealProbability`
  - **Deal Weightage**
    - Path: `/Settings/deal-weightage`
    - Permission: `Settings.DealWeightage`
  - **Privileges**
    - Path: `/Settings/privileges`
    - Permission: `Settings.Privileges`
  - **Map Settings** (Path: `/Settings/map-setting`)
  - **Mail Box Settings** (Path: `/Settings/mail-box-setting`)
  - **LinkedIn Settings** (Path: `/Settings/linkedin-setting`)
  - **Facebook Setting** (Path: `/Settings/facebook-setting`)
  - **Instagram Setting** (Path: `/Settings/instagram-setting`)
  - **Notification Rule** (Path: `/Settings/notification-rule`)

---

## 10. Analytics

- **Reports**
  - Path: `#`
  - Permission: `null`

---

## 11. Administration

- **Workflow Rules** (Path: `/workflow-rule`, Permission: `Administration.WorkflowRules`)
  - **Workflow Modules** (Path: `/workflow-rule/workflow-module`)
  - **Workflow Events** (Path: `/workflow-rule/workflow-event`)
  - **Workflow Rules** (Path: `/workflow-rule/workflow-rule-creation`)
  - **Conditions** (Path: `/workflow-rule/workflow-condition`)
  - **Actions** (Path: `/workflow-rule/workflow-action`)
  - **Email Templates** (Path: `/workflow-rule/email-template`)
  - **Notification Templates** (Path: `/workflow-rule/workflow-notification-template`)
  - **Notifications** (Path: `/workflow-rule/workflow-notification`)
  - **Executions** (Path: `/workflow-rule/workflow-execution`)
  - **Notification Logs** (Path: `/workflow-rule/workflow-notification-log`)
- **Lead Scoring**
  - Path: `/administration/lead-score`
  - Permission: `Administration.LeadScore`
- **Organisation**
  - Path: `/administration/organisation`
  - Permission: `null`
- **Bench Management**
  - Path: `/administration/bench-management`
  - Permission: `null`
- **Competitor Tracking**
  - Path: `/administration/competitor-tracking`
  - Permission: `null`
- **Add-ons** (Path: `/add-ons`, Permission: `null`)
  - **Add-on Purchase Request** (Path: `/add-ons/add-on-purchase`)
  - **Additional Storage Request** (Path: `/add-ons/additional-storage`)
  - **Renewal Request** (Path: `/add-ons/renewal-request`)
  - **Add or Reduce Users** (Path: `/add-ons/add-reduce-users`)
- **Problem Management** (Path: `/problem-management`, Permission: `null`)
  - **Problem** (Path: `/problem-management/problem`)
  - **Problem Category** (Path: `/problem-management/problem-category`)
  - **Troubleshoot Guide** (Path: `/problem-management/troubleshoot-guide`)
- **Customer Segmentation**
  - Path: `/customer-segmentation`
  - Permission: `Settings.CustomerSegmentation`
- **Dropdown Values**
  - Path: `/dropdown-values`
  - Permission: `Settings.DropdownValues`
- **Notification Preferences**
  - Path: `/notification-preference`
  - Permission: `Settings.NotificationPreferences`
- **Notification Rule**
  - Path: `/Settings/notification-rule`
  - Permission: `null`
- **Payment Terms & Conditions**
  - Path: `/Settings/payment-terms`
  - Permission: `null`
