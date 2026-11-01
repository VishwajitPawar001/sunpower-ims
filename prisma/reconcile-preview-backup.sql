-- CreateEnum
CREATE TYPE "billing_type" AS ENUM ('WARRANTY_FREE', 'BILLABLE');

-- AlterEnum
ALTER TYPE "component_category" ADD VALUE 'SAFETY_EARTHING';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "project_status" ADD VALUE 'SURVEY_SCHEDULED';
ALTER TYPE "project_status" ADD VALUE 'QUOTE_ACCEPTED';
ALTER TYPE "project_status" ADD VALUE 'DISPATCH_PENDING';
ALTER TYPE "project_status" ADD VALUE 'DISPATCHED';
ALTER TYPE "project_status" ADD VALUE 'DISCOM_SYNCED';

-- AlterEnum
ALTER TYPE "ticket_status" ADD VALUE 'IN_PROGRESS';

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "city" TEXT,
ADD COLUMN     "customer_code" TEXT,
ADD COLUMN     "pincode" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "bidirectional_meter_serial" TEXT,
ADD COLUMN     "booking_advance_paid" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "civil_material_cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "consumer_account_number" TEXT,
ADD COLUMN     "direct_labor_cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "discom_application_number" TEXT,
ADD COLUMN     "dispatch_payment_paid" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "final_balance_paid" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "freight_cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "grid_sync_date" TIMESTAMPTZ(6),
ADD COLUMN     "is_grid_synchronized" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "monthly_power_bill" DECIMAL(12,2),
ADD COLUMN     "package_template_id" INTEGER,
ADD COLUMN     "sanctioned_load_kw" DECIMAL(8,2),
ADD COLUMN     "system_capacity_kw" DECIMAL(6,2),
ADD COLUMN     "total_quoted_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
ALTER COLUMN "capacity_kw" DROP NOT NULL;

-- AlterTable
ALTER TABLE "site_surveys" ADD COLUMN     "ac_cable_run_mtrs" DECIMAL(8,2),
ADD COLUMN     "dc_cable_run_mtrs" DECIMAL(8,2),
ADD COLUMN     "earth_pit_viable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "has_shading_issue" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_approved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_south_facing" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "parapet_height_ft" DECIMAL(6,2),
ADD COLUMN     "rejection_reason" TEXT,
ADD COLUMN     "survey_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "survey_notes" TEXT,
ADD COLUMN     "tilt_angle_deg" DECIMAL(5,2),
ADD COLUMN     "usable_area_sq_ft" DECIMAL(10,2),
ALTER COLUMN "roof_usable_area_sqm" DROP NOT NULL,
ALTER COLUMN "tilt_degrees" DROP NOT NULL,
ALTER COLUMN "azimuth_degrees" DROP NOT NULL,
ALTER COLUMN "cable_run_meters" DROP NOT NULL,
ALTER COLUMN "sanctioned_load_kw" DROP NOT NULL,
ALTER COLUMN "is_viable" DROP NOT NULL;

-- AlterTable
ALTER TABLE "support_tickets" ADD COLUMN     "assigned_to_id" INTEGER,
ADD COLUMN     "billing_type" "billing_type" NOT NULL DEFAULT 'WARRANTY_FREE',
ADD COLUMN     "customer_id" INTEGER,
ADD COLUMN     "faulty_serial_number" TEXT,
ADD COLUMN     "replaced_with_serial" TEXT,
ADD COLUMN     "reported_issue" TEXT NOT NULL,
ADD COLUMN     "resolution_notes" TEXT,
ADD COLUMN     "ticket_code" TEXT NOT NULL,
ALTER COLUMN "ticket_number" DROP NOT NULL,
ALTER COLUMN "reported_fault_code" DROP NOT NULL,
ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "is_covered_under_warranty" SET DEFAULT false;

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

-- CreateIndex
CREATE UNIQUE INDEX "package_templates_package_code_key" ON "package_templates"("package_code");

-- CreateIndex
CREATE UNIQUE INDEX "installation_records_project_id_key" ON "installation_records"("project_id");

-- CreateIndex
CREATE INDEX "installation_records_lead_technician_id_idx" ON "installation_records"("lead_technician_id");

-- CreateIndex
CREATE UNIQUE INDEX "customers_customer_code_key" ON "customers"("customer_code");

-- CreateIndex
CREATE INDEX "projects_package_template_id_idx" ON "projects"("package_template_id");

-- CreateIndex
CREATE UNIQUE INDEX "support_tickets_ticket_code_key" ON "support_tickets"("ticket_code");

-- CreateIndex
CREATE INDEX "support_tickets_customer_id_idx" ON "support_tickets"("customer_id");

-- CreateIndex
CREATE INDEX "support_tickets_assigned_to_id_idx" ON "support_tickets"("assigned_to_id");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_package_template_id_fkey" FOREIGN KEY ("package_template_id") REFERENCES "package_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installation_records" ADD CONSTRAINT "installation_records_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installation_records" ADD CONSTRAINT "installation_records_lead_technician_id_fkey" FOREIGN KEY ("lead_technician_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
