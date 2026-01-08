
import { GoogleGenAI } from "@google/genai";

export const getChaplaincyInsights = async (dataSummary: string) => {
  // Mensagem de fallback padrão (usada em caso de erro ou cota excedida)
  const FALLBACK_MSG = "A capelania é luz nos momentos de dor. O trabalho realizado em cada setor faz a diferença na vida dos pacientes e colaboradores. Siga em frente com fé!";

  try {
    // Verificação preventiva de API_KEY
    if (!process.env.API_KEY) {
      return "Sua dedicação é o que move a capelania. Cada atendimento é um passo para o conforto de quem precisa!";
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Tentativa segura de chamada à API
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
    // Silencia o erro no console para não assustar o usuário, apenas loga como aviso
    console.warn("Gemini API indisponível ou cota excedida. Usando mensagem offline.");
    
    // Retorna mensagem motivacional imediatamente sem lançar exceção para o App
    return FALLBACK_MSG;
  }
};
