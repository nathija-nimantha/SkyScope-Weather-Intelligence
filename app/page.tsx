"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Search,
  MapPin,
  Droplets,
  Wind,
  Eye,
  Sun,
  Thermometer,
  Locate,
  SettingsIcon,
  ChevronDown,
  ChevronUp,
  Clock,
  Gauge,
  Zap,
  Palette,
  RotateCcw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"


interface WeatherData {
  location: {
    name: string
    region: string
    country: string
    lat: number
    lon: number
    tz_id: string
    localtime_epoch: number
    localtime: string
  }
  current: {
    last_updated_epoch: number
    last_updated: string
    temp_c: number
    temp_f: number
    is_day: number
    condition: {
      text: string
      icon: string
      code: number
    }
    wind_mph: number
    wind_kph: number
    wind_degree: number
    wind_dir: string
    pressure_mb: number
    pressure_in: number
    precip_mm: number
    precip_in: number
    humidity: number
    cloud: number
    feelslike_c: number
    feelslike_f: number
    windchill_c: number
    windchill_f: number
    heatindex_c: number
    heatindex_f: number
    dewpoint_c: number
    dewpoint_f: number
    vis_km: number
    vis_miles: number
    uv: number
    gust_mph: number
    gust_kph: number
  }
}

interface AppSettings {
  tempUnit: "C" | "F"
  windUnit: "kmh" | "mph" | "ms"
  pressureUnit: "mb" | "inHg" | "kPa"
  distanceUnit: "km" | "mi"
  timeFormat: "12h" | "24h"
  autoRefresh: "off" | "5min" | "15min" | "30min"
  animations: boolean
  defaultLocation: string
}

// Simple card wrapper without 3D effects
const CardWrapper: React.FC<{
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}> = ({ children, className = "", style = {} }) => {
  return (
      <div className={`transition-all duration-300 ease-out ${className}`} style={style}>
        {children}
      </div>
  )
}

const getBackgroundClass = (condition: string, isDay: number) => {
  const lowerCondition = condition.toLowerCase()

  if (lowerCondition.includes("sunny") || lowerCondition.includes("clear")) {
    return isDay
        ? "bg-gradient-to-br from-amber-300 via-orange-400 to-pink-500"
        : "bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900"
  } else if (lowerCondition.includes("cloud")) {
    return isDay
        ? "bg-gradient-to-br from-slate-400 via-slate-500 to-slate-600"
        : "bg-gradient-to-br from-slate-800 via-slate-900 to-black"
  } else if (lowerCondition.includes("rain") || lowerCondition.includes("drizzle")) {
    return "bg-gradient-to-br from-slate-600 via-blue-800 to-slate-900"
  } else if (lowerCondition.includes("snow")) {
    return "bg-gradient-to-br from-blue-100 via-slate-200 to-slate-300"
  } else if (lowerCondition.includes("thunder") || lowerCondition.includes("storm")) {
    return "bg-gradient-to-br from-slate-900 via-purple-900 to-black"
  } else if (lowerCondition.includes("mist") || lowerCondition.includes("fog")) {
    return "bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500"
  }

  return "bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600"
}

const getTextColorClass = (condition: string, isDay: number) => {
  const lowerCondition = condition.toLowerCase()

  // Light backgrounds that need dark text
  if (lowerCondition.includes("sunny") && isDay) {
    return "text-gray-900"
  } else if (lowerCondition.includes("snow")) {
    return "text-gray-900"
  } else if (lowerCondition.includes("clear") && isDay) {
    return "text-gray-900"
  } else if (lowerCondition.includes("mist") || lowerCondition.includes("fog")) {
    return "text-gray-900"
  }

  // Dark backgrounds that need light text (default)
  return "text-white"
}

const getButtonColorClass = (condition: string, isDay: number) => {
  const lowerCondition = condition.toLowerCase()

  // Light backgrounds that need dark buttons
  if (lowerCondition.includes("sunny") && isDay) {
    return "bg-gray-900/20 hover:bg-gray-900/30 text-gray-900 border-gray-900/30"
  } else if (lowerCondition.includes("snow")) {
    return "bg-gray-900/20 hover:bg-gray-900/30 text-gray-900 border-gray-900/30"
  } else if (lowerCondition.includes("clear") && isDay) {
    return "bg-gray-900/20 hover:bg-gray-900/30 text-gray-900 border-gray-900/30"
  } else if ((lowerCondition.includes("mist") || lowerCondition.includes("fog")) && isDay) {
    return "bg-gray-900/20 hover:bg-gray-900/30 text-gray-900 border-gray-900/30"
  }

  // Dark backgrounds that need light buttons (default)
  return "bg-white/20 hover:bg-white/30 text-white border-white/30"
}

const getTextOpacityClass = (condition: string, isDay: number, opacity: string) => {
  const lowerCondition = condition.toLowerCase()

  // Light backgrounds that need dark text
  if (lowerCondition.includes("sunny") && isDay) {
    return `text-gray-900/${opacity}`
  } else if (lowerCondition.includes("snow")) {
    return `text-gray-900/${opacity}`
  } else if (lowerCondition.includes("clear") && isDay) {
    return `text-gray-900/${opacity}`
  } else if (lowerCondition.includes("mist") || lowerCondition.includes("fog")) {
    return `text-gray-900/${opacity}`
  }

  // Dark backgrounds that need light text (default)
  return `text-white/${opacity}`
}

