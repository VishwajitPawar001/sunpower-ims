-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('ADMIN', 'SALES', 'SURVEYOR', 'WAREHOUSE', 'TECHNICIAN', 'SUPPORT');

-- CreateEnum
CREATE TYPE "project_status" AS ENUM ('LEAD_RECEIVED', 'SURVEY_PENDING', 'SURVEY_APPROVED', 'REJECTED', 'QUOTE_ISSUED', 'ORDER_CONFIRMED', 'DISPATCHED', 'COMMISSIONED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "system_type" AS ENUM ('ON_GRID', 'OFF_GRID');

-- CreateEnum
CREATE TYPE "component_type" AS ENUM ('PANEL', 'INVERTER', 'BATTERY', 'STRUCTURE', 'BALANCE_OF_SYSTEM');

-- CreateEnum
CREATE TYPE "warranty_status" AS ENUM ('ACTIVE', 'EXPIRED', 'VOID');

-- CreateEnum
CREATE TYPE "ticket_status" AS ENUM ('OPEN', 'INVESTIGATING', 'PARTS_REPLACED', 'RESOLVED', 'CLOSED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "role" "user_role" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "installation_address" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL,
    "project_code" TEXT NOT NULL,
    "customer_id" UUID NOT NULL,
    "status" "project_status" NOT NULL DEFAULT 'LEAD_RECEIVED',
    "capacity_kw" DECIMAL(4,2) NOT NULL,
    "system_type" "system_type" NOT NULL,
    "agreed_price" DECIMAL(12,2),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_surveys" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "surveyor_id" UUID NOT NULL,
    "roof_usable_area_sqm" DECIMAL(8,2) NOT NULL,
    "tilt_degrees" DECIMAL(4,1) NOT NULL,
    "azimuth_degrees" DECIMAL(4,1) NOT NULL,
    "cable_run_meters" DECIMAL(6,2) NOT NULL,
    "sanctioned_load_kw" DECIMAL(6,2) NOT NULL,
    "is_shadow_free" BOOLEAN NOT NULL DEFAULT true,
    "is_viable" BOOLEAN NOT NULL,
    "notes" TEXT,
    "surveyed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_surveys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_items" (
    "id" UUID NOT NULL,
    "sku" TEXT NOT NULL,
    "model_name" TEXT NOT NULL,
    "category" "component_type" NOT NULL,
    "unit_cost" DECIMAL(10,2) NOT NULL,
    "quantity_on_hand" INTEGER NOT NULL DEFAULT 0,
    "warranty_months" INTEGER NOT NULL,

    CONSTRAINT "stock_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "serial_registry" (
    "id" UUID NOT NULL,
    "serial_number" TEXT NOT NULL,
    "stock_item_id" UUID NOT NULL,
    "project_id" UUID,
    "is_dispatched" BOOLEAN NOT NULL DEFAULT false,
    "dispatched_at" TIMESTAMPTZ(6),
    "warranty_start_date" DATE,
    "warranty_end_date" DATE,
    "status" "warranty_status" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "serial_registry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commissioning_records" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "lead_technician_id" UUID NOT NULL,
    "voc_volts_measured" DECIMAL(6,2) NOT NULL,
    "isc_amps_measured" DECIMAL(6,2) NOT NULL,
    "earthing_resistance_ohms" DECIMAL(5,2) NOT NULL,
    "completion_photo_url" TEXT NOT NULL,
    "customer_signature_svg" TEXT NOT NULL,
    "signed_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "commissioning_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" UUID NOT NULL,
    "ticket_number" TEXT NOT NULL,
    "project_id" UUID NOT NULL,
    "serial_registry_id" UUID,
    "reported_fault_code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ticket_status" NOT NULL DEFAULT 'OPEN',
    "is_covered_under_warranty" BOOLEAN NOT NULL,
    "billable_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "customers_phone_key" ON "customers"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "projects_project_code_key" ON "projects"("project_code");

-- CreateIndex
CREATE INDEX "projects_customer_id_idx" ON "projects"("customer_id");

-- CreateIndex
CREATE INDEX "projects_status_idx" ON "projects"("status");

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
CREATE UNIQUE INDEX "support_tickets_ticket_number_key" ON "support_tickets"("ticket_number");

-- CreateIndex
CREATE INDEX "support_tickets_project_id_idx" ON "support_tickets"("project_id");

-- CreateIndex
CREATE INDEX "support_tickets_serial_registry_id_idx" ON "support_tickets"("serial_registry_id");

-- CreateIndex
CREATE INDEX "support_tickets_status_idx" ON "support_tickets"("status");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_serial_registry_id_fkey" FOREIGN KEY ("serial_registry_id") REFERENCES "serial_registry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
