import Habit from "../models/Habit.js";
import HabitLog from "../models/HabitLog.js";
import AIInsight from "../models/AIInsight.js";
import { chatCompletion, SYSTEM_PROMPTS } from "../utils/aiService.js";
import { lastNDays, calcStreak, todayKey } from "../utils/dateHelpers.js";

const buildWeeklyContext = async (userId) => {
    const habits = await Habit.find({ userId, isArchived: false });
    const days = lastNDays(7);
    const logs = await HabitLog.find({
        userId,
        completedDate: { $gte: days[0], $lte: days[days.length - 1] },
    });
    const perHabit = habits.map((h) => {
        const completed = logs.filter(
            (l) => String(l.habitId) === String(h._id)
        ).length;
        return {
            name: h.name,
            category: h.category,
            frequency: h.frequency,
            completedDays: completed,
            targetDays: h.targetDays,
        };
    });
    return { days, perHabit };
};

export const weeklyReport = async (req, res) => {
    try {
        const ctx = await buildWeeklyContext(req.user._id);

        if (!ctx.perHabit.length) {
            return res.json({
                content:
                    "You don't have any active habits yet. Create your first habit to start tracking — I'll generate a weekly report once you have some data.",
            });
        }

        const userMsg = `Here is the user's habit data for the past 7 days (${ctx.days[0]} to ${ctx.days[6]}):\n\n${ctx.perHabit
            .map(
                (h) =>
                    `- ${h.name} (${h.category}, ${h.frequency}): completed ${h.completedDays} of the past 7 days, target ${h.targetDays}/week`
            )
            .join("\n")}

Please write the personalised weekly report now.`;

        const { content } = await chatCompletion({
            system: SYSTEM_PROMPTS.weekly,
            user: userMsg,
        });

        await AIInsight.create({
            userId: req.user._id,
            type: "weekly",
            content,
        });

        res.json({ content });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const suggestHabits = async (req, res) => {
    try {
        const { goals, productiveTime, struggles } = req.body;

        // Build user prompt for AI
        const userMsg = `User goals: ${goals || "not provided"}
Most productive time: ${productiveTime || "not provided"}
Past struggles: ${struggles || "not provided"}\n\n

Suggest exactly 3 personalised habits now.
Return JSON only.`;

        // Get AI-generated suggestions
        const { content } = await chatCompletion({
            system: SYSTEM_PROMPTS.suggestion,
            user: userMsg,
        });

        let suggestions = [];

        // Parse AI JSON response safely
        try {
            const cleaned = content
                .replace(/```json/g, "")
                .replace(/```/g, "")
                .trim();

            const parsed = JSON.parse(cleaned);
            suggestions = parsed.suggestions || [];
        } catch {
            suggestions = [];
        }

        // Fallback suggestions if AI response is invalid or empty
        if (!suggestions.length) {
            suggestions = [
                {
                    name: "10-minute morning walk",
                    description:
                        "Start the day with light movement and fresh air.",
                    frequency: "daily",
                    category: "Fitness",
                    icon: "🚶",
                    reason:
                        "Low-friction way to build consistency early in the day.",
                },
                {
                    name: "Read 5 pages",
                    description:
                        "Short daily reading to build a learning routine.",
                    frequency: "daily",
                    category: "Learning",
                    icon: "📚",
                    reason:
                        "Compounds into significant knowledge over weeks.",
                },
                {
                    name: "2 minutes of mindful breathing",
                    description:
                        "Pause and breathe to reset focus and reduce stress.",
                    frequency: "daily",
                    category: "Mindfulness",
                    icon: "🧘",
                    reason:
                        "Tiny anchor habit that fits any schedule.",
                },
            ];
        }

        // Save AI insight to database
        await AIInsight.create({
            userId: req.user._id,
            type: "suggestion",
            content: JSON.stringify(suggestions),
            meta: {
                goals,
                productiveTime,
                struggles,
            },
        });

        // Return final suggestions
        res.json({
            suggestions,
        });
    } catch (err) {
        res.status(500).json({
            message: err.message,
        });
    }
};

export const recoveryPlan = async (req, res) => {
    try {
        const { habitId } = req.body;

        // Find the habit
        const habit = await Habit.findOne({
            _id: habitId,
            userId: req.user._id,
        });

        // If habit does not exist
        if (!habit) {
            return res.status(404).json({
                message: "Habit not found",
            });
        }

        // Get all completion logs for this habit
        const logs = await HabitLog.find({
            userId: req.user._id,
            habitId,
        }).sort({ completedDate: -1 });

        // Extract completed date keys
        const keys = logs.map((log) => log.completedDate);

        // Calculate streak information
        const { current, longest } = calcStreak(keys);

        // Build prompt for AI
        const userMsg = `Habit: ${habit.name} (${habit.category})
Description: ${habit.description || "none"}
Current streak: ${current} days
Longest ever: ${longest} days

The user just broke a streak.
Write a warm and actionable 3-day recovery plan.`;

        // Generate AI recovery plan
        const { content } = await chatCompletion({
            system: SYSTEM_PROMPTS.recovery,
            user: userMsg,
        });

        // Save insight to database
        await AIInsight.create({
            userId: req.user._id,
            type: "recovery",
            content,
            meta: {
                habitId,
            },
        });

        // Return response
        res.json({
            content,
        });
    } catch (err) {
        res.status(500).json({
            message: err.message,
        });
    }
};

export const chatAnalysis = async (req, res) => {
    try {
        const { question } = req.body;

        // Validate input
        if (!question) {
            return res.status(400).json({
                message: "Question is required",
            });
        }

        // Get all active habits
        const habits = await Habit.find({
            userId: req.user._id,
            isArchived: false,
        });

        // Get last 30 days
        const days = lastNDays(30);

        // Fetch logs from last 30 days
        const logs = await HabitLog.find({
            userId: req.user._id,
            completedDate: {
                $gte: days[0],
                $lte: days[days.length - 1],
            },
        });

        // Build context for AI
        const context = habits
            .map((habit) => {
                const habitLogs = logs.filter(
                    (log) =>
                        String(log.habitId) === String(habit._id)
                );

                // Count completions by day of week
                // Index: 0=Sun, 1=Mon, ..., 6=Sat
                const byDow = [0, 0, 0, 0, 0, 0, 0];

                for (const log of habitLogs) {
                    const dow = new Date(
                        log.completedDate
                    ).getDay();
                    byDow[dow] += 1;
                }

                return `${habit.name} (${habit.category}): ${habitLogs.length}/30 completions in the last 30 days, by weekday [Sun, Mon, Tue, Wed, Thu, Fri, Sat] = [${byDow.join(
                    ", "
                )}]`;
            })
            .join("\n");

        // Build user message for AI
        const userMsg = `User question: "${question}"

User data (last 30 days):
${context}

Answer now.`;

        // Generate AI response
        const { content } = await chatCompletion({
            system: SYSTEM_PROMPTS.chat,
            user: userMsg,
        });

        // Save chat insight
        await AIInsight.create({
            userId: req.user._id,
            type: "chat",
            content,
            meta: {
                question,
            },
        });

        // Return response
        res.json({
            content,
        });
    } catch (err) {
        res.status(500).json({
            message: err.message,
        });
    }
};

export const morningMotivation = async (req, res) => {
    try {
        // Get all active habits
        const habits = await Habit.find({
            userId: req.user._id,
            isArchived: false,
        });

        // If no habits exist
        if (!habits.length) {
            return res.json({
                content:
                    "Good morning! Add your first habit today and let's get the momentum started.",
            });
        }

        // Get last 30 days
        const days = lastNDays(30);

        // Fetch logs for last 30 days
        const logs = await HabitLog.find({
            userId: req.user._id,
            completedDate: {
                $gte: days[0],
                $lte: days[days.length - 1],
            },
        });

        // Build streak context
        const ctx = habits
            .map((habit) => {
                const habitLogs = logs
                    .filter(
                        (log) =>
                            String(log.habitId) === String(habit._id)
                    )
                    .map((log) => log.completedDate)
                    .sort()
                    .reverse();

                const { current } = calcStreak(habitLogs);

                return `${habit.name}: current streak ${current} day${current === 1 ? "" : "s"
                    }`;
            })
            .join("\n");

        // Today's completion stats
        const today = todayKey();

        const todayLogs = logs.filter(
            (log) => log.completedDate === today
        );

        const done = todayLogs.length;
        const total = habits.length;

        // Build AI prompt
        const userMsg = `Today's habits and streaks:
${ctx}

Done today: ${done}/${total} habits.

Write the morning motivation message now.`;

        // Generate AI message
        const { content } = await chatCompletion({
            system: SYSTEM_PROMPTS.morning,
            user: userMsg,
            temperature: 0.8,
        });

        // Save insight
        await AIInsight.create({
            userId: req.user._id,
            type: "morning",
            content,
        });

        // Return response
        res.json({
            content,
        });
    } catch (err) {
        res.status(500).json({
            message: err.message,
        });
    }
};