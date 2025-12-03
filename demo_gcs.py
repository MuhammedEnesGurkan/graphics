#!/usr/bin/env python3
"""
PyMAVLink GCS Demo Script
Demonstrates the GCS functionality without requiring actual hardware
"""

import sys
import time
import threading
import random
import math
from datetime import datetime

# Mock MAVLink message for demonstration
class MockMAVLinkMessage:
    def __init__(self, msg_type, **kwargs):
        self.msg_type = msg_type
        for key, value in kwargs.items():
            setattr(self, key, value)
    
    def get_type(self):
        return self.msg_type
    
    def get_srcSystem(self):
        return getattr(self, 'srcSystem', 1)

class MockMAVLinkConnection:
    def __init__(self, connection_string):
        self.connection_string = connection_string
        self.target_system = 1
        self.target_component = 1
        self.connected = False
        self.simulation_active = False
        self.simulation_thread = None
        self.message_queue = []
        self.lat = 37.7749  # San Francisco
        self.lon = -122.4194
        self.alt = 100.0
        self.relative_alt = 50.0
        self.roll = 0.0
        self.pitch = 0.0
        self.yaw = 0.0
        self.ground_speed = 0.0
        self.air_speed = 0.0
        self.climb_rate = 0.0
        self.heading = 0.0
        self.battery_voltage = 12.6
        self.battery_current = 5.2
        self.battery_remaining = 85
        self.gps_satellites = 12
        self.armed = False
        self.flight_mode = 0  # STABILIZE
        
    def wait_heartbeat(self, timeout=10):
        """Simulate waiting for heartbeat"""
        print(f"[DEMO] Simulating heartbeat wait for {timeout} seconds...")
        time.sleep(1)  # Simulate connection delay
        
        # Create mock heartbeat message
        heartbeat = MockMAVLinkMessage(
            'HEARTBEAT',
            srcSystem=1,
            autopilot=3,  # ARDUPILOTMEGA
            type=2,  # QUADROTOR
            base_mode=81,  # MAV_MODE_FLAG_CUSTOM_MODE_ENABLED
            custom_mode=0,  # STABILIZE
            system_status=4  # ACTIVE
        )
        
        self.connected = True
        self.start_simulation()
        return heartbeat
    
    def start_simulation(self):
        """Start telemetry simulation"""
        if not self.simulation_active:
            self.simulation_active = True
            self.simulation_thread = threading.Thread(target=self.simulation_worker)
            self.simulation_thread.daemon = True
            self.simulation_thread.start()
    
    def simulation_worker(self):
        """Generate simulated telemetry data"""
        time_start = time.time()
        
        while self.simulation_active:
            current_time = time.time()
            elapsed = current_time - time_start
            
            # Simulate drone movement
            self.lat += random.uniform(-0.00001, 0.00001)
            self.lon += random.uniform(-0.00001, 0.00001)
            self.alt += random.uniform(-0.5, 0.5)
            self.relative_alt = max(0, self.alt - 50)
            
            # Simulate attitude changes
            self.roll = math.sin(elapsed * 0.1) * 5.0
            self.pitch = math.cos(elapsed * 0.15) * 3.0
            self.yaw = (elapsed * 10) % 360
            
            # Simulate speeds
            self.ground_speed = 2.0 + random.uniform(-0.5, 0.5)
            self.air_speed = self.ground_speed + random.uniform(-0.2, 0.2)
            self.climb_rate = random.uniform(-0.5, 0.5)
            self.heading = self.yaw
            
            # Simulate battery discharge
            self.battery_voltage = max(10.0, 12.6 - (elapsed / 3600) * 2.0)
            self.battery_current = 5.2 + random.uniform(-1.0, 1.0)
            self.battery_remaining = max(0, int(85 - (elapsed / 3600) * 20))
            
            # Generate messages
            messages = [
                MockMAVLinkMessage('HEARTBEAT',
                    base_mode=81 | (64 if self.armed else 0),
                    custom_mode=self.flight_mode,
                    system_status=4),
                
                MockMAVLinkMessage('GLOBAL_POSITION_INT',
                    lat=int(self.lat * 1e7),
                    lon=int(self.lon * 1e7),
                    alt=int(self.alt * 1000),
                    relative_alt=int(self.relative_alt * 1000),
                    vx=int(self.ground_speed * 100),
                    vy=0,
                    vz=int(self.climb_rate * 100),
                    hdg=int(self.heading * 100)),
                
                MockMAVLinkMessage('ATTITUDE',
                    roll=math.radians(self.roll),
                    pitch=math.radians(self.pitch),
                    yaw=math.radians(self.yaw),
                    rollspeed=0.0,
                    pitchspeed=0.0,
                    yawspeed=0.0),
                
                MockMAVLinkMessage('VFR_HUD',
                    airspeed=self.air_speed,
                    groundspeed=self.ground_speed,
                    climb=self.climb_rate,
                    throttle=50,
                    alt=self.alt,
                    heading=int(self.heading)),
                
                MockMAVLinkMessage('SYS_STATUS',
                    voltage_battery=int(self.battery_voltage * 1000),
                    current_battery=int(self.battery_current * 100),
                    battery_remaining=self.battery_remaining),
                
                MockMAVLinkMessage('GPS_RAW_INT',
                    lat=int(self.lat * 1e7),
                    lon=int(self.lon * 1e7),
                    alt=int(self.alt * 1000),
                    fix_type=3,  # 3D_FIX
                    satellites_visible=self.gps_satellites)
            ]
            
            self.message_queue.extend(messages)
            time.sleep(0.1)  # 10Hz update rate
    
    def recv_match(self, blocking=True, timeout=1):
        """Simulate receiving MAVLink messages"""
        if self.message_queue:
            return self.message_queue.pop(0)
        
        if not blocking:
            return None
        
        # Wait for messages
        wait_time = 0
        while wait_time < timeout and not self.message_queue:
            time.sleep(0.01)
            wait_time += 0.01
        
        if self.message_queue:
            return self.message_queue.pop(0)
        
        return None
    
    def close(self):
        """Close simulation"""
        self.simulation_active = False
        self.connected = False
        if self.simulation_thread:
            self.simulation_thread.join(timeout=1.0)

