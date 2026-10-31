import { PrismaClient, UserRole, ComponentType, ProjectStatus, SystemType, WarrantyStatus, TicketStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting SunPower database seeding...");

  // Default demo password hash matching frontend 1-click login buttons
  const defaultPasswordHash = await bcrypt.hash(process.env.SEED_PASSWORD || "SunPower@2026", 10);

  // --------------------------------------------------
  // 1. CREATE INITIAL USERS FOR ALL ROLES
  // --------------------------------------------------

  const users = [
    {
      email: "admin@sunpower.local",
      fullName: "System Administrator",
      role: UserRole.ADMIN,
    },
    {
      email: "director@sunpower.local",
      fullName: "Executive Director",
      role: UserRole.DIRECTOR,
    },
    {
      email: "sales@sunpower.local",
      fullName: "Rohan Varma (Commercial Sales)",
      role: UserRole.SALES,
    },
    {
      email: "surveyor@sunpower.local",
      fullName: "Priya Nair (Lead Field Surveyor)",
      role: UserRole.SURVEYOR,
    },
    {
      email: "warehouse@sunpower.local",
      fullName: "Karthik Reddy (Logistics Lead)",
      role: UserRole.WAREHOUSE,
    },
    {
      email: "technician@sunpower.local",
      fullName: "Suresh Patil (Lead Technician)",
      role: UserRole.TECHNICIAN,
    },
    {
      email: "support@sunpower.local",
      fullName: "Ananya Deshmukh (Service Desk)",
      role: UserRole.SUPPORT,
    },
  ];

  const createdUsers: Record<string, string> = {};

  for (const user of users) {
    const record = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        fullName: user.fullName,
        role: user.role,
        passwordHash: defaultPasswordHash,
        isActive: true,
      },
      create: {
        ...user,
        passwordHash: defaultPasswordHash,
      },
    });
    createdUsers[user.role] = record.id;
  }

  console.log("Created or updated role-based users with SunPower@2026 passkey.");

  // --------------------------------------------------
  // 2. CREATE STOCK CATALOG
  // --------------------------------------------------

  const stockItems = [
    {
      sku: "PV-TOP-550-BIF",
      modelName: "Mono PERC Bifacial 550W Module (Tier 1)",
      category: ComponentType.PANEL,
      unitCost: "11500.00",
      quantityOnHand: 250,
      warrantyMonths: 300,
    },
    {
      sku: "INV-GRID-5K",
      modelName: "SunPower 5kW Grid-Tied String Inverter IP65",
      category: ComponentType.INVERTER,
      unitCost: "38000.00",
      quantityOnHand: 40,
      warrantyMonths: 120,
    },
    {
      sku: "INV-HYB-5K-01",
      modelName: "SunPower Solax 5kW Hybrid Inverter IP65",
      category: ComponentType.INVERTER,
      unitCost: "54000.00",
      quantityOnHand: 35,
      warrantyMonths: 120,
    },
    {
      sku: "BAT-LFP-48-100",
      modelName: "SunPower LiFePO4 5.12kWh 48V Storage Pack",
      category: ComponentType.BATTERY,
      unitCost: "68000.00",
      quantityOnHand: 30,
      warrantyMonths: 120,
    },
    {
      sku: "STR-ALUM-ELEV",
      modelName: "Anodized Aluminum HD Elevated Racking (150 km/h wind load)",
      category: ComponentType.STRUCTURE,
      unitCost: "1800.00",
      quantityOnHand: 150,
      warrantyMonths: 60,
    },
    {
      sku: "BOS-SOLAR-KIT",
      modelName: "Balance of System Kit (4sqmm DC Cable, AC/DC DB, Isolators)",
      category: ComponentType.BALANCE_OF_SYSTEM,
      unitCost: "12000.00",
      quantityOnHand: 80,
      warrantyMonths: 36,
    },
  ];

  const createdStockItems: Record<string, string> = {};

  for (const item of stockItems) {
    const stock = await prisma.stockItem.upsert({
      where: { sku: item.sku },
      update: {
        modelName: item.modelName,
        category: item.category,
        unitCost: item.unitCost,
        quantityOnHand: item.quantityOnHand,
        warrantyMonths: item.warrantyMonths,
      },
      create: item,
    });
    createdStockItems[item.sku] = stock.id;
  }

  console.log("Created stock items catalog.");

  // --------------------------------------------------
  // 3. CREATE SERIAL REGISTRY INVENTORY
  // --------------------------------------------------

  const sampleSerials = [
    { serialNumber: "INV-9028-X5", sku: "INV-HYB-5K-01" },
    { serialNumber: "INV-9029-X6", sku: "INV-GRID-5K" },
    { serialNumber: "INV-9030-X7", sku: "INV-GRID-5K" },
    { serialNumber: "BAT-LFP-099", sku: "BAT-LFP-48-100" },
    { serialNumber: "BAT-LFP-100", sku: "BAT-LFP-48-100" },
    { serialNumber: "PV-550-A101", sku: "PV-TOP-550-BIF" },
    { serialNumber: "PV-550-A102", sku: "PV-TOP-550-BIF" },
    { serialNumber: "PV-550-A103", sku: "PV-TOP-550-BIF" },
    { serialNumber: "PV-550-A104", sku: "PV-TOP-550-BIF" },
    { serialNumber: "PV-550-A105", sku: "PV-TOP-550-BIF" },
    { serialNumber: "PV-550-A106", sku: "PV-TOP-550-BIF" },
    { serialNumber: "PV-550-A107", sku: "PV-TOP-550-BIF" },
    { serialNumber: "PV-550-A108", sku: "PV-TOP-550-BIF" },
  ];

  for (const s of sampleSerials) {
    const stockId = createdStockItems[s.sku];
    if (stockId) {
      await prisma.serialRegistry.upsert({
        where: { serialNumber: s.serialNumber },
        update: {},
        create: {
          serialNumber: s.serialNumber,
          stockItemId: stockId,
          isDispatched: false,
          status: WarrantyStatus.ACTIVE,
        },
      });
    }
  }

  console.log("Created sample hardware serial registry.");

  // --------------------------------------------------
  // 4. CREATE SAMPLE CUSTOMERS AND FULL LIFECYCLE PROJECTS
  // --------------------------------------------------

  const customersData = [
    {
      phone: "+91 98401 22345",
      fullName: "Kaveri Industrial Mills",
      email: "operations@kaverimills.com",
      address: "Plot 41, Nacharam IDA, Hyderabad",
      projectCode: "PRJ-2026-088",
      capacityKw: 5.0,
      systemType: SystemType.ON_GRID,
      status: ProjectStatus.SURVEY_APPROVED,
      agreedPrice: 285000,
      hasSurvey: true,
      hasCommissioning: false,
    },
    {
      phone: "+91 97110 44521",
      fullName: "Dr. Aris Thorne",
      email: "aris.thorne@meditech.org",
      address: "Bungalow 14, Jubilee Hills, Hyderabad",
      projectCode: "PRJ-2026-089",
      capacityKw: 3.5,
      systemType: SystemType.OFF_GRID,
      status: ProjectStatus.COMMISSIONED,
      agreedPrice: 240000,
      hasSurvey: true,
      hasCommissioning: true,
    },
    {
      phone: "+91 99882 11029",
      fullName: "Vertex Logistics Hub",
      email: "dispatch@vertexlogistics.in",
      address: "Sector 3, Gachibowli, Hyderabad",
      projectCode: "PRJ-2026-090",
      capacityKw: 5.0,
      systemType: SystemType.ON_GRID,
      status: ProjectStatus.ORDER_CONFIRMED,
      agreedPrice: 295000,
      hasSurvey: true,
      hasCommissioning: false,
    },
    {
      phone: "+91 94401 88320",
      fullName: "Radha Krishna Residency",
      email: "secretary@rkr-housing.org",
      address: "Street 4, Habsiguda, Hyderabad",
      projectCode: "PRJ-2026-091",
      capacityKw: 2.0,
      systemType: SystemType.ON_GRID,
      status: ProjectStatus.SURVEY_PENDING,
      agreedPrice: 135000,
      hasSurvey: false,
      hasCommissioning: false,
    },
    {
      phone: "+91 98223 77410",
      fullName: "Meenakshi Solar Tech Labs",
      email: "admin@meenakshitech.com",
      address: "Tech Zone 2, HITEC City, Hyderabad",
      projectCode: "PRJ-2026-092",
      capacityKw: 10.0,
      systemType: SystemType.ON_GRID,
      status: ProjectStatus.QUOTE_ISSUED,
      agreedPrice: 560000,
      hasSurvey: true,
      hasCommissioning: false,
    },
  ];

  const surveyorUserId = createdUsers[UserRole.SURVEYOR] || createdUsers[UserRole.ADMIN];
  const technicianUserId = createdUsers[UserRole.TECHNICIAN] || createdUsers[UserRole.ADMIN];

  for (const item of customersData) {
    const customer = await prisma.customer.upsert({
      where: { phone: item.phone },
      update: {
        fullName: item.fullName,
        email: item.email,
        installationAddress: item.address,
      },
      create: {
        fullName: item.fullName,
        phone: item.phone,
        email: item.email,
        installationAddress: item.address,
      },
    });

    const project = await prisma.project.upsert({
      where: { projectCode: item.projectCode },
      update: {
        customerId: customer.id,
        capacityKw: item.capacityKw,
        systemType: item.systemType,
        status: item.status,
        agreedPrice: item.agreedPrice,
      },
      create: {
        projectCode: item.projectCode,
        customerId: customer.id,
        capacityKw: item.capacityKw,
        systemType: item.systemType,
        status: item.status,
        agreedPrice: item.agreedPrice,
      },
    });

    if (item.hasSurvey) {
      await prisma.siteSurvey.upsert({
        where: { projectId: project.id },
        update: {
          surveyorId: surveyorUserId,
          roofUsableAreaSqm: item.capacityKw * 10,
          tiltDegrees: 18.0,
          azimuthDegrees: 185.0,
          cableRunMeters: 28.0,
          sanctionedLoadKw: item.capacityKw,
          isShadowFree: true,
          isViable: true,
          notes: "South-facing RCC slab verified. Shadow-free window confirmed.",
        },
        create: {
          projectId: project.id,
          surveyorId: surveyorUserId,
          roofUsableAreaSqm: item.capacityKw * 10,
          tiltDegrees: 18.0,
          azimuthDegrees: 185.0,
          cableRunMeters: 28.0,
          sanctionedLoadKw: item.capacityKw,
          isShadowFree: true,
          isViable: true,
          notes: "South-facing RCC slab verified. Shadow-free window confirmed.",
        },
      });
    }

    if (item.hasCommissioning) {
      await prisma.commissioningRecord.upsert({
        where: { projectId: project.id },
        update: {
          leadTechnicianId: technicianUserId,
          vocVoltsMeasured: 382.4,
          iscAmpsMeasured: 9.8,
          earthingResistanceOhms: 2.1,
          completionPhotoUrl: "https://storage.sunpower.internal/commissioning/roof-089.jpg",
          customerSignatureSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 176"><path d="M 50 80 Q 150 20 250 80 T 450 80" fill="none" stroke="#38bdf8" stroke-width="2.5"/></svg>`,
          signedAt: new Date(),
        },
        create: {
          projectId: project.id,
          leadTechnicianId: technicianUserId,
          vocVoltsMeasured: 382.4,
          iscAmpsMeasured: 9.8,
          earthingResistanceOhms: 2.1,
          completionPhotoUrl: "https://storage.sunpower.internal/commissioning/roof-089.jpg",
          customerSignatureSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 176"><path d="M 50 80 Q 150 20 250 80 T 450 80" fill="none" stroke="#38bdf8" stroke-width="2.5"/></svg>`,
          signedAt: new Date(),
        },
      });
    }

    // --------------------------------------------------
    // 5. CREATE SUPPORT TICKETS
    // --------------------------------------------------
    if (item.projectCode === "PRJ-2026-088") {
      await prisma.supportTicket.upsert({
        where: { ticketNumber: "TCK-2026-012" },
        update: {
          description: "Inverter error code E03 (Grid overvoltage trip) during peak generation hours.",
          status: TicketStatus.OPEN,
        },
        create: {
          ticketNumber: "TCK-2026-012",
          projectId: project.id,
          reportedFaultCode: "E03-GRID-OVERVOLT",
          description: "Inverter error code E03 (Grid overvoltage trip) during peak generation hours.",
          status: TicketStatus.OPEN,
          isCoveredUnderWarranty: true,
          billableAmount: 0.0,
        },
      });
    }

    if (item.projectCode === "PRJ-2026-089") {
      await prisma.supportTicket.upsert({
        where: { ticketNumber: "TCK-2026-013" },
        update: {
          description: "Customer requesting secondary sign-off copy for state subsidy documentation.",
          status: TicketStatus.OPEN,
        },
        create: {
          ticketNumber: "TCK-2026-013",
          projectId: project.id,
          reportedFaultCode: "DOC-REQUEST",
          description: "Customer requesting secondary sign-off copy for state subsidy documentation.",
          status: TicketStatus.OPEN,
          isCoveredUnderWarranty: true,
          billableAmount: 0.0,
        },
      });
    }
  }

  console.log("Seeded sample projects, surveys, commissioning records, and support tickets!");
  console.log("SunPower database seeding completed successfully!");
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
