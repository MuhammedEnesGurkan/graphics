#!/bin/bash

# PyMAVLink Ground Control Station Launcher
# This script helps launch the GCS with proper error handling

echo "🚁 PyMAVLink Ground Control Station"
echo "=================================="

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.7 or higher."
    exit 1
fi

# Check if required packages are installed
echo "📦 Checking dependencies..."

python3 -c "import pymavlink" 2>/dev/null || {
    echo "❌ pymavlink is not installed. Installing..."
    pip3 install pymavlink
}

python3 -c "import serial" 2>/dev/null || {
    echo "❌ pyserial is not installed. Installing..."
    pip3 install pyserial
}

python3 -c "import tkinter" 2>/dev/null || {
    echo "❌ tkinter is not available. Please install python3-tk package."
    echo "   On Ubuntu/Debian: sudo apt-get install python3-tk"
    exit 1
}

# Check for optional dependencies
python3 -c "import tkintermapview" 2>/dev/null || {
    echo "⚠️  tkintermapview not found. Map functionality will be disabled."
    echo "   To enable maps: pip3 install tkintermapview"
}

echo "✅ Dependencies check complete"
echo ""

# Check if we're in the right directory
if [ ! -f "mavlink_gcs.py" ]; then
    echo "❌ mavlink_gcs.py not found in current directory"
    echo "   Please run this script from the directory containing mavlink_gcs.py"
    exit 1
fi

# Check for serial port permissions (Linux)
if [ "$(uname)" = "Linux" ]; then
    if [ ! -w "/dev/ttyUSB0" ] 2>/dev/null && [ ! -w "/dev/ttyACM0" ] 2>/dev/null; then
        echo "⚠️  You may need to set serial port permissions:"
        echo "   sudo chmod 666 /dev/ttyUSB* /dev/ttyACM*"
        echo "   Or add your user to dialout group: sudo usermod -a -G dialout $USER"
        echo ""
    fi
fi

echo "🚀 Starting PyMAVLink Ground Control Station..."
echo "   Close the application window to exit"
echo ""

# Launch the application
python3 mavlink_gcs.py

echo ""
echo "👋 PyMAVLink GCS has been closed"