export default function WeatherApp() {
  const [city, setCity] = useState("")
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [error, setError] = useState("")
  const [backgroundClass, setBackgroundClass] = useState("bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600")
  const [showWeather, setShowWeather] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const [textColorClass, setTextColorClass] = useState("text-white")
  const [textOpacity80, setTextOpacity80] = useState("text-white/80")
  const [textOpacity70, setTextOpacity70] = useState("text-white/70")
  const [textOpacity60, setTextOpacity60] = useState("text-white/60")
  const [textOpacity90, setTextOpacity90] = useState("text-white/90")

  const [buttonColorClass, setButtonColorClass] = useState("bg-white/20 hover:bg-white/30 text-white border-white/30")

  const [settings, setSettings] = useState<AppSettings>({
    tempUnit: "C",
    windUnit: "kmh",
    pressureUnit: "mb",
    distanceUnit: "km",
    timeFormat: "24h",
    autoRefresh: "off",
    animations: true,
    defaultLocation: typeof window !== "undefined" ? localStorage.getItem("defaultLocation") || "London" : "London",
  })

  // Implement temporary settings state and apply/cancel functionality

  // Add these new state variables after the existing settings state (around line 120)
  const [tempSettings, setTempSettings] = useState<AppSettings>({
    tempUnit: "C",
    windUnit: "kmh",
    pressureUnit: "mb",
    distanceUnit: "km",
    timeFormat: "24h",
    autoRefresh: "off",
    animations: true,
    defaultLocation: typeof window !== "undefined" ? localStorage.getItem("defaultLocation") || "London" : "London",
  })

  // Access the API key from .env
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

  // Helper functions for unit conversions
  const getTemperature = (tempC: number, tempF: number) => {
    return settings.tempUnit === "C" ? `${Math.round(tempC)}°C` : `${Math.round(tempF)}°F`
  }

  const getWindSpeed = (windKph: number, windMph: number) => {
    switch (settings.windUnit) {
      case "kmh":
        return `${Math.round(windKph)} km/h`
      case "mph":
        return `${Math.round(windMph)} mph`
      case "ms":
        return `${Math.round(windKph * 0.277778)} m/s`
      default:
        return `${Math.round(windKph)} km/h`
    }
  }

  const getPressure = (pressureMb: number, pressureIn: number) => {
    switch (settings.pressureUnit) {
      case "mb":
        return `${Math.round(pressureMb)} mb`
      case "inHg":
        return `${pressureIn.toFixed(2)} inHg`
      case "kPa":
        return `${(pressureMb * 0.1).toFixed(1)} kPa`
      default:
        return `${Math.round(pressureMb)} mb`
    }
  }

  const getDistance = (km: number, miles: number) => {
    return settings.distanceUnit === "km" ? `${km} km` : `${miles} mi`
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    if (settings.timeFormat === "12h") {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
    } else {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
    }
  }

  // Update the updateSetting function to modify tempSettings instead of settings directly
  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setTempSettings((prev) => ({ ...prev, [key]: value }))
  }

  // Add an applySettings function
  const applySettings = () => {
    // Save default location to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("defaultLocation", tempSettings.defaultLocation)
    }
    setSettings({ ...tempSettings })
    setShowSettings(false)
  }

  // Update the resetSettings function
  const resetSettings = () => {
    const defaultSettings = {
      tempUnit: "C",
      windUnit: "kmh",
      pressureUnit: "mb",
      distanceUnit: "km",
      timeFormat: "24h",
      autoRefresh: "off",
      animations: true,
      defaultLocation: "London",
    }
    // Clear localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("defaultLocation", "London")
    }
    // @ts-ignore
    setTempSettings(defaultSettings)
    // @ts-ignore
    setSettings(defaultSettings)
  }

  const fetchWeather = async (cityName: string) => {
    if (!cityName.trim()) return

    setLoading(true)
    setError("")
    setShowWeather(false)

    try {
      const response = await fetch(
          `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${encodeURIComponent(cityName)}&aqi=no`,
      )

      if (!response.ok) {
        throw new Error("Weather data not found")
      }

      const data: WeatherData = await response.json()
      setWeather(data)
      setBackgroundClass(getBackgroundClass(data.current.condition.text, data.current.is_day))

      // Set text colors based on background
      setTextColorClass(getTextColorClass(data.current.condition.text, data.current.is_day))
      setTextOpacity80(getTextOpacityClass(data.current.condition.text, data.current.is_day, "80"))
      setTextOpacity70(getTextOpacityClass(data.current.condition.text, data.current.is_day, "70"))
      setTextOpacity60(getTextOpacityClass(data.current.condition.text, data.current.is_day, "60"))
      setTextOpacity90(getTextOpacityClass(data.current.condition.text, data.current.is_day, "90"))

      setButtonColorClass(getButtonColorClass(data.current.condition.text, data.current.is_day))

      // Delay showing weather for smooth animation
      setTimeout(() => setShowWeather(true), settings.animations ? 300 : 0)
    } catch (err) {
      setError("Failed to fetch weather data. Please check the city name and try again.")
      console.error("Weather API Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.")
      return
    }

    setLocationLoading(true)
    setError("")

    navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          try {
            const response = await fetch(
                `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${latitude},${longitude}&aqi=no`,
            )

            if (!response.ok) {
              throw new Error("Weather data not found")
            }

            const data: WeatherData = await response.json()
            setWeather(data)
            setCity(data.location.name)
            setBackgroundClass(getBackgroundClass(data.current.condition.text, data.current.is_day))

            // Set text colors based on background
            setTextColorClass(getTextColorClass(data.current.condition.text, data.current.is_day))
            setTextOpacity80(getTextOpacityClass(data.current.condition.text, data.current.is_day, "80"))
            setTextOpacity70(getTextOpacityClass(data.current.condition.text, data.current.is_day, "70"))
            setTextOpacity60(getTextOpacityClass(data.current.condition.text, data.current.is_day, "60"))
            setTextOpacity90(getTextOpacityClass(data.current.condition.text, data.current.is_day, "90"))

            setButtonColorClass(getButtonColorClass(data.current.condition.text, data.current.is_day))
          } catch (err) {
            setError("Failed to fetch weather data for your location.")
            console.error("Weather API Error:", err)
          } finally {
            setLocationLoading(false)
          }
        },
        (error) => {
          setError("Unable to retrieve your location. Please check your browser settings.")
          setLocationLoading(false)
          console.error("Geolocation error:", error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        },
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchWeather(city)
  }

  // Auto-refresh functionality
  useEffect(() => {
    if (settings.autoRefresh === "off" || !weather) return

    const intervals = {
      "5min": 5 * 60 * 1000,
      "15min": 15 * 60 * 1000,
      "30min": 30 * 60 * 1000,
    }

    const interval = setInterval(() => {
      fetchWeather(weather.location.name)
    }, intervals[settings.autoRefresh])

    return () => clearInterval(interval)
  }, [settings.autoRefresh, weather])

  // Close settings dropdown when clicking outside
  /*
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])
  */

  // Add a useEffect to initialize tempSettings whenever the settings panel opens
  useEffect(() => {
    if (showSettings) {
      setTempSettings({ ...settings })
    }
  }, [showSettings, settings])

  useEffect(() => {
    // Load default city weather on component mount
    fetchWeather(settings.defaultLocation)
  }, [])

  // Add this useEffect after the existing useEffects, before the return statement
  useEffect(() => {
    // Initialize settings from localStorage on component mount
    if (typeof window !== "undefined") {
      const savedDefaultLocation = localStorage.getItem("defaultLocation")
      if (savedDefaultLocation) {
        setSettings((prev) => ({ ...prev, defaultLocation: savedDefaultLocation }))
        setTempSettings((prev) => ({ ...prev, defaultLocation: savedDefaultLocation }))
      }
    }
  }, [])

  const animationClass = settings.animations ? "transition-all duration-1000 ease-in-out" : ""

  return (
      <div className={`min-h-screen ${animationClass} ${backgroundClass} relative overflow-hidden`}>
        {/* Animated background elements */}
        {settings.animations && (
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
              <div
                  className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"
                  style={{ animationDelay: "2s" }}
              ></div>
              <div
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse"
                  style={{ animationDelay: "4s" }}
              ></div>
            </div>
        )}

        <div className="container mx-auto px-4 py-6 relative z-10">
          {/* Enhanced Header */}
          <header className={`mb-8 ${settings.animations ? "animate-fade-in" : ""}`}>
            {/* Top Header Bar */}
            <div className="flex flex-col lg:flex-row justify-between items-center mb-8 gap-4">
              {/* Logo and Title */}
              <div className="flex items-center gap-4">
                <div
                    className={`text-4xl md:text-5xl font-bold ${textColorClass} drop-shadow-2xl tracking-tight ${
                        settings.animations ? "animate-slide-down" : ""
                    }`}
                >
                  SkyScope
                </div>
                <div className="hidden md:block w-px h-12 bg-white/30"></div>
                <div
                    className={`${textOpacity90} text-lg ${settings.animations ? "animate-slide-down" : ""}`}
                    style={{ animationDelay: "0.1s" }}
                >
                  Weather Intelligence
                </div>
              </div>

              {/* Header Controls */}
              <div className="flex items-center gap-4">
                {/* Temperature Unit Toggle */}
                <div
                    className={`flex bg-white/20 backdrop-blur-xl rounded-full p-1 ${
                        settings.animations ? "animate-slide-down" : ""
                    }`}
                    style={{ animationDelay: "0.2s" }}
                >
                  <Button
                      onClick={() => updateSetting("tempUnit", "C")}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                          tempSettings.tempUnit === "C"
                              ? "bg-white text-gray-900 shadow-lg"
                              : (weather &&
                                  weather.current.condition.text.toLowerCase().includes("sunny") &&
                                  weather.current.is_day) ||
                              (weather && weather.current.condition.text.toLowerCase().includes("snow")) ||
                              (weather &&
                                  weather.current.condition.text.toLowerCase().includes("clear") &&
                                  weather.current.is_day) ||
                              (weather &&
                                  (weather.current.condition.text.toLowerCase().includes("mist") ||
                                      weather.current.condition.text.toLowerCase().includes("fog")) &&
                                  weather.current.is_day)
                                  ? `${textColorClass} bg-transparent`
                                  : `${textColorClass} hover:bg-white/20 bg-transparent`
                      }`}
                  >
                    °C
                  </Button>
                  <Button
                      onClick={() => updateSetting("tempUnit", "F")}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                          tempSettings.tempUnit === "F"
                              ? "bg-white text-gray-900 shadow-lg"
                              : (weather &&
                                  weather.current.condition.text.toLowerCase().includes("sunny") &&
                                  weather.current.is_day) ||
                              (weather && weather.current.condition.text.toLowerCase().includes("snow")) ||
                              (weather &&
                                  weather.current.condition.text.toLowerCase().includes("clear") &&
                                  weather.current.is_day) ||
                              (weather &&
                                  (weather.current.condition.text.toLowerCase().includes("mist") ||
                                      weather.current.condition.text.toLowerCase().includes("fog")) &&
                                  weather.current.is_day)
                                  ? `${textColorClass} bg-transparent`
                                  : `${textColorClass} hover:bg-white/20 bg-transparent`
                      }`}
                  >
                    °F
                  </Button>
                </div>

                {/* Settings Button */}
                <Button
                    onClick={() => setShowSettings(true)}
                    className={`${buttonColorClass} backdrop-blur-xl px-4 py-2 rounded-full transition-all duration-300 hover:scale-105 ${
                        settings.animations ? "animate-slide-down" : ""
                    }`}
                    style={{ animationDelay: "0.3s" }}
                >
                  <SettingsIcon className="w-4 h-4 mr-2" />
                  Settings
                </Button>

                {/* Settings Side Panel */}
                <Sheet open={showSettings} onOpenChange={setShowSettings}>
                  <SheetContent
                      className="w-[350px] sm:w-[450px] bg-white/10 backdrop-blur-xl border-white/30 overflow-y-auto"
                      style={{
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)",
                      }}
                  >
                    <SheetHeader className="pb-4">
                      <SheetTitle className={`text-xl font-bold ${textColorClass}`}>Weather Settings</SheetTitle>
                    </SheetHeader>

                    <div className="space-y-6 my-6">
                      {/* Wind Speed Unit */}
                      <div>
                        <label className={`block ${textColorClass} text-sm mb-2 flex items-center gap-2`}>
                          <Wind className="w-4 h-4" />
                          Wind Speed Unit
                        </label>
                        <div className="flex gap-1 bg-white/10 rounded-lg p-1">
                          {[
                            { value: "kmh", label: "km/h" },
                            { value: "mph", label: "mph" },
                            { value: "ms", label: "m/s" },
                          ].map((option) => (
                              <Button
                                  key={option.value}
                                  onClick={() => updateSetting("windUnit", option.value as any)}
                                  className={`flex-1 py-2 px-3 text-sm rounded-lg transition-all duration-200 ${
                                      tempSettings.windUnit === option.value
                                          ? "bg-white/30 text-black font-medium shadow-lg"
                                          : "bg-white/10 text-white hover:bg-white/20"
                                  }`}
                              >
                                {option.label}
                              </Button>
                          ))}
                        </div>
                      </div>

                      {/* Pressure Unit */}
                      <div>
                        <label className={`block ${textColorClass} text-sm mb-2 flex items-center gap-2`}>
                          <Gauge className="w-4 h-4" />
                          Pressure Unit
                        </label>
                        <div className="flex gap-1 bg-white/10 rounded-lg p-1">
                          {[
                            { value: "mb", label: "mb" },
                            { value: "inHg", label: "inHg" },
                            { value: "kPa", label: "kPa" },
                          ].map((option) => (
                              <Button
                                  key={option.value}
                                  onClick={() => updateSetting("pressureUnit", option.value as any)}
                                  className={`flex-1 py-2 px-3 text-sm rounded-lg transition-all duration-200 ${
                                      tempSettings.pressureUnit === option.value
                                          ? "bg-white/30 text-black font-medium shadow-lg"
                                          : "bg-white/10 text-white hover:bg-white/20"
                                  }`}
                              >
                                {option.label}
                              </Button>
                          ))}
                        </div>
                      </div>

                      {/* Distance Unit */}
                      <div>
                        <label className={`block ${textColorClass} text-sm mb-2 flex items-center gap-2`}>
                          <Eye className="w-4 h-4" />
                          Distance Unit
                        </label>
                        <div className="flex gap-1 bg-white/10 rounded-lg p-1">
                          {[
                            { value: "km", label: "Kilometers" },
                            { value: "mi", label: "Miles" },
                          ].map((option) => (
                              <Button
                                  key={option.value}
                                  onClick={() => updateSetting("distanceUnit", option.value as any)}
                                  className={`flex-1 py-2 px-3 text-sm rounded-lg transition-all duration-200 ${
                                      tempSettings.distanceUnit === option.value
                                          ? "bg-white/30 text-black font-medium shadow-lg"
                                          : "bg-white/10 text-white hover:bg-white/20"
                                  }`}
                              >
                                {option.label}
                              </Button>
                          ))}
                        </div>
                      </div>

                      {/* Time Format */}
                      <div>
                        <label className={`block ${textColorClass} text-sm mb-2 flex items-center gap-2`}>
                          <Clock className="w-4 h-4" />
                          Time Format
                        </label>
                        <div className="flex gap-1 bg-white/10 rounded-lg p-1">
                          {[
                            { value: "12h", label: "12 Hour" },
                            { value: "24h", label: "24 Hour" },
                          ].map((option) => (
                              <Button
                                  key={option.value}
                                  onClick={() => updateSetting("timeFormat", option.value as any)}
                                  className={`flex-1 py-2 px-3 text-sm rounded-lg transition-all duration-200 ${
                                      tempSettings.timeFormat === option.value
                                          ? "bg-white/30 text-black font-medium shadow-lg"
                                          : "bg-white/10 text-white hover:bg-white/20"
                                  }`}
                              >
                                {option.label}
                              </Button>
                          ))}
                        </div>
                      </div>

                      {/* Auto Refresh */}
                      <div>
                        <label className={`block ${textColorClass} text-sm mb-2 flex items-center gap-2`}>
                          <RotateCcw className="w-4 h-4" />
                          Auto Refresh
                        </label>
                        <div className="grid grid-cols-2 gap-1 bg-white/10 rounded-lg p-1">
                          {[
                            { value: "off", label: "Off" },
                            { value: "5min", label: "5 min" },
                            { value: "15min", label: "15 min" },
                            { value: "30min", label: "30 min" },
                          ].map((option) => (
                              <Button
                                  key={option.value}
                                  onClick={() => updateSetting("autoRefresh", option.value as any)}
                                  className={`py-2 px-3 text-sm rounded-lg transition-all duration-200 ${
                                      tempSettings.autoRefresh === option.value
                                          ? "bg-white/30 text-black font-medium shadow-lg"
                                          : "bg-white/10 text-white hover:bg-white/20"
                                  }`}
                              >
                                {option.label}
                              </Button>
                          ))}
                        </div>
                      </div>

                      {/* Animations Toggle */}
                      <div>
                        <label className={`block ${textColorClass} text-sm mb-2 flex items-center gap-2`}>
                          <Zap className="w-4 h-4" />
                          Animations
                        </label>
                        <div className="flex gap-1 bg-white/10 rounded-lg p-1">
                          {[
                            { value: true, label: "Enabled" },
                            { value: false, label: "Disabled" },
                          ].map((option) => (
                              <Button
                                  key={option.label}
                                  onClick={() => updateSetting("animations", option.value)}
                                  className={`flex-1 py-2 px-3 text-sm rounded-lg transition-all duration-200 ${
                                      tempSettings.animations === option.value
                                          ? "bg-white/30 text-black font-medium shadow-lg"
                                          : "bg-white/10 text-white hover:bg-white/20"
                                  }`}
                              >
                                {option.label}
                              </Button>
                          ))}
                        </div>
                      </div>

                      {/* Default Location */}
                      <div>
                        <label className={`block ${textColorClass} text-sm mb-2 flex items-center gap-2`}>
                          <MapPin className="w-4 h-4" />
                          Default Location
                        </label>
                        <Input
                            type="text"
                            value={tempSettings.defaultLocation}
                            onChange={(e) => updateSetting("defaultLocation", e.target.value)}
                            className="bg-white/10 border-white/30 text-white placeholder:text-white/50 rounded-lg"
                            placeholder="Enter default city"
                        />
                      </div>
                    </div>

                    <SheetFooter className="flex justify-between mt-8">
                      <Button
                          onClick={() => {
                            resetSettings()
                          }}
                          variant="outline"
                          className="bg-white/10 hover:bg-white/20 text-white border-white/30"
                      >
                        Reset to Default
                      </Button>
                      <div className="flex gap-2">
                        <Button
                            onClick={() => setShowSettings(false)}
                            variant="outline"
                            className="bg-white/10 hover:bg-white/20 text-white border-white/30"
                        >
                          Cancel
                        </Button>
                        <Button onClick={applySettings} className="bg-white text-black hover:bg-white/90">
                          Apply
                        </Button>
                      </div>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>

                {/* Advanced Weather Toggle */}
                <Button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className={`${buttonColorClass} backdrop-blur-xl px-4 py-2 rounded-full transition-all duration-300 hover:scale-105 ${
                        settings.animations ? "animate-slide-down" : ""
                    }`}
                    style={{ animationDelay: "0.4s" }}
                >
                  <Palette className="w-4 h-4 mr-2" />
                  Advanced
                  {showAdvanced ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
                </Button>
              </div>
            </div>

            {/* Current Location Info */}
            {weather && (
                <CardWrapper
                    className={`${settings.animations ? "animate-slide-up" : ""}`}
                    style={{ animationDelay: "0.4s" }}
                >
                  <Card className="bg-white/15 backdrop-blur-xl border-white/20 rounded-2xl shadow-xl hover:bg-white/20 transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 ${textOpacity80}" />
                            <div>
                              <h2 className="text-xl font-bold ${textColorClass}">
                                {weather.location.name}, {weather.location.region}
                              </h2>
                              <p className="${textOpacity70} text-sm">
                                {weather.location.country} • {weather.location.lat.toFixed(2)}°,{" "}
                                {weather.location.lon.toFixed(2)}°
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-3">
                            <img
                                src={`https:${weather.current.condition.icon}`}
                                alt={weather.current.condition.text}
                                className={`w-12 h-12 hover:scale-110 transition-transform duration-300 ${settings.animations ? "animate-float" : ""}`}
                            />
                            <div>
                              <div className="text-2xl font-bold ${textColorClass}">
                                {getTemperature(weather.current.temp_c, weather.current.temp_f)}
                              </div>
                              <div className="${textOpacity80} text-sm">{weather.current.condition.text}</div>
                            </div>
                          </div>

                          <div className="hidden md:block w-px h-12 bg-white/30"></div>

                          <div className="text-right">
                            <div className="${textOpacity80} text-sm">Local Time</div>
                            <div className="${textColorClass} font-medium">{formatTime(weather.location.localtime)}</div>
                            {settings.autoRefresh !== "off" && (
                                <div className="${textOpacity60} text-xs mt-1">
                                  Auto-refresh: {settings.autoRefresh.replace("min", " min")}
                                </div>
                            )}
                          </div>

                          <div className="hidden md:block w-px h-12 bg-white/30"></div>

                          {/* View on Map Button */}
                          <Button
                              onClick={() => {
                                const locationName = encodeURIComponent(
                                    `${weather.location.name}, ${weather.location.region}, ${weather.location.country}`
                                )
                                const googleMapsUrl = `https://www.google.com/maps/place/${locationName}`
                                window.open(googleMapsUrl, "_blank")
                              }}
                              className={`${buttonColorClass} backdrop-blur-xl px-4 py-2 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 group`}
                              title="View location on Google Maps"
                          >
                            <MapPin className="w-4 h-4 mr-2 group-hover:animate-bounce" />
                            View on Map
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CardWrapper>
            )}
          </header>

          {/* Search Form with Location Button */}
          <div
              className={`max-w-2xl mx-auto mb-12 ${settings.animations ? "animate-slide-up" : ""}`}
              style={{ animationDelay: "0.6s" }}
          >
            <form onSubmit={handleSubmit} className="flex gap-3">
              <div className="relative flex-1">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 ${textOpacity60} w-5 h-5" />
                <Input
                    type="text"
                    placeholder="Enter city name..."
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="pl-12 pr-4 py-4 bg-white/20 backdrop-blur-xl border-white/30 ${textColorClass} placeholder:${textOpacity70} focus:bg-white/30 rounded-2xl text-lg transition-all duration-300 hover:bg-white/25 focus:scale-105"
                />
              </div>

              <Button
                  type="button"
                  onClick={fetchCurrentLocation}
                  disabled={locationLoading}
                  className={`${buttonColorClass} backdrop-blur-xl px-4 py-4 rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95`}
                  title="Use current location"
              >
                {locationLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <Locate className="w-5 h-5" />
                )}
              </Button>

              <Button
                  type="submit"
                  disabled={loading}
                  className={`${buttonColorClass} backdrop-blur-xl px-6 py-4 rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95`}
              >
                {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <Search className="w-5 h-5" />
                )}
              </Button>
            </form>
          </div>

          {/* Error Message */}
          {error && (
              <div className={`max-w-md mx-auto mb-8 ${settings.animations ? "animate-shake" : ""}`}>
                <Card className="bg-red-500/20 backdrop-blur-xl border-red-300/30 rounded-2xl">
                  <CardContent className="p-6">
                    <p className="${textColorClass} text-center font-medium">{error}</p>
                  </CardContent>
                </Card>
              </div>
          )}

          {/* Weather Display */}
          {weather && showWeather && (
              <div className={`max-w-6xl mx-auto ${settings.animations ? "animate-fade-in-up" : ""}`}>
                {/* Main Weather Card */}
                <CardWrapper className={settings.animations ? "animate-slide-up" : ""}>
                  <Card className="bg-white/15 backdrop-blur-xl border-white/20 rounded-3xl shadow-2xl hover:bg-white/20 transition-all duration-300">
                    <CardContent className="p-10">
                      <div className="flex flex-col lg:flex-row items-center justify-center gap-12">
                        <div
                            className={`text-center ${settings.animations ? "animate-scale-in" : ""}`}
                            style={{ animationDelay: "0.4s" }}
                        >
                          <div className="relative mb-6">
                            <img
                                src={`https:${weather.current.condition.icon}`}
                                alt={weather.current.condition.text}
                                className={`w-32 h-32 mx-auto ${settings.animations ? "animate-float" : ""}`}
                            />
                            {settings.animations && (
                                <div className="absolute inset-0 bg-white/10 rounded-full blur-xl animate-pulse"></div>
                            )}
                          </div>
                          <p className="text-2xl ${textOpacity90} mb-4 font-medium">{weather.current.condition.text}</p>
                        </div>

                        <div
                            className={`text-center ${settings.animations ? "animate-scale-in" : ""}`}
                            style={{ animationDelay: "0.6s" }}
                        >
                          <div
                              className={`text-8xl md:text-9xl font-bold ${textColorClass} mb-4 ${
                                  settings.animations ? "animate-pulse-slow" : ""
                              }`}
                          >
                            {settings.tempUnit === "C"
                                ? Math.round(weather.current.temp_c)
                                : Math.round(weather.current.temp_f)}
                            °
                          </div>
                          <p className="${textOpacity80} text-xl">
                            Feels like {getTemperature(weather.current.feelslike_c, weather.current.feelslike_f)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CardWrapper>

                {/* Basic Weather Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 mt-12">
                  <CardWrapper className={settings.animations ? "animate-slide-up" : ""}>
                    <Card className="bg-white/15 backdrop-blur-xl border-white/20 rounded-2xl shadow-xl hover:bg-white/20 transition-all duration-300">
                      <CardContent className="p-6 text-center">
                        <Droplets
                            className={`w-8 h-8 text-cyan-300 mx-auto mb-3 transition-all duration-300 ${settings.animations ? "animate-bounce" : ""}`}
                            style={{ animationDuration: "2s" }}
                        />
                        <p className="text-2xl font-bold ${textColorClass} mb-1 transition-transform duration-300">
                          {weather.current.humidity}%
                        </p>
                        <p className="${textOpacity80} text-sm transition-colors duration-300">Humidity</p>
                      </CardContent>
                    </Card>
                  </CardWrapper>

                  <CardWrapper className={settings.animations ? "animate-slide-up" : ""}>
                    <Card className="bg-white/15 backdrop-blur-xl border-white/20 rounded-2xl shadow-xl hover:bg-white/20 transition-all duration-300">
                      <CardContent className="p-6 text-center">
                        <Wind
                            className={`w-8 h-8 text-blue-300 mx-auto mb-3 transition-all duration-300 ${settings.animations ? "animate-pulse" : ""}`}
                        />
                        <p className="text-2xl font-bold ${textColorClass} mb-1 transition-transform duration-300">
                          {getWindSpeed(weather.current.wind_kph, weather.current.wind_mph).split(" ")[0]}
                        </p>
                        <p className="${textOpacity80} text-sm transition-colors duration-300">
                          {getWindSpeed(weather.current.wind_kph, weather.current.wind_mph).split(" ")[1]}{" "}
                          {weather.current.wind_dir}
                        </p>
                      </CardContent>
                    </Card>
                  </CardWrapper>

                  <CardWrapper className={settings.animations ? "animate-slide-up" : ""}>
                    <Card className="bg-white/15 backdrop-blur-xl border-white/20 rounded-2xl shadow-xl hover:bg-white/20 transition-all duration-300">
                      <CardContent className="p-6 text-center">
                        <Eye className="w-8 h-8 text-purple-300 mx-auto mb-3 transition-all duration-300" />
                        <p className="text-2xl font-bold ${textColorClass} mb-1 transition-transform duration-300">
                          {getDistance(weather.current.vis_km, weather.current.vis_miles).split(" ")[0]}
                        </p>
                        <p className="${textOpacity80} text-sm transition-colors duration-300">
                          {getDistance(weather.current.vis_km, weather.current.vis_miles).split(" ")[1]} visibility
                        </p>
                      </CardContent>
                    </Card>
                  </CardWrapper>

                  <CardWrapper className={settings.animations ? "animate-slide-up" : ""}>
                    <Card className="bg-white/15 backdrop-blur-xl border-white/20 rounded-2xl shadow-xl hover:bg-white/20 transition-all duration-300">
                      <CardContent className="p-6 text-center">
                        <Sun
                            className={`w-8 h-8 text-yellow-300 mx-auto mb-3 transition-all duration-300 ${settings.animations ? "animate-spin" : ""}`}
                            style={{ animationDuration: "4s" }}
                        />
                        <p className="text-2xl font-bold ${textColorClass} mb-1 transition-transform duration-300">
                          {weather.current.uv}
                        </p>
                        <p className="${textOpacity80} text-sm transition-colors duration-300">UV Index</p>
                      </CardContent>
                    </Card>
                  </CardWrapper>
                </div>

                {/* Advanced Weather Info */}
                {showAdvanced && (
                    <div className={settings.animations ? "animate-fade-in-up" : ""}>
                      <h3 className="text-2xl font-bold ${textColorClass} mb-6 text-center">Complete Weather Analysis</h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Location Details */}
                        <CardWrapper
                            className={settings.animations ? "animate-slide-up" : ""}
                            style={{ animationDelay: "0.1s" }}
                        >
                          <Card className="bg-white/15 backdrop-blur-xl border-white/20 rounded-2xl shadow-xl hover:bg-white/20 transition-all duration-300">
                            <CardContent className="p-8">
                              <h3 className="text-xl font-bold ${textColorClass} mb-6 flex items-center gap-3 transition-transform duration-300">
                                <MapPin className="w-6 h-6 text-green-300" />
                                Location Details
                              </h3>
                              <div className="space-y-4">
                                {[
                                  { label: "Full Name", value: `${weather.location.name}, ${weather.location.region}` },
                                  { label: "Country", value: weather.location.country },
                                  {
                                    label: "Coordinates",
                                    value: `${weather.location.lat.toFixed(4)}°, ${weather.location.lon.toFixed(4)}°`,
                                  },
                                  { label: "Timezone", value: weather.location.tz_id },
                                  { label: "Local Time", value: formatTime(weather.location.localtime) },
                                  { label: "Epoch Time", value: weather.location.localtime_epoch.toString() },
                                ].map((item, index) => (
                                    <div
                                        key={item.label}
                                        className={`flex justify-between items-start ${
                                            settings.animations ? "animate-slide-right" : ""
                                        }`}
                                        style={{ animationDelay: `${0.1 + index * 0.1}s` }}
                                    >
                                      <span className="${textOpacity80} text-sm">{item.label}:</span>
                                      <span className="${textColorClass} font-semibold text-sm text-right max-w-[60%]">
                                {item.value}
                              </span>
                                    </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        </CardWrapper>

                        {/* Temperature Analysis */}
                        <CardWrapper
                            className={settings.animations ? "animate-slide-up" : ""}
                            style={{ animationDelay: "0.2s" }}
                        >
                          <Card className="bg-white/15 backdrop-blur-xl border-white/20 rounded-2xl shadow-xl hover:bg-white/20 transition-all duration-300">
                            <CardContent className="p-8">
                              <h3 className="text-xl font-bold ${textColorClass} mb-6 flex items-center gap-3 transition-transform duration-300">
                                <Thermometer className="w-6 h-6 text-orange-300 transition-all duration-300" />
                                Temperature Analysis
                              </h3>
                              <div className="space-y-4">
                                {[
                                  { label: "Current", value: getTemperature(weather.current.temp_c, weather.current.temp_f) },
                                  {
                                    label: "Feels Like",
                                    value: getTemperature(weather.current.feelslike_c, weather.current.feelslike_f),
                                  },
                                  {
                                    label: "Heat Index",
                                    value: getTemperature(weather.current.heatindex_c, weather.current.heatindex_f),
                                  },
                                  {
                                    label: "Wind Chill",
                                    value: getTemperature(weather.current.windchill_c, weather.current.windchill_f),
                                  },
                                  {
                                    label: "Dew Point",
                                    value: getTemperature(weather.current.dewpoint_c, weather.current.dewpoint_f),
                                  },
                                  { label: "Day/Night", value: weather.current.is_day ? "🌞 Daytime" : "🌙 Nighttime" },
                                ].map((item, index) => (
                                    <div
                                        key={item.label}
                                        className={`flex justify-between items-center ${
                                            settings.animations ? "animate-slide-right" : ""
                                        }`}
                                        style={{ animationDelay: `${0.2 + index * 0.1}s` }}
                                    >
                                      <span className="${textOpacity80}">{item.label}:</span>
                                      <span className="${textColorClass} font-semibold text-lg">{item.value}</span>
                                    </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        </CardWrapper>

                        {/* Wind & Air Movement */}
                        <CardWrapper
                            className={settings.animations ? "animate-slide-up" : ""}
                            style={{ animationDelay: "0.3s" }}
                        >
                          <Card className="bg-white/15 backdrop-blur-xl border-white/20 rounded-2xl shadow-xl hover:bg-white/20 transition-all duration-300">
                            <CardContent className="p-8">
                              <h3 className="text-xl font-bold ${textColorClass} mb-6 flex items-center gap-3 transition-transform duration-300">
                                <Wind
                                    className={`w-6 h-6 text-blue-300 transition-all duration-300 ${settings.animations ? "animate-pulse" : ""}`}
                                />
                                Wind & Air Movement
                              </h3>
                              <div className="space-y-4">
                                {[
                                  {
                                    label: "Wind Speed",
                                    value: getWindSpeed(weather.current.wind_kph, weather.current.wind_mph),
                                  },
                                  {
                                    label: "Wind Direction",
                                    value: `${weather.current.wind_dir} (${weather.current.wind_degree}°)`,
                                  },
                                  {
                                    label: "Wind Gust",
                                    value: getWindSpeed(weather.current.gust_kph, weather.current.gust_mph),
                                  },
                                  {
                                    label: "Pressure",
                                    value: getPressure(weather.current.pressure_mb, weather.current.pressure_in),
                                  },
                                  { label: "Cloud Cover", value: `${weather.current.cloud}%` },
                                  { label: "Humidity", value: `${weather.current.humidity}%` },
                                ].map((item, index) => (
                                    <div
                                        key={item.label}
                                        className={`flex justify-between items-center ${
                                            settings.animations ? "animate-slide-right" : ""
                                        }`}
                                        style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                                    >
                                      <span className="${textOpacity80}">{item.label}:</span>
                                      <span className="${textColorClass} font-semibold text-lg">{item.value}</span>
                                    </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        </CardWrapper>

                        {/* Visibility & Precipitation */}
                        <CardWrapper
                            className={settings.animations ? "animate-slide-up" : ""}
                            style={{ animationDelay: "0.4s" }}
                        >
                          <Card className="bg-white/15 backdrop-blur-xl border-white/20 rounded-2xl shadow-xl hover:bg-white/20 transition-all duration-300">
                            <CardContent className="p-8">
                              <h3 className="text-xl font-bold ${textColorClass} mb-6 flex items-center gap-3 transition-transform duration-300">
                                <Eye className="w-6 h-6 text-purple-300 transition-all duration-300" />
                                Visibility & Precipitation
                              </h3>
                              <div className="space-y-4">
                                {[
                                  {
                                    label: "Visibility",
                                    value: getDistance(weather.current.vis_km, weather.current.vis_miles),
                                  },
                                  { label: "Precipitation (mm)", value: `${weather.current.precip_mm} mm` },
                                  { label: "Precipitation (in)", value: `${weather.current.precip_in.toFixed(2)} in` },
                                  { label: "Weather Condition", value: weather.current.condition.text },
                                  { label: "Condition Code", value: weather.current.condition.code.toString() },
                                  {
                                    label: "UV Index",
                                    value: `${weather.current.uv} ${weather.current.uv <= 2 ? "(Low)" : weather.current.uv <= 5 ? "(Moderate)" : weather.current.uv <= 7 ? "(High)" : weather.current.uv <= 10 ? "(Very High)" : "(Extreme)"}`,
                                  },
                                ].map((item, index) => (
                                    <div
                                        key={item.label}
                                        className={`flex justify-between items-center ${
                                            settings.animations ? "animate-slide-right" : ""
                                        }`}
                                        style={{ animationDelay: `${0.4 + index * 0.1}s` }}
                                    >
                                      <span className="${textOpacity80}">{item.label}:</span>
                                      <span className="${textColorClass} font-semibold text-lg">{item.value}</span>
                                    </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        </CardWrapper>

                        {/* Data Timestamps */}
                        <CardWrapper
                            className={settings.animations ? "animate-slide-up" : ""}
                            style={{ animationDelay: "0.5s" }}
                        >
                          <Card className="bg-white/15 backdrop-blur-xl border-white/20 rounded-2xl shadow-xl hover:bg-white/20 transition-all duration-300">
                            <CardContent className="p-8">
                              <h3 className="text-xl font-bold ${textColorClass} mb-6 flex items-center gap-3 transition-transform duration-300">
                                <Clock className="w-6 h-6 text-cyan-300 transition-all duration-300" />
                                Data Information
                              </h3>
                              <div className="space-y-4">
                                {[
                                  { label: "Last Updated", value: formatTime(weather.current.last_updated) },
                                  { label: "Update Epoch", value: weather.current.last_updated_epoch.toString() },
                                  { label: "Local Time", value: formatTime(weather.location.localtime) },
                                  { label: "Time Epoch", value: weather.location.localtime_epoch.toString() },
                                  {
                                    label: "Data Freshness",
                                    value: `${Math.round((Date.now() / 1000 - weather.current.last_updated_epoch) / 60)} min ago`,
                                  },
                                  { label: "API Response", value: "WeatherAPI.com" },
                                ].map((item, index) => (
                                    <div
                                        key={item.label}
                                        className={`flex justify-between items-center ${
                                            settings.animations ? "animate-slide-right" : ""
                                        }`}
                                        style={{ animationDelay: `${0.5 + index * 0.1}s` }}
                                    >
                                      <span className="${textOpacity80}">{item.label}:</span>
                                      <span className="${textColorClass} font-semibold text-sm">{item.value}</span>
                                    </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        </CardWrapper>

                        {/* Weather Summary Card */}
                        <CardWrapper
                            className={settings.animations ? "animate-slide-up" : ""}
                            style={{ animationDelay: "0.6s" }}
                        >
                          <Card className="bg-white/15 backdrop-blur-xl border-white/20 rounded-2xl shadow-xl hover:bg-white/20 transition-all duration-300">
                            <CardContent className="p-8">
                              <h3 className="text-xl font-bold ${textColorClass} mb-6 flex items-center gap-3 transition-transform duration-300">
                                <Sun
                                    className={`w-6 h-6 text-yellow-300 transition-all duration-300 ${settings.animations ? "animate-spin" : ""}`}
                                    style={{ animationDuration: "4s" }}
                                />
                                Weather Summary
                              </h3>
                              <div className="text-center mb-4">
                                <img
                                    src={`https:${weather.current.condition.icon}`}
                                    alt={weather.current.condition.text}
                                    className={`w-16 h-16 mx-auto mb-4 ${settings.animations ? "animate-float" : ""}`}
                                />
                                <div className="${textColorClass} font-semibold text-lg mb-2">
                                  {weather.current.condition.text}
                                </div>
                                <div className="${textOpacity80} text-sm mb-4">Code: {weather.current.condition.code}</div>
                              </div>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="${textOpacity80}">Temperature Range:</span>
                                  <span className="${textColorClass} font-medium">
                              {getTemperature(weather.current.windchill_c, weather.current.windchill_f)} -{" "}
                                    {getTemperature(weather.current.heatindex_c, weather.current.heatindex_f)}
                            </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="${textOpacity80}">Comfort Level:</span>
                                  <span className="${textColorClass} font-medium">
                              {Math.abs(weather.current.temp_c - weather.current.feelslike_c) <= 2
                                  ? "Comfortable"
                                  : weather.current.feelslike_c < weather.current.temp_c
                                      ? "Feels Cooler"
                                      : "Feels Warmer"}
                            </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="${textOpacity80}">Air Quality:</span>
                                  <span className="${textColorClass} font-medium">
                              {weather.current.humidity > 80
                                  ? "High Humidity"
                                  : weather.current.humidity < 30
                                      ? "Low Humidity"
                                      : "Normal"}
                            </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </CardWrapper>
                      </div>

                      {/* Raw Data Section */}
                      <div className="mt-8">
                        <CardWrapper>
                          <Card className="bg-white/10 backdrop-blur-xl border-white/20 rounded-2xl shadow-xl hover:bg-white/20 transition-all duration-300">
                            <CardContent className="p-6">
                              <h3 className="text-lg font-bold ${textColorClass} mb-4 flex items-center gap-2">
                                <SettingsIcon className="w-5 h-5" />
                                Complete API Response Data
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                <div className="space-y-1">
                                  <div className="${textOpacity60} font-medium">Location Data:</div>
                                  <div className="${textOpacity80}">Name: {weather.location.name}</div>
                                  <div className="${textOpacity80}">Region: {weather.location.region}</div>
                                  <div className="${textOpacity80}">Country: {weather.location.country}</div>
                                  <div className="${textOpacity80}">Lat: {weather.location.lat}</div>
                                  <div className="${textOpacity80}">Lon: {weather.location.lon}</div>
                                  <div className="${textOpacity80}">Timezone: {weather.location.tz_id}</div>
                                </div>
                                <div className="space-y-1">
                                  <div className="${textOpacity60} font-medium">Temperature Data:</div>
                                  <div className="${textOpacity80}">Temp C: {weather.current.temp_c}°</div>
                                  <div className="${textOpacity80}">Temp F: {weather.current.temp_f}°</div>
                                  <div className="${textOpacity80}">Feels Like C: {weather.current.feelslike_c}°</div>
                                  <div className="${textOpacity80}">Feels Like F: {weather.current.feelslike_f}°</div>
                                  <div className="${textOpacity80}">Heat Index C: {weather.current.heatindex_c}°</div>
                                  <div className="${textOpacity80}">Wind Chill C: {weather.current.windchill_c}°</div>
                                </div>
                                <div className="space-y-1">
                                  <div className="${textOpacity60} font-medium">Atmospheric Data:</div>
                                  <div className="${textOpacity80}">Wind KPH: {weather.current.wind_kph}</div>
                                  <div className="${textOpacity80}">Wind MPH: {weather.current.wind_mph}</div>
                                  <div className="${textOpacity80}">Wind Degree: {weather.current.wind_degree}°</div>
                                  <div className="${textOpacity80}">Pressure MB: {weather.current.pressure_mb}</div>
                                  <div className="${textOpacity80}">Pressure IN: {weather.current.pressure_in}</div>
                                  <div className="${textOpacity80}">Humidity: {weather.current.humidity}%</div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </CardWrapper>
                      </div>
                    </div>
                )}
              </div>
          )}
        </div>
      </div>
  )
}
