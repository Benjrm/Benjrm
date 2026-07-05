const rankingClassNameCache = new Map<number, string>()

/**
 * Returns the Tailwind class string for a leaderboard row's rank badge,
 * highlighting the top 3 ranks distinctly. Results are cached since the
 * set of possible rankings is small and reused across re-renders.
 */
export default function getRankingClassName(ranking: number): string {
    if (rankingClassNameCache.has(ranking)) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return rankingClassNameCache.get(ranking)!
    }
    const baseClasses =
        "transition-all duration-300 ease-out hover:scale-[1.01] hover:shadow-lg cursor-pointer"
    let result: string
    if (ranking === 1) {
        result = `${baseClasses} bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700 hover:shadow-cyan-500/30`
    } else if (ranking === 2) {
        result = `${baseClasses} bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border-orange-300 dark:border-orange-700 hover:shadow-orange-500/30`
    } else if (ranking === 3) {
        result = `${baseClasses} bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-300 dark:border-purple-700 hover:shadow-purple-500/30`
    } else {
        result = `${baseClasses} bg-card text-card-foreground border-border hover:shadow-muted/50`
    }
    rankingClassNameCache.set(ranking, result)
    return result
}
