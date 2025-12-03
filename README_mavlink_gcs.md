# PyMAVLink Ground Control Station

A comprehensive Ground Control Station (GCS) application for controlling and monitoring Pixhawk Orange Cube drones using the MAVLink protocol.

## Features

### 🔗 Enhanced Connection Management
- **Multiple Connection Types**: Serial/USB, TCP, and UDP connections
- **Auto Port Detection**: Automatically scans and lists available serial ports
- **Robust Error Handling**: Detailed error messages and connection status
- **Auto-reconnect**: Automatic reconnection on connection loss
- **Connection Timeout**: Configurable timeout settings
- **MAVLink v2 Support**: Full support for MAVLink v2 protocol

### 📡 Pixhawk Orange Cube Compatibility
- **Optimized Parameters**: Pre-configured for Orange Cube autopilot
- **Enhanced Connection String**: Improved connection string formats
- **Retry Logic**: Intelligent retry mechanism for unstable connections
- **Telemetry Protocol**: Advanced telemetry data handling

### 📊 Real-time Telemetry Display
- **Position & Attitude**: GPS coordinates, altitude, roll, pitch, yaw
- **Speed & Navigation**: Ground speed, air speed, climb rate, heading
- **System Status**: Flight mode, armed status, system health
- **Battery Monitoring**: Voltage, current, remaining percentage
- **GPS Information**: Fix type, satellite count
- **Live Updates**: Real-time data refresh

### 🗺️ Map Integration (Optional)
- **Live Tracking**: Real-time drone position on interactive map
- **Marker Display**: Visual drone position indicator
- **Auto-centering**: Automatically centers map on drone position
- **Requires**: `tkintermapview` package

### 🎮 Manual Control
- **Flight Mode Control**: Change flight modes (STABILIZE, AUTO, GUIDED, etc.)
- **Arm/Disarm**: Safe arming and disarming controls
- **Emergency Features**: Emergency stop and Return to Launch (RTL)
- **Safety Checks**: Built-in safety confirmations

### 📝 Message Logging
- **Timestamped Logs**: All activities logged with timestamps
- **Error Tracking**: Detailed error messages and stack traces
- **Clear History**: Option to clear message history
- **Console Output**: Messages also displayed in console

## Installation

### Prerequisites
- Python 3.7 or higher
- Tkinter (usually included with Python)

### Required Dependencies
```bash
pip install pymavlink pyserial
```

### Optional Dependencies
```bash
pip install tkintermapview  # For map functionality
```

### Ubuntu/Debian Installation
```bash
sudo apt-get update
sudo apt-get install python3-tk
pip3 install pymavlink pyserial tkintermapview
```

## Usage

### Starting the Application
```bash
python3 mavlink_gcs.py
```

### Connection Setup

#### Serial/USB Connection
1. Connect your Pixhawk Orange Cube via USB
2. Select "Serial/USB" connection type
3. Click "Refresh" to scan for available ports
4. Select your device port (usually `/dev/ttyUSB0` or `/dev/ttyACM0` on Linux)
5. Choose appropriate baud rate (default: 57600)
6. Click "Connect"

#### TCP Connection
1. Select "TCP" connection type
2. Enter host IP address (default: 127.0.0.1)
3. Enter port number (default: 14550)
4. Click "Connect"

#### UDP Connection
1. Select "UDP" connection type
2. Enter host IP address (default: 127.0.0.1)
3. Enter port number (default: 14550)
4. Click "Connect"

### Connection Options
- **Timeout**: Connection timeout in seconds (default: 30)
- **Auto-reconnect**: Automatically reconnect on connection loss
- **MAVLink v2**: Enable MAVLink v2 protocol (recommended)

## Tabs Overview

### 1. Connection Tab
- Configure connection parameters
- Connect/disconnect from drone
- View connection status

### 2. Telemetry Tab
- Real-time telemetry data display
- Position, attitude, speed, and system information
- Battery and GPS status

### 3. Map Tab (if available)
- Interactive map showing drone position
- Real-time position tracking
- Automatic map centering

### 4. Control Tab
- Flight mode selection
- Arm/disarm controls
- Emergency stop and RTL functions

### 5. Messages Tab
- Activity log with timestamps
- Error messages and system events
- Clear log functionality

## Troubleshooting

### Common Connection Issues

#### "getaddrinfo failed" Error
- **Solution**: Use IP address instead of hostname
- **Example**: Use `127.0.0.1` instead of `localhost`

#### Permission Denied on Serial Port
```bash
sudo chmod 666 /dev/ttyUSB0
# Or add user to dialout group
sudo usermod -a -G dialout $USER
```

#### No Serial Ports Detected
1. Check physical connection
2. Verify drivers are installed
3. Try different USB ports
4. Check with `lsusb` command

#### Connection Timeout
1. Increase timeout value
2. Check baud rate settings
3. Verify MAVLink protocol version
4. Check for interference

### Error Messages

#### "No heartbeat received"
- Check connection parameters
- Verify drone is powered on
- Ensure correct baud rate
- Try different connection type

#### "Connection refused"
- Check IP address and port
- Verify firewall settings
- Ensure MAVProxy or similar is running

## Advanced Features

### Connection String Examples
```python
# Serial connection
"/dev/ttyUSB0:57600"

# TCP connection
"tcp:127.0.0.1:14550"

# UDP connection
"udp:127.0.0.1:14550"
```

### Supported Flight Modes
- STABILIZE
- ACRO
- ALT_HOLD
- AUTO
- GUIDED
- LOITER
- RTL (Return to Launch)
- CIRCLE
- POSITION
- LAND
- And more...

### MAVLink Message Types Supported
- HEARTBEAT
- GLOBAL_POSITION_INT
- ATTITUDE
- VFR_HUD
- SYS_STATUS
- GPS_RAW_INT
- And more...

## Development

### Running Tests
```bash
python3 test_mavlink_gcs.py
```

### Code Structure
- `mavlink_gcs.py`: Main application file
- `test_mavlink_gcs.py`: Unit tests
- `DroneData`: Data structure for telemetry
- `MAVLinkGCS`: Main application class

## Safety Notes

⚠️ **Important Safety Information**
- Always test in a safe environment
- Keep manual control available
- Never rely solely on software for safety
- Follow local aviation regulations
- Test all functions before flight

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

This project is provided as-is for educational and development purposes.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review error messages in the Messages tab
3. Enable debug logging for more information
4. Check MAVLink documentation

---

**Note**: This Ground Control Station is designed specifically for Pixhawk Orange Cube but should work with other MAVLink-compatible autopilots with minimal modifications.