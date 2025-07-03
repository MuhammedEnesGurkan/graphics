# Troubleshooting Guide: "getaddrinfo failed" Error

## Problem Description
The `getaddrinfo failed` error occurs when the PyMAVLink Ground Control Station cannot resolve the hostname or network address during connection attempts to the Pixhawk Orange Cube.

## Common Causes and Solutions

### 1. Hostname Resolution Issues

**Problem**: Using hostname instead of IP address
```
Connection string: tcp:pixhawk.local:14550
Error: getaddrinfo failed
```

**Solution**: Use IP address instead of hostname
```
Connection string: tcp:192.168.1.100:14550
```

### 2. Network Configuration Issues

**Problem**: Incorrect network settings
- Wrong IP address
- Incorrect port number
- Network not reachable

**Solutions**:
1. **Find the correct IP address**:
   ```bash
   # On Linux/Mac
   ping pixhawk.local
   nmap -sn 192.168.1.0/24
   
   # On Windows
   ping pixhawk.local
   ```

2. **Check port availability**:
   ```bash
   telnet 192.168.1.100 14550
   netstat -an | grep 14550
   ```

3. **Verify network connectivity**:
   ```bash
   ping 192.168.1.100
   ```

### 3. MAVProxy Connection Issues

**Problem**: MAVProxy not running or misconfigured

**Solution**: Start MAVProxy correctly
```bash
# Serial connection forwarding
mavproxy.py --master=/dev/ttyUSB0 --baudrate=57600 --out=tcpin:0.0.0.0:14550

# UDP forwarding
mavproxy.py --master=/dev/ttyUSB0 --baudrate=57600 --out=udpin:0.0.0.0:14550
```

### 4. Firewall Blocking Connection

**Problem**: Firewall blocking the connection

**Solution**: Configure firewall
```bash
# Linux (ufw)
sudo ufw allow 14550

# Linux (iptables)
sudo iptables -A INPUT -p tcp --dport 14550 -j ACCEPT

# Windows
# Add inbound rule for port 14550 in Windows Firewall
```

### 5. DNS Resolution Problems

**Problem**: DNS not resolving `.local` addresses

**Solution**: Install and configure mDNS
```bash
# Ubuntu/Debian
sudo apt-get install avahi-daemon avahi-utils

# macOS (usually included)
# Check with: dns-sd -B _services._dns-sd._udp local.

# Windows
# Install Bonjour Print Services
```

## Specific Fixes for PyMAVLink GCS

### 1. Update Connection String in GCS

In the PyMAVLink GCS application:

1. **For TCP connections**:
   - Host: `192.168.1.100` (replace with actual IP)
   - Port: `14550`
   - Connection string: `tcp:192.168.1.100:14550`

2. **For UDP connections**:
   - Host: `127.0.0.1` (for localhost)
   - Port: `14550`
   - Connection string: `udp:127.0.0.1:14550`

### 2. Use Serial Connection Instead

If network issues persist, use direct serial connection:
1. Connect Pixhawk via USB
2. Select "Serial/USB" in GCS
3. Choose correct port (usually `/dev/ttyUSB0` or `/dev/ttyACM0`)
4. Set baud rate to `57600`

### 3. Test Connection Manually

Before using the GCS, test the connection:

```python
#!/usr/bin/env python3
import socket
import sys

def test_tcp_connection(host, port):
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        result = sock.connect_ex((host, port))
        sock.close()
        
        if result == 0:
            print(f"✅ TCP connection to {host}:{port} successful")
            return True
        else:
            print(f"❌ TCP connection to {host}:{port} failed")
            return False
    except socket.gaierror as e:
        print(f"❌ DNS resolution failed: {e}")
        return False
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 test_connection.py <host> <port>")
        sys.exit(1)
    
    host = sys.argv[1]
    port = int(sys.argv[2])
    
    test_tcp_connection(host, port)
```

Save as `test_connection.py` and run:
```bash
python3 test_connection.py 192.168.1.100 14550
```

## Prevention Tips

1. **Use IP addresses instead of hostnames** when possible
2. **Set static IP** for your Pixhawk device
3. **Document your network configuration**
4. **Test connections** before important flights
5. **Keep backup connection methods** (serial, different ports)

## Advanced Troubleshooting

### 1. Check Network Interface

```bash
# Linux
ip addr show
ifconfig

# Windows
ipconfig
```

### 2. Monitor Network Traffic

```bash
# Linux
sudo tcpdump -i any port 14550

# Windows
# Use Wireshark to monitor port 14550
```

### 3. Check MAVLink Messages

```bash
# If connection works but no data
mavproxy.py --master=tcp:192.168.1.100:14550 --out=console
```

### 4. Verify Pixhawk Configuration

Check ArduPilot parameters:
- `SERIAL1_PROTOCOL = 2` (MAVLink2)
- `SERIAL1_BAUD = 57600`
- `LOG_BACKEND_TYPE = 3` (Both)

## Quick Fix Checklist

When encountering "getaddrinfo failed":

- [ ] Replace hostname with IP address
- [ ] Check network connectivity (`ping`)
- [ ] Verify port is open (`telnet` or `netstat`)
- [ ] Check firewall settings
- [ ] Try different connection type (TCP/UDP/Serial)
- [ ] Restart MAVProxy/networking services
- [ ] Update connection timeout settings
- [ ] Check DNS resolution
- [ ] Verify device is powered and connected

## Contact Support

If issues persist after trying these solutions:
1. Check the Messages tab in the GCS for detailed error logs
2. Enable debug logging
3. Test with the demo script first
4. Verify hardware connections

Remember: When in doubt, use a direct serial connection which bypasses most network-related issues.