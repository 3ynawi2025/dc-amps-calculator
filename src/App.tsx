import { useState } from 'react'
import { Plus, Trash2, Car, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import './App.css'

interface Device {
  id: string
  name: string
  watts: number
  amps: number
}

function App() {
  const [voltage, setVoltage] = useState<number>(12)
  const [devices, setDevices] = useState<Device[]>([])
  const [newDeviceName, setNewDeviceName] = useState('')

  const addDevice = () => {
    if (newDeviceName.trim()) {
      const newDevice: Device = {
        id: Date.now().toString(),
        name: newDeviceName.trim(),
        watts: 0,
        amps: 0
      }
      setDevices([...devices, newDevice])
      setNewDeviceName('')
    }
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

        <div className="grid gap-6 md:grid-cols-2">
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
              <CardTitle>Device List</CardTitle>
            </CardHeader>
            <CardContent>
              {devices.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Car className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No devices added yet. Add your first device above!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {devices.map((device) => (
                    <div key={device.id} className="border rounded-lg p-4 bg-white">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg">{device.name}</h3>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeDevice(device.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
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
                      
                      <div className="mt-3 text-sm text-gray-600">
                        <p>Power: {device.watts.toFixed(2)}W | Current: {device.amps.toFixed(2)}A</p>
                      </div>
                    </div>
                  ))}
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
