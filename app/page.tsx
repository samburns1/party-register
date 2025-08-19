"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Image from "next/image"

type Step = "initial" | "contact-input" | "success"
type RegistrationMode = "SMS" | "EMAIL"

export default function PartyRegistration() {
  const [step, setStep] = useState<Step>("initial")
  const [contact, setContact] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [registrationMode, setRegistrationMode] = useState<RegistrationMode>("SMS")

  useEffect(() => {
    fetch('/api/mode')
      .then(res => res.json())
      .then(data => setRegistrationMode(data.mode))
      .catch(err => console.error('Failed to fetch registration mode:', err))
  }, [])

  const handleInitialClick = () => {
    setStep("contact-input")
  }

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contact.trim()) return

    setIsLoading(true)

    try {
      let formattedContact = contact.trim()
      
      // Format phone for E.164 if SMS mode
      if (registrationMode === "SMS") {
        const digits = contact.replace(/\D/g, "")
        formattedContact = `+1${digits}`
      }
      
      const response = await fetch("/api/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contact: formattedContact }),
      })

      if (response.ok) {
        setStep("success")
      } else {
        const data = await response.json()
        alert(data.error || "Failed to send registration request")
      }
    } catch (error) {
      console.error("Failed to send registration:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "")
    if (digits.length >= 6) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`
    } else if (digits.length >= 3) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`
    }
    return digits
  }

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    
    if (registrationMode === "SMS") {
      const formatted = formatPhoneNumber(value)
      if (formatted.replace(/\D/g, "").length <= 10) {
        setContact(formatted)
      }
    } else {
      setContact(value)
    }
  }

  const isValidInput = () => {
    if (registrationMode === "EMAIL") {
      return /^[a-zA-Z0-9._%+-]+@usc\.edu$/.test(contact.trim())
    } else {
      return contact.replace(/\D/g, "").length === 10
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
            {registrationMode === "EMAIL" ? "enter USC email here to register" : "enter phone # here to register"}
          </button>
        )}

        {step === "contact-input" && (
          <form onSubmit={handleContactSubmit} className="flex flex-col items-center space-y-8 w-full">
            <input
              type={registrationMode === "EMAIL" ? "email" : "tel"}
              value={contact}
              onChange={handleContactChange}
              placeholder={registrationMode === "EMAIL" ? "yourname@usc.edu" : "650-400-7441"}
              className="text-center text-white/70 text-xl font-light bg-transparent border-none outline-none placeholder:text-white/50 focus:text-white/90 focus:ring-0 focus:border-none min-h-[48px] w-full"
              style={{
                backgroundColor: "transparent",
                boxShadow: "none",
                border: "none",
              }}
              maxLength={registrationMode === "EMAIL" ? 50 : 12}
              autoFocus
              aria-label={registrationMode === "EMAIL" ? "USC Email" : "Phone number"}
            />
            <button
              type="submit"
              disabled={!contact.trim() || isLoading || !isValidInput()}
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
              {registrationMode === "EMAIL" ? "email sent, check your inbox" : "text sent, finish up there"}
            </div>
            <button
              onClick={() => {
                setStep("initial")
                setContact("")
              }}
              className="text-white/50 text-sm hover:text-white/70 transition-colors underline"
            >
              Register another {registrationMode === "EMAIL" ? "email" : "number"}
            </button>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 right-0 w-48 h-48 sm:w-64 sm:h-64">
        <Image 
          src="/house.svg" 
          alt="House decoration"
          width={256}
          height={256}
          className="w-full h-full object-cover rounded-tl-lg"
        />
      </div>
      
      {/* Compliance notice */}
      <div className="absolute bottom-4 left-4 text-white/40 text-xs max-w-xs">
        {registrationMode === "EMAIL" 
          ? "You'll receive 1 email to complete RSVP. Reply with your name."
          : "You'll receive 1 SMS to complete RSVP. Reply STOP to opt out."
        }
      </div>
    </div>
  )
}