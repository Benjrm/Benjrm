import type { JSX } from "react"
import { useEffect, useRef, useState } from "react"
import { Maximize2, Minimize2 } from "lucide-react"
import ReactQRCode from "react-qr-code"
import { Button } from "@/shadcn/components/ui/button"

interface QRCodeProps {
    codeWithDash: string | undefined
}

export default function QRCode({ codeWithDash }: QRCodeProps): JSX.Element {
    const [isFullscreen, setIsFullscreen] = useState(false)
    const qrFullscreenRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const onFullscreenChange = () => setIsFullscreen(document.fullscreenElement !== null)
        document.addEventListener("fullscreenchange", onFullscreenChange)
        return () => document.removeEventListener("fullscreenchange", onFullscreenChange)
    }, [])

    const toggleFullscreen = () => {
        if (!isFullscreen) {
            qrFullscreenRef.current?.requestFullscreen().catch(() => {})
        } else {
            document.exitFullscreen().catch(() => {})
        }
    }

    const joinUrl =
        codeWithDash !== undefined
            ? `${window.location.origin}/play/${codeWithDash.replace("-", "")}`
            : ""

    return (
        <div className="order-1 flex flex-col items-center gap-3 md:order-2">
            <div
                ref={qrFullscreenRef}
                className={`flex flex-col items-center gap-6 rounded-2xl bg-white p-4 ${
                    isFullscreen
                        ? "h-dvh w-dvw justify-center overflow-y-auto rounded-none p-6 sm:p-12"
                        : ""
                }`}
            >
                {isFullscreen ? (
                    <div className="w-[min(420px,80vmin)]">
                        <ReactQRCode
                            value={joinUrl}
                            viewBox="0 0 256 256"
                            style={{
                                height: "auto",
                                maxWidth: "100%",
                                width: "100%",
                            }}
                        />
                    </div>
                ) : (
                    <ReactQRCode size={200} value={joinUrl} />
                )}
                {isFullscreen ? (
                    <>
                        <div className="text-center">
                            <p className="text-2xl font-black tracking-widest text-black">
                                {codeWithDash}
                            </p>
                            <p className="mt-1 font-mono text-sm text-gray-500">{joinUrl}</p>
                        </div>
                        <Button className="gap-2" onClick={toggleFullscreen} variant="outline">
                            <Minimize2 className="h-4 w-4" />
                            Exit fullscreen
                        </Button>
                    </>
                ) : null}
            </div>
            {!isFullscreen && (
                <div className="flex flex-col items-center gap-2">
                    <p className="text-muted-foreground max-w-xs text-center text-xs">
                        Scan to join at{" "}
                        <span className="text-foreground font-mono font-semibold">{joinUrl}</span>
                    </p>
                    <Button
                        className="gap-2"
                        onClick={toggleFullscreen}
                        size="sm"
                        variant="outline"
                    >
                        <Maximize2 className="h-4 w-4" />
                        Show fullscreen
                    </Button>
                </div>
            )}
        </div>
    )
}
