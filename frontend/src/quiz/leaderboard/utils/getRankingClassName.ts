export default function getRankingClassName(ranking: number): string {
    if (ranking === 1) {
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700"
    }

    if (ranking === 2) {
        return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700"
    }

    if (ranking === 3) {
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300 dark:border-amber-700"
    }

    return "bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-800"
}
