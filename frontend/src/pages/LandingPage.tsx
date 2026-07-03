// frontend/src/pages/LandingPage.tsx

import { useState } from "react"
import type { JSX } from "react"
import { useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import GamePinForm from "@/components/GamePinForm"
import { getSession } from "@/api/session"
import { ApiError } from "@/api/utils"

export default function LandingPage(): JSX.Element {
    const navigate = useNavigate()
    const { t } = useTranslation()
    const [isPending, setIsPending] = useState(false)
    const [error, setError] = useState<string | null>(null)

    return (
        <div className="bg-background text-foreground flex flex-col">
            <div className="relative mx-auto flex w-full flex-1 items-start px-4 pt-12 pb-12 sm:px-6 md:pt-20">
                <div className="relative z-10 grid w-full grid-cols-1 items-center gap-8 md:grid-cols-2 lg:gap-24">
                    {/* Left Column */}
                    <div className="flex flex-col gap-6 md:gap-10">
                        <div className="space-y-4 md:space-y-6">
                            {/* Orange pill */}
                            <div className="inline-flex w-max items-center gap-2 rounded-full border border-[#FF8A00]/20 bg-[#FF8A00]/10 px-3 py-1.5 text-xs font-bold tracking-widest text-[#FF8A00] uppercase">
                                <span className="h-2 w-2 animate-pulse rounded-full bg-[#FF8A00]" />
                                {t("landing.newFeaturesLive")}
                            </div>

                            {/* Smaller heading on mobile */}
                            <h1 className="flex flex-col gap-2 text-4xl font-extrabold tracking-tighter sm:gap-2 sm:text-5xl md:text-7xl">
                                <span>{t("landing.engageAndLearn")}</span>
                                <span>
                                    {t("landing.with")}{" "}
                                    <span className="text-[#00F2FF]">{t("common.brandName")}</span>
                                </span>
                            </h1>
                            <p className="text-muted-foreground text-base font-medium tracking-wide sm:text-xl">
                                {t("landing.subtitle")}
                            </p>
                        </div>

                        <GamePinForm
                            error={error}
                            isPending={isPending}
                            onJoin={async (digits) => {
                                setError(null)
                                setIsPending(true)
                                try {
                                    await getSession(Number(digits))
                                    navigate(`/play/${encodeURIComponent(digits)}`)
                                } catch (err) {
                                    if (!(err instanceof ApiError)) {
                                        setError(t("landing.errors.generic"))
                                        return
                                    }
                                    if (err.status === 404) {
                                        setError(t("landing.errors.lobbyNotFound"))
                                    } else {
                                        setError(t("landing.errors.generic"))
                                    }
                                } finally {
                                    setIsPending(false)
                                }
                            }}
                        />
                    </div>

                    {/* Right Column */}
                    <div className="relative hidden pr-4 pb-4 md:block">
                        <div className="pointer-events-none absolute -inset-2 rounded-[2.5rem] bg-linear-to-tr from-[#00F2FF] to-[#FF8A00] opacity-20 blur-2xl" />

                        <div className="relative rounded-3xl border border-white/10 shadow-2xl">
                            <div className="relative aspect-4/3 overflow-hidden rounded-3xl">
                                <img
                                    alt={t("landing.imageAlt")}
                                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                                    src="/pictures/happy_people.jpg"
                                />
                                <div className="from-background/95 via-background/10 absolute inset-0 flex items-end bg-linear-to-t to-transparent p-8 lg:p-12">
                                    <p className="max-w-[85%] text-3xl leading-tight font-extrabold tracking-tighter text-white lg:text-5xl">
                                        {t("landing.imageText")}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
