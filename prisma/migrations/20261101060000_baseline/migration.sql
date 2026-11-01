-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('DIRECTOR', 'ADMIN', 'SALES', 'SURVEYOR', 'WAREHOUSE', 'LEAD_TECHNICIAN', 'FIELD_RIGGER', 'SUPPORT');

-- CreateEnum
CREATE TYPE "system_type" AS ENUM ('ON_GRID', 'OFF_GRID', 'HYBRID');

-- CreateEnum
CREATE TYPE "roof_type" AS ENUM ('FLAT_RCC', 'METAL_SHEET', 'TILED', 'GROUND_MOUNT');

-- CreateEnum
CREATE TYPE "project_status" AS ENUM ('LEAD_RECEIVED', 'SURVEY_PENDING', 'SURVEY_SCHEDULED', 'SURVEY_APPROVED', 'SURVEY_REJECTED', 'QUOTATION_ISSUED', 'QUOTE_ACCEPTED', 'ORDER_CONFIRMED', 'DISPATCH_PENDING', 'MATERIAL_DISPATCHED', 'DISPATCHED', 'INSTALLATION_IN_PROGRESS', 'INSTALLATION_COMPLETED', 'COMMISSIONED', 'NET_METERING_PENDING', 'DISCOM_SYNCED', 'COMPLETED', 'ON_HOLD', 'CANCELLED');

-- CreateEnum
CREATE TYPE "component_category" AS ENUM ('PANEL', 'INVERTER', 'BATTERY', 'CHARGE_CONTROLLER', 'STRUCTURE', 'BALANCE_OF_SYSTEM', 'SAFETY_EARTHING');

-- CreateEnum
CREATE TYPE "serial_status" AS ENUM ('IN_STOCK', 'DISPATCHED', 'INSTALLED', 'FAILED_RMA', 'RETURNED_TO_VENDOR');

