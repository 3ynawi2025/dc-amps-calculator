import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Car, Plus, Trash2, Download, Zap, Settings, Shield, AlertTriangle, Info, Lightbulb, BarChart3 } from 'lucide-react'

interface Device {
  id: string
  name: string
  watts: number
  amps: number
  pdmOutput?: number
}

interface DevicePreset {
  name: string
  category: string
  typicalWatts: number
  typicalAmps: number
  safetyRecommendation: SafetyRecommendation
}

interface SafetyRecommendation {
  fuseRating: number
  wireGauge: string
  needsRelay: boolean
  riskLevel: 'low' | 'medium' | 'high'
  safetyNotes: string[]
}

interface PDMConfig {
  hasPDM: boolean
  inputCount: number
  outputCount: number
  maxAmpsPerOutput: number
  totalMaxAmps: number
}

interface BatteryConfig {
  primaryCapacity: number
  hasAuxiliary: boolean
  auxiliaryCapacity: number
  batteryType: 'lead-acid' | 'agm' | 'lithium'
}

interface ChargingSystem {
  alternatorCapacity: number
  alternatorEfficiency: number
  idleOutput: number
}

interface WireCalculation {
  recommendedGauge: string
  actualVoltageDrop: number
  powerLoss: number
  length: number
  ambientTemp: number
}

const devicePresets: DevicePreset[] = [
  {
    name: 'Fuel Pump',
    category: 'Engine Systems',
    typicalWatts: 120,
    typicalAmps: 10,
    safetyRecommendation: {
      fuseRating: 15,
      wireGauge: '12 AWG',
      needsRelay: true,
      riskLevel: 'high',
      safetyNotes: ['Critical safety component', 'Use automotive relay', 'Install close to tank']
    }
  },
  {
    name: 'Electric Fan',
    category: 'Cooling Systems',
    typicalWatts: 180,
    typicalAmps: 15,
    safetyRecommendation: {
      fuseRating: 20,
      wireGauge: '12 AWG',
      needsRelay: true,
      riskLevel: 'medium',
      safetyNotes: ['Use temperature switch', 'Mount securely']
    }
  },
  {
    name: 'Water Pump',
    category: 'Cooling Systems',
    typicalWatts: 240,
    typicalAmps: 20,
    safetyRecommendation: {
      fuseRating: 25,
      wireGauge: '10 AWG',
      needsRelay: true,
      riskLevel: 'high',
      safetyNotes: ['Critical for engine cooling', 'Use heavy duty relay']
    }
  },
  {
    name: 'Headlights (LED)',
    category: 'Lighting',
    typicalWatts: 60,
    typicalAmps: 5,
    safetyRecommendation: {
      fuseRating: 10,
      wireGauge: '14 AWG',
      needsRelay: false,
      riskLevel: 'low',
      safetyNotes: ['Use proper beam pattern', 'Check local regulations']
    }
  },
  {
    name: 'Fog Lights',
    category: 'Lighting',
    typicalWatts: 110,
    typicalAmps: 9,
    safetyRecommendation: {
      fuseRating: 15,
      wireGauge: '12 AWG',
      needsRelay: true,
      riskLevel: 'low',
      safetyNotes: ['Use with headlight switch', 'Mount low on bumper']
    }
  },
  {
    name: 'ECU (Engine Control Unit)',
    category: 'Engine Systems',
    typicalWatts: 36,
    typicalAmps: 3,
    safetyRecommendation: {
      fuseRating: 5,
      wireGauge: '16 AWG',
      needsRelay: false,
      riskLevel: 'high',
      safetyNotes: ['Critical component', 'Use clean power source', 'Protect from EMI']
    }
  },
  {
    name: 'Dashboard/Instrument Cluster',
    category: 'Interior Electronics',
    typicalWatts: 24,
    typicalAmps: 2,
    safetyRecommendation: {
      fuseRating: 5,
      wireGauge: '16 AWG',
      needsRelay: false,
      riskLevel: 'medium',
      safetyNotes: ['Use switched power', 'Protect from voltage spikes']
    }
  },
  {
    name: 'Nitrous System',
    category: 'Performance',
    typicalWatts: 180,
    typicalAmps: 15,
    safetyRecommendation: {
      fuseRating: 20,
      wireGauge: '12 AWG',
      needsRelay: true,
      riskLevel: 'high',
      safetyNotes: ['Use WOT switch', 'Install pressure safety switch', 'Professional installation recommended']
    }
  },
  {
    name: 'Ignition Coils',
    category: 'Engine Systems',
    typicalWatts: 60,
    typicalAmps: 5,
    safetyRecommendation: {
      fuseRating: 10,
      wireGauge: '14 AWG',
      needsRelay: false,
      riskLevel: 'high',
      safetyNotes: ['Critical for engine operation', 'Use quality connections']
    }
  },
  {
    name: 'Electric Power Steering',
    category: 'Steering Systems',
    typicalWatts: 600,
    typicalAmps: 50,
    safetyRecommendation: {
      fuseRating: 60,
      wireGauge: '6 AWG',
      needsRelay: true,
      riskLevel: 'high',
      safetyNotes: ['Safety critical system', 'Use heavy duty wiring', 'Professional installation required']
    }
  }
]

