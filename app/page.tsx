"use client"

import type React from "react"
import { useState, useEffect } from "react"
import HouseDotAnimation from "../components/HouseDotAnimation"

type Step = "initial" | "name-input" | "email-input" | "success"

export default function PartyRegistration() {
  const [step, setStep] = useState<Step>("initial")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleInitialClick = () => {
    setStep("name-input")
  }

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setStep("email-input")
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !name.trim()) return

    setIsLoading(true)

    try {
      const response = await fetch("/api/register-complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      })

      if (response.ok) {
        setStep("success")
      } else {
        const data = await response.json()
        alert(data.error || "Failed to complete registration")
      }
    } catch (error) {
      console.error("Failed to complete registration:", error)
    } finally {
      setIsLoading(false)
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
            register with @usc.edu email
          </button>
        )}

        {step === "name-input" && (
          <form onSubmit={handleNameSubmit} className="flex flex-col items-center space-y-8 w-full">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="your first and last name"
              className="text-center text-white/70 text-xl font-light bg-transparent border-none outline-none placeholder:text-white/50 focus:text-white/90 focus:ring-0 focus:border-none min-h-[48px] w-full"
              style={{
                backgroundColor: "transparent",
                boxShadow: "none",
                border: "none",
              }}
              maxLength={40}
              autoFocus
              aria-label="Full name"
            />
            <button
              type="submit"
              disabled={!name.trim() || isLoading}
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

        {step === "email-input" && (
          <form onSubmit={handleEmailSubmit} className="flex flex-col items-center space-y-8 w-full">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="yourname@usc.edu"
              className="text-center text-white/70 text-xl font-light bg-transparent border-none outline-none placeholder:text-white/50 focus:text-white/90 focus:ring-0 focus:border-none min-h-[48px] w-full"
              style={{
                backgroundColor: "transparent",
                boxShadow: "none",
                border: "none",
              }}
              pattern=".*@usc\.edu$"
              autoFocus
              aria-label="USC Email"
            />
            <button
              type="submit"
              disabled={!email.trim() || !/^[a-zA-Z0-9._%+-]+@usc\.edu$/.test(email) || isLoading}
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
            <div className="text-white/60 text-lg font-light tracking-wide">
              email sent, check your inbox
            </div>
            <button
              onClick={() => {
                setStep("initial")
                setName("")
                setEmail("")
              }}
              className="text-white/50 text-sm hover:text-white/70 transition-colors underline"
            >
              Register another person
            </button>
          </div>
        )}
      </div>

      <HouseDotAnimation />
      
      {/* Compliance notice */}
      <div className="absolute bottom-4 left-4 text-white/40 text-xs max-w-xs">
        You&apos;ll receive a confirmation email after registering
      </div>
    </div>
  )
}