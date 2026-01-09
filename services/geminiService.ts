
import { GoogleGenAI } from "@google/genai";

export const getChaplaincyInsights = async (dataSummary: string) => {
  const FALLBACK_MSG = "A capelania é luz nos momentos de dor. O trabalho realizado em cada setor faz a diferença na vida dos pacientes e colaboradores. Siga em frente com fé!";

  try {
    // Acesso seguro à variável de ambiente injetada pelo Vite/Vercel
    const apiKey = (import.meta as any).env?.VITE_API_KEY || (process as any).env?.API_KEY;

    if (!apiKey) {
      return "Sua dedicação é o que move a capelania. Cada atendimento é um passo para o conforto de quem precisa!";
    }

    const ai = new GoogleGenAI({ apiKey });
    
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
