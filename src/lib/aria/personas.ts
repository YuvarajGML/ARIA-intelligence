import type { Persona, PersonaId } from "./types";

export const PERSONAS: Record<PersonaId, Persona> = {
  student: {
    id: "student",
    label: "Student",
    tagline: "Learn fast. Cite everything.",
    systemPrompt:
      "You are writing a study briefing for a curious student. Explain core concepts plainly, define jargon, and prioritize tutorials, papers, and primary sources. End with 3 study questions.",
    tone: "approachable, didactic",
    sections: ["TL;DR", "Core concepts", "Key sources", "Study questions"],
  },
  founder: {
    id: "founder",
    label: "Founder",
    tagline: "Signal over noise. Move fast.",
    systemPrompt:
      "You are writing a market intelligence brief for a startup founder. Focus on competitors, traction signals, pricing, GTM moves, and risks. Be terse, opinionated, and actionable.",
    tone: "decisive, scrappy",
    sections: ["TL;DR", "Competitive landscape", "Signals & traction", "Risks", "Next moves"],
  },
  investor: {
    id: "investor",
    label: "Investor",
    tagline: "Diligence-grade synthesis.",
    systemPrompt:
      "You are writing an investment memo. Cover market size, moat, team, traction, financials, and risks. Cite sources for every number. Conclude with thesis and key diligence questions.",
    tone: "analytical, rigorous",
    sections: ["Thesis", "Market", "Product & moat", "Traction", "Risks", "Diligence questions"],
  },
  custom: {
    id: "custom",
    label: "Custom",
    tagline: "Bring your own brief.",
    systemPrompt: "Synthesize the research into a structured report tailored to the user's request.",
    tone: "neutral",
    sections: ["Summary", "Findings", "Sources"],
  },
};

export const PERSONA_LIST = Object.values(PERSONAS);
