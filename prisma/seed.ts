import {
  PrismaClient,
  UserRole,
  SystemType,
  ComponentCategory,
  SerialStatus,
  ProjectStatus,
  RoofType,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding complete SunPower IMS operational database...");

  const defaultPassword = process.env.SEED_PASSWORD || "SolarPower@2026";
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  // ----------------------------------------------------
  // 1. ALL ROLES & EXPANDED TEAM (EMP-001 to EMP-022)
  // ----------------------------------------------------
  const staffMembers = [
    // Director & Admin
    { employeeCode: "EMP-001", email: "director@sunpower.local", fullName: "Rajesh Sharma", role: UserRole.DIRECTOR, monthlySalary: 120000, dailyLaborRate: 0, phone: "9820011001" },
    { employeeCode: "EMP-022", email: "admin@sunpower.local", fullName: "Kiran Deshmukh", role: UserRole.ADMIN, monthlySalary: 45000, dailyLaborRate: 0, phone: "9820011022" },

    // Sales Executives
    { employeeCode: "EMP-002", email: "sales1@sunpower.local", fullName: "Amit Patel", role: UserRole.SALES, monthlySalary: 25000, dailyLaborRate: 0, phone: "9820011002" },
    { employeeCode: "EMP-003", email: "sales2@sunpower.local", fullName: "Sneha Kulkarni", role: UserRole.SALES, monthlySalary: 25000, dailyLaborRate: 0, phone: "9820011003" },

    // Site Surveyor
    { employeeCode: "EMP-004", email: "surveyor@sunpower.local", fullName: "Vikas Shinde", role: UserRole.SURVEYOR, monthlySalary: 28000, dailyLaborRate: 1000, phone: "9820011004" },

    // Warehouse Inventory Manager
    { employeeCode: "EMP-005", email: "warehouse@sunpower.local", fullName: "Ganesh Jadhav", role: UserRole.WAREHOUSE, monthlySalary: 22000, dailyLaborRate: 0, phone: "9820011005" },

    // Lead Installation Technicians
    { employeeCode: "EMP-006", email: "tech1@sunpower.local", fullName: "Ramesh Pawar", role: UserRole.LEAD_TECHNICIAN, monthlySalary: 32000, dailyLaborRate: 1200, phone: "9820011006" },
    { employeeCode: "EMP-007", email: "tech2@sunpower.local", fullName: "Sachin More", role: UserRole.LEAD_TECHNICIAN, monthlySalary: 32000, dailyLaborRate: 1200, phone: "9820011007" },
    { employeeCode: "EMP-008", email: "tech3@sunpower.local", fullName: "Pradeep Joshi", role: UserRole.LEAD_TECHNICIAN, monthlySalary: 32000, dailyLaborRate: 1200, phone: "9820011008" },
    { employeeCode: "EMP-009", email: "tech4@sunpower.local", fullName: "Mahesh Gaikwad", role: UserRole.LEAD_TECHNICIAN, monthlySalary: 32000, dailyLaborRate: 1200, phone: "9820011009" },
    { employeeCode: "EMP-010", email: "tech5@sunpower.local", fullName: "Deepak Chavan", role: UserRole.LEAD_TECHNICIAN, monthlySalary: 32000, dailyLaborRate: 1200, phone: "9820011010" },

    // Field Riggers & Helpers (Ground civil & panel mounting crew)
    { employeeCode: "EMP-011", email: "rigger1@sunpower.local", fullName: "Santosh Kale", role: UserRole.FIELD_RIGGER, monthlySalary: 15000, dailyLaborRate: 600, phone: "9820011011" },
    { employeeCode: "EMP-012", email: "rigger2@sunpower.local", fullName: "Nitin Jagtap", role: UserRole.FIELD_RIGGER, monthlySalary: 15000, dailyLaborRate: 600, phone: "9820011012" },
    { employeeCode: "EMP-013", email: "rigger3@sunpower.local", fullName: "Sunil Ghodke", role: UserRole.FIELD_RIGGER, monthlySalary: 15000, dailyLaborRate: 600, phone: "9820011013" },
    { employeeCode: "EMP-014", email: "rigger4@sunpower.local", fullName: "Ajay Thorat", role: UserRole.FIELD_RIGGER, monthlySalary: 15000, dailyLaborRate: 600, phone: "9820011014" },
    { employeeCode: "EMP-015", email: "rigger5@sunpower.local", fullName: "Pravin Salunkhe", role: UserRole.FIELD_RIGGER, monthlySalary: 15000, dailyLaborRate: 600, phone: "9820011015" },
    { employeeCode: "EMP-016", email: "rigger6@sunpower.local", fullName: "Manoj Bhosale", role: UserRole.FIELD_RIGGER, monthlySalary: 15000, dailyLaborRate: 600, phone: "9820011016" },
    { employeeCode: "EMP-017", email: "rigger7@sunpower.local", fullName: "Anil Wagh", role: UserRole.FIELD_RIGGER, monthlySalary: 15000, dailyLaborRate: 600, phone: "9820011017" },
    { employeeCode: "EMP-018", email: "rigger8@sunpower.local", fullName: "Rahul Solanke", role: UserRole.FIELD_RIGGER, monthlySalary: 15000, dailyLaborRate: 600, phone: "9820011018" },
    { employeeCode: "EMP-019", email: "rigger9@sunpower.local", fullName: "Vijay Mane", role: UserRole.FIELD_RIGGER, monthlySalary: 15000, dailyLaborRate: 600, phone: "9820011019" },
    { employeeCode: "EMP-020", email: "rigger10@sunpower.local", fullName: "Kailash Gite", role: UserRole.FIELD_RIGGER, monthlySalary: 15000, dailyLaborRate: 600, phone: "9820011020" },

    // Post-Sales & Customer Support
    { employeeCode: "EMP-021", email: "support@sunpower.local", fullName: "Pooja Mehta", role: UserRole.SUPPORT, monthlySalary: 22000, dailyLaborRate: 0, phone: "9820011021" },
  ];

  for (const s of staffMembers) {
    await prisma.user.upsert({
      where: { email: s.email },
      update: {
        employeeCode: s.employeeCode,
        fullName: s.fullName,
        role: s.role,
        monthlySalary: s.monthlySalary,
        dailyLaborRate: s.dailyLaborRate,
        phone: s.phone,
        isActive: true,
      },
      create: { ...s, passwordHash },
    });
  }
  console.log("✓ Provisioned 22 staff members across all business departments.");

  // ----------------------------------------------------
  // 2. READY-MADE PACKAGES (1kW to 5kW: ON-GRID, OFF-GRID, HYBRID)
  // ----------------------------------------------------
  const packageTemplates = [
    // On-Grid Packages
    { packageCode: "PKG-ONGRID-1KW", name: "1kW On-Grid Starter Package", capacityKw: 1.0, systemType: SystemType.ON_GRID, panelCount: 2, inverterRatingKw: 1.0, batteryCapacityAh: null, baseHardwareCost: 38000, baseLaborCost: 6000, defaultPrice: 65000 },
    { packageCode: "PKG-ONGRID-2KW", name: "2kW On-Grid Compact Package", capacityKw: 2.0, systemType: SystemType.ON_GRID, panelCount: 4, inverterRatingKw: 2.0, batteryCapacityAh: null, baseHardwareCost: 68000, baseLaborCost: 7500, defaultPrice: 115000 },
    { packageCode: "PKG-ONGRID-3KW", name: "3kW On-Grid Standard Home Package", capacityKw: 3.0, systemType: SystemType.ON_GRID, panelCount: 6, inverterRatingKw: 3.0, batteryCapacityAh: null, baseHardwareCost: 95000, baseLaborCost: 9000, defaultPrice: 165000 },
    { packageCode: "PKG-ONGRID-5KW", name: "5kW On-Grid Premium Home Package", capacityKw: 5.0, systemType: SystemType.ON_GRID, panelCount: 9, inverterRatingKw: 5.0, batteryCapacityAh: null, baseHardwareCost: 141000, baseLaborCost: 12000, defaultPrice: 245000 },

    // Off-Grid Packages (With Battery Bank)
    { packageCode: "PKG-OFFGRID-1KW", name: "1kW Off-Grid Cabin Package", capacityKw: 1.0, systemType: SystemType.OFF_GRID, panelCount: 2, inverterRatingKw: 1.0, batteryCapacityAh: 100, baseHardwareCost: 65000, baseLaborCost: 7500, defaultPrice: 105000 },
    { packageCode: "PKG-OFFGRID-3KW", name: "3kW Off-Grid Resilient Package", capacityKw: 3.0, systemType: SystemType.OFF_GRID, panelCount: 6, inverterRatingKw: 3.0, batteryCapacityAh: 200, baseHardwareCost: 175000, baseLaborCost: 12000, defaultPrice: 265000 },
    { packageCode: "PKG-OFFGRID-5KW", name: "5kW Off-Grid Heavy-Duty Estate Package", capacityKw: 5.0, systemType: SystemType.OFF_GRID, panelCount: 9, inverterRatingKw: 5.0, batteryCapacityAh: 400, baseHardwareCost: 265000, baseLaborCost: 16000, defaultPrice: 385000 },

    // Hybrid Packages (Grid-tied with Lithium Storage)
    { packageCode: "PKG-HYBRID-3KW", name: "3kW Hybrid Uninterrupted Power Package", capacityKw: 3.0, systemType: SystemType.HYBRID, panelCount: 6, inverterRatingKw: 3.0, batteryCapacityAh: 100, baseHardwareCost: 195000, baseLaborCost: 13000, defaultPrice: 295000 },
    { packageCode: "PKG-HYBRID-5KW", name: "5kW Hybrid Commercial Resilient Package", capacityKw: 5.0, systemType: SystemType.HYBRID, panelCount: 9, inverterRatingKw: 5.0, batteryCapacityAh: 200, baseHardwareCost: 295000, baseLaborCost: 18000, defaultPrice: 430000 },
  ];

  for (const pkg of packageTemplates) {
    await prisma.packageTemplate.upsert({
      where: { packageCode: pkg.packageCode },
      update: {
        name: pkg.name,
        capacityKw: pkg.capacityKw,
        systemType: pkg.systemType,
        panelCount: pkg.panelCount,
        inverterRatingKw: pkg.inverterRatingKw,
        batteryCapacityAh: pkg.batteryCapacityAh,
        baseHardwareCost: pkg.baseHardwareCost,
        baseLaborCost: pkg.baseLaborCost,
        defaultPrice: pkg.defaultPrice,
      },
      create: pkg,
    });
    createdUsers[user.role] = record.id;
  }
  console.log("✓ Initialized 9 system package templates (On-Grid, Off-Grid & Hybrid).");

  // ----------------------------------------------------
  // 3. MASTER HARDWARE CATALOG & SKUs
  // ----------------------------------------------------
  const hardwareItems = [
    { sku: "SKU-PNL-550W", modelName: "Tier-1 550W Mono PERC Half-Cut Module", category: ComponentCategory.PANEL, unitCost: 8500, quantityOnHand: 250, warrantyMonths: 240 },
    { sku: "SKU-INV-1KW", modelName: "1kW Single Phase Grid-Tie Inverter", category: ComponentCategory.INVERTER, unitCost: 16000, quantityOnHand: 30, warrantyMonths: 24 },
    { sku: "SKU-INV-3KW", modelName: "3kW Dual MPPT Grid Inverter", category: ComponentCategory.INVERTER, unitCost: 24000, quantityOnHand: 40, warrantyMonths: 24 },
    { sku: "SKU-INV-5KW", modelName: "5kW Smart WiFi On-Grid Inverter", category: ComponentCategory.INVERTER, unitCost: 32000, quantityOnHand: 50, warrantyMonths: 24 },
    { sku: "SKU-INV-HYB-5KW", modelName: "5kW Hybrid Bidirectional Storage Inverter", category: ComponentCategory.INVERTER, unitCost: 55000, quantityOnHand: 20, warrantyMonths: 24 },
    { sku: "SKU-BAT-100AH", modelName: "Lithium Ferro Phosphate (LFP) 48V 100Ah", category: ComponentCategory.BATTERY, unitCost: 65000, quantityOnHand: 25, warrantyMonths: 24 },
    { sku: "SKU-BAT-200AH", modelName: "Lithium Ferro Phosphate (LFP) 48V 200Ah", category: ComponentCategory.BATTERY, unitCost: 120000, quantityOnHand: 15, warrantyMonths: 24 },
    { sku: "SKU-CC-60A", modelName: "60A MPPT Solar Charge Controller", category: ComponentCategory.CHARGE_CONTROLLER, unitCost: 9500, quantityOnHand: 30, warrantyMonths: 24 },
    { sku: "SKU-STR-GI-3KW", modelName: "Hot-Dip Galvanized Iron Stand 3kW", category: ComponentCategory.STRUCTURE, unitCost: 9000, quantityOnHand: 35, warrantyMonths: 24 },
    { sku: "SKU-STR-GI-5KW", modelName: "Elevated Galvanized Iron High-Wind Stand 5kW", category: ComponentCategory.STRUCTURE, unitCost: 14000, quantityOnHand: 45, warrantyMonths: 24 },
    { sku: "SKU-BOS-KIT-5KW", modelName: "ACDB/DCDB + UV 4sqmm Solar Cable Spool", category: ComponentCategory.BALANCE_OF_SYSTEM, unitCost: 11000, quantityOnHand: 60, warrantyMonths: 24 },
    { sku: "SKU-EARTH-KIT", modelName: "Chemical Earthing Set (3 Electrodes + Bentonite + LA)", category: ComponentCategory.SAFETY_EARTHING, unitCost: 7500, quantityOnHand: 50, warrantyMonths: 24 },
  ];

  for (const item of hardwareItems) {
    await prisma.stockItem.upsert({
      where: { sku: item.sku },
      update: {
        unitCost: item.unitCost,
        quantityOnHand: item.quantityOnHand,
        warrantyMonths: item.warrantyMonths,
      },
      create: item,
    });
    createdStockItems[item.sku] = stock.id;
  }
  console.log("✓ Stocked master hardware inventory with 12 SKU lines.");

  // ----------------------------------------------------
  // 4. PHYSICAL SERIAL REGISTRY (TEST FACTORY BARCODES)
  // ----------------------------------------------------
  const inv5k = await prisma.stockItem.findUnique({ where: { sku: "SKU-INV-5KW" } });
  const bat100 = await prisma.stockItem.findUnique({ where: { sku: "SKU-BAT-100AH" } });
  const pnl550 = await prisma.stockItem.findUnique({ where: { sku: "SKU-PNL-550W" } });

  if (inv5k && bat100 && pnl550) {
    const serialBarcodes = [
      // Inverters
      { serialNumber: "INV-5K-SN-8001", stockItemId: inv5k.id },
      { serialNumber: "INV-5K-SN-8002", stockItemId: inv5k.id },
      { serialNumber: "INV-5K-SN-8003", stockItemId: inv5k.id },
      { serialNumber: "INV-5K-SN-8004", stockItemId: inv5k.id },

      // Batteries
      { serialNumber: "BAT-LFP-SN-3001", stockItemId: bat100.id },
      { serialNumber: "BAT-LFP-SN-3002", stockItemId: bat100.id },

      // Solar Panels
      { serialNumber: "PNL-550-SN-00101", stockItemId: pnl550.id },
      { serialNumber: "PNL-550-SN-00102", stockItemId: pnl550.id },
      { serialNumber: "PNL-550-SN-00103", stockItemId: pnl550.id },
      { serialNumber: "PNL-550-SN-00104", stockItemId: pnl550.id },
      { serialNumber: "PNL-550-SN-00105", stockItemId: pnl550.id },
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
    console.log("✓ Registered physical factory barcodes in serial registry.");
  }
  console.log(`✓ Seeded ${TICKET_COUNT} Support & SLA tickets.`);

  // ----------------------------------------------------
  // 5. MASTER SAMPLE CUSTOMER & PROJECT LIFECYCLE
  // ----------------------------------------------------
  const customer = await prisma.customer.upsert({
    where: { phone: "9876543210" },
    update: {},
    create: {
      customerCode: "CUST-00001",
      fullName: "Anand Deshmukh",
      phone: "9876543210",
      email: "anand.d@example.com",
      installationAddress: "Plot 42, Green Meadows, Baner",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411045",
    },
  });

  const pkg5kOnGrid = await prisma.packageTemplate.findUnique({ where: { packageCode: "PKG-ONGRID-5KW" } });

  await prisma.project.upsert({
    where: { projectCode: "PRJ-2026-00001" },
    update: {},
    create: {
      projectCode: "PRJ-2026-00001",
      customerId: customer.id,
      packageTemplateId: pkg5kOnGrid?.id,
      systemCapacityKw: 5.0,
      systemType: SystemType.ON_GRID,
      status: ProjectStatus.LEAD_RECEIVED,
      consumerAccountNumber: "MSEDCL-847291038",
      sanctionedLoadKw: 6.0,
      monthlyPowerBill: 4500.0,
      totalQuotedPrice: 245000.0,
      bookingAdvancePaid: 49000.0, // 20% milestone
      dispatchPaymentPaid: 0.0,
      finalBalancePaid: 0.0,
      freightCost: 2000.0,
      civilMaterialCost: 2500.0,
      directLaborCost: 4800.0,
    },
  });

  console.log("✓ Pipeline project PRJ-2026-00001 seeded cleanly.");
}

main()
  .catch((e) => {
    console.error("❌ Seed execution error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
