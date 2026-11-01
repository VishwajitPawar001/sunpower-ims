-- PROJECTS
ALTER TABLE "projects"
ADD CONSTRAINT "projects_capacity_kw_check"
CHECK ("capacity_kw" > 0);

ALTER TABLE "projects"
ADD CONSTRAINT "projects_agreed_price_check"
CHECK ("agreed_price" IS NULL OR "agreed_price" >= 0);


-- SITE SURVEYS
ALTER TABLE "site_surveys"
ADD CONSTRAINT "site_surveys_roof_area_check"
CHECK ("roof_usable_area_sqm" >= 0);

ALTER TABLE "site_surveys"
ADD CONSTRAINT "site_surveys_tilt_check"
CHECK ("tilt_degrees" BETWEEN 0 AND 90);

ALTER TABLE "site_surveys"
ADD CONSTRAINT "site_surveys_azimuth_check"
CHECK ("azimuth_degrees" BETWEEN 0 AND 360);

ALTER TABLE "site_surveys"
ADD CONSTRAINT "site_surveys_cable_run_check"
CHECK ("cable_run_meters" >= 0);

ALTER TABLE "site_surveys"
ADD CONSTRAINT "site_surveys_sanctioned_load_check"
CHECK ("sanctioned_load_kw" >= 0);


-- STOCK ITEMS
ALTER TABLE "stock_items"
ADD CONSTRAINT "stock_items_unit_cost_check"
CHECK ("unit_cost" >= 0);

ALTER TABLE "stock_items"
ADD CONSTRAINT "stock_items_quantity_check"
CHECK ("quantity_on_hand" >= 0);

ALTER TABLE "stock_items"
ADD CONSTRAINT "stock_items_warranty_months_check"
CHECK ("warranty_months" >= 0);


-- COMMISSIONING RECORDS
ALTER TABLE "commissioning_records"
ADD CONSTRAINT "commissioning_earthing_resistance_check"
CHECK ("earthing_resistance_ohms" >= 0);


-- SUPPORT TICKETS
ALTER TABLE "support_tickets"
ADD CONSTRAINT "support_tickets_billable_amount_check"
CHECK ("billable_amount" >= 0);