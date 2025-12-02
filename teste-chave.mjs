import { GoogleGenerativeAI } from "@google/generative-ai";

// ⚠️ COLE SUA CHAVE DENTRO DAS ASPAS ABAIXO:
const genAI = new GoogleGenerativeAI('AIzaSyCnt-oSNgjuBZy1mj3V0uM4GVQA0gSKD6A');

async function teste() {
  console.log("🔄 Testando conexão com Gemini...");
  try {
    // Vamos tentar o modelo mais básico que existe
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent("Diga 'Olá' se você estiver funcionando.");
    console.log("✅ SUCESSO! A chave funcionou.");
    console.log("Resposta da IA:", result.response.text());
  } catch (error) {
    console.error("❌ ERRO NA CHAVE:", error.message);
    console.log("\n--- Diagnóstico ---");
    if (error.message.includes("API key not valid")) console.log("-> A chave foi copiada errada.");
    if (error.message.includes("not found")) console.log("-> A chave é válida, mas não tem permissão para acessar o Gemini.");
  }
}

teste();