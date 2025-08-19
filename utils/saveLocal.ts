import fs from 'fs';
import path from 'path';

export function saveResponseToLocalCSV(email: string, name: string, timestamp: string) {
  try {
    const csvPath = path.join(process.cwd(), 'party_responses.csv');
    const csvRow = `"${email}","${name}","${timestamp}","EMAIL"\n`;
    
    // Check if file exists, if not create with header
    if (!fs.existsSync(csvPath)) {
      const header = 'contact,name,timestamp,type\n';
      fs.writeFileSync(csvPath, header);
    }
    
    // Append the new response
    fs.appendFileSync(csvPath, csvRow);
    console.log(`Saved response to local CSV: ${email} - ${name}`);
  } catch (error) {
    console.error('Failed to save to local CSV:', error);
  }
}