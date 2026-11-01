import {
  PrismaClient,
  UserRole,
  SystemType,
  ComponentCategory,
  SerialStatus,
  ProjectStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding SunPower IMS operational database...");

  const defaultPassword = process.env.SEED_PASSWORD || "SolarPower@2026";
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  // ----------------------------------------------------
  // 1. CORE USERS
  // ----------------------------------------------------
  const staffMembers = [
    { email: "director@sunpower.local", fullName: "Rajesh Sharma", role: UserRole.DIRECTOR },
    { email: "admin@sunpower.local", fullName: "Kiran Deshmukh", role: UserRole.ADMIN },
    { email: "sales@sunpower.local", fullName: "Amit Patel", role: UserRole.SALES },
    { email: "surveyor@sunpower.local", fullName: "Vikas Shinde", role: UserRole.SURVEYOR },
    { email: "warehouse@sunpower.local", fullName: "Ganesh Jadhav", role: UserRole.WAREHOUSE },
    { email: "tech@sunpower.local", fullName: "Ramesh Pawar", role: UserRole.LEAD_TECHNICIAN },
    { email: "support@sunpower.local", fullName: "Pooja Mehta", role: UserRole.SUPPORT },
  ];

  for (const s of staffMembers) {
    await prisma.user.upsert({
      where: { email: s.email },
      update: { fullName: s.fullName, role: s.role },
      create: { ...s, passwordHash },
    });
  }
  console.log("✓ Provisioned core staff members.");

  // ----------------------------------------------------
  // 2. MASTER HARDWARE INVENTORY (SKUs)
  // ----------------------------------------------------
  const hardwareItems = [
    { sku: "SKU-PNL-550W", modelName: "Tier-1 550W Mono PERC Module", category: ComponentCategory.PANEL, unitCost: 8500, quantityOnHand: 250, warrantyMonths: 240 },
    { sku: "SKU-INV-5KW", modelName: "5kW Smart WiFi On-Grid Inverter", category: ComponentCategory.INVERTER, unitCost: 32000, quantityOnHand: 50, warrantyMonths: 24 },
    { sku: "SKU-BAT-100AH", modelName: "LFP 48V 100Ah Battery", category: ComponentCategory.BATTERY, unitCost: 65000, quantityOnHand: 25, warrantyMonths: 24 },
    { sku: "SKU-STR-GI-5KW", modelName: "Galvanized Iron Stand 5kW", category: ComponentCategory.STRUCTURE, unitCost: 14000, quantityOnHand: 45, warrantyMonths: 24 },
    { sku: "SKU-BOS-KIT-5KW", modelName: "ACDB/DCDB + Solar Cable Kit", category: ComponentCategory.BALANCE_OF_SYSTEM, unitCost: 11000, quantityOnHand: 60, warrantyMonths: 24 },
  ];

  for (const item of hardwareItems) {
    await prisma.stockItem.upsert({
      where: { sku: item.sku },
      update: { unitCost: item.unitCost, quantityOnHand: item.quantityOnHand },
      create: item,
    });
  }
  console.log("✓ Stocked master hardware inventory.");

  // ----------------------------------------------------
  // 3. PHYSICAL SERIAL REGISTRY
  // ----------------------------------------------------
  const inv5k = await prisma.stockItem.findUnique({ where: { sku: "SKU-INV-5KW" } });
  const pnl550 = await prisma.stockItem.findUnique({ where: { sku: "SKU-PNL-550W" } });

  if (inv5k && pnl550) {
    const serialBarcodes = [
      { serialNumber: "INV-5K-SN-8001", stockItemId: inv5k.id },
      { serialNumber: "PNL-550-SN-00101", stockItemId: pnl550.id },
      { serialNumber: "PNL-550-SN-00102", stockItemId: pnl550.id },
    ];

    for (const barcode of serialBarcodes) {
      await prisma.serialRegistry.upsert({
        where: { serialNumber: barcode.serialNumber },
        update: {},
        create: {
          serialNumber: barcode.serialNumber,
          stockItemId: barcode.stockItemId,
          status: SerialStatus.IN_STOCK,
          isDispatched: false,
        },
      });
    }
    console.log("✓ Registered physical factory barcodes.");
  }

  // ----------------------------------------------------
  // 4. SAMPLE CUSTOMER & PROJECT
  // ----------------------------------------------------
  const customer = await prisma.customer.upsert({
    where: { phone: "9876543210" },
    update: {},
    create: {
      fullName: "Anand Deshmukh",
      phone: "9876543210",
      email: "anand.d@example.com",
      installationAddress: "Plot 42, Green Meadows, Baner, Pune",
    },
  });

  await prisma.project.upsert({
    where: { projectCode: "PRJ-2026-00001" },
    update: {},
    create: {
      projectCode: "PRJ-2026-00001",
      customerId: customer.id,
      capacityKw: 5.0,
      systemType: SystemType.ON_GRID,
      status: ProjectStatus.LEAD_RECEIVED,
      agreedPrice: 245000.0,
    },
  });

  console.log("✓ Pipeline project PRJ-2026-00001 seeded successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Seed execution error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });