# Internet Monitoring & Control Dashboard

A comprehensive Next.js dashboard for monitoring and controlling internet usage through pfSense firewall integration. This system provides real-time bandwidth monitoring, user management, and automated traffic control capabilities.

## 🚀 Features

### Core Functionality
- **Real-time Bandwidth Monitoring**: Live charts showing network usage per user
- **User Management**: View connected users with IP/MAC addresses and connection status
- **Traffic Control**: Block/unblock users directly from the dashboard
- **Historical Analytics**: Store and analyze bandwidth usage patterns over time
- **Activity Logging**: Complete audit trail of all administrative actions
- **Automated Controls**: Set bandwidth thresholds for automatic user blocking

### Technical Features
- **pfSense Integration**: Direct API communication for traffic data and firewall rules
- **PostgreSQL Database**: Persistent storage for logs, user data, and analytics
- **Real-time Updates**: Dashboard refreshes every 30 seconds with live data
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Dark/Light Theme**: Professional UI with theme switching capability

## 🏗️ Architecture

```
[Internet Source] → [pfSense Router] → [Connected Users]
                           ↓
                    [SNMP/API Data]
                           ↓
              [Next.js Dashboard + API] ↔ [PostgreSQL Database]
```

### Component Overview
- **pfSense**: Firewall/router handling traffic enforcement and data collection
- **Next.js**: Full-stack application with dashboard UI and API routes
- **Prisma ORM**: Database management and type-safe queries
- **PostgreSQL**: Persistent storage for user logs and bandwidth history
- **Recharts**: Real-time data visualization and analytics

## 📋 Prerequisites

### Hardware Requirements
- Dedicated PC or VM for pfSense (minimum 2GB RAM, 8GB storage)
- Network interfaces: WAN (internet connection) + LAN (user connections)
- Internet source: Phone hotspot, ISP connection, or cellular modem

### Software Requirements
- Node.js 18+ and npm
- PostgreSQL database (local or cloud-hosted)
- pfSense 2.6+ with API package installed

## 🛠️ Installation

### Step 1: pfSense Setup

1. **Download and Install pfSense**
   ```bash
   # Download from: https://www.pfsense.org/download/
   # Install on dedicated hardware or VM
   ```

2. **Configure Network Interfaces**
   - **WAN**: Connect to internet source (phone hotspot/ISP)
   - **LAN**: Configure subnet (e.g., 192.168.1.1/24)
   - Enable DHCP server for automatic IP assignment

3. **Enable Required Services**
   ```bash
   # In pfSense WebGUI:
   # 1. Services → SNMP → Enable SNMP daemon
   # 2. System → Package Manager → Install pfSense-pkg-API
   # 3. System → API → Enable REST API access
   ```

4. **Create API User**
   - Navigate to System → User Manager
   - Create dedicated API user with appropriate privileges
   - Generate API key and secret

### Step 2: Database Setup

1. **PostgreSQL Installation**
   ```bash
   # Local installation (Ubuntu/Debian)
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   
   # Or use cloud providers:
   # - Supabase (recommended)
   # - Railway
   # - PlanetScale
   # - AWS RDS
   ```

2. **Create Database**
   ```sql
   CREATE DATABASE pfsense_monitor;
   CREATE USER dashboard_user WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE pfsense_monitor TO dashboard_user;
   ```

### Step 3: Dashboard Application

1. **Clone and Install Dependencies**
   ```bash
   git clone <repository-url>
   cd pfsense-dashboard
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/pfsense_monitor"
   
   # pfSense API
   PFSENSE_HOST="192.168.1.1"
   PFSENSE_USERNAME="api_user"
   PFSENSE_PASSWORD="api_password"
   PFSENSE_API_KEY="your_api_key"
   PFSENSE_API_SECRET="your_api_secret"
   
   # Application
   NEXTAUTH_SECRET="your_nextauth_secret"
   NEXTAUTH_URL="http://localhost:3000"
   ```

3. **Database Migration**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Docker Deployment
```dockerfile
# Dockerfile included in project
docker build -t pfsense-dashboard .
docker run -p 3000:3000 pfsense-dashboard
```

### Environment Variables for Production
```env
NODE_ENV=production
DATABASE_URL="your_production_database_url"
PFSENSE_HOST="your_pfsense_ip"
# ... other production configs
```

## 📊 Usage

### Dashboard Overview
- **Stats Cards**: Total users, active connections, bandwidth usage, blocked users
- **Bandwidth Chart**: Real-time network traffic visualization
- **Users Table**: Connected devices with management controls
- **Activity Log**: Recent administrative actions and system events

### User Management
1. **View Connected Users**: See all devices with IP, MAC, and status
2. **Block/Unblock Users**: Click toggle switches for instant control
3. **Bandwidth Monitoring**: Track individual user consumption
4. **Historical Data**: View usage patterns and trends

### Automated Controls
- Set bandwidth thresholds in the dashboard
- Configure automatic blocking rules
- Receive notifications for policy violations
- Schedule maintenance windows

## 🔧 Configuration

### pfSense API Settings
```javascript
// lib/pfsense-api.ts
const config = {
  host: process.env.PFSENSE_HOST,
  username: process.env.PFSENSE_USERNAME,
  password: process.env.PFSENSE_PASSWORD,
  // SSL verification settings
  rejectUnauthorized: false // for self-signed certificates
};
```

### Database Schema
The application uses Prisma with the following main models:
- `User`: Connected device information
- `BandwidthLog`: Historical usage data
- `ActivityLog`: Administrative actions
- `BlockedUser`: Firewall rule tracking

### Monitoring Intervals
- Real-time updates: 30 seconds
- Bandwidth logging: 5 minutes
- Database cleanup: Daily
- API health checks: 1 minute

## 🛡️ Security

### Best Practices
- Use strong passwords for pfSense API access
- Enable HTTPS in production
- Regularly update pfSense and dashboard dependencies
- Monitor API access logs
- Implement rate limiting for API endpoints

### Network Security
- Isolate management network from user traffic
- Use VPN for remote dashboard access
- Enable pfSense logging and monitoring
- Regular security audits and updates

## 🐛 Troubleshooting

### Common Issues

**Dashboard not connecting to pfSense:**
```bash
# Check network connectivity
ping 192.168.1.1

# Verify API credentials
curl -k https://192.168.1.1/api/v1/status/system
```

**Database connection errors:**
```bash
# Test database connection
npx prisma db pull

# Check PostgreSQL service
sudo systemctl status postgresql
```

**Missing bandwidth data:**
- Verify SNMP is enabled on pfSense
- Check firewall rules allow SNMP traffic
- Confirm correct community strings

### Logs and Debugging
```bash
# Application logs
npm run dev -- --debug

# Database logs
tail -f /var/log/postgresql/postgresql-*.log

# pfSense logs
# Check Status → System Logs in pfSense WebGUI
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- pfSense team for the excellent firewall platform
- Next.js team for the amazing React framework
- Prisma team for the outstanding ORM
- shadcn/ui for the beautiful component library

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting section above
- Review pfSense documentation: https://docs.pfsense.org/

---

**Note**: This dashboard is designed for network administrators with pfSense experience. Ensure proper network security practices when deploying in production environments.