#!/usr/bin/env python3
"""
PyMAVLink Ground Control Station
Enhanced GCS for Pixhawk Orange Cube with improved connection management
"""

import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext
import threading
import time
import serial
import serial.tools.list_ports
from pymavlink import mavutil
import queue
import json
import os
import math
import socket
import traceback
from datetime import datetime

try:
    import tkintermapview
    MAP_AVAILABLE = True
except ImportError:
    MAP_AVAILABLE = False
    print("tkintermapview not available - map features disabled")

class DroneData:
    """Data structure to hold drone telemetry"""
    def __init__(self):
        self.connected = False
        self.lat = 0.0
        self.lon = 0.0
        self.alt = 0.0
        self.relative_alt = 0.0
        self.roll = 0.0
        self.pitch = 0.0
        self.yaw = 0.0
        self.ground_speed = 0.0
        self.air_speed = 0.0
        self.climb_rate = 0.0
        self.heading = 0.0
        self.throttle = 0.0
        self.battery_voltage = 0.0
        self.battery_current = 0.0
        self.battery_remaining = 0.0
        self.gps_fix_type = 0
        self.gps_satellites = 0
        self.flight_mode = "UNKNOWN"
        self.armed = False
        self.last_heartbeat = 0
        self.system_status = "UNKNOWN"
        self.autopilot_type = "UNKNOWN"
        self.vehicle_type = "UNKNOWN"

