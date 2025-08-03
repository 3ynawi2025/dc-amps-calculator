import { useState } from 'react'
import { Plus, Trash2, Car, Zap, Shield, AlertTriangle, Info, Lightbulb, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import './App.css'

interface Device {
  id: string
  name: string
  watts: number
  amps: number
  pdmOutput?: number
}

interface PDMConfig {
  hasPDM: boolean
  inputCount: number
  outputCount: number
  maxAmpsPerOutput: number
  totalMaxAmps: number
}

interface SafetyRecommendation {
  fuseRating: number
  needsRelay: boolean
  wireGauge: string
  safetyNotes: string[]
  riskLevel: 'low' | 'medium' | 'high'
}

function App() {
  const [voltage, setVoltage] = useState<number>(12)
  const [devices, setDevices] = useState<Device[]>([])
  const [newDeviceName, setNewDeviceName] = useState('')
  const [pdmConfig, setPdmConfig] = useState<PDMConfig>({
    hasPDM: false,
    inputCount: 1,
    outputCount: 8,
    maxAmpsPerOutput: 30,
    totalMaxAmps: 200
  })

  const addDevice = () => {
    if (newDeviceName.trim()) {
      const availableOutput = pdmConfig.hasPDM ? getNextAvailablePDMOutput() : undefined
      const newDevice: Device = {
        id: Date.now().toString(),
        name: newDeviceName.trim(),
        watts: 0,
        amps: 0,
        pdmOutput: availableOutput
      }
      setDevices([...devices, newDevice])
      setNewDeviceName('')
    }
  }

  const getNextAvailablePDMOutput = (): number => {
    const usedOutputs = devices.map(d => d.pdmOutput).filter(Boolean)
    for (let i = 1; i <= pdmConfig.outputCount; i++) {
      if (!usedOutputs.includes(i)) {
        return i
      }
    }
    return 1
  }

  const getPDMOutputLoad = (outputNum: number): number => {
    return devices
      .filter(d => d.pdmOutput === outputNum)
      .reduce((sum, d) => sum + (d.amps || d.watts / voltage), 0)
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

  const totalAmps = devices.reduce((sum, device) => sum + device.amps, 0)

  const getSafetyRecommendation = (device: Device, pdm?: PDMConfig): SafetyRecommendation => {
    const amps = device.amps
    let fuseRating: number
    let needsRelay: boolean
    let wireGauge: string
    let safetyNotes: string[] = []
    let riskLevel: 'low' | 'medium' | 'high'

    if (amps <= 5) {
      fuseRating = Math.ceil(amps * 1.25)
      needsRelay = false
      wireGauge = '18 AWG'
      riskLevel = 'low'
      safetyNotes = ['Low current device - basic fuse protection sufficient']
    } else if (amps <= 15) {
      fuseRating = Math.ceil(amps * 1.25)
      needsRelay = amps > 10
      wireGauge = amps <= 10 ? '16 AWG' : '14 AWG'
      riskLevel = 'medium'
      safetyNotes = [
        'Medium current device - use quality fuse holder',
        needsRelay ? 'Relay recommended to reduce switch load' : 'Direct switching acceptable'
      ]
    } else if (amps <= 30) {
      fuseRating = Math.ceil(amps * 1.25)
      needsRelay = true
      wireGauge = amps <= 20 ? '12 AWG' : '10 AWG'
      riskLevel = 'high'
      safetyNotes = [
        'High current device - relay REQUIRED',
        'Use heavy-duty fuse and holder',
        'Check all connections for tightness',
        'Consider using a fuse block or distribution panel'
      ]
    } else {
      fuseRating = Math.ceil(amps * 1.25)
      needsRelay = true
      wireGauge = amps <= 40 ? '8 AWG' : '6 AWG'
      riskLevel = 'high'
      safetyNotes = [
        'VERY HIGH current device - professional installation recommended',
        'Relay and contactor REQUIRED',
        'Use ANL or MEGA fuse',
        'Heavy gauge wire with proper lugs',
        'Consider battery isolation and dedicated alternator charging'
      ]
    }

    if (fuseRating > 40) {
      safetyNotes.push('Consider splitting load across multiple circuits')
    }

    if (pdm?.hasPDM) {
      if (amps > pdm.maxAmpsPerOutput) {
        safetyNotes.push(`⚠️ Device exceeds PDM output limit (${pdm.maxAmpsPerOutput}A)`)
        riskLevel = 'high'
      }
      safetyNotes.push('PDM provides centralized fuse protection')
      safetyNotes.push(`Assigned to PDM Output ${device.pdmOutput || 1}`)
      if (!needsRelay && pdm.hasPDM) {
        safetyNotes.push('PDM can handle switching - no additional relay needed')
      }
    }

    return {
      fuseRating: Math.min(fuseRating, 100),
      needsRelay: pdm?.hasPDM ? false : needsRelay,
      wireGauge,
      safetyNotes,
      riskLevel
    }
  }

  const handleVoltageChange = (newVoltage: string) => {
    const voltageNum = parseInt(newVoltage)
    setVoltage(voltageNum)
    
    setDevices(devices.map(device => ({
      ...device,
      watts: device.amps * voltageNum
    })))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Car className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">Car DC Amps Calculator</h1>
            <Zap className="w-8 h-8 text-yellow-500" />
          </div>
          <p className="text-gray-600">Calculate the total amp load for all your car's DC devices</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                  <Label htmlFor="deviceName">Device Name</Label>
                  <Input
                    id="deviceName"
                    placeholder="e.g., LED Light Bar, Radio, etc."
                    value={newDeviceName}
                    onChange={(e) => setNewDeviceName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addDevice()}
                  />
                </div>
                <Button onClick={addDevice} className="w-full" disabled={!newDeviceName.trim()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Device
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Device List & Safety Recommendations</CardTitle>
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
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-lg">{device.name}</h3>
                              <Badge 
                                variant={safety.riskLevel === 'high' ? 'destructive' : safety.riskLevel === 'medium' ? 'default' : 'secondary'}
                              >
                                {safety.riskLevel.toUpperCase()} RISK
                              </Badge>
                            </div>
                            {pdmConfig.hasPDM && device.pdmOutput && (
                              <div className="text-sm text-gray-600 mt-1">PDM Output {device.pdmOutput}</div>
                            )}
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeDevice(device.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <Tabs defaultValue="specs" className="w-full">
                          <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="specs">Specifications</TabsTrigger>
                            <TabsTrigger value="safety">Safety Setup</TabsTrigger>
                            <TabsTrigger value="wiring">Wiring Guide</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="specs" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor={`watts-${device.id}`}>Watts</Label>
                                <Input
                                  id={`watts-${device.id}`}
                                  type="number"
                                  placeholder="Enter watts"
                                  value={device.watts || ''}
                                  onChange={(e) => updateDeviceWatts(device.id, parseFloat(e.target.value) || 0)}
                                />
                              </div>
                              <div>
                                <Label htmlFor={`amps-${device.id}`}>Amps</Label>
                                <Input
                                  id={`amps-${device.id}`}
                                  type="number"
                                  placeholder="Enter amps"
                                  value={device.amps || ''}
                                  onChange={(e) => updateDeviceAmps(device.id, parseFloat(e.target.value) || 0)}
                                />
                              </div>
                            </div>
                            
                            {pdmConfig.hasPDM && (
                              <div>
                                <Label htmlFor={`pdm-${device.id}`}>PDM Output</Label>
                                <Select 
                                  value={(device.pdmOutput || 1).toString()} 
                                  onValueChange={(value) => {
                                    const updatedDevices = devices.map(d => 
                                      d.id === device.id ? { ...d, pdmOutput: Number(value) } : d
                                    )
                                    setDevices(updatedDevices)
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Array.from({length: pdmConfig.outputCount}, (_, i) => i + 1).map(num => {
                                      const load = getPDMOutputLoad(num)
                                      const isOverloaded = load > pdmConfig.maxAmpsPerOutput
                                      return (
                                        <SelectItem key={num} value={num.toString()}>
                                          Output {num} ({load.toFixed(1)}A/{pdmConfig.maxAmpsPerOutput}A) {isOverloaded ? '⚠️' : ''}
                                        </SelectItem>
                                      )
                                    })}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                            
                            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                              <p><strong>Power:</strong> {device.watts.toFixed(2)}W | <strong>Current:</strong> {device.amps.toFixed(2)}A</p>
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="safety" className="space-y-4">
                            {device.amps > 0 && (
                              <>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="bg-blue-50 p-3 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Shield className="w-4 h-4 text-blue-600" />
                                      <span className="font-semibold text-blue-800">Fuse Rating</span>
                                    </div>
                                    <p className="text-2xl font-bold text-blue-600">{safety.fuseRating}A</p>
                                    <p className="text-xs text-blue-600">125% of device current</p>
                                  </div>
                                  
                                  <div className="bg-green-50 p-3 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Zap className="w-4 h-4 text-green-600" />
                                      <span className="font-semibold text-green-800">Relay Needed</span>
                                    </div>
                                    <p className="text-2xl font-bold text-green-600">
                                      {safety.needsRelay ? 'YES' : 'NO'}
                                    </p>
                                    <p className="text-xs text-green-600">
                                      {safety.needsRelay ? 'Use 30A+ relay' : 'Direct switching OK'}
                                    </p>
                                  </div>
                                  
                                  <div className="bg-orange-50 p-3 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Car className="w-4 h-4 text-orange-600" />
                                      <span className="font-semibold text-orange-800">Wire Gauge</span>
                                    </div>
                                    <p className="text-2xl font-bold text-orange-600">{safety.wireGauge}</p>
                                    <p className="text-xs text-orange-600">Minimum recommended</p>
                                  </div>
                                </div>
                                
                                <Alert className={`${safety.riskLevel === 'high' ? 'border-red-200 bg-red-50' : safety.riskLevel === 'medium' ? 'border-yellow-200 bg-yellow-50' : 'border-green-200 bg-green-50'}`}>
                                  <AlertTriangle className="h-4 w-4" />
                                  <AlertDescription>
                                    <strong>Safety Notes:</strong>
                                    <ul className="mt-2 space-y-1">
                                      {safety.safetyNotes.map((note, index) => (
                                        <li key={index} className="text-sm">• {note}</li>
                                      ))}
                                    </ul>
                                  </AlertDescription>
                                </Alert>
                              </>
                            )}
                          </TabsContent>
                          
                          <TabsContent value="wiring" className="space-y-4">
                            {device.amps > 0 && (
                              <>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                                    <Lightbulb className="w-4 h-4" />
                                    Recommended Wiring Setup
                                  </h4>
                                  
                                  <div className="space-y-3 text-sm">
                                    <div className="flex items-start gap-3">
                                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                                      <div>
                                        <strong>Power Source:</strong> Connect to {voltage}V battery positive terminal or fuse box
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-start gap-3">
                                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                                      <div>
                                        <strong>Fuse Protection:</strong> Install {safety.fuseRating}A fuse within 18" of power source
                                      </div>
                                    </div>
                                    
                                    {safety.needsRelay && (
                                      <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                                        <div>
                                          <strong>Relay Setup:</strong> Use 30A+ automotive relay (87→Device, 30→Fused Power, 85→Switch, 86→Ground)
                                        </div>
                                      </div>
                                    )}
                                    
                                    <div className="flex items-start gap-3">
                                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">{safety.needsRelay ? '4' : '3'}</div>
                                      <div>
                                        <strong>Wire Run:</strong> Use {safety.wireGauge} wire from {safety.needsRelay ? 'relay' : 'fuse'} to device
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-start gap-3">
                                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">{safety.needsRelay ? '5' : '4'}</div>
                                      <div>
                                        <strong>Ground Connection:</strong> Connect device ground to chassis ground point with same gauge wire
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="bg-blue-50 p-4 rounded-lg">
                                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                                    <Info className="w-4 h-4" />
                                    Connection Diagram
                                  </h4>
                                  <div className="font-mono text-sm bg-white p-3 rounded border">
                                    {pdmConfig.hasPDM ? (
                                      <pre className="whitespace-pre-wrap">
{`Battery (+) ──[${Math.ceil(totalAmps * 1.25)}A Main Fuse]── PDM Input (+)
                                    │
PDM Output ${device.pdmOutput || 1} ──[${safety.fuseRating}A Fuse]── Device (+)

Device (-) ──────────────────────────────── Chassis Ground

Wire Gauge: ${safety.wireGauge} minimum (PDM to device)
Main Wire: ${totalAmps > 50 ? '4 AWG' : totalAmps > 30 ? '8 AWG' : '12 AWG'} (Battery to PDM)`}
                                      </pre>
                                    ) : safety.needsRelay ? (
                                      <pre className="whitespace-pre-wrap">
{`Battery (+) ──[${safety.fuseRating}A Fuse]── Relay Pin 30
                                    │
Switch ──────────────────────── Relay Pin 85
                                    │
Ground ──────────────────────── Relay Pin 86
                                    │
Device (+) ─────────────────── Relay Pin 87

Device (-) ─────────────────── Chassis Ground

Wire Gauge: ${safety.wireGauge} minimum`}
                                      </pre>
                                    ) : (
                                      <pre className="whitespace-pre-wrap">
{`Battery (+) ──[${safety.fuseRating}A Fuse]── Switch ── Device (+)
                                              │
Device (-) ──────────────────────────────── Chassis Ground

Wire Gauge: ${safety.wireGauge} minimum`}
                                      </pre>
                                    )}
                                  </div>
                                </div>
                              </>
                            )}
                          </TabsContent>
                        </Tabs>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {devices.length > 0 && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  System-Wide Safety Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {totalAmps > 50 && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>HIGH TOTAL LOAD WARNING:</strong> Your total load of {totalAmps.toFixed(1)}A is very high. 
                        Consider using a dedicated fuse block, upgrading your alternator, and checking battery capacity.
                        {pdmConfig.hasPDM && ' PDM provides centralized protection and control.'}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {totalAmps > 30 && totalAmps <= 50 && (
                    <Alert className="border-yellow-200 bg-yellow-50">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>MEDIUM LOAD NOTICE:</strong> Your total load of {totalAmps.toFixed(1)}A requires careful planning. 
                        Ensure your alternator can handle the load and consider a fuse distribution block.
                        {pdmConfig.hasPDM && ' PDM simplifies wiring and provides better control.'}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-2">
                        {pdmConfig.hasPDM ? 'PDM Main Fuse' : 'Recommended Main Fuse'}
                      </h4>
                      <p className="text-2xl font-bold text-blue-600">{Math.ceil(totalAmps * 1.25)}A</p>
                      <p className="text-sm text-blue-600">125% of total load for safety margin</p>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-2">Minimum Alternator</h4>
                      <p className="text-2xl font-bold text-green-600">{Math.ceil(totalAmps * 1.3)}A</p>
                      <p className="text-sm text-green-600">130% of load + charging capacity</p>
                    </div>
                  </div>
                  
                  {pdmConfig.hasPDM && (
                    <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Settings className="h-4 w-4 text-purple-600" />
                        <span className="font-semibold text-purple-800">PDM Status</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="font-medium">Total Load:</span> {totalAmps.toFixed(1)}A / {pdmConfig.totalMaxAmps}A
                        </div>
                        <div>
                          <span className="font-medium">Outputs Used:</span> {devices.filter(d => d.pdmOutput).length} / {pdmConfig.outputCount}
                        </div>
                      </div>
                      <div className="space-y-1">
                        {Array.from({length: pdmConfig.outputCount}, (_, i) => i + 1).map(outputNum => {
                          const load = getPDMOutputLoad(outputNum)
                          const isOverloaded = load > pdmConfig.maxAmpsPerOutput
                          const hasDevice = devices.some(d => d.pdmOutput === outputNum)
                          if (!hasDevice && load === 0) return null
                          return (
                            <div key={outputNum} className={`text-xs ${isOverloaded ? 'text-red-600' : 'text-purple-600'}`}>
                              Output {outputNum}: {load.toFixed(1)}A / {pdmConfig.maxAmpsPerOutput}A {isOverloaded ? '⚠️ OVERLOADED' : ''}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
