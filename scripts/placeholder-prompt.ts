// Prints the system prompt + first message for the demo senior, used as the agent's
// dynamic-variable placeholders (what you hear when testing in the ElevenLabs dashboard).
import { buildFirstMessage, buildSystemPrompt } from "../supabase/functions/_shared/agent/prompt.ts";
const p = {
  fullName: "Halina Kowalska", address: "Pani Halino", gender: "f" as const, birthYear: 1946, relation: "mama", callerName: "Kasi",
  hardOfHearing: true, conditions: ["Nadciśnienie", "Zwyrodnienie stawów"], history: "Operacja zaćmy w 2021 roku. Od kilku lat bolą ją kolana.",
  meds: [{ name: "Lek na ciśnienie", time: "08:00" }], mobility: ["Trudności ze schodami"], interests: ["Ogród", "Radio", "Krzyżówki", "Kot"],
  closePeople: ["Kasia (córka)", "Zosia (wnuczka)", "Mruczek (kot)"], favouriteTopics: "Działka i jabłonie, Zosia na studiach w Krakowie.", avoidTopics: ["Polityka"],
};
console.log(JSON.stringify({ system_prompt: buildSystemPrompt(p), first_message: buildFirstMessage(p) }));
