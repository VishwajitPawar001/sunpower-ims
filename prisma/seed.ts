
import { PrismaClient, UserRole, ComponentType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting SunPower database seeding...");

  // Read the initial password from the .env file
  const initialPassword = process.env.SEED_PASSWORD;

  if (!initialPassword) {
    throw new Error("SEED_PASSWORD is missing from your .env file.");
  }

  // Hash the password before storing it
  const passwordHash = await bcrypt.hash(initialPassword, 12);

  // --------------------------------------------------
  // 1. CREATE INITIAL USERS FOR ALL SIX ROLES
  // --------------------------------------------------

  const users = [
    {
      email: "admin@sunpower.local",
      fullName: "System Administrator",
      role: UserRole.ADMIN,
    },
    {
      email: "sales@sunpower.local",
      fullName: "Sales Executive",
      role: UserRole.SALES,
    },
    {
      email: "surveyor@sunpower.local",
      fullName: "Site Surveyor",
      role: UserRole.SURVEYOR,
    },
    {
      email: "warehouse@sunpower.local",
      fullName: "Warehouse Manager",
      role: UserRole.WAREHOUSE,
    },
    {
      email: "technician@sunpower.local",
      fullName: "Installation Technician",
      role: UserRole.TECHNICIAN,
    },
    {
      email: "support@sunpower.local",
      fullName: "Support Executive",
      role: UserRole.SUPPORT,
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        fullName: user.fullName,
        role: user.role,
        isActive: true,
      },
      create: {
        ...user,
        passwordHash,
      },
    });
  }

  console.log("Created or verified six role-based users.");

  // --------------------------------------------------
  // 2. CREATE SAMPLE CUSTOMERS
  // --------------------------------------------------

  const customers = [
    {
      fullName: "Aarav Sharma",
      phone: "+910000000001",
      email: "aarav@example.test",
      installationAddress: "Hyderabad, Telangana",
    },
    {
      fullName: "Diya Reddy",
      phone: "+910000000002",
      email: "diya@example.test",
      installationAddress: "Secunderabad, Telangana",
    },
  ];

  for (const customer of customers) {
    await prisma.customer.upsert({
      where: { phone: customer.phone },
      update: {
        fullName: customer.fullName,
        email: customer.email,
        installationAddress: customer.installationAddress,
      },
      create: customer,
    });
  }

  console.log("Created or verified sample customers.");

  // --------------------------------------------------
  // 3. CREATE SAMPLE WAREHOUSE STOCK ITEMS
  // --------------------------------------------------

  const stockItems = [
    {
      sku: "SOLAR-PANEL-550W",
      modelName: "550W Monocrystalline Solar Panel",
      category: ComponentType.PANEL,
      unitCost: "12000.00",
      quantityOnHand: 100,
      warrantyMonths: 300,
    },
    {
      sku: "SOLAR-INV-3KW",
      modelName: "3KW Solar Inverter",
      category: ComponentType.INVERTER,
      unitCost: "25000.00",
      quantityOnHand: 25,
      warrantyMonths: 60,
    },
    {
      sku: "SOLAR-BAT-5KWH",
      modelName: "5KWh Solar Battery",
      category: ComponentType.BATTERY,
      unitCost: "45000.00",
      quantityOnHand: 20,
      warrantyMonths: 60,
    },
    {
      sku: "SOLAR-STRUCTURE-01",
      modelName: "Solar Mounting Structure",
      category: ComponentType.STRUCTURE,
      unitCost: "8000.00",
      quantityOnHand: 50,
      warrantyMonths: 24,
    },
    {
      sku: "SOLAR-BOS-01",
      modelName: "Balance of System Kit",
      category: ComponentType.BALANCE_OF_SYSTEM,
      unitCost: "5000.00",
      quantityOnHand: 50,
      warrantyMonths: 24,
    },
  ];

  for (const item of stockItems) {
    await prisma.stockItem.upsert({
      where: { sku: item.sku },
      update: {
        modelName: item.modelName,
        category: item.category,
        unitCost: item.unitCost,
        warrantyMonths: item.warrantyMonths,
      },
      create: item,
    });
  }

  console.log("Created or verified sample stock items.");

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
