import {
    format,
    subDays,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
} from "date-fns";

// Convert Date object to YYYY-MM-DD format
export const toDateKey = (date) => format(date, "yyyy-MM-dd");

// Get today's date key
export const todayKey = () => toDateKey(new Date());

/**
 * Last 7 days including today
 * Example: ["2026-05-07", ..., "2026-05-13"]
 */
export const last7Days = () => {
    const end = new Date();
    const start = subDays(end, 6);
    return eachDayOfInterval({ start, end }).map(toDateKey);
};

/**
 * Last 30 days including today
 * Example: ["2026-04-14", ..., "2026-05-13"]
 */
export const last30Days = () => {
    const end = new Date();
    const start = subDays(end, 29);
    return eachDayOfInterval({ start, end }).map(toDateKey);
};

/**
 * Last 90 days including today
 */
export const last90Days = () => {
    const end = new Date();
    const start = subDays(end, 89);
    return eachDayOfInterval({ start, end }).map(toDateKey);
};

/**
 * Current week (Monday to Sunday)
 */
export const currentWeekKeys = () => {
    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn: 1 });
    const end = endOfWeek(now, { weekStartsOn: 1 });

    return eachDayOfInterval({ start, end }).map(toDateKey);
};

/**
 * Last N days including today
 */
export const lastNDays = (n) => {
    const end = new Date();
    const start = subDays(end, n - 1);

    return eachDayOfInterval({ start, end }).map(toDateKey);
};

/**
 * Calculate current and longest streak
 * Input: sortedDateKeys (newest first, unique)
 */
export const calcStreak = (sortedDateKeys = []) => {
    // Remove duplicates
    const uniqueDateKeys = [...new Set(sortedDateKeys)];

    if (!uniqueDateKeys.length) {
        return {
            current: 0,
            longest: 0,
        };
    }

    const set = new Set(uniqueDateKeys);
    const today = todayKey();
    const yesterday = toDateKey(subDays(new Date(), 1));

    // ----------------------------
    // Calculate Current Streak
    // ----------------------------
    let current = 0;
    let cursor = new Date();

    // If neither today nor yesterday exists, streak is broken
    if (!set.has(today) && !set.has(yesterday)) {
        current = 0;
    } else {
        // If today's habit is not completed, start from yesterday
        if (!set.has(today)) {
            cursor = subDays(cursor, 1);
        }

        // Count consecutive completed days backward
        while (set.has(toDateKey(cursor))) {
            current += 1;
            cursor = subDays(cursor, 1);
        }
    }

    // ----------------------------
    // Calculate Longest Streak
    // ----------------------------
    const sortedAsc = [...uniqueDateKeys].sort();

    let longest = 0;
    let run = 0;
    let prev = null;

    for (const key of sortedAsc) {
        if (prev) {
            const currentDate = new Date(key);
            const previousDate = new Date(prev);

            const diff = Math.round(
                (currentDate - previousDate) / (1000 * 60 * 60 * 24)
            );

            if (diff === 1) {
                run += 1;
            } else {
                run = 1;
            }
        } else {
            run = 1;
        }

        longest = Math.max(longest, run);
        prev = key;
    }

    return {
        current,
        longest,
    };
};