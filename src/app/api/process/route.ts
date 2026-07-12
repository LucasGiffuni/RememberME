import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { scheduleReminder } from "@/lib/qstash";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `Eres RememberME, un asistente personal inteligente en español. Tu trabajo es ayudar al usuario a:
1. Organizar tareas complejas desglosándolas en pasos
2. Crear listas (compras, pendientes, etc.)
3. Organizar su día con una agenda
4. Recordarle cosas importantes

REGLAS:
- Siempre responde en formato JSON válido
- Analiza el mensaje del usuario y determina qué quiere hacer
- Si menciona una lista de compras, organízala por categorías
- Si es una tarea compleja, desglósala en subtareas
- Si habla de su día o agenda, crea items de agenda con horarios sugeridos
- Mantén las tareas y agenda existentes del usuario y agrégales los nuevos

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
      "deadline": "before:14:00 | between:16:00-17:00 | after:09:00 (formato para restricciones horarias)",
      "estimatedMinutes": 30,
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
  "message": "Mensaje opcional para el usuario"
}

IMPORTANTE: 
- Genera IDs únicos usando el formato "task-", "agenda-" seguido de un timestamp numérico
- Si el usuario tiene datos existentes, inclúyelos en la respuesta junto con los nuevos
- Prioriza la claridad y la organización
- Si el usuario menciona un horario ("antes de las 2", "entre 4 y 5"), usa el campo deadline con formato: "before:HH:MM", "between:HH:MM-HH:MM", "after:HH:MM"
- Si el usuario dice algo como "tengo cita a las 3", crea una tarea con deadline "between:15:00-16:00"
- Si el usuario dice "recuérdame mañana a las 8 que tengo que...", crea un item de agenda con reminder`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, tasks = [], agenda = [] } = body;

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
        message: "Tarea agregada (configura GEMINI_API_KEY para respuestas inteligentes)",
      });
    }

    const userContext = `
Tareas actuales del usuario: ${JSON.stringify(tasks)}
Agenda actual: ${JSON.stringify(agenda)}
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

    // Schedule reminders with QStash
    const { userId } = await auth();
    if (userId && process.env.QSTASH_TOKEN) {
      // Schedule reminders for tasks with reminder field
      if (parsed.tasks) {
        for (const task of parsed.tasks) {
          if (task.reminder && !task.completed) {
            const reminderDate = new Date(task.reminder);
            if (reminderDate > new Date()) {
              await scheduleReminder(userId, "Recordatorio", task.title, reminderDate).catch(console.error);
            }
          }
        }
      }
    }

    return Response.json(parsed);
  } catch (error) {
    console.error("API Error:", error);
    // Fallback
    const body = await request.clone().json().catch(() => ({ message: "", tasks: [], agenda: [] }));
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
      message: "Error al procesar. Tarea agregada de forma simple.",
    });
  }
}