class MAVLinkGCS:
    def __init__(self, root):
        self.root = root
        self.root.title("PyMAVLink Ground Control Station - Enhanced")
        self.root.geometry("1200x800")
        
        # Connection variables
        self.connection = None
        self.connection_string = ""
        self.connection_type = "serial"
        self.is_connected = False
        self.connection_thread = None
        self.telemetry_thread = None
        self.running = False
        
        # Data queues
        self.telemetry_queue = queue.Queue()
        self.message_queue = queue.Queue()
        
        # Drone data
        self.drone_data = DroneData()
        
        # Connection parameters
        self.serial_ports = []
        self.connection_timeout = 30
        self.retry_attempts = 3
        self.retry_delay = 2
        
        # Map variables
        self.map_widget = None
        self.drone_marker = None
        
        # GUI Setup
        self.setup_gui()
        self.refresh_serial_ports()
        
        # Start GUI update loop
        self.root.after(100, self.update_gui)
        
        # Bind close event
        self.root.protocol("WM_DELETE_WINDOW", self.on_closing)

    def setup_gui(self):
        """Setup the main GUI"""
        # Create main notebook for tabs
        self.notebook = ttk.Notebook(self.root)
        self.notebook.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # Connection tab
        self.setup_connection_tab()
        
        # Telemetry tab
        self.setup_telemetry_tab()
        
        # Map tab (if available)
        if MAP_AVAILABLE:
            self.setup_map_tab()
        
        # Control tab
        self.setup_control_tab()
        
        # Messages tab
        self.setup_messages_tab()

    def setup_connection_tab(self):
        """Setup connection configuration tab"""
        self.connection_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.connection_frame, text="Connection")
        
        # Connection type selection
        type_frame = ttk.LabelFrame(self.connection_frame, text="Connection Type")
        type_frame.pack(fill=tk.X, padx=5, pady=5)
        
        self.connection_type_var = tk.StringVar(value="serial")
        ttk.Radiobutton(type_frame, text="Serial/USB", variable=self.connection_type_var, 
                       value="serial", command=self.on_connection_type_changed).pack(side=tk.LEFT)
        ttk.Radiobutton(type_frame, text="TCP", variable=self.connection_type_var, 
                       value="tcp", command=self.on_connection_type_changed).pack(side=tk.LEFT)
        ttk.Radiobutton(type_frame, text="UDP", variable=self.connection_type_var, 
                       value="udp", command=self.on_connection_type_changed).pack(side=tk.LEFT)
        
        # Serial connection frame
        self.serial_frame = ttk.LabelFrame(self.connection_frame, text="Serial Connection")
        self.serial_frame.pack(fill=tk.X, padx=5, pady=5)
        
        # Port selection
        port_frame = ttk.Frame(self.serial_frame)
        port_frame.pack(fill=tk.X, padx=5, pady=2)
        
        ttk.Label(port_frame, text="Port:").pack(side=tk.LEFT)
        self.port_var = tk.StringVar()
        self.port_combo = ttk.Combobox(port_frame, textvariable=self.port_var, state="readonly")
        self.port_combo.pack(side=tk.LEFT, padx=5, fill=tk.X, expand=True)
        
        ttk.Button(port_frame, text="Refresh", command=self.refresh_serial_ports).pack(side=tk.RIGHT)
        
        # Baud rate selection
        baud_frame = ttk.Frame(self.serial_frame)
        baud_frame.pack(fill=tk.X, padx=5, pady=2)
        
        ttk.Label(baud_frame, text="Baud Rate:").pack(side=tk.LEFT)
        self.baud_var = tk.StringVar(value="57600")
        baud_combo = ttk.Combobox(baud_frame, textvariable=self.baud_var, 
                                 values=["9600", "19200", "38400", "57600", "115200", "230400", "460800", "921600"])
        baud_combo.pack(side=tk.LEFT, padx=5)
        
        # Network connection frame
        self.network_frame = ttk.LabelFrame(self.connection_frame, text="Network Connection")
        self.network_frame.pack(fill=tk.X, padx=5, pady=5)
        
        # Host and port
        host_frame = ttk.Frame(self.network_frame)
        host_frame.pack(fill=tk.X, padx=5, pady=2)
        
        ttk.Label(host_frame, text="Host:").pack(side=tk.LEFT)
        self.host_var = tk.StringVar(value="127.0.0.1")
        ttk.Entry(host_frame, textvariable=self.host_var).pack(side=tk.LEFT, padx=5)
        
        ttk.Label(host_frame, text="Port:").pack(side=tk.LEFT, padx=(20, 0))
        self.network_port_var = tk.StringVar(value="14550")
        ttk.Entry(host_frame, textvariable=self.network_port_var, width=10).pack(side=tk.LEFT, padx=5)
        
        # Connection options
        options_frame = ttk.LabelFrame(self.connection_frame, text="Connection Options")
        options_frame.pack(fill=tk.X, padx=5, pady=5)
        
        # Timeout
        timeout_frame = ttk.Frame(options_frame)
        timeout_frame.pack(fill=tk.X, padx=5, pady=2)
        
        ttk.Label(timeout_frame, text="Timeout (seconds):").pack(side=tk.LEFT)
        self.timeout_var = tk.StringVar(value="30")
        ttk.Entry(timeout_frame, textvariable=self.timeout_var, width=10).pack(side=tk.LEFT, padx=5)
        
        # Auto-reconnect
        self.auto_reconnect_var = tk.BooleanVar(value=True)
        ttk.Checkbutton(timeout_frame, text="Auto-reconnect", variable=self.auto_reconnect_var).pack(side=tk.LEFT, padx=20)
        
        # MAVLink version
        self.mavlink_v2_var = tk.BooleanVar(value=True)
        ttk.Checkbutton(timeout_frame, text="MAVLink v2", variable=self.mavlink_v2_var).pack(side=tk.LEFT, padx=20)
        
        # Connection control
        control_frame = ttk.Frame(self.connection_frame)
        control_frame.pack(fill=tk.X, padx=5, pady=10)
        
        self.connect_button = ttk.Button(control_frame, text="Connect", command=self.connect_to_drone)
        self.connect_button.pack(side=tk.LEFT, padx=5)
        
        self.disconnect_button = ttk.Button(control_frame, text="Disconnect", command=self.disconnect_from_drone, state=tk.DISABLED)
        self.disconnect_button.pack(side=tk.LEFT, padx=5)
        
        # Connection status
        self.status_label = ttk.Label(control_frame, text="Status: Disconnected", foreground="red")
        self.status_label.pack(side=tk.LEFT, padx=20)
        
        # Initially show serial frame
        self.on_connection_type_changed()

    def setup_telemetry_tab(self):
        """Setup telemetry display tab"""
        self.telemetry_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.telemetry_frame, text="Telemetry")
        
        # Create two columns
        left_frame = ttk.Frame(self.telemetry_frame)
        left_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        right_frame = ttk.Frame(self.telemetry_frame)
        right_frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # Position and attitude
        pos_frame = ttk.LabelFrame(left_frame, text="Position & Attitude")
        pos_frame.pack(fill=tk.X, pady=5)
        
        self.lat_label = ttk.Label(pos_frame, text="Latitude: --")
        self.lat_label.pack(anchor=tk.W)
        
        self.lon_label = ttk.Label(pos_frame, text="Longitude: --")
        self.lon_label.pack(anchor=tk.W)
        
        self.alt_label = ttk.Label(pos_frame, text="Altitude: --")
        self.alt_label.pack(anchor=tk.W)
        
        self.rel_alt_label = ttk.Label(pos_frame, text="Relative Alt: --")
        self.rel_alt_label.pack(anchor=tk.W)
        
        self.roll_label = ttk.Label(pos_frame, text="Roll: --")
        self.roll_label.pack(anchor=tk.W)
        
        self.pitch_label = ttk.Label(pos_frame, text="Pitch: --")
        self.pitch_label.pack(anchor=tk.W)
        
        self.yaw_label = ttk.Label(pos_frame, text="Yaw: --")
        self.yaw_label.pack(anchor=tk.W)
        
        # Speed and navigation
        speed_frame = ttk.LabelFrame(left_frame, text="Speed & Navigation")
        speed_frame.pack(fill=tk.X, pady=5)
        
        self.ground_speed_label = ttk.Label(speed_frame, text="Ground Speed: --")
        self.ground_speed_label.pack(anchor=tk.W)
        
        self.air_speed_label = ttk.Label(speed_frame, text="Air Speed: --")
        self.air_speed_label.pack(anchor=tk.W)
        
        self.climb_rate_label = ttk.Label(speed_frame, text="Climb Rate: --")
        self.climb_rate_label.pack(anchor=tk.W)
        
        self.heading_label = ttk.Label(speed_frame, text="Heading: --")
        self.heading_label.pack(anchor=tk.W)
        
        # System status
        system_frame = ttk.LabelFrame(right_frame, text="System Status")
        system_frame.pack(fill=tk.X, pady=5)
        
        self.flight_mode_label = ttk.Label(system_frame, text="Flight Mode: --")
        self.flight_mode_label.pack(anchor=tk.W)
        
        self.armed_label = ttk.Label(system_frame, text="Armed: --")
        self.armed_label.pack(anchor=tk.W)
        
        self.system_status_label = ttk.Label(system_frame, text="System Status: --")
        self.system_status_label.pack(anchor=tk.W)
        
        self.autopilot_label = ttk.Label(system_frame, text="Autopilot: --")
        self.autopilot_label.pack(anchor=tk.W)
        
        # Battery
        battery_frame = ttk.LabelFrame(right_frame, text="Battery")
        battery_frame.pack(fill=tk.X, pady=5)
        
        self.battery_voltage_label = ttk.Label(battery_frame, text="Voltage: --")
        self.battery_voltage_label.pack(anchor=tk.W)
        
        self.battery_current_label = ttk.Label(battery_frame, text="Current: --")
        self.battery_current_label.pack(anchor=tk.W)
        
        self.battery_remaining_label = ttk.Label(battery_frame, text="Remaining: --")
        self.battery_remaining_label.pack(anchor=tk.W)
        
        # GPS
        gps_frame = ttk.LabelFrame(right_frame, text="GPS")
        gps_frame.pack(fill=tk.X, pady=5)
        
        self.gps_fix_label = ttk.Label(gps_frame, text="Fix Type: --")
        self.gps_fix_label.pack(anchor=tk.W)
        
        self.gps_sats_label = ttk.Label(gps_frame, text="Satellites: --")
        self.gps_sats_label.pack(anchor=tk.W)

    def setup_map_tab(self):
        """Setup map display tab"""
        if not MAP_AVAILABLE:
            return
            
        self.map_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.map_frame, text="Map")
        
        # Map widget
        self.map_widget = tkintermapview.TkinterMapView(self.map_frame, width=800, height=600, corner_radius=0)
        self.map_widget.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # Set initial position (can be changed when drone connects)
        self.map_widget.set_position(37.7749, -122.4194)  # San Francisco
        self.map_widget.set_zoom(15)

    def setup_control_tab(self):
        """Setup manual control tab"""
        self.control_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.control_frame, text="Control")
        
        # Flight mode control
        mode_frame = ttk.LabelFrame(self.control_frame, text="Flight Mode")
        mode_frame.pack(fill=tk.X, padx=5, pady=5)
        
        self.flight_modes = ["STABILIZE", "LOITER", "AUTO", "GUIDED", "LAND", "RTL", "CIRCLE", "POSITION", "ACRO", "OF_LOITER"]
        self.selected_mode = tk.StringVar(value="STABILIZE")
        mode_combo = ttk.Combobox(mode_frame, textvariable=self.selected_mode, values=self.flight_modes, state="readonly")
        mode_combo.pack(side=tk.LEFT, padx=5)
        
        ttk.Button(mode_frame, text="Set Mode", command=self.set_flight_mode).pack(side=tk.LEFT, padx=5)
        
        # Arm/Disarm
        arm_frame = ttk.LabelFrame(self.control_frame, text="Arm/Disarm")
        arm_frame.pack(fill=tk.X, padx=5, pady=5)
        
        ttk.Button(arm_frame, text="ARM", command=self.arm_drone).pack(side=tk.LEFT, padx=5)
        ttk.Button(arm_frame, text="DISARM", command=self.disarm_drone).pack(side=tk.LEFT, padx=5)
        
        # Emergency controls
        emergency_frame = ttk.LabelFrame(self.control_frame, text="Emergency")
        emergency_frame.pack(fill=tk.X, padx=5, pady=5)
        
        ttk.Button(emergency_frame, text="EMERGENCY STOP", command=self.emergency_stop, 
                  style="Danger.TButton").pack(side=tk.LEFT, padx=5)
        ttk.Button(emergency_frame, text="Return to Launch", command=self.return_to_launch).pack(side=tk.LEFT, padx=5)
        
        # Manual control (if needed)
        manual_frame = ttk.LabelFrame(self.control_frame, text="Manual Control")
        manual_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        ttk.Label(manual_frame, text="Manual control requires joystick/gamepad").pack(pady=20)

    def setup_messages_tab(self):
        """Setup messages/logs tab"""
        self.messages_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.messages_frame, text="Messages")
        
        # Message display
        self.message_text = scrolledtext.ScrolledText(self.messages_frame, wrap=tk.WORD, height=20)
        self.message_text.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # Clear button
        ttk.Button(self.messages_frame, text="Clear Messages", command=self.clear_messages).pack(pady=5)

    def on_connection_type_changed(self):
        """Handle connection type change"""
        conn_type = self.connection_type_var.get()
        
        if conn_type == "serial":
            self.serial_frame.pack(fill=tk.X, padx=5, pady=5)
            self.network_frame.pack_forget()
        else:
            self.serial_frame.pack_forget()
            self.network_frame.pack(fill=tk.X, padx=5, pady=5)

    def refresh_serial_ports(self):
        """Refresh available serial ports"""
        self.serial_ports = []
        ports = serial.tools.list_ports.comports()
        
        for port in ports:
            # Look for likely drone ports
            port_info = f"{port.device}"
            if port.description:
                port_info += f" - {port.description}"
            self.serial_ports.append(port_info)
        
        # Update combo box
        self.port_combo['values'] = self.serial_ports
        if self.serial_ports:
            self.port_combo.set(self.serial_ports[0])
        
        self.log_message(f"Found {len(self.serial_ports)} serial ports")

    def build_connection_string(self):
        """Build connection string based on selected parameters"""
        conn_type = self.connection_type_var.get()
        
        if conn_type == "serial":
            port = self.port_var.get().split(' - ')[0]  # Extract port name
            baud = self.baud_var.get()
            return f"{port}:{baud}"
        elif conn_type == "tcp":
            host = self.host_var.get()
            port = self.network_port_var.get()
            return f"tcp:{host}:{port}"
        elif conn_type == "udp":
            host = self.host_var.get()
            port = self.network_port_var.get()
            return f"udp:{host}:{port}"
        
        return ""

    def connect_to_drone(self):
        """Connect to drone with improved error handling"""
        if self.is_connected:
            self.log_message("Already connected to drone")
            return
        
        self.connection_string = self.build_connection_string()
        if not self.connection_string:
            messagebox.showerror("Error", "Please select a valid connection")
            return
        
        self.log_message(f"Attempting to connect to: {self.connection_string}")
        
        # Disable connect button
        self.connect_button.config(state=tk.DISABLED)
        self.status_label.config(text="Status: Connecting...", foreground="orange")
        
        # Start connection in separate thread
        self.running = True
        self.connection_thread = threading.Thread(target=self.connection_worker)
        self.connection_thread.daemon = True
        self.connection_thread.start()

    def connection_worker(self):
        """Worker thread for connection with retry logic"""
        attempts = 0
        max_attempts = self.retry_attempts
        
        while attempts < max_attempts and self.running:
            try:
                attempts += 1
                self.log_message(f"Connection attempt {attempts}/{max_attempts}")
                
                # Enhanced connection parameters for Pixhawk Orange Cube
                connection_params = {
                    'timeout': int(self.timeout_var.get()),
                    'retry': 3,
                    'force_connected': True,
                    'source_system': 255,
                    'source_component': 0,
                    'use_native': False
                }
                
                # Set MAVLink version
                if self.mavlink_v2_var.get():
                    connection_params['mavlink_version'] = 2
                else:
                    connection_params['mavlink_version'] = 1
                
                # Create connection
                self.connection = mavutil.mavlink_connection(self.connection_string, **connection_params)
                
                # Wait for heartbeat with timeout
                self.log_message("Waiting for heartbeat...")
                heartbeat_timeout = int(self.timeout_var.get())
                
                # Wait for first heartbeat
                heartbeat = self.connection.wait_heartbeat(timeout=heartbeat_timeout)
                
                if heartbeat:
                    self.log_message(f"Heartbeat received from system {heartbeat.get_srcSystem()}")
                    self.is_connected = True
                    
                    # Update drone data
                    self.drone_data.connected = True
                    self.drone_data.last_heartbeat = time.time()
                    self.drone_data.autopilot_type = self.get_autopilot_type_name(heartbeat.autopilot)
                    self.drone_data.vehicle_type = self.get_vehicle_type_name(heartbeat.type)
                    
                    # Start telemetry thread
                    self.telemetry_thread = threading.Thread(target=self.telemetry_worker)
                    self.telemetry_thread.daemon = True
                    self.telemetry_thread.start()
                    
                    # Update GUI
                    self.root.after(0, self.on_connection_success)
                    return
                else:
                    raise Exception("No heartbeat received")
                    
            except Exception as e:
                error_msg = f"Connection attempt {attempts} failed: {str(e)}"
                self.log_message(error_msg)
                
                if attempts < max_attempts:
                    self.log_message(f"Retrying in {self.retry_delay} seconds...")
                    time.sleep(self.retry_delay)
                else:
                    self.root.after(0, self.on_connection_failed, str(e))
                    return

    def on_connection_success(self):
        """Handle successful connection"""
        self.status_label.config(text="Status: Connected", foreground="green")
        self.connect_button.config(state=tk.NORMAL)
        self.disconnect_button.config(state=tk.NORMAL)
        self.log_message("Successfully connected to drone")
        
        # Request data streams
        self.request_data_streams()

    def on_connection_failed(self, error_msg):
        """Handle connection failure"""
        self.status_label.config(text="Status: Connection Failed", foreground="red")
        self.connect_button.config(state=tk.NORMAL)
        self.disconnect_button.config(state=tk.DISABLED)
        self.log_message(f"Connection failed: {error_msg}")
        
        messagebox.showerror("Connection Failed", f"Failed to connect to drone:\n{error_msg}")

    def request_data_streams(self):
        """Request data streams from drone"""
        if not self.connection:
            return
        
        try:
            # Request different data streams
            streams = [
                (mavutil.mavlink.MAV_DATA_STREAM_POSITION, 4),
                (mavutil.mavlink.MAV_DATA_STREAM_EXTRA1, 4),
                (mavutil.mavlink.MAV_DATA_STREAM_EXTRA2, 4),
                (mavutil.mavlink.MAV_DATA_STREAM_EXTRA3, 4),
                (mavutil.mavlink.MAV_DATA_STREAM_RAW_SENSORS, 4),
                (mavutil.mavlink.MAV_DATA_STREAM_EXTENDED_STATUS, 2),
            ]
            
            for stream_id, rate in streams:
                self.connection.mav.request_data_stream_send(
                    self.connection.target_system,
                    self.connection.target_component,
                    stream_id,
                    rate,
                    1  # start streaming
                )
            
            self.log_message("Data streams requested")
        except Exception as e:
            self.log_message(f"Error requesting data streams: {str(e)}")

    def telemetry_worker(self):
        """Worker thread for processing telemetry data"""
        while self.running and self.is_connected:
            try:
                # Receive message with timeout
                msg = self.connection.recv_match(blocking=True, timeout=1)
                
                if msg:
                    self.process_mavlink_message(msg)
                else:
                    # Check for connection timeout
                    if time.time() - self.drone_data.last_heartbeat > 10:
                        self.log_message("Connection timeout - no heartbeat received")
                        if self.auto_reconnect_var.get():
                            self.log_message("Attempting to reconnect...")
                            self.root.after(0, self.reconnect)
                        else:
                            self.root.after(0, self.disconnect_from_drone)
                        break
                        
            except Exception as e:
                self.log_message(f"Telemetry error: {str(e)}")
                time.sleep(0.1)

    def process_mavlink_message(self, msg):
        """Process incoming MAVLink messages"""
        try:
            msg_type = msg.get_type()
            
            if msg_type == 'HEARTBEAT':
                self.drone_data.last_heartbeat = time.time()
                self.drone_data.flight_mode = self.get_flight_mode_name(msg.custom_mode)
                self.drone_data.armed = bool(msg.base_mode & mavutil.mavlink.MAV_MODE_FLAG_SAFETY_ARMED)
                self.drone_data.system_status = self.get_system_status_name(msg.system_status)
                
            elif msg_type == 'GLOBAL_POSITION_INT':
                self.drone_data.lat = msg.lat / 1e7
                self.drone_data.lon = msg.lon / 1e7
                self.drone_data.alt = msg.alt / 1000.0
                self.drone_data.relative_alt = msg.relative_alt / 1000.0
                self.drone_data.ground_speed = msg.vx / 100.0
                self.drone_data.heading = msg.hdg / 100.0
                
                # Update map if available
                if MAP_AVAILABLE and self.map_widget:
                    self.update_map_position()
                
            elif msg_type == 'ATTITUDE':
                self.drone_data.roll = math.degrees(msg.roll)
                self.drone_data.pitch = math.degrees(msg.pitch)
                self.drone_data.yaw = math.degrees(msg.yaw)
                
            elif msg_type == 'VFR_HUD':
                self.drone_data.air_speed = msg.airspeed
                self.drone_data.ground_speed = msg.groundspeed
                self.drone_data.climb_rate = msg.climb
                self.drone_data.throttle = msg.throttle
                
            elif msg_type == 'SYS_STATUS':
                self.drone_data.battery_voltage = msg.voltage_battery / 1000.0
                self.drone_data.battery_current = msg.current_battery / 100.0
                self.drone_data.battery_remaining = msg.battery_remaining
                
            elif msg_type == 'GPS_RAW_INT':
                self.drone_data.gps_fix_type = msg.fix_type
                self.drone_data.gps_satellites = msg.satellites_visible
                
            # Queue telemetry update
            self.telemetry_queue.put(msg_type)
            
        except Exception as e:
            self.log_message(f"Error processing message {msg_type}: {str(e)}")

    def update_map_position(self):
        """Update drone position on map"""
        if not MAP_AVAILABLE or not self.map_widget:
            return
        
        try:
            # Remove old marker
            if self.drone_marker:
                self.drone_marker.delete()
            
            # Add new marker
            if self.drone_data.lat != 0 and self.drone_data.lon != 0:
                self.drone_marker = self.map_widget.set_marker(
                    self.drone_data.lat, 
                    self.drone_data.lon, 
                    text="Drone",
                    marker_color_circle="red",
                    marker_color_outside="darkred"
                )
                
                # Center map on drone (first time only)
                if not hasattr(self, 'map_centered'):
                    self.map_widget.set_position(self.drone_data.lat, self.drone_data.lon)
                    self.map_centered = True
                    
        except Exception as e:
            self.log_message(f"Map update error: {str(e)}")

    def disconnect_from_drone(self):
        """Disconnect from drone"""
        self.running = False
        self.is_connected = False
        
        if self.connection:
            try:
                self.connection.close()
            except:
                pass
            self.connection = None
        
        # Update GUI
        self.status_label.config(text="Status: Disconnected", foreground="red")
        self.connect_button.config(state=tk.NORMAL)
        self.disconnect_button.config(state=tk.DISABLED)
        
        # Reset drone data
        self.drone_data = DroneData()
        
        self.log_message("Disconnected from drone")

    def reconnect(self):
        """Attempt to reconnect to drone"""
        self.disconnect_from_drone()
        time.sleep(1)
        self.connect_to_drone()

    def set_flight_mode(self):
        """Set flight mode"""
        if not self.is_connected:
            messagebox.showwarning("Warning", "Not connected to drone")
            return
        
        try:
            mode_name = self.selected_mode.get()
            mode_id = self.get_flight_mode_id(mode_name)
            
            if mode_id is not None:
                self.connection.mav.set_mode_send(
                    self.connection.target_system,
                    mavutil.mavlink.MAV_MODE_FLAG_CUSTOM_MODE_ENABLED,
                    mode_id
                )
                self.log_message(f"Flight mode set to {mode_name}")
            else:
                self.log_message(f"Unknown flight mode: {mode_name}")
        except Exception as e:
            self.log_message(f"Error setting flight mode: {str(e)}")

    def arm_drone(self):
        """Arm the drone"""
        if not self.is_connected:
            messagebox.showwarning("Warning", "Not connected to drone")
            return
        
        try:
            self.connection.mav.command_long_send(
                self.connection.target_system,
                self.connection.target_component,
                mavutil.mavlink.MAV_CMD_COMPONENT_ARM_DISARM,
                0,
                1, 0, 0, 0, 0, 0, 0
            )
            self.log_message("ARM command sent")
        except Exception as e:
            self.log_message(f"Error arming drone: {str(e)}")

    def disarm_drone(self):
        """Disarm the drone"""
        if not self.is_connected:
            messagebox.showwarning("Warning", "Not connected to drone")
            return
        
        try:
            self.connection.mav.command_long_send(
                self.connection.target_system,
                self.connection.target_component,
                mavutil.mavlink.MAV_CMD_COMPONENT_ARM_DISARM,
                0,
                0, 0, 0, 0, 0, 0, 0
            )
            self.log_message("DISARM command sent")
        except Exception as e:
            self.log_message(f"Error disarming drone: {str(e)}")

    def emergency_stop(self):
        """Emergency stop"""
        if not self.is_connected:
            messagebox.showwarning("Warning", "Not connected to drone")
            return
        
        result = messagebox.askyesno("Emergency Stop", "Are you sure you want to emergency stop?")
        if result:
            try:
                self.connection.mav.command_long_send(
                    self.connection.target_system,
                    self.connection.target_component,
                    mavutil.mavlink.MAV_CMD_DO_MOTOR_TEST,
                    0,
                    0, 0, 0, 0, 0, 0, 0
                )
                self.log_message("EMERGENCY STOP command sent")
            except Exception as e:
                self.log_message(f"Error sending emergency stop: {str(e)}")

    def return_to_launch(self):
        """Return to launch"""
        if not self.is_connected:
            messagebox.showwarning("Warning", "Not connected to drone")
            return
        
        try:
            self.connection.mav.command_long_send(
                self.connection.target_system,
                self.connection.target_component,
                mavutil.mavlink.MAV_CMD_NAV_RETURN_TO_LAUNCH,
                0,
                0, 0, 0, 0, 0, 0, 0
            )
            self.log_message("Return to Launch command sent")
        except Exception as e:
            self.log_message(f"Error sending RTL command: {str(e)}")

    def update_gui(self):
        """Update GUI with telemetry data"""
        # Update telemetry display
        self.update_telemetry_display()
        
        # Process message queue
        self.process_message_queue()
        
        # Schedule next update
        self.root.after(100, self.update_gui)

    def update_telemetry_display(self):
        """Update telemetry display labels"""
        try:
            # Position & Attitude
            self.lat_label.config(text=f"Latitude: {self.drone_data.lat:.6f}°")
            self.lon_label.config(text=f"Longitude: {self.drone_data.lon:.6f}°")
            self.alt_label.config(text=f"Altitude: {self.drone_data.alt:.1f} m")
            self.rel_alt_label.config(text=f"Relative Alt: {self.drone_data.relative_alt:.1f} m")
            self.roll_label.config(text=f"Roll: {self.drone_data.roll:.1f}°")
            self.pitch_label.config(text=f"Pitch: {self.drone_data.pitch:.1f}°")
            self.yaw_label.config(text=f"Yaw: {self.drone_data.yaw:.1f}°")
            
            # Speed & Navigation
            self.ground_speed_label.config(text=f"Ground Speed: {self.drone_data.ground_speed:.1f} m/s")
            self.air_speed_label.config(text=f"Air Speed: {self.drone_data.air_speed:.1f} m/s")
            self.climb_rate_label.config(text=f"Climb Rate: {self.drone_data.climb_rate:.1f} m/s")
            self.heading_label.config(text=f"Heading: {self.drone_data.heading:.1f}°")
            
            # System Status
            self.flight_mode_label.config(text=f"Flight Mode: {self.drone_data.flight_mode}")
            self.armed_label.config(text=f"Armed: {'YES' if self.drone_data.armed else 'NO'}")
            self.system_status_label.config(text=f"System Status: {self.drone_data.system_status}")
            self.autopilot_label.config(text=f"Autopilot: {self.drone_data.autopilot_type}")
            
            # Battery
            self.battery_voltage_label.config(text=f"Voltage: {self.drone_data.battery_voltage:.2f} V")
            self.battery_current_label.config(text=f"Current: {self.drone_data.battery_current:.2f} A")
            self.battery_remaining_label.config(text=f"Remaining: {self.drone_data.battery_remaining}%")
            
            # GPS
            self.gps_fix_label.config(text=f"Fix Type: {self.get_gps_fix_type_name(self.drone_data.gps_fix_type)}")
            self.gps_sats_label.config(text=f"Satellites: {self.drone_data.gps_satellites}")
            
        except Exception as e:
            self.log_message(f"GUI update error: {str(e)}")

    def process_message_queue(self):
        """Process messages from queue"""
        try:
            while not self.message_queue.empty():
                message = self.message_queue.get_nowait()
                self.message_text.insert(tk.END, message + "\n")
                self.message_text.see(tk.END)
        except queue.Empty:
            pass

    def log_message(self, message):
        """Log message with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        formatted_message = f"[{timestamp}] {message}"
        self.message_queue.put(formatted_message)
        print(formatted_message)  # Also print to console

    def clear_messages(self):
        """Clear message display"""
        self.message_text.delete(1.0, tk.END)

    def get_flight_mode_name(self, mode_id):
        """Get flight mode name from ID"""
        mode_names = {
            0: "STABILIZE",
            1: "ACRO",
            2: "ALT_HOLD",
            3: "AUTO",
            4: "GUIDED",
            5: "LOITER",
            6: "RTL",
            7: "CIRCLE",
            8: "POSITION",
            9: "LAND",
            10: "OF_LOITER",
            11: "DRIFT",
            13: "SPORT",
            14: "FLIP",
            15: "AUTOTUNE",
            16: "POSHOLD",
            17: "BRAKE",
            18: "THROW",
            19: "AVOID_ADSB",
            20: "GUIDED_NOGPS",
            21: "SMART_RTL",
            22: "FLOWHOLD",
            23: "FOLLOW",
            24: "ZIGZAG",
            25: "SYSTEMID",
            26: "AUTOROTATE",
            27: "AUTO_RTL"
        }
        return mode_names.get(mode_id, f"UNKNOWN({mode_id})")

    def get_flight_mode_id(self, mode_name):
        """Get flight mode ID from name"""
        mode_ids = {
            "STABILIZE": 0,
            "ACRO": 1,
            "ALT_HOLD": 2,
            "AUTO": 3,
            "GUIDED": 4,
            "LOITER": 5,
            "RTL": 6,
            "CIRCLE": 7,
            "POSITION": 8,
            "LAND": 9,
            "OF_LOITER": 10,
            "DRIFT": 11,
            "SPORT": 13,
            "FLIP": 14,
            "AUTOTUNE": 15,
            "POSHOLD": 16,
            "BRAKE": 17,
            "THROW": 18,
            "AVOID_ADSB": 19,
            "GUIDED_NOGPS": 20,
            "SMART_RTL": 21,
            "FLOWHOLD": 22,
            "FOLLOW": 23,
            "ZIGZAG": 24,
            "SYSTEMID": 25,
            "AUTOROTATE": 26,
            "AUTO_RTL": 27
        }
        return mode_ids.get(mode_name)

    def get_system_status_name(self, status_id):
        """Get system status name from ID"""
        status_names = {
            0: "UNINIT",
            1: "BOOT",
            2: "CALIBRATING",
            3: "STANDBY",
            4: "ACTIVE",
            5: "CRITICAL",
            6: "EMERGENCY",
            7: "POWEROFF"
        }
        return status_names.get(status_id, f"UNKNOWN({status_id})")

    def get_autopilot_type_name(self, autopilot_id):
        """Get autopilot type name from ID"""
        autopilot_names = {
            0: "GENERIC",
            1: "RESERVED",
            2: "SLUGS",
            3: "ARDUPILOTMEGA",
            4: "OPENPILOT",
            5: "GENERIC_WAYPOINTS_ONLY",
            6: "GENERIC_WAYPOINTS_AND_SIMPLE_NAVIGATION_ONLY",
            7: "GENERIC_MISSION_FULL",
            8: "INVALID",
            9: "PPZ",
            10: "UDB",
            11: "FP",
            12: "PX4",
            13: "SMACCMPILOT",
            14: "AUTOQUAD",
            15: "ARMAZILA",
            16: "AEROB",
            17: "ASLUAV",
            18: "SMARTAP",
            19: "AIRRAILS"
        }
        return autopilot_names.get(autopilot_id, f"UNKNOWN({autopilot_id})")

    def get_vehicle_type_name(self, type_id):
        """Get vehicle type name from ID"""
        type_names = {
            0: "GENERIC",
            1: "FIXED_WING",
            2: "QUADROTOR",
            3: "COAXIAL",
            4: "HELICOPTER",
            5: "ANTENNA_TRACKER",
            6: "GCS",
            7: "AIRSHIP",
            8: "FREE_BALLOON",
            9: "ROCKET",
            10: "GROUND_ROVER",
            11: "SURFACE_BOAT",
            12: "SUBMARINE",
            13: "HEXAROTOR",
            14: "OCTOROTOR",
            15: "TRICOPTER",
            16: "FLAPPING_WING",
            17: "KITE",
            18: "ONBOARD_CONTROLLER",
            19: "VTOL_DUOROTOR",
            20: "VTOL_QUADROTOR",
            21: "VTOL_TILTROTOR",
            22: "VTOL_RESERVED2",
            23: "VTOL_RESERVED3",
            24: "VTOL_RESERVED4",
            25: "VTOL_RESERVED5",
            26: "GIMBAL",
            27: "ADSB",
            28: "PARAFOIL",
            29: "DODECAROTOR",
            30: "CAMERA",
            31: "CHARGING_STATION",
            32: "FLARM",
            33: "SERVO",
            34: "ODID",
            35: "DECAROTOR",
            36: "BATTERY",
            37: "PARACHUTE",
            38: "LOG",
            39: "OSD",
            40: "IMU",
            41: "GPS",
            42: "WINCH"
        }
        return type_names.get(type_id, f"UNKNOWN({type_id})")

    def get_gps_fix_type_name(self, fix_type_id):
        """Get GPS fix type name from ID"""
        fix_type_names = {
            0: "NO_GPS",
            1: "NO_FIX",
            2: "2D_FIX",
            3: "3D_FIX",
            4: "DGPS",
            5: "RTK_FLOAT",
            6: "RTK_FIXED",
            7: "STATIC",
            8: "PPP"
        }
        return fix_type_names.get(fix_type_id, f"UNKNOWN({fix_type_id})")

    def on_closing(self):
        """Handle window closing"""
        self.running = False
        self.disconnect_from_drone()
        self.root.destroy()

if __name__ == "__main__":
    root = tk.Tk()
    app = MAVLinkGCS(root)
    root.mainloop()