import { prisma } from './config/database';

async function main() {
  const setting = await prisma.appSetting.findUnique({ where: { key: 'gemini_api_key' } });
  if (!setting || !setting.value) {
    console.log("No Gemini API key found.");
    return;
  }
  
  const key = setting.value;
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.models) {
      console.log("Available models:");
      data.models.forEach((m: any) => console.log(m.name));
    } else {
      console.log("Response:", data);
    }
  } catch (err) {
    console.error("Error fetching models:", err);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
