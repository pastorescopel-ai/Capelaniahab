
import { GoogleGenAI } from "@google/genai";

export const getChaplaincyInsights = async (dataSummary: string) => {
  const FALLBACK_MSG = "A capelania é luz nos momentos de dor. O trabalho realizado em cada setor faz a diferença na vida dos pacientes e colaboradores. Siga em frente com fé!";

  try {
    // Initialization using the mandatory process.env.API_KEY directly as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analise os seguintes dados de capelania hospitalar e forneça um resumo motivacional e estratégico (máximo 150 palavras) para a equipe:\n\n${dataSummary}`,
      config: {
        systemInstruction: "Você é um consultor de liderança cristã e capelania hospitalar focado em impacto e acolhimento. Seja inspirador e prático.",
      }
    });

    if (response && response.text) {
      return response.text;
    }
    
    return FALLBACK_MSG;

  } catch (error: any) {
    console.warn("Gemini API indisponível ou cota excedida. Usando mensagem offline.");
    return FALLBACK_MSG;
  }
};