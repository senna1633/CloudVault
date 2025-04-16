import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, CheckCircle, File } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion"
import { cn } from "@/lib/utils"
import confetti from "canvas-confetti" // Properly import confetti

export default function UploadCard() {
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "success">("idle")
  const [progress, setProgress] = useState(0)
  const [fileName, setFileName] = useState("document.pdf")

  // Magnetic effect for buttons
  const buttonRef = useRef<HTMLButtonElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const springConfig = { damping: 15, stiffness: 150 }
  const springX = useSpring(mouseX, springConfig)
  const springY = useSpring(mouseY, springConfig)

  // Morphing background effect
  const [bgPosition, setBgPosition] = useState({ x: 0, y: 0 })

  // Handle mouse movement for magnetic button effect
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const button = buttonRef.current
      if (!button) return

      const rect = button.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      // Calculate distance from center
      mouseX.set((e.clientX - centerX) * 0.2)
      mouseY.set((e.clientY - centerY) * 0.2)
    },
    [mouseX, mouseY],
  )

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0)
    mouseY.set(0)
  }, [mouseX, mouseY])

  // Confetti effect for success state
  const triggerConfetti = useCallback(() => {
    const canvas = document.createElement("canvas")
    canvas.className = "fixed inset-0 w-full h-full pointer-events-none z-50"
    document.body.appendChild(canvas)

    const myConfetti = confetti.create(canvas, {
      resize: true,
      useWorker: true,
    })

    myConfetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#60a5fa", "#34d399", "#a78bfa", "#f87171", "#fbbf24"],
    })

    setTimeout(() => {
      myConfetti({
        particleCount: 50,
        spread: 100,
        origin: { y: 0.7, x: 0.3 },
        colors: ["#60a5fa", "#34d399", "#a78bfa"],
      })
    }, 250)

    setTimeout(() => {
      myConfetti({
        particleCount: 50,
        spread: 100,
        origin: { y: 0.7, x: 0.7 },
        colors: ["#f87171", "#fbbf24", "#a78bfa"],
      })
    }, 500)

    setTimeout(() => {
      if (canvas && canvas.parentNode) {
        canvas.parentNode.removeChild(canvas)
      }
    }, 4000)
  }, [])

  // Simulate upload progress with smooth animation
  const handleUpload = useCallback(() => {
    setProgress(0)
    setUploadState("uploading")

    const duration = 3000 // 3 seconds total
    const startTime = Date.now()

    const updateProgress = () => {
      const elapsed = Date.now() - startTime
      const nextProgress = Math.min(100, Math.floor((elapsed / duration) * 100))

      setProgress(nextProgress)

      if (nextProgress < 100) {
        requestAnimationFrame(updateProgress)
      } else {
        setTimeout(() => {
          setUploadState("success")
          triggerConfetti()
        }, 300)
      }
    }

    requestAnimationFrame(updateProgress)
  }, [triggerConfetti])

  const startAnimation = useCallback(() => {
    handleUpload()
  }, [handleUpload])

  const resetUpload = useCallback(() => {
    setUploadState("idle")
    setProgress(0)
  }, [])

  // Track mouse movement for background effect
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100
      const y = (e.clientY / window.innerHeight) * 100
      setBgPosition({ x, y })
    }

    window.addEventListener("mousemove", handleGlobalMouseMove)
    return () => window.removeEventListener("mousemove", handleGlobalMouseMove)
  }, [])

  // Variants for animations
  const containerVariants = {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  }

  const stateVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: "easeIn" } },
  }

  const successVariants = {
    initial: { opacity: 0, scale: 0.9 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: { type: "spring", stiffness: 400, damping: 30 },
    },
  }

  return (
    <motion.div variants={containerVariants} initial="initial" animate="animate">
      <Card
        className={cn(
          "w-full overflow-hidden border-0 shadow-2xl rounded-3xl",
          "bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-md",
          "transition-all duration-300",
        )}
        style={{
          backgroundPosition: `${bgPosition.x}% ${bgPosition.y}%`,
        }}
      >
        <CardContent className="p-8">
          <AnimatePresence mode="wait">
            {uploadState === "idle" && (
              <motion.div
                key="upload"
                variants={stateVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="flex flex-col items-center justify-center py-10"
              >
                <motion.div
                  className="w-24 h-24 rounded-full flex items-center justify-center mb-8 relative"
                  animate={{
                    boxShadow: [
                      "0 0 0 0 rgba(59, 130, 246, 0)",
                      "0 0 0 15px rgba(59, 130, 246, 0.1)",
                      "0 0 0 0 rgba(59, 130, 246, 0)",
                    ],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "loop",
                    ease: "easeInOut",
                  }}
                >
                  {/* Animated gradient background */}
                  <div className="absolute inset-0 rounded-full overflow-hidden">
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-500 to-blue-400"
                      style={{
                        transform: "rotate(0deg)",
                        animation: "gradientSpin 4s linear infinite",
                      }}
                    />
                  </div>
                  <div className="absolute inset-1 rounded-full bg-slate-900 flex items-center justify-center">
                    <Upload className="h-10 w-10 text-blue-400" strokeWidth={1.5} />
                  </div>
                </motion.div>

                <h3 className="text-2xl font-medium text-white mb-3">Upload File</h3>
                <p className="text-sm text-slate-300 text-center mb-10 max-w-xs">
                  Click the button below to start the animation
                </p>

                <motion.div
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  style={{
                    x: springX,
                    y: springY,
                  }}
                >
                  <Button
                    ref={buttonRef}
                    onClick={startAnimation}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full px-10 py-7 h-auto text-lg font-medium transition-all shadow-lg hover:shadow-blue-500/20 relative overflow-hidden group"
                  >
                    <span className="relative z-10">Start Animation</span>
                    <motion.span
                      className="absolute inset-0 bg-blue-400 opacity-0 group-hover:opacity-20"
                      animate={{
                        scale: [1, 1.5],
                        opacity: [0, 0.2, 0],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: "loop",
                      }}
                    />
                  </Button>
                </motion.div>
              </motion.div>
            )}

            {uploadState === "uploading" && (
              <motion.div
                key="uploading"
                variants={stateVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="py-10"
              >
                <div className="flex items-center mb-8">
                  <motion.div
                    className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mr-5 shadow-lg relative overflow-hidden"
                    animate={{
                      rotate: [0, 3, 0, -3, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "loop",
                      ease: "easeInOut",
                    }}
                  >
                    {/* Animated gradient border */}
                    <div className="absolute inset-0 p-[2px] rounded-2xl">
                      <div
                        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 opacity-70"
                        style={{
                          animation: "borderRotate 4s linear infinite",
                        }}
                      />
                    </div>
                    <div className="absolute inset-[2px] bg-slate-800 rounded-xl flex items-center justify-center">
                      <File className="h-7 w-7 text-blue-400" strokeWidth={1.5} />
                    </div>
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium text-white truncate">{fileName}</p>
                    <p className="text-sm text-slate-400">{progress}% complete</p>
                  </div>
                </div>

                <div className="relative mb-10">
                  <Progress value={progress} className="h-2" />
                  <motion.div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400 to-purple-400 opacity-30 rounded-full"
                    style={{ width: `${progress}%` }}
                    animate={{
                      opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "loop",
                      ease: "easeInOut",
                    }}
                  />
                </div>

                <div className="flex justify-center mt-8">
                  <motion.div
                    animate={{
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 1.8,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "loop",
                      ease: "easeInOut",
                    }}
                  >
                    {/* Custom loader with gradient */}
                    <div className="w-16 h-16 relative">
                      <div className="absolute inset-0 rounded-full border-4 border-slate-700" />
                      <motion.div
                        className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500"
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1.5,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "linear",
                        }}
                      />
                      <motion.div
                        className="absolute inset-2 rounded-full border-4 border-transparent border-t-purple-500"
                        animate={{ rotate: -360 }}
                        transition={{
                          duration: 2,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "linear",
                        }}
                      />
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {uploadState === "success" && (
              <motion.div
                key="success"
                variants={successVariants}
                initial="initial"
                animate="animate"
                className="flex flex-col items-center justify-center py-10"
              >
                <motion.div
                  className="w-24 h-24 rounded-full flex items-center justify-center mb-8 bg-gradient-to-br from-green-400 to-emerald-500"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    delay: 0.1,
                  }}
                >
                  <CheckCircle className="h-12 w-12 text-white" strokeWidth={1.5} />
                </motion.div>

                <motion.h3
                  className="text-2xl font-medium text-white mb-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Upload Complete!
                </motion.h3>
                <motion.p
                  className="text-sm text-slate-300 text-center mb-10"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  Your file has been successfully uploaded
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button
                    onClick={resetUpload}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-10 py-6 h-auto text-base font-medium transition-all shadow-lg"
                  >
                    Upload Another File
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* CSS for gradient animations */}
      <style jsx global>{`
        @keyframes gradientSpin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes borderRotate {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </motion.div>
  )
}