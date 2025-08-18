"use client"

import type React from "react"
import { useState } from "react"

type Step = "initial" | "phone-input" | "success"

export default function PhoneRegistration() {
  const [step, setStep] = useState<Step>("initial")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleInitialClick = () => {
    setStep("phone-input")
  }

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phoneNumber.trim()) return

    setIsLoading(true)

    try {
      // Format phone for E.164 (+1XXXXXXXXXX)
      const digits = phoneNumber.replace(/\D/g, "")
      const e164Phone = `+1${digits}`
      
      const response = await fetch("/api/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone: e164Phone }),
      })

      if (response.ok) {
        setStep("success")
      } else {
        console.error("Failed to send SMS")
      }
    } catch (error) {
      console.error("Failed to send SMS:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "")

    // Format as XXX-XXX-XXXX
    if (digits.length >= 6) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`
    } else if (digits.length >= 3) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`
    }
    return digits
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    if (formatted.replace(/\D/g, "").length <= 10) {
      setPhoneNumber(formatted)
    }
  }

  return (
    <div
      className="h-screen w-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: "#8B7D7A" }}
    >
      {/* Main content - centered for mobile */}
      <div className="flex-1 flex items-center justify-center px-6 w-full max-w-sm">
        {step === "initial" && (
          <button
            onClick={handleInitialClick}
            className="text-white/70 text-xl font-light tracking-wide hover:text-white/90 active:text-white transition-colors duration-300 cursor-pointer bg-transparent border-none outline-none py-4 px-2 min-h-[48px] text-center"
          >
            enter phone # here to register
          </button>
        )}

        {step === "phone-input" && (
          <form onSubmit={handlePhoneSubmit} className="flex flex-col items-center space-y-8 w-full">
            <input
              type="tel"
              value={phoneNumber}
              onChange={handlePhoneChange}
              placeholder="650-400-7441"
              className="text-center text-white/70 text-xl font-light bg-transparent border-none outline-none placeholder:text-white/50 focus:text-white/90 focus:ring-0 focus:border-none min-h-[48px] w-full"
              style={{
                backgroundColor: "transparent",
                boxShadow: "none",
                border: "none",
              }}
              maxLength={12}
              autoFocus
              aria-label="Phone number"
            />
            <button
              type="submit"
              disabled={!phoneNumber.trim() || isLoading || phoneNumber.replace(/\D/g, "").length !== 10}
              className="group disabled:opacity-30 disabled:cursor-not-allowed transition-opacity duration-200 min-h-[48px] min-w-[48px] flex items-center justify-center"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white/70 rounded-full animate-spin" />
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-white/60 group-hover:text-white/80 transition-colors duration-200"
                >
                  <path
                    d="M5 12h14m-7-7l7 7-7 7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          </form>
        )}

        {step === "success" && (
          <div className="text-center space-y-6 w-full">
            <div className="text-white/70 text-xl font-light tracking-wide">thanks ✓</div>
            <div className="text-white/60 text-lg font-light tracking-wide">text sent, finish up there</div>
            <button
              onClick={() => {
                setStep("initial")
                setPhoneNumber("")
              }}
              className="text-white/50 text-sm hover:text-white/70 transition-colors underline"
            >
              Register another number
            </button>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 right-0 w-48 h-48 sm:w-64 sm:h-64">
        <div className="w-full h-full bg-white/10 rounded-tl-lg flex items-center justify-center">
          <span className="text-white/30 text-sm font-light">PNG placeholder</span>
        </div>
      </div>
      
      {/* Compliance notice */}
      <div className="absolute bottom-4 left-4 text-white/40 text-xs max-w-xs">
        You&apos;ll receive 1 SMS to complete RSVP. Reply STOP to opt out.
      </div>
    </div>
  )
}