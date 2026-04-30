import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const getAI = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY no configurada en el servidor");
    return new GoogleGenAI({ apiKey });
};

// ─── Endpoint 1: Chat conversacional ──────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
    try {
        const { messages, systemPrompt } = req.body;
        const ai = getAI();

        const contents = messages.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        }));

        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            config: { systemInstruction: systemPrompt },
            contents
        });

        const text = response.text;
        res.json({ text });
    } catch (error) {
        console.error("Error en Chat Gemini:", error);
        res.status(500).json({ error: "Error procesando la solicitud de IA" });
    }
});

// ─── Endpoint 2: Análisis estructurado con chartConfig ─────────────────────
app.post('/api/analyze', async (req, res) => {
    try {
        const { messages, systemPrompt, rawData } = req.body;
        const ai = getAI();

        const dataContext = rawData
            ? `\n\nDATO RAW DISPONIBLE PARA ANÁLISIS:\n${JSON.stringify(rawData, null, 2)}`
            : '';

        const fullSystemPrompt = `${systemPrompt}${dataContext}

REGLAS DE RESPUESTA:
1. Responde siempre en español.
2. Si tu respuesta incluye datos que se pueden graficar, incluye un objeto JSON al final con este EXACTO formato entre las etiquetas <chart> y </chart>:
<chart>
{
  "type": "bar" | "line" | "pie" | "area",
  "title": "Título del gráfico",
  "data": [...],
  "dataKey": "nombre_del_campo_numérico",
  "nameKey": "nombre_del_campo_de_categoría"
}
</chart>
3. Usa Markdown para formatear tu texto principal.
4. No incluyas la etiqueta <chart> si no hay datos para graficar.`;

        const contents = messages.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        }));

        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            config: { systemInstruction: fullSystemPrompt },
            contents
        });

        const fullText = response.text;

        const chartMatch = fullText.match(/<chart>([\s\S]*?)<\/chart>/);
        let chartConfig = null;
        let text = fullText.replace(/<chart>[\s\S]*?<\/chart>/g, '').trim();

        if (chartMatch) {
            try {
                chartConfig = JSON.parse(chartMatch[1].trim());
            } catch (e) {
                console.warn("No se pudo parsear chartConfig:", e);
            }
        }

        res.json({ text, chartConfig });
    } catch (error) {
        console.error("Error en Analyze Gemini:", error);
        res.status(500).json({ error: "Error procesando el análisis de IA" });
    }
});

// ─── Endpoint 3: Auto-Insights Estructurados ───────────────────────────────
app.post('/api/insights', async (req, res) => {
    try {
        const { summary, stats } = req.body;
        const ai = getAI();

        const systemPrompt = `Eres un analista de datos de Contact Center de élite. 
Analiza el siguiente resumen de datos operativos y genera un análisis estructurado de hallazgos.
Responde ÚNICAMENTE con un JSON válido, sin markdown, sin explicaciones adicionales.

ESTRUCTURA REQUERIDA:
{
  "findings": [
    {
      "type": "alert" | "trend" | "achievement" | "risk",
      "title": "Título corto del hallazgo (máx 5 palabras)",
      "description": "Descripción concisa del hallazgo con contexto",
      "value": "Valor o métrica destacada (ej: '87.3%', '+23%', '4h 12m')",
      "action": "Recomendación táctica concreta"
    }
  ],
  "executiveSummary": "Párrafo ejecutivo de 2-3 oraciones sobre el estado general de la operación"
}

Genera entre 3 y 5 findings. Sé específico con los números del dataset.`;

        const userMessage = `RESUMEN DEL DATASET:\n${summary}\n\nESTADÍSTICAS CLAVE:\nSLA: ${stats?.slaCompliance?.toFixed(1)}%\nAHT: ${stats?.avgDuration}\nBot Success: ${stats?.botSuccessRate?.toFixed(1)}%\nEficiencia: ${stats?.efficiencyIndex?.toFixed(1)}%\nSesiones: ${stats?.totalSessions}\nHora Pico: ${stats?.peakHour?.hour}:00\nTop Canal: ${stats?.sessionsByChannel?.[0]?.channel}`;

        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            config: { systemInstruction: systemPrompt },
            contents: [{ role: 'user', parts: [{ text: userMessage }] }]
        });

        const rawText = response.text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(rawText);
        res.json(parsed);
    } catch (error) {
        console.error("Error en Insights Gemini:", error);
        res.status(500).json({ error: "Error generando insights" });
    }
});