def run_demo():
    """Run the GCS demo"""
    print("🎮 PyMAVLink Ground Control Station - DEMO MODE")
    print("=" * 60)
    print()
    
    # Import the GCS classes
    try:
        from mavlink_gcs import DroneData, MAVLinkGCS
        print("✅ GCS modules imported successfully")
    except ImportError as e:
        print(f"❌ Failed to import GCS modules: {e}")
        return False
    
    # Create drone data instance
    drone_data = DroneData()
    print("✅ DroneData instance created")
    
    # Simulate connection
    print("🔗 Simulating connection to drone...")
    connection = MockMAVLinkConnection("demo:127.0.0.1:14550")
    
    # Wait for heartbeat
    heartbeat = connection.wait_heartbeat(timeout=5)
    if heartbeat:
        print(f"✅ Heartbeat received from system {heartbeat.get_srcSystem()}")
        print(f"   Autopilot: {heartbeat.autopilot}")
        print(f"   Vehicle Type: {heartbeat.type}")
        print(f"   Flight Mode: {heartbeat.custom_mode}")
    else:
        print("❌ No heartbeat received")
        return False
    
    # Simulate telemetry reception
    print("\n📡 Receiving telemetry data...")
    print("   (Press Ctrl+C to stop)")
    
    try:
        start_time = time.time()
        message_count = 0
        
        while time.time() - start_time < 30:  # Run for 30 seconds
            msg = connection.recv_match(timeout=1)
            if msg:
                message_count += 1
                msg_type = msg.get_type()
                
                if msg_type == 'HEARTBEAT':
                    print(f"💓 Heartbeat - Mode: {msg.custom_mode}, Armed: {bool(msg.base_mode & 64)}")
                
                elif msg_type == 'GLOBAL_POSITION_INT':
                    lat = msg.lat / 1e7
                    lon = msg.lon / 1e7
                    alt = msg.alt / 1000
                    print(f"📍 Position - Lat: {lat:.6f}, Lon: {lon:.6f}, Alt: {alt:.1f}m")
                
                elif msg_type == 'ATTITUDE':
                    roll = math.degrees(msg.roll)
                    pitch = math.degrees(msg.pitch)
                    yaw = math.degrees(msg.yaw)
                    print(f"🎯 Attitude - Roll: {roll:.1f}°, Pitch: {pitch:.1f}°, Yaw: {yaw:.1f}°")
                
                elif msg_type == 'VFR_HUD':
                    print(f"🚁 Speed - Ground: {msg.groundspeed:.1f}m/s, Air: {msg.airspeed:.1f}m/s")
                
                elif msg_type == 'SYS_STATUS':
                    voltage = msg.voltage_battery / 1000
                    current = msg.current_battery / 100
                    remaining = msg.battery_remaining
                    print(f"🔋 Battery - {voltage:.1f}V, {current:.1f}A, {remaining}%")
                
                elif msg_type == 'GPS_RAW_INT':
                    fix_types = {0: "NO_GPS", 1: "NO_FIX", 2: "2D_FIX", 3: "3D_FIX"}
                    fix_type = fix_types.get(msg.fix_type, "UNKNOWN")
                    print(f"🛰️  GPS - Fix: {fix_type}, Satellites: {msg.satellites_visible}")
                
                # Show progress
                if message_count % 50 == 0:
                    elapsed = time.time() - start_time
                    rate = message_count / elapsed
                    print(f"📊 Stats - Messages: {message_count}, Rate: {rate:.1f} msg/s, Time: {elapsed:.1f}s")
            
            time.sleep(0.1)
    
    except KeyboardInterrupt:
        print("\n⏹️  Demo stopped by user")
    
    finally:
        connection.close()
        print("🔌 Connection closed")
    
    print("\n🎉 Demo completed successfully!")
    print("📝 Summary:")
    print(f"   - Connection established: ✅")
    print(f"   - Heartbeat received: ✅")
    print(f"   - Telemetry messages: {message_count}")
    print(f"   - Demo duration: {time.time() - start_time:.1f} seconds")
    print("\n💡 To use with real hardware, run: python3 mavlink_gcs.py")
    
    return True

if __name__ == "__main__":
    success = run_demo()
    sys.exit(0 if success else 1)