-- CreateEnum
CREATE TYPE "ticket_status" AS ENUM ('OPEN', 'INVESTIGATING', 'IN_PROGRESS', 'PARTS_REPLACED', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "billing_type" AS ENUM ('WARRANTY_FREE', 'BILLABLE');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "employee_code" TEXT,
    "phone" TEXT,
    "monthly_salary" DECIMAL(10,2),
    "daily_labor_rate" DECIMAL(10,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" SERIAL NOT NULL,
    "customer_code" TEXT,
    "full_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "installation_address" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_templates" (
    "id" SERIAL NOT NULL,
    "package_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity_kw" DECIMAL(6,2) NOT NULL,
    "system_type" "system_type" NOT NULL,
    "panel_count" INTEGER NOT NULL DEFAULT 0,
    "inverter_rating_kw" DECIMAL(6,2) NOT NULL,
    "battery_capacity_ah" DECIMAL(10,2),
    "base_hardware_cost" DECIMAL(12,2) NOT NULL,
    "base_labor_cost" DECIMAL(12,2) NOT NULL,
    "default_price" DECIMAL(12,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "package_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" SERIAL NOT NULL,
    "project_code" TEXT NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "status" "project_status" NOT NULL DEFAULT 'LEAD_RECEIVED',
    "capacity_kw" DECIMAL(4,2),
    "system_type" "system_type" NOT NULL,
    "agreed_price" DECIMAL(12,2),
    "package_template_id" INTEGER,
    "system_capacity_kw" DECIMAL(6,2),
    "consumer_account_number" TEXT,
    "sanctioned_load_kw" DECIMAL(8,2),
    "monthly_power_bill" DECIMAL(12,2),
    "total_quoted_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "booking_advance_paid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "dispatch_payment_paid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "final_balance_paid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "freight_cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "civil_material_cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "direct_labor_cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discom_application_number" TEXT,
    "bidirectional_meter_serial" TEXT,
    "is_grid_synchronized" BOOLEAN NOT NULL DEFAULT false,
    "grid_sync_date" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_surveys" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "surveyor_id" INTEGER NOT NULL,
    "roof_type" "roof_type" NOT NULL DEFAULT 'FLAT_RCC',
    "roof_usable_area_sqm" DECIMAL(8,2),
    "tilt_degrees" DECIMAL(4,1),
    "azimuth_degrees" DECIMAL(4,1),
    "cable_run_meters" DECIMAL(6,2),
    "sanctioned_load_kw" DECIMAL(6,2),
    "is_shadow_free" BOOLEAN NOT NULL DEFAULT true,
    "is_viable" BOOLEAN,
    "notes" TEXT,
    "surveyed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usable_area_sq_ft" DECIMAL(10,2),
    "is_south_facing" BOOLEAN NOT NULL DEFAULT true,
    "tilt_angle_deg" DECIMAL(5,2),
    "has_shading_issue" BOOLEAN NOT NULL DEFAULT false,
    "parapet_height_ft" DECIMAL(6,2),
    "dc_cable_run_mtrs" DECIMAL(8,2),
    "ac_cable_run_mtrs" DECIMAL(8,2),
    "earth_pit_viable" BOOLEAN NOT NULL DEFAULT true,
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "rejection_reason" TEXT,
    "survey_notes" TEXT,
    "survey_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_surveys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_items" (
    "id" SERIAL NOT NULL,
    "sku" TEXT NOT NULL,
    "model_name" TEXT NOT NULL,
    "category" "component_category" NOT NULL,
    "unit_cost" DECIMAL(10,2) NOT NULL,
    "quantity_on_hand" INTEGER NOT NULL DEFAULT 0,
    "warranty_months" INTEGER NOT NULL,

    CONSTRAINT "stock_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "serial_registry" (
    "id" SERIAL NOT NULL,
    "serial_number" TEXT NOT NULL,
    "stock_item_id" INTEGER NOT NULL,
    "project_id" INTEGER,
    "is_dispatched" BOOLEAN NOT NULL DEFAULT false,
    "dispatched_at" TIMESTAMPTZ(6),
    "warranty_start_date" DATE,
    "warranty_end_date" DATE,
    "status" "serial_status" NOT NULL DEFAULT 'IN_STOCK',

    CONSTRAINT "serial_registry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commissioning_records" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "lead_technician_id" INTEGER NOT NULL,
    "voc_volts_measured" DECIMAL(6,2) NOT NULL,
    "isc_amps_measured" DECIMAL(6,2) NOT NULL,
    "earthing_resistance_ohms" DECIMAL(5,2) NOT NULL,
    "completion_photo_url" TEXT NOT NULL,
    "customer_signature_svg" TEXT NOT NULL,
    "signed_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "commissioning_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "installation_records" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "lead_technician_id" INTEGER NOT NULL,
    "transit_received_at" TIMESTAMPTZ(6),
    "civil_pads_completed" BOOLEAN NOT NULL DEFAULT false,
    "grout_curing_verified" BOOLEAN NOT NULL DEFAULT false,
    "structure_torqued" BOOLEAN NOT NULL DEFAULT false,
    "dc_conduit_completed" BOOLEAN NOT NULL DEFAULT false,
    "earth_pits_completed" BOOLEAN NOT NULL DEFAULT false,
    "voc_volts" DECIMAL(8,2) NOT NULL,
    "isc_amperes" DECIMAL(8,2) NOT NULL,
    "earth_resistance_ohms" DECIMAL(8,2) NOT NULL,
    "roof_photo_url" TEXT,
    "customer_signature_svg" TEXT NOT NULL,
    "installed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "installation_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" SERIAL NOT NULL,
    "ticket_number" TEXT,
    "ticket_code" TEXT NOT NULL,
    "project_id" INTEGER NOT NULL,
    "customer_id" INTEGER,
    "serial_registry_id" INTEGER,
    "assigned_to_id" INTEGER,
    "reported_fault_code" TEXT,
    "description" TEXT,
    "is_covered_under_warranty" BOOLEAN NOT NULL DEFAULT false,
    "billable_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" "ticket_status" NOT NULL DEFAULT 'OPEN',
    "billing_type" "billing_type" NOT NULL DEFAULT 'WARRANTY_FREE',
    "reported_issue" TEXT NOT NULL,
    "faulty_serial_number" TEXT,
    "replaced_with_serial" TEXT,
    "resolution_notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_employee_code_key" ON "users"("employee_code");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "customers_customer_code_key" ON "customers"("customer_code");

-- CreateIndex
CREATE UNIQUE INDEX "customers_phone_key" ON "customers"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "package_templates_package_code_key" ON "package_templates"("package_code");

-- CreateIndex
CREATE UNIQUE INDEX "projects_project_code_key" ON "projects"("project_code");

-- CreateIndex
CREATE INDEX "projects_customer_id_idx" ON "projects"("customer_id");

-- CreateIndex
CREATE INDEX "projects_status_idx" ON "projects"("status");

-- CreateIndex
CREATE INDEX "projects_package_template_id_idx" ON "projects"("package_template_id");

-- CreateIndex
CREATE UNIQUE INDEX "site_surveys_project_id_key" ON "site_surveys"("project_id");

-- CreateIndex
CREATE INDEX "site_surveys_surveyor_id_idx" ON "site_surveys"("surveyor_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_items_sku_key" ON "stock_items"("sku");

-- CreateIndex
CREATE INDEX "stock_items_category_idx" ON "stock_items"("category");

-- CreateIndex
CREATE UNIQUE INDEX "serial_registry_serial_number_key" ON "serial_registry"("serial_number");

-- CreateIndex
CREATE INDEX "serial_registry_stock_item_id_idx" ON "serial_registry"("stock_item_id");

-- CreateIndex
CREATE INDEX "serial_registry_project_id_idx" ON "serial_registry"("project_id");

-- CreateIndex
CREATE INDEX "serial_registry_status_idx" ON "serial_registry"("status");

-- CreateIndex
CREATE UNIQUE INDEX "commissioning_records_project_id_key" ON "commissioning_records"("project_id");

-- CreateIndex
CREATE INDEX "commissioning_records_lead_technician_id_idx" ON "commissioning_records"("lead_technician_id");

-- CreateIndex
CREATE UNIQUE INDEX "installation_records_project_id_key" ON "installation_records"("project_id");

-- CreateIndex
CREATE INDEX "installation_records_lead_technician_id_idx" ON "installation_records"("lead_technician_id");

-- CreateIndex
CREATE UNIQUE INDEX "support_tickets_ticket_number_key" ON "support_tickets"("ticket_number");

-- CreateIndex
CREATE UNIQUE INDEX "support_tickets_ticket_code_key" ON "support_tickets"("ticket_code");

-- CreateIndex
CREATE INDEX "support_tickets_project_id_idx" ON "support_tickets"("project_id");

-- CreateIndex
CREATE INDEX "support_tickets_customer_id_idx" ON "support_tickets"("customer_id");

-- CreateIndex
CREATE INDEX "support_tickets_serial_registry_id_idx" ON "support_tickets"("serial_registry_id");

-- CreateIndex
CREATE INDEX "support_tickets_assigned_to_id_idx" ON "support_tickets"("assigned_to_id");

-- CreateIndex
CREATE INDEX "support_tickets_status_idx" ON "support_tickets"("status");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_package_template_id_fkey" FOREIGN KEY ("package_template_id") REFERENCES "package_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_surveys" ADD CONSTRAINT "site_surveys_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_surveys" ADD CONSTRAINT "site_surveys_surveyor_id_fkey" FOREIGN KEY ("surveyor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serial_registry" ADD CONSTRAINT "serial_registry_stock_item_id_fkey" FOREIGN KEY ("stock_item_id") REFERENCES "stock_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serial_registry" ADD CONSTRAINT "serial_registry_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissioning_records" ADD CONSTRAINT "commissioning_records_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissioning_records" ADD CONSTRAINT "commissioning_records_lead_technician_id_fkey" FOREIGN KEY ("lead_technician_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installation_records" ADD CONSTRAINT "installation_records_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installation_records" ADD CONSTRAINT "installation_records_lead_technician_id_fkey" FOREIGN KEY ("lead_technician_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_serial_registry_id_fkey" FOREIGN KEY ("serial_registry_id") REFERENCES "serial_registry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
