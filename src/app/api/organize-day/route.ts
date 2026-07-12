import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const ORGANIZE_PROMPT = `Eres RememberME, un organizador inteligente del día. 

El usuario tiene tareas y hábitos que necesita completar hoy. Tu trabajo es crear un plan del día óptimo.

REGLAS:
1. Organiza las tareas respetando sus restricciones de horario (deadline field):
   - "before:14:00" = debe hacerse antes de las 14:00
   - "between:16:00-17:00" = debe hacerse entre esas horas
   - "after:09:00" = debe hacerse después de las 09:00
2. Distribuye los hábitos en horarios lógicos (ejercicio temprano, lectura noche, etc.)
3. Deja espacios entre tareas (no agendes todo seguido)
4. Prioriza tareas de alta prioridad primero
5. Estima duración si no se provee (tareas simples: 15min, medias: 30min, complejas: 60min)
6. Sugiere mejoras basadas en lo que ves (ej: "Podrías agrupar las tareas de casa juntas")

FORMATO DE RESPUESTA (JSON):
{
  "agenda": [
    {
      "id": "plan-timestamp",
      "time": "09:00",
      "endTime": "09:30",
      "title": "Título de la actividad",
      "description": "Detalle opcional o por qué se sugiere a esta hora",
      "type": "task|habit|reminder",
      "taskId": "id-de-la-tarea-original (si aplica)",
      "completed": false
    }
  ],
  "suggestions": [
    "Sugerencia 1 para mejorar el día",
    "Sugerencia 2 basada en patrones detectados"
  ]
}

IMPORTANTE:
- Genera IDs con formato "plan-" seguido de timestamp
- El campo "time" usa formato 24h HH:mm
- Incluye TODAS las tareas pendientes y hábitos del día
- Si detectas patrones (ej: muchas tareas de casa), sugiere agruparlas
- Si ves que el usuario tiene demasiado, sugiere priorizar
- Sé realista con los tiempos`;

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { tasks = [], habits = [] } = body;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    const dayOfWeek = now.toLocaleDateString("es-ES", { weekday: "long" });

    if (!GEMINI_API_KEY) {
      // Fallback: simple organization without AI
      const pendingTasks = tasks.filter((t: { completed: boolean }) => !t.completed);
      const agenda = pendingTasks.map((task: { id: string; title: string; deadline?: string }, i: number) => {
        const hour = 9 + i;
        return {
          id: `plan-${Date.now()}-${i}`,
          time: `${hour.toString().padStart(2, "0")}:00`,
          endTime: `${hour.toString().padStart(2, "0")}:30`,
          title: task.title,
          type: "task",
          taskId: task.id,
          completed: false,
        };
      });
      return Response.json({ agenda, suggestions: ["Configura GEMINI_API_KEY para organización inteligente"] });
    }

    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const todaysHabits = habits.filter((h: { frequency: string; customDays?: number[]; completedDates: string[] }) => {
      if (h.completedDates.includes(todayStr)) return false;
      if (h.frequency === "daily") return true;
      if (h.frequency === "custom" && h.customDays) return h.customDays.includes(now.getDay());
      if (h.frequency === "weekly") return now.getDay() === 1;
      return false;
    });

    const pendingTasks = tasks.filter((t: { completed: boolean }) => !t.completed);

    const userContext = `
Día: ${dayOfWeek}
Hora actual: ${currentTime}
Tareas pendientes: ${JSON.stringify(pendingTasks)}
Hábitos pendientes de hoy: ${JSON.stringify(todaysHabits)}

Organiza el día desde la hora actual en adelante.`;

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: ORGANIZE_PROMPT + "\n\n" + userContext }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("No response from Gemini");
    }

    const parsed = JSON.parse(text);
    return Response.json(parsed);
  } catch (error) {
    console.error("Organize day error:", error);
    return Response.json({ agenda: [], suggestions: ["Error al organizar. Intenta de nuevo."] }, { status: 500 });
  }
}
