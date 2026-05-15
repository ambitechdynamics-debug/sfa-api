import { chatService } from './modules/chat/chat.service';
import { prisma } from './config/database';

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log("Aucun utilisateur trouvé dans la base de données. Impossible de tester.");
    return;
  }
  
  console.log("Test de l'agent IA pour l'utilisateur:", user.id);
  
  try {
    const response = await chatService.sendMessage({
      message: "Bonjour, quel est ton rôle exact au sein de Studio Flyer AI ?",
      history: []
    }, user.id);
    
    console.log("\n=== RÉPONSE DE L'IA ===");
    console.log(response.reply);
    console.log("=======================\n");
  } catch (error) {
    console.error("\nErreur lors de l'appel à l'IA:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
