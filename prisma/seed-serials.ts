import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Looking up available stock items...");

  // Automatically find existing items in your StockItem table
  const stockItems = await prisma.stockItem.findMany();

  if (stockItems.length === 0) {
    console.error("No stock items found in database! Please run your initial seed first.");
    return;
  }

  // Generate 2 test serial numbers for each existing stock item
  for (const item of stockItems) {
    const prefix = item.category || "HW";
    
    await prisma.serialRegistry.createMany({
      data: [
        {
          serialNumber: `${prefix}-SN-1001`,
          stockItemId: item.id,
          isDispatched: false,
        },
        {
          serialNumber: `${prefix}-SN-1002`,
          stockItemId: item.id,
          isDispatched: false,
        },
      ],
      skipDuplicates: true,
    });

    console.log(`Created serials: ${prefix}-SN-1001 and ${prefix}-SN-1002 for ${item.modelName}`);
  }

  console.log("Serials ready for testing!");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());