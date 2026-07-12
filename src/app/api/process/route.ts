import { NextRequest } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `Eres RememberME, un asistente personal inteligente en español. Tu trabajo es ayudar al usuario a:
1. Organizar tareas complejas desglosándolas en pasos
2. Crear listas (compras, pendientes, etc.)
3. Organizar su día con una agenda
4. Recordarle cosas importantes
5. Crear citas y eventos en el calendario

REGLAS:
- Siempre responde en formato JSON válido
- Analiza el mensaje del usuario y determina qué quiere hacer
- Si menciona una lista de compras, organízala por categorías
- Si es una tarea compleja, desglósala en subtareas
- Si habla de su día o agenda, crea items de agenda con horarios sugeridos
- Si menciona una cita, reunión, evento o algo con fecha/hora específica, créalo como evento de calendario
- Mantén las tareas, agenda y eventos existentes del usuario y agrégales los nuevos

FORMATO DE RESPUESTA (JSON):
{
  "tasks": [
    {
      "id": "task-timestamp",
      "title": "Título de la tarea",
      "completed": false,
      "category": "Categoría",
      "subtasks": [{"id": "sub-timestamp", "title": "subtarea", "completed": false}],
      "priority": "high|medium|low",
      "dueDate": "2024-01-01T00:00:00Z (opcional)",
      "reminder": "2024-01-01T09:00:00Z (opcional)",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "agenda": [
    {
      "id": "agenda-timestamp",
      "time": "09:00",
      "title": "Título",
      "description": "Descripción opcional",
      "type": "task|reminder|event",
      "completed": false
    }
  ],
  "events": [
    {
      "id": "event-timestamp",
      "title": "Título del evento",
      "description": "Descripción opcional",
      "date": "2024-01-15",
      "startTime": "09:00",
      "endTime": "10:00",
      "recurring": "none|daily|weekly|monthly",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "message": "Mensaje opcional para el usuario"
}

IMPORTANTE: 
- Genera IDs únicos usando el formato "task-", "agenda-", "event-" seguido de un timestamp numérico
- Si el usuario tiene datos existentes, inclúyelos en la respuesta junto con los nuevos
- Prioriza la claridad y la organización
- Si el usuario dice algo como "tengo cita con el dentista el martes a las 3", crea un evento de calendario
- Si el usuario dice "recuérdame mañana a las 8 que tengo que...", crea un item de agenda con reminder`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, tasks = [], agenda = [], events = [] } = body;

    if (!GEMINI_API_KEY) {
      // Fallback: create a simple task without AI
      const newTask = {
        id: `task-${Date.now()}`,
        title: message,
        completed: false,
        category: "General",
        subtasks: [],
        priority: "medium" as const,
        createdAt: new Date().toISOString(),
      };
      return Response.json({
        tasks: [...tasks, newTask],
        agenda,
        events,
        message: "Tarea agregada (configura GEMINI_API_KEY para respuestas inteligentes)",
      });
    }

    const userContext = `
Tareas actuales del usuario: ${JSON.stringify(tasks)}
Agenda actual: ${JSON.stringify(agenda)}
Eventos de calendario actuales: ${JSON.stringify(events)}
Fecha y hora actual: ${new Date().toLocaleString("es-ES", { timeZone: "America/Argentina/Buenos_Aires" })}

Mensaje del usuario: "${message}"`;

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: SYSTEM_PROMPT + "\n\n" + userContext }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
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
    console.error("API Error:", error);
    // Fallback
    const body = await request.clone().json().catch(() => ({ message: "", tasks: [], agenda: [], events: [] }));
    const newTask = {
      id: `task-${Date.now()}`,
      title: body.message || "Nueva tarea",
      completed: false,
      category: "General",
      subtasks: [],
      priority: "medium" as const,
      createdAt: new Date().toISOString(),
    };
    return Response.json({
      tasks: [...(body.tasks || []), newTask],
      agenda: body.agenda || [],
      events: body.events || [],
      message: "Error al procesar. Tarea agregada de forma simple.",
    });
  }
}