// ─── Endpoint 4: Slides Configurables ──────────────────────────────────────
app.post('/api/slides', async (req, res) => {
    try {
        const { stats, summary, config } = req.body;
        const ai = getAI();

        // Config defaults
        const slideCount = config?.slideCount ?? 5;
        const theme = config?.theme ?? 'teal';
        const includedTypes = config?.includedTypes ?? ['overview', 'efficiency', 'channels', 'tipification', 'action'];

        // Build dynamic narrative from selected types
        const narrativeMap = {
            overview:       'Situación Actual — Resumen ejecutivo del período',
            efficiency:     'Eficiencia Operativa — SLA, AHT, Índice de Eficiencia',
            channels:       'Mix de Canales — Análisis de distribución y preferencias',
            tipification:   'Cuellos de Botella — Tipificaciones críticas y volumen',
            action:         'Plan de Acción — Recomendaciones con impacto esperado',
            strategy:       'Estrategia — Visión a mediano plazo y KPIs objetivo',
            colas:          'Distribución por Colas — Análisis de flujos de atención',
            hourly:         'Análisis Horario — Picos de demanda y capacidad',
        };

        const selectedTypes = includedTypes.slice(0, slideCount);
        const narrativeList = selectedTypes
            .map((t, i) => `${i + 1}. SLIDE ${i + 1} (type: ${t}): ${narrativeMap[t] || t}`)
            .join('\n');

        const themeInstruction = `El color principal del tema visual es "${theme}". Refleja esto en los títulos y el tono.`;

        const systemPrompt = `Eres un Consultor Estratégico Senior (Ex-McKinsey, Bain) especialista en Contact Centers.
Tu misión es generar una presentación ejecutiva de ALTO IMPACTO basada en datos reales.
Responde ÚNICAMENTE con un JSON válido, sin markdown adicional.
${themeInstruction}

ESTRUCTURA DE CADA SLIDE:
{
  "slides": [
    {
      "title": "Título poderoso y directivo (máx 6 palabras)",
      "subtitle": "Hallazgo principal como pregunta o afirmación impactante",
      "content": "Análisis profundo de 2-3 oraciones con datos específicos del dataset.",
      "insight": "Recomendación táctica concreta y accionable",
      "metric": "VALOR UNIDAD (ej: '87.3% SLA', '4.2min AHT', '1,234 Sesiones')",
      "type": "overview" | "efficiency" | "channels" | "tipification" | "strategy" | "action" | "colas" | "hourly",
      "bulletPoints": ["Dato clave 1 con número", "Dato clave 2 con número", "Dato clave 3 con número"],
      "color": "${theme}"
    }
  ]
}

NARRATIVA REQUERIDA (${slideCount} slides exactamente):
${narrativeList}

IMPORTANTE: Usa EXCLUSIVAMENTE los datos reales proporcionados. Genera EXACTAMENTE ${slideCount} slides.`;

        const userMessage = `DATOS REALES DEL PERÍODO:
- Período: ${stats.dateRange}
- Total Sesiones: ${stats.totalSessions}
- SLA Compliance: ${stats.slaCompliance?.toFixed(2)}%
- AHT Promedio: ${stats.avgDuration}
- Bot Success Rate: ${stats.botSuccessRate?.toFixed(2)}%
- Efficiency Index: ${stats.efficiencyIndex?.toFixed(2)}%
- Hora Pico: ${stats.peakHour?.hour}:00 (${stats.peakHour?.count} sesiones)
- Transfer Rate: ${((stats.totalTransfers / stats.totalSessions) * 100).toFixed(1)}%
- Total Respuestas: ${stats.totalResponses}

CANALES (Top 5):
${stats.sessionsByChannel?.slice(0, 5).map(c => `  - ${c.channel}: ${c.count} sesiones (${((c.count/stats.totalSessions)*100).toFixed(1)}%)`).join('\n')}

TIPIFICACIONES CRÍTICAS (Top 5):
${stats.statsByTipificacion?.slice(0, 5).map(t => `  - ${t.category}: ${t.count} casos`).join('\n')}

COLAS DE ATENCIÓN:
${stats.statsByCola?.slice(0, 4).map(q => `  - ${q.cola}: ${q.count} sesiones`).join('\n')}

ESTADOS:
${stats.statsByStatus?.slice(0, 4).map(s => `  - ${s.status}: ${s.count}`).join('\n')}`;

        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            config: { systemInstruction: systemPrompt },
            contents: [{ role: 'user', parts: [{ text: userMessage }] }]
        });

        const rawText = response.text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(rawText);
        res.json(parsed);
    } catch (error) {
        console.error("Error en Slides Gemini:", error);
        res.status(500).json({ error: "Error generando slides" });
    }
});

app.listen(port, () => {
    console.log(`🚀 TSV Intelligence Server corriendo en http://localhost:${port}`);
    console.log(`📡 Endpoints: /api/chat | /api/analyze | /api/insights | /api/slides`);
});