function App() {
  const [devices, setDevices] = useState<Device[]>([])
  const [voltage, setVoltage] = useState(12)
  const [selectedDeviceType, setSelectedDeviceType] = useState('')
  const [newDeviceName, setNewDeviceName] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [wireLength, setWireLength] = useState(10)
  const [ambientTemp, setAmbientTemp] = useState(25)
  const [allowableVoltageDrop, setAllowableVoltageDrop] = useState(3)

  const [pdmConfig, setPdmConfig] = useState<PDMConfig>({
    hasPDM: false,
    inputCount: 2,
    outputCount: 8,
    maxAmpsPerOutput: 20,
    totalMaxAmps: 120
  })

  const [batteryConfig, setBatteryConfig] = useState<BatteryConfig>({
    primaryCapacity: 75,
    hasAuxiliary: false,
    auxiliaryCapacity: 50,
    batteryType: 'agm'
  })

  const [chargingSystem, setChargingSystem] = useState<ChargingSystem>({
    alternatorCapacity: 120,
    alternatorEfficiency: 0.85,
    idleOutput: 60
  })

  const totalAmps = useMemo(() => {
    return devices.reduce((sum, device) => sum + device.amps, 0)
  }, [devices])

  const calculateBatteryRuntime = useMemo(() => {
    if (totalAmps === 0) return { primary: 0, auxiliary: 0, combined: 0 }
    
    const usableCapacityFactors = {
      'lead-acid': 0.5,
      'agm': 0.8,
      'lithium': 0.95
    }
    
    const factor = usableCapacityFactors[batteryConfig.batteryType]
    const primaryUsable = batteryConfig.primaryCapacity * factor
    const auxiliaryUsable = batteryConfig.auxiliaryCapacity * factor
    
    return {
      primary: primaryUsable / totalAmps,
      auxiliary: batteryConfig.hasAuxiliary ? auxiliaryUsable / totalAmps : 0,
      combined: batteryConfig.hasAuxiliary ? (primaryUsable + auxiliaryUsable) / totalAmps : primaryUsable / totalAmps
    }
  }, [totalAmps, batteryConfig])

  const chargingAnalysis = useMemo(() => {
    const effectiveCapacity = chargingSystem.alternatorCapacity * chargingSystem.alternatorEfficiency
    const alternatorSurplus = effectiveCapacity - totalAmps
    const idleSurplus = chargingSystem.idleOutput - totalAmps
    
    return {
      alternatorSurplus,
      idleSurplus,
      chargingCapable: alternatorSurplus > 0 && idleSurplus > -10
    }
  }, [totalAmps, chargingSystem])

  const calculateWireGauge = (amps: number): WireCalculation => {
    const wireGauges = [
      { gauge: '18 AWG', resistance: 6.385, ampacity: 16 },
      { gauge: '16 AWG', resistance: 4.016, ampacity: 22 },
      { gauge: '14 AWG', resistance: 2.525, ampacity: 32 },
      { gauge: '12 AWG', resistance: 1.588, ampacity: 41 },
      { gauge: '10 AWG', resistance: 0.999, ampacity: 55 },
      { gauge: '8 AWG', resistance: 0.628, ampacity: 73 },
      { gauge: '6 AWG', resistance: 0.395, ampacity: 101 },
      { gauge: '4 AWG', resistance: 0.249, ampacity: 135 },
      { gauge: '2 AWG', resistance: 0.156, ampacity: 181 },
      { gauge: '1/0 AWG', resistance: 0.098, ampacity: 230 }
    ]

    const tempDerating = ambientTemp > 30 ? 0.8 : 1.0
    const maxAllowableVoltageDrop = (voltage * allowableVoltageDrop) / 100

    for (const wire of wireGauges) {
      const derated_ampacity = wire.ampacity * tempDerating * 0.8
      if (amps <= derated_ampacity) {
        const voltageDrop = (2 * wire.resistance * amps * wireLength) / 1000
        if (voltageDrop <= maxAllowableVoltageDrop) {
          const actualVoltageDropPercent = (voltageDrop / voltage) * 100
          const powerLoss = (amps * amps * 2 * wire.resistance * wireLength) / 1000
          
          return {
            recommendedGauge: wire.gauge,
            actualVoltageDrop: actualVoltageDropPercent,
            powerLoss,
            length: wireLength,
            ambientTemp
          }
        }
      }
    }

    return {
      recommendedGauge: '1/0 AWG',
      actualVoltageDrop: 5,
      powerLoss: 100,
      length: wireLength,
      ambientTemp
    }
  }

  const handleVoltageChange = (value: string) => {
    const newVoltage = Number(value)
    setVoltage(newVoltage)
    
    setDevices(devices.map(device => ({
      ...device,
      amps: device.watts / newVoltage
    })))
  }

  const addDevice = () => {
    if (!selectedDeviceType) return
    
    let deviceName = selectedDeviceType
    let watts = 0
    let amps = 0
    
    if (selectedDeviceType === 'custom') {
      if (!newDeviceName.trim()) return
      deviceName = newDeviceName.trim()
      watts = 60
      amps = watts / voltage
    } else {
      const preset = devicePresets.find(p => p.name === selectedDeviceType)
      if (preset) {
        deviceName = preset.name
        watts = preset.typicalWatts
        amps = preset.typicalAmps
      }
    }
    
    const newDevice: Device = {
      id: Date.now().toString(),
      name: deviceName,
      watts,
      amps
    }
    
    setDevices([...devices, newDevice])
    setSelectedDeviceType('')
    setNewDeviceName('')
    setShowCustomInput(false)
  }

  const removeDevice = (id: string) => {
    setDevices(devices.filter(device => device.id !== id))
  }

  const updateDeviceWatts = (id: string, watts: number) => {
    setDevices(devices.map(device => 
      device.id === id 
        ? { ...device, watts, amps: watts / voltage }
        : device
    ))
  }

  const updateDeviceAmps = (id: string, amps: number) => {
    setDevices(devices.map(device => 
      device.id === id 
        ? { ...device, amps, watts: amps * voltage }
        : device
    ))
  }

  const getSafetyRecommendation = (device: Device, _pdmConfig: PDMConfig): SafetyRecommendation => {
    const preset = devicePresets.find(p => p.name === device.name)
    if (preset) {
      return preset.safetyRecommendation
    }
    
    const amps = device.amps
    let fuseRating = Math.ceil(amps * 1.25)
    let wireGauge = '14 AWG'
    let needsRelay = amps > 10
    let riskLevel: 'low' | 'medium' | 'high' = 'low'
    
    if (amps > 30) {
      wireGauge = '10 AWG'
      riskLevel = 'high'
    } else if (amps > 15) {
      wireGauge = '12 AWG'
      riskLevel = 'medium'
    }
    
    return {
      fuseRating,
      wireGauge,
      needsRelay,
      riskLevel,
      safetyNotes: ['Custom device - verify specifications']
    }
  }

  const getPDMOutputLoad = (outputNumber: number): number => {
    return devices
      .filter(device => device.pdmOutput === outputNumber)
      .reduce((sum, device) => sum + device.amps, 0)
  }

  const downloadSystemDiagram = () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    canvas.width = 800
    canvas.height = 600
    
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    ctx.fillStyle = 'black'
    ctx.font = '20px Arial'
    ctx.fillText('Car DC System Wiring Diagram', 250, 30)
    
    ctx.font = '14px Arial'
    ctx.fillText(`Total Load: ${totalAmps.toFixed(2)}A @ ${voltage}V`, 50, 60)
    
    let y = 100
    devices.forEach((device) => {
      const safety = getSafetyRecommendation(device, pdmConfig)
      ctx.fillText(`${device.name}: ${device.amps.toFixed(1)}A - Fuse: ${safety.fuseRating}A - Wire: ${safety.wireGauge}`, 50, y)
      y += 25
    })
    
    const link = document.createElement('a')
    link.download = 'car-dc-system-diagram.png'
    link.href = canvas.toDataURL()
    link.click()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Car className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Car DC Amps Calculator</h1>
          </div>
          <p className="text-gray-600">Calculate the total amp load for all your car's DC devices</p>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            System Configuration
          </h2>
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Car Voltage Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="voltage">Car Voltage</Label>
                    <Select value={voltage.toString()} onValueChange={handleVoltageChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select voltage" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12">12V (Standard Cars)</SelectItem>
                        <SelectItem value="24">24V (Trucks/RVs)</SelectItem>
                        <SelectItem value="6">6V (Classic Cars)</SelectItem>
                        <SelectItem value="48">48V (Electric Vehicles)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-2">Total Load Summary</h3>
                    <div className="text-2xl font-bold text-blue-600">
                      {totalAmps.toFixed(2)} Amps
                    </div>
                    <div className="text-sm text-blue-600">
                      {(totalAmps * voltage).toFixed(2)} Watts Total
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  PDM Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="hasPDM"
                      checked={pdmConfig.hasPDM}
                      onChange={(e) => setPdmConfig({...pdmConfig, hasPDM: e.target.checked})}
                      className="rounded"
                    />
                    <Label htmlFor="hasPDM" className="text-sm font-medium">
                      Use Power Distribution Module (PDM)
                    </Label>
                  </div>
                  
                  {pdmConfig.hasPDM && (
                    <div className="space-y-3 bg-gray-50 p-3 rounded-lg">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Input Count</Label>
                          <Input
                            type="number"
                            min="1"
                            max="4"
                            value={pdmConfig.inputCount}
                            onChange={(e) => setPdmConfig({...pdmConfig, inputCount: Number(e.target.value)})}
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Output Count</Label>
                          <Input
                            type="number"
                            min="4"
                            max="16"
                            value={pdmConfig.outputCount}
                            onChange={(e) => setPdmConfig({...pdmConfig, outputCount: Number(e.target.value)})}
                            className="text-sm"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Max Amps/Output</Label>
                          <Input
                            type="number"
                            min="5"
                            max="50"
                            value={pdmConfig.maxAmpsPerOutput}
                            onChange={(e) => setPdmConfig({...pdmConfig, maxAmpsPerOutput: Number(e.target.value)})}
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Total Max Amps</Label>
                          <Input
                            type="number"
                            min="50"
                            max="500"
                            value={pdmConfig.totalMaxAmps}
                            onChange={(e) => setPdmConfig({...pdmConfig, totalMaxAmps: Number(e.target.value)})}
                            className="text-sm"
                          />
                        </div>
                      </div>
                      
                      {totalAmps > pdmConfig.totalMaxAmps && (
                        <Alert className="border-red-200 bg-red-50">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            ⚠️ Total load ({totalAmps.toFixed(1)}A) exceeds PDM capacity ({pdmConfig.totalMaxAmps}A)
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Power Analysis
          </h2>
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Power Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="battery" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="battery">Battery</TabsTrigger>
                    <TabsTrigger value="charging">Charging</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="battery" className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Primary Battery (Ah)</Label>
                        <Input
                          type="number"
                          min="20"
                          max="200"
                          value={batteryConfig.primaryCapacity}
                          onChange={(e) => setBatteryConfig({...batteryConfig, primaryCapacity: Number(e.target.value)})}
                          className="text-sm"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="hasAuxiliary"
                          checked={batteryConfig.hasAuxiliary}
                          onChange={(e) => setBatteryConfig({...batteryConfig, hasAuxiliary: e.target.checked})}
                          className="rounded"
                        />
                        <Label htmlFor="hasAuxiliary" className="text-xs">Auxiliary Battery</Label>
                      </div>
                      
                      {batteryConfig.hasAuxiliary && (
                        <div>
                          <Label className="text-xs">Auxiliary Battery (Ah)</Label>
                          <Input
                            type="number"
                            min="20"
                            max="200"
                            value={batteryConfig.auxiliaryCapacity}
                            onChange={(e) => setBatteryConfig({...batteryConfig, auxiliaryCapacity: Number(e.target.value)})}
                            className="text-sm"
                          />
                        </div>
                      )}
                      
                      <div>
                        <Label className="text-xs">Battery Type</Label>
                        <Select value={batteryConfig.batteryType} onValueChange={(value: 'lead-acid' | 'agm' | 'lithium') => setBatteryConfig({...batteryConfig, batteryType: value})}>
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="lead-acid">Lead Acid (50% usable)</SelectItem>
                            <SelectItem value="agm">AGM (80% usable)</SelectItem>
                            <SelectItem value="lithium">Lithium (95% usable)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {totalAmps > 0 && (
                      <div className="bg-green-50 p-3 rounded-lg">
                        <h4 className="font-semibold text-green-800 text-sm mb-2">Runtime Estimates</h4>
                        <div className="text-xs space-y-1">
                          <div>Primary: {calculateBatteryRuntime.primary.toFixed(1)} hours</div>
                          {batteryConfig.hasAuxiliary && (
                            <>
                              <div>Auxiliary: {calculateBatteryRuntime.auxiliary.toFixed(1)} hours</div>
                              <div>Combined: {calculateBatteryRuntime.combined.toFixed(1)} hours</div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="charging" className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Alternator Capacity (A)</Label>
                        <Input
                          type="number"
                          min="60"
                          max="300"
                          value={chargingSystem.alternatorCapacity}
                          onChange={(e) => setChargingSystem({...chargingSystem, alternatorCapacity: Number(e.target.value)})}
                          className="text-sm"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs">Efficiency (%)</Label>
                        <Input
                          type="number"
                          min="70"
                          max="95"
                          value={Math.round(chargingSystem.alternatorEfficiency * 100)}
                          onChange={(e) => setChargingSystem({...chargingSystem, alternatorEfficiency: Number(e.target.value) / 100})}
                          className="text-sm"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs">Idle Output (A)</Label>
                        <Input
                          type="number"
                          min="30"
                          max="150"
                          value={chargingSystem.idleOutput}
                          onChange={(e) => setChargingSystem({...chargingSystem, idleOutput: Number(e.target.value)})}
                          className="text-sm"
                        />
                      </div>
                    </div>
                    
                    {totalAmps > 0 && (
                      <div className={`p-3 rounded-lg ${chargingAnalysis.chargingCapable ? 'bg-green-50' : 'bg-red-50'}`}>
                        <h4 className={`font-semibold text-sm mb-2 ${chargingAnalysis.chargingCapable ? 'text-green-800' : 'text-red-800'}`}>
                          Charging Analysis
                        </h4>
                        <div className="text-xs space-y-1">
                          <div>Surplus: {chargingAnalysis.alternatorSurplus.toFixed(1)}A</div>
                          <div>Idle Surplus: {chargingAnalysis.idleSurplus.toFixed(1)}A</div>
                          <div>Status: {chargingAnalysis.chargingCapable ? '✅ Can charge' : '❌ Cannot charge'}</div>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Advanced Calculations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs">Wire Length (feet)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="50"
                      value={wireLength}
                      onChange={(e) => setWireLength(Number(e.target.value))}
                      className="text-sm"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Ambient Temperature (°C)</Label>
                    <Input
                      type="number"
                      min="-20"
                      max="80"
                      value={ambientTemp}
                      onChange={(e) => setAmbientTemp(Number(e.target.value))}
                      className="text-sm"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Max Voltage Drop (%)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="5"
                      step="0.5"
                      value={allowableVoltageDrop}
                      onChange={(e) => setAllowableVoltageDrop(Number(e.target.value))}
                      className="text-sm"
                    />
                  </div>
                  
                  {totalAmps > 0 && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <h4 className="font-semibold text-blue-800 text-sm mb-2">Wire Analysis</h4>
                      {(() => {
                        const wireCalc = calculateWireGauge(totalAmps)
                        return (
                          <div className="text-xs space-y-1">
                            <div>Recommended: {wireCalc.recommendedGauge}</div>
                            <div>Voltage Drop: {wireCalc.actualVoltageDrop.toFixed(2)}%</div>
                            <div>Power Loss: {wireCalc.powerLoss.toFixed(1)}W</div>
                            <div>Length: {wireCalc.length}ft @ {wireCalc.ambientTemp}°C</div>
                          </div>
                        )
                      })()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Device Management
          </h2>
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add New Device
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="deviceType">Device Type</Label>
                    <Select value={selectedDeviceType} onValueChange={(value) => {
                      setSelectedDeviceType(value)
                      setShowCustomInput(value === 'custom')
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select device type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">Other (Custom Device)</SelectItem>
                        {Object.entries(
                          devicePresets.reduce((acc, preset) => {
                            if (!acc[preset.category]) acc[preset.category] = []
                            acc[preset.category].push(preset)
                            return acc
                          }, {} as Record<string, DevicePreset[]>)
                        ).map(([category, presets]) => (
                          <div key={category}>
                            <div className="px-2 py-1 text-sm font-semibold text-gray-500 bg-gray-100">
                              {category}
                            </div>
                            {presets.map((preset) => (
                              <SelectItem key={preset.name} value={preset.name}>
                                {preset.name} ({preset.typicalAmps}A)
                              </SelectItem>
                            ))}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {showCustomInput && (
                    <div>
                      <Label htmlFor="deviceName">Custom Device Name</Label>
                      <Input
                        id="deviceName"
                        placeholder="e.g., Custom LED Strip, etc."
                        value={newDeviceName}
                        onChange={(e) => setNewDeviceName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addDevice()}
                      />
                    </div>
                  )}
                  
                  <Button 
                    onClick={addDevice} 
                    className="w-full" 
                    disabled={!selectedDeviceType || (showCustomInput && !newDeviceName.trim())}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Device
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Device List & Safety Recommendations
                <Button onClick={downloadSystemDiagram} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download Diagram
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {devices.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Car className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No devices added yet. Add your first device above!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {devices.map((device) => {
                    const safety = getSafetyRecommendation(device, pdmConfig)
                    return (
                      <div key={device.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-lg">{device.name}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant={safety.riskLevel === 'high' ? 'destructive' : safety.riskLevel === 'medium' ? 'secondary' : 'default'}>
                              {safety.riskLevel.toUpperCase()} RISK
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeDevice(device.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <Label className="text-xs text-gray-600">Watts</Label>
                            <Input
                              type="number"
                              value={device.watts}
                              onChange={(e) => updateDeviceWatts(device.id, Number(e.target.value))}
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-gray-600">Amps</Label>
                            <Input
                              type="number"
                              value={device.amps.toFixed(2)}
                              onChange={(e) => updateDeviceAmps(device.id, Number(e.target.value))}
                              className="text-sm"
                            />
                          </div>
                          {pdmConfig.hasPDM && (
                            <div>
                              <Label className="text-xs text-gray-600">PDM Output</Label>
                              <Select 
                                value={device.pdmOutput?.toString() || 'none'} 
                                onValueChange={(value) => {
                                  const updatedDevices = devices.map(d => 
                                    d.id === device.id 
                                      ? { ...d, pdmOutput: value === 'none' ? undefined : Number(value) }
                                      : d
                                  )
                                  setDevices(updatedDevices)
                                }}
                              >
                                <SelectTrigger className="text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">No PDM Output</SelectItem>
                                  {Array.from({ length: pdmConfig.outputCount }, (_, i) => i + 1).map((num) => (
                                    <SelectItem key={num} value={num.toString()}>
                                      Output {num} ({getPDMOutputLoad(num).toFixed(1)}A / {pdmConfig.maxAmpsPerOutput}A)
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                                <Shield className="w-4 h-4" />
                                Safety Requirements
                              </h4>
                              <div className="text-xs space-y-1">
                                <div>Fuse: {safety.fuseRating}A</div>
                                <div>Wire: {safety.wireGauge}</div>
                                <div>Relay: {safety.needsRelay ? 'Required' : 'Not needed'}</div>
                              </div>
                            </div>
                            
                            {safety.safetyNotes.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                                  <Info className="w-4 h-4" />
                                  Safety Notes
                                </h4>
                                <ul className="text-xs space-y-1">
                                  {safety.safetyNotes.map((note, index) => (
                                    <li key={index} className="flex items-start gap-1">
                                      <span className="text-yellow-600">•</span>
                                      <span>{note}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default App
