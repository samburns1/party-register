#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

async function exportRegistrations() {
  try {
    console.log(
      "Fetching registrations from https://1306.space/api/debug-registrations..."
    );

    const response = await fetch("https://1306.space/api/debug-registrations");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch registrations");
    }

    console.log(`Found ${data.total} registrations`);

    // Create CSV content
    let csvContent = "contact,name,timestamp,type\n";

    data.registrations.forEach((reg) => {
      if (reg.data) {
        const contact = reg.data.email || reg.data.phone || "unknown";
        const name = reg.data.name || "unknown";
        const timestamp = reg.data.ts || "unknown";
        const type = reg.data.email ? "EMAIL" : "SMS";

        // Escape commas in names
        const escapedName = name.includes(",") ? `"${name}"` : name;
        const escapedContact = contact.includes(",") ? `"${contact}"` : contact;

        csvContent += `${escapedContact},${escapedName},${timestamp},${type}\n`;
      }
    });

    // Save to local file
    const filename = `reigstrations.csv`;
    const filepath = path.join(process.cwd(), filename);

    fs.writeFileSync(filepath, csvContent);

    console.log(`✅ Exported ${data.total} registrations to: ${filepath}`);
  } catch (error) {
    console.error("❌ Export failed:", error.message);
    process.exit(1);
  }
}

exportRegistrations();
