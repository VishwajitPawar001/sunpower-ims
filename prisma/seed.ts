import { PrismaClient, UserRole, ComponentType, ProjectStatus, SystemType, WarrantyStatus, TicketStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const INDIAN_CITIES = [
  { city: "Hyderabad", state: "Telangana", pin: "500081", area: "HITEC City" },
  { city: "Bengaluru", state: "Karnataka", pin: "560100", area: "Electronic City" },
  { city: "Pune", state: "Maharashtra", pin: "411057", area: "Hinjawadi Phase 1" },
  { city: "Mumbai", state: "Maharashtra", pin: "400072", area: "Andheri East" },
  { city: "Chennai", state: "Tamil Nadu", pin: "600096", area: "OMR IT Corridor" },
  { city: "Ahmedabad", state: "Gujarat", pin: "382481", area: "GIDC Naroda" },
  { city: "Jaipur", state: "Rajasthan", pin: "302022", area: "Sitapura Industrial Area" },
  { city: "Surat", state: "Gujarat", pin: "395006", area: "Varachha Textile Hub" },
  { city: "Coimbatore", state: "Tamil Nadu", pin: "641014", area: "Peelamedu Tech Zone" },
  { city: "Kochi", state: "Kerala", pin: "682030", area: "Kakkanad InfoPark" },
  { city: "Indore", state: "Madhya Pradesh", pin: "452010", area: "Vijay Nagar Commercial" },
  { city: "Nagpur", state: "Maharashtra", pin: "440022", area: "MIHAN SEZ" },
  { city: "Lucknow", state: "Uttar Pradesh", pin: "226010", area: "Gomti Nagar Extension" },
  { city: "Chandigarh", state: "Punjab", pin: "160019", area: "Industrial Area Phase 2" },
  { city: "Vadodara", state: "Gujarat", pin: "390010", area: "Makarpura GIDC" },
  { city: "Visakhapatnam", state: "Andhra Pradesh", pin: "530017", area: "Auto Nagar Industrial" },
  { city: "Nashik", state: "Maharashtra", pin: "422007", area: "Satpur MIDC" },
  { city: "Mysore", state: "Karnataka", pin: "570018", area: "Hebbal Industrial Estate" },
  { city: "Bhopal", state: "Madhya Pradesh", pin: "462023", area: "Govindpura Industrial" },
  { city: "Noida", state: "Uttar Pradesh", pin: "201301", area: "Sector 62 Institutional Area" }
];

const COMMERCIAL_NAMES = [
  "Kaveri Industrial Mills", "Vertex Logistics Hub", "Meenakshi Tech Labs", "Horizon Cold Storage",
  "Deccan Spinning Mills", "Surya Agro Industries", "Greenline Warehousing", "Sterling Biotech Research",
  "Lotus Hospitality Suites", "Vardhaman Polymers Ltd", "Zenith Metal Crafts", "Apollo Diagnostics Hub",
  "Heritage International Campus", "Navkar Food Processors", "Pragati Auto Components", "Shree Ram Dyeing Works",
  "Bluechip Data Park", "Godavari Steel Tubes", "Royal Orchid Convention Centre", "Narmada Agro Seeds",
  "Sai Teja Paper Products", "Galaxy Multiplex & Mall", "Southern Precision Forgings", "Albatross Pharma Labs",
  "Vanguard Distribution Depot", "Crystal Beverages India", "Suncity Cold Chain Logistics", "Bharat Heavy Castings",
  "Tirumala Rice Exports", "Kalyani Precision Tools", "Evergreen Tea Estates Facility", "Jupiter Chemical Industries"
];

const RESIDENTIAL_NAMES = [
  "Dr. Aris Thorne", "Radha Krishna Residency", "Vikramaditya Singhania", "Ananya Deshmukh",
  "Prof. Rajeshwar Shastri", "Capt. Harpreet Singh", "Kavita Ramachandran", "Sanjay & Meera Kothari",
  "Dr. Deepa Nambiar", "Tariq & Zoya Khan", "Sunil & Rekha Agarwal", "Arvind & Shweta Verma",
  "Col. Bhaskar Reddy (Retd)", "Dr. Manisha Kulkarni", "Karthik Subramanian", "Priya Swaminathan",
  "Naveen & Shalini Joshi", "Brigadier Mohan Pillai", "Dr. Alok Chatterjee", "Ritu & Sameer Bansal",
  "Gautam & Pooja Mehta", "Dr. Sneha Bhattacharya", "Dharmendra & Sunita Patel", "Venkatesh Rao"
];

async function main() {
  console.log("=== Initializing SunPower IMS Database Seeding (300+ Records & Grid Hybrid) ===");

  const defaultPasswordHash = await bcrypt.hash("SunPower@2026", 10);

  // --------------------------------------------------
  // 1. CLEAR EXISTING DATA (CASCADE CLEANUP)
  // --------------------------------------------------
  console.log("Cleaning existing transactional records...");
  await prisma.supportTicket.deleteMany({});
  await prisma.commissioningRecord.deleteMany({});
  await prisma.siteSurvey.deleteMany({});
  await prisma.serialRegistry.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.customer.deleteMany({});

  // --------------------------------------------------
  // 2. CREATE / UPSERT ROLE USERS
  // --------------------------------------------------
  const users = [
    { email: "admin@sunpower.local", fullName: "System Administrator", role: UserRole.ADMIN },
    { email: "director@sunpower.local", fullName: "Executive Director", role: UserRole.DIRECTOR },
    { email: "sales@sunpower.local", fullName: "Rohan Varma (Commercial Sales)", role: UserRole.SALES },
    { email: "surveyor@sunpower.local", fullName: "Priya Nair (Lead Field Surveyor)", role: UserRole.SURVEYOR },
    { email: "warehouse@sunpower.local", fullName: "Karthik Reddy (Logistics Lead)", role: UserRole.WAREHOUSE },
    { email: "technician@sunpower.local", fullName: "Suresh Patil (Lead Technician)", role: UserRole.TECHNICIAN },
    { email: "support@sunpower.local", fullName: "Ananya Deshmukh (Service Desk)", role: UserRole.SUPPORT },
  ];

  const createdUsers: Record<string, string> = {};
  for (const user of users) {
    const record = await prisma.user.upsert({
      where: { email: user.email },
      update: { fullName: user.fullName, role: user.role, passwordHash: defaultPasswordHash, isActive: true },
      create: { ...user, passwordHash: defaultPasswordHash },
    });
    createdUsers[user.role] = record.id;
  }
  console.log("✓ Seeded 7 Role Users (Passkey: SunPower@2026).");

  // --------------------------------------------------
  // 3. CREATE STOCK CATALOG (SUPPORTING HYBRID, ON-GRID, OFF-GRID)
  // --------------------------------------------------
  const stockItems = [
    {
      sku: "PV-TOP-550-BIF",
      modelName: "Mono PERC Bifacial 550W Module (Tier 1)",
      category: ComponentType.PANEL,
      unitCost: "11500.00",
      quantityOnHand: 15000,
      warrantyMonths: 300,
    },
    {
      sku: "INV-GRID-5K",
      modelName: "SunPower 5kW Grid-Tied String Inverter IP65",
      category: ComponentType.INVERTER,
      unitCost: "38000.00",
      quantityOnHand: 1200,
      warrantyMonths: 120,
    },
    {
      sku: "INV-HYB-5K-01",
      modelName: "SunPower Solax 5kW Hybrid Inverter IP65",
      category: ComponentType.INVERTER,
      unitCost: "54000.00",
      quantityOnHand: 900,
      warrantyMonths: 120,
    },
    {
      sku: "BAT-LFP-48-100",
      modelName: "SunPower LiFePO4 5.12kWh 48V Storage Pack",
      category: ComponentType.BATTERY,
      unitCost: "68000.00",
      quantityOnHand: 800,
      warrantyMonths: 120,
    },
    {
      sku: "STR-ALUM-ELEV",
      modelName: "Anodized Aluminum HD Elevated Racking (150 km/h wind load)",
      category: ComponentType.STRUCTURE,
      unitCost: "1800.00",
      quantityOnHand: 10000,
      warrantyMonths: 60,
    },
    {
      sku: "BOS-SOLAR-KIT",
      modelName: "Balance of System Kit (4sqmm DC Cable, AC/DC DB, Isolators)",
      category: ComponentType.BALANCE_OF_SYSTEM,
      unitCost: "12000.00",
      quantityOnHand: 2500,
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
  console.log("✓ Seeded Stock Catalog (Panels, Grid Inverters, Hybrid Inverters, Batteries, Structures, BOS).");

  // --------------------------------------------------
  // 4. SEED 250 UNASSIGNED SERIAL REGISTRY ENTRIES
  // --------------------------------------------------
  const serialsToCreate: { serialNumber: string; stockItemId: string }[] = [];

  // 100 Panels
  for (let i = 1; i <= 100; i++) {
    serialsToCreate.push({
      serialNumber: `PAN-550-${String(i).padStart(4, "0")}`,
      stockItemId: createdStockItems["PV-TOP-550-BIF"],
    });
  }
  // 50 Grid Inverters
  for (let i = 1; i <= 50; i++) {
    serialsToCreate.push({
      serialNumber: `INV-GRD-${String(i).padStart(4, "0")}`,
      stockItemId: createdStockItems["INV-GRID-5K"],
    });
  }
  // 50 Hybrid Inverters
  for (let i = 1; i <= 50; i++) {
    serialsToCreate.push({
      serialNumber: `INV-HYB-${String(i).padStart(4, "0")}`,
      stockItemId: createdStockItems["INV-HYB-5K-01"],
    });
  }
  // 50 Storage Battery Packs
  for (let i = 1; i <= 50; i++) {
    serialsToCreate.push({
      serialNumber: `BAT-LFP-${String(i).padStart(4, "0")}`,
      stockItemId: createdStockItems["BAT-LFP-48-100"],
    });
  }

  for (const s of serialsToCreate) {
    await prisma.serialRegistry.create({
      data: {
        serialNumber: s.serialNumber,
        stockItemId: s.stockItemId,
        isDispatched: false,
        status: WarrantyStatus.ACTIVE,
      },
    });
  }
  console.log(`✓ Seeded ${serialsToCreate.length} unassigned hardware serials in warehouse stock.`);

  // --------------------------------------------------
  // 5. GENERATE 330 DUMMY CUSTOMERS AND PROJECTS
  // --------------------------------------------------
  const TOTAL_RECORDS = 330;
  console.log(`Generating ${TOTAL_RECORDS} realistic dummy project records across India...`);

  // Realistic lifecycle status distribution:
  // 45 LEAD_RECEIVED, 35 SURVEY_PENDING, 45 SURVEY_APPROVED, 45 QUOTE_ISSUED,
  // 40 ORDER_CONFIRMED, 40 DISPATCHED, 45 COMMISSIONED, 25 COMPLETED, 10 REJECTED = 330
  const statusBuckets: { status: ProjectStatus; count: number }[] = [
    { status: ProjectStatus.LEAD_RECEIVED, count: 45 },
    { status: ProjectStatus.SURVEY_PENDING, count: 35 },
    { status: ProjectStatus.SURVEY_APPROVED, count: 45 },
    { status: ProjectStatus.QUOTE_ISSUED, count: 45 },
    { status: ProjectStatus.ORDER_CONFIRMED, count: 40 },
    { status: ProjectStatus.DISPATCHED, count: 40 },
    { status: ProjectStatus.COMMISSIONED, count: 45 },
    { status: ProjectStatus.COMPLETED, count: 25 },
    { status: ProjectStatus.REJECTED, count: 10 },
  ];

  const statuses: ProjectStatus[] = [];
  for (const b of statusBuckets) {
    for (let j = 0; j < b.count; j++) {
      statuses.push(b.status);
    }
  }

  // Capacities pool in kW
  const capacityPool = [2.0, 3.0, 3.5, 4.0, 5.0, 6.0, 7.5, 8.0, 10.0, 12.0, 15.0, 20.0, 25.0, 30.0, 50.0];

  const surveyorUserId = createdUsers[UserRole.SURVEYOR] || createdUsers[UserRole.ADMIN];
  const technicianUserId = createdUsers[UserRole.TECHNICIAN] || createdUsers[UserRole.ADMIN];

  const createdProjects: { id: string; projectCode: string; status: ProjectStatus; customerName: string }[] = [];

  for (let idx = 1; idx <= TOTAL_RECORDS; idx++) {
    const isCommercial = idx % 2 === 0;
    const namePool = isCommercial ? COMMERCIAL_NAMES : RESIDENTIAL_NAMES;
    const baseName = namePool[(idx - 1) % namePool.length];
    const customerName = `${baseName} ${idx > namePool.length ? `(Unit ${Math.floor(idx / namePool.length) + 1})` : ""}`.trim();

    const loc = INDIAN_CITIES[(idx - 1) % INDIAN_CITIES.length];
    const phone = `+91 ${91000 + (idx % 8999)} ${String(10000 + (idx * 27) % 89999).padStart(5, "0")}`;
    const email = `${customerName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 14)}@sunpower-client.in`;
    const address = `Plot ${10 + (idx % 180)}, ${loc.area}, ${loc.city}, ${loc.state} - ${loc.pin}`;

    // System Type: Approx 50% ON_GRID, 30% HYBRID, 20% OFF_GRID
    let systemType: SystemType;
    if (idx % 10 < 5) {
      systemType = SystemType.ON_GRID;
    } else if (idx % 10 < 8) {
      systemType = SystemType.HYBRID;
    } else {
      systemType = SystemType.OFF_GRID;
    }

    const capacityKw = capacityPool[(idx - 1) % capacityPool.length];
    const status = statuses[idx - 1] || ProjectStatus.LEAD_RECEIVED;

    // Price calculation
    let baseRatePerKw = 62000;
    if (systemType === SystemType.HYBRID) baseRatePerKw = 96000;
    else if (systemType === SystemType.OFF_GRID) baseRatePerKw = 88000;

    const agreedPrice = status === ProjectStatus.LEAD_RECEIVED ? 0 : Math.round(capacityKw * baseRatePerKw * (1 + (idx % 7) * 0.02));
    const projectCode = `PRJ-2026-${String(idx).padStart(3, "0")}`;

    // 1. Create Customer
    const customer = await prisma.customer.create({
      data: {
        fullName: customerName,
        phone,
        email,
        installationAddress: address,
      },
    });

    // 2. Create Project
    const project = await prisma.project.create({
      data: {
        projectCode,
        customerId: customer.id,
        capacityKw,
        systemType,
        status,
        agreedPrice: agreedPrice > 0 ? agreedPrice : null,
      },
    });

    createdProjects.push({ id: project.id, projectCode: project.projectCode, status: project.status, customerName });

    // 3. Attach Site Survey for projects past or in SURVEY_APPROVED
    const hasSurvey = (
      [
        ProjectStatus.SURVEY_APPROVED,
        ProjectStatus.QUOTE_ISSUED,
        ProjectStatus.ORDER_CONFIRMED,
        ProjectStatus.DISPATCHED,
        ProjectStatus.COMMISSIONED,
        ProjectStatus.COMPLETED,
        ProjectStatus.REJECTED,
      ] as ProjectStatus[]
    ).includes(status);

    if (hasSurvey) {
      const isViable = status !== ProjectStatus.REJECTED;
      await prisma.siteSurvey.create({
        data: {
          projectId: project.id,
          surveyorId: surveyorUserId,
          roofUsableAreaSqm: Math.round(capacityKw * 10 * 1.15),
          tiltDegrees: 16.5 + (idx % 6),
          azimuthDegrees: 178.0 + (idx % 10) - 5,
          cableRunMeters: 20 + (idx % 35),
          sanctionedLoadKw: capacityKw,
          isShadowFree: isViable,
          isViable: isViable,
          notes: isViable
            ? `South-facing RCC slab verified. Shadow-free solar window confirmed with 10m²/kW ratio for ${systemType} interconnect.`
            : `Roof flagged with structural parapet shading and poor slab load-bearing capacity. Marked unviable.`,
        },
      });
    }

    // 4. Attach Commissioning Record for COMMISSIONED / COMPLETED projects
    const hasCommissioning = ([ProjectStatus.COMMISSIONED, ProjectStatus.COMPLETED] as ProjectStatus[]).includes(status);
    if (hasCommissioning) {
      const warrantyStartDate = new Date(Date.now() - (idx % 60) * 86400000);
      await prisma.commissioningRecord.create({
        data: {
          projectId: project.id,
          leadTechnicianId: technicianUserId,
          vocVoltsMeasured: Number((380.0 + (idx % 15) * 1.5).toFixed(1)),
          iscAmpsMeasured: Number((9.5 + (idx % 8) * 0.1).toFixed(1)),
          earthingResistanceOhms: Number((1.8 + (idx % 12) * 0.1).toFixed(2)),
          completionPhotoUrl: `https://storage.sunpower.internal/commissioning/verified-${projectCode.toLowerCase()}.jpg`,
          customerSignatureSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 176"><path d="M 50 80 Q 150 20 250 80 T 450 80" fill="none" stroke="#38bdf8" stroke-width="2.5"/></svg>`,
          signedAt: warrantyStartDate,
        },
      });
    }
  }

  console.log(`✓ Created ${createdProjects.length} Projects and Customers.`);

  // --------------------------------------------------
  // 6. SEED 35 SUPPORT & SLA TICKETS
  // --------------------------------------------------
  const faultCodes = [
    { code: "E03-GRID-OVERVOLT", desc: "Inverter error code E03: Grid overvoltage trip observed during midday generation.", priority: "HIGH" },
    { code: "E07-ISO-RESISTANCE", desc: "Low DC array insulation resistance warning triggered following seasonal rainfall.", priority: "MEDIUM" },
    { code: "E12-DC-INJECTION", desc: "Intermittent DC current injection alarm flagged by DISCOM smart bidirectional meter.", priority: "HIGH" },
    { code: "COMM-SYNC-ISSUE", desc: "Smart WiFi datalogger disconnected from customer fiber gateway router.", priority: "LOW" },
    { code: "DOC-REQUEST", desc: "Customer requesting signed commissioning certificate for state rooftop solar subsidy portal.", priority: "LOW" },
  ];

  const commissionedProjects = createdProjects.filter(
    (p) => p.status === ProjectStatus.COMMISSIONED || p.status === ProjectStatus.COMPLETED
  );

  const TICKET_COUNT = 35;
  for (let t = 1; t <= TICKET_COUNT; t++) {
    const prj = commissionedProjects[(t - 1) % commissionedProjects.length];
    const fault = faultCodes[(t - 1) % faultCodes.length];
    let ticketStatus: TicketStatus = TicketStatus.OPEN;
    if (t % 3 === 1) ticketStatus = TicketStatus.IN_PROGRESS;
    else if (t % 3 === 2) ticketStatus = TicketStatus.RESOLVED;

    await prisma.supportTicket.create({
      data: {
        ticketNumber: `TCK-2026-${String(t).padStart(3, "0")}`,
        projectId: prj.id,
        reportedFaultCode: fault.code,
        description: `${fault.desc} (Client: ${prj.customerName})`,
        status: ticketStatus,
        isCoveredUnderWarranty: true,
        billableAmount: 0.0,
      },
    });
  }
  console.log(`✓ Seeded ${TICKET_COUNT} Support & SLA tickets.`);

  console.log("=== Seeding Successfully Completed ===");
  console.log(`Total Projects: ${createdProjects.length}`);
  console.log(`- On-Grid: ~165 projects`);
  console.log(`- Grid Hybrid: ~100 projects`);
  console.log(`- Off-Grid: ~65 projects`);
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
