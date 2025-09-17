'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings as SettingsIcon, ArrowLeft, Save, Shield, Bell, Monitor } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Setting {
  id: string;
  key: string;
  value: string;
  description?: string;
  category: string;
}

export default function SystemSettings() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key: string, value: string) => {
    setSettings(settings.map(setting => 
      setting.key === key ? { ...setting, value } : setting
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      if (response.ok) {
        toast.success('Settings saved successfully');
      } else {
        toast.error('Failed to save settings');
      }
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const getSettingsByCategory = (category: string) => {
    return settings.filter(setting => setting.category === category);
  };

  const getSetting = (key: string) => {
    return settings.find(setting => setting.key === key)?.value || '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-background shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl font-bold">System Settings</h1>
                <p className="text-muted-foreground">Configure system preferences and parameters</p>
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <SettingsIcon className="w-5 h-5 mr-2" />
                  General Settings
                </CardTitle>
                <CardDescription>
                  Basic system configuration and display preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="system_name">System Name</Label>
                  <Input
                    id="system_name"
                    value={getSetting('system_name')}
                    onChange={(e) => updateSetting('system_name', e.target.value)}
                    placeholder="Rwanda Network Management System"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Display name shown in the application header
                  </p>
                </div>
                <div>
                  <Label htmlFor="company_name">Organization Name</Label>
                  <Input
                    id="company_name"
                    value={getSetting('company_name')}
                    onChange={(e) => updateSetting('company_name', e.target.value)}
                    placeholder="Ministry of ICT & Innovation"
                  />
                </div>
                <div>
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={getSetting('contact_email')}
                    onChange={(e) => updateSetting('contact_email', e.target.value)}
                    placeholder="admin@minict.gov.rw"
                  />
                </div>
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <select
                    id="timezone"
                    value={getSetting('timezone')}
                    onChange={(e) => updateSetting('timezone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="Africa/Kigali">Africa/Kigali (CAT)</option>
                    <option value="UTC">UTC</option>
                    <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Monitor className="w-5 h-5 mr-2" />
                  Monitoring Settings
                </CardTitle>
                <CardDescription>
                  Configure monitoring thresholds and data collection
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="max_bandwidth_threshold">Bandwidth Alert Threshold (%)</Label>
                  <Input
                    id="max_bandwidth_threshold"
                    type="number"
                    min="1"
                    max="100"
                    value={getSetting('max_bandwidth_threshold')}
                    onChange={(e) => updateSetting('max_bandwidth_threshold', e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Alert when router bandwidth usage exceeds this percentage
                  </p>
                </div>
                <div>
                  <Label htmlFor="monitoring_interval">Monitoring Interval (seconds)</Label>
                  <Input
                    id="monitoring_interval"
                    type="number"
                    min="10"
                    max="300"
                    value={getSetting('monitoring_interval')}
                    onChange={(e) => updateSetting('monitoring_interval', e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    How often to collect data from routers
                  </p>
                </div>
                <div>
                  <Label htmlFor="data_retention_days">Data Retention (days)</Label>
                  <Input
                    id="data_retention_days"
                    type="number"
                    min="1"
                    max="365"
                    value={getSetting('data_retention_days')}
                    onChange={(e) => updateSetting('data_retention_days', e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    How long to keep historical monitoring data
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto_discovery"
                    checked={getSetting('auto_discovery') === 'true'}
                    onCheckedChange={(checked) => updateSetting('auto_discovery', checked.toString())}
                  />
                  <Label htmlFor="auto_discovery">Enable Auto-Discovery</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically detect new routers on the network
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  Notification Settings
                </CardTitle>
                <CardDescription>
                  Configure alert notifications and communication preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="alert_email_enabled"
                    checked={getSetting('alert_email_enabled') === 'true'}
                    onCheckedChange={(checked) => updateSetting('alert_email_enabled', checked.toString())}
                  />
                  <Label htmlFor="alert_email_enabled">Enable Email Alerts</Label>
                </div>
                <div>
                  <Label htmlFor="smtp_server">SMTP Server</Label>
                  <Input
                    id="smtp_server"
                    value={getSetting('smtp_server')}
                    onChange={(e) => updateSetting('smtp_server', e.target.value)}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div>
                  <Label htmlFor="smtp_port">SMTP Port</Label>
                  <Input
                    id="smtp_port"
                    type="number"
                    value={getSetting('smtp_port')}
                    onChange={(e) => updateSetting('smtp_port', e.target.value)}
                    placeholder="587"
                  />
                </div>
                <div>
                  <Label htmlFor="alert_recipients">Alert Recipients (comma-separated)</Label>
                  <Input
                    id="alert_recipients"
                    value={getSetting('alert_recipients')}
                    onChange={(e) => updateSetting('alert_recipients', e.target.value)}
                    placeholder="admin@minict.gov.rw, tech@minict.gov.rw"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="sms_alerts_enabled"
                    checked={getSetting('sms_alerts_enabled') === 'true'}
                    onCheckedChange={(checked) => updateSetting('sms_alerts_enabled', checked.toString())}
                  />
                  <Label htmlFor="sms_alerts_enabled">Enable SMS Alerts</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Configure security policies and access controls
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="session_timeout">Session Timeout (seconds)</Label>
                  <Input
                    id="session_timeout"
                    type="number"
                    min="300"
                    max="86400"
                    value={getSetting('session_timeout')}
                    onChange={(e) => updateSetting('session_timeout', e.target.value)}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Automatically log out users after this period of inactivity
                  </p>
                </div>
                <div>
                  <Label htmlFor="max_login_attempts">Max Login Attempts</Label>
                  <Input
                    id="max_login_attempts"
                    type="number"
                    min="3"
                    max="10"
                    value={getSetting('max_login_attempts')}
                    onChange={(e) => updateSetting('max_login_attempts', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="password_min_length">Minimum Password Length</Label>
                  <Input
                    id="password_min_length"
                    type="number"
                    min="6"
                    max="20"
                    value={getSetting('password_min_length')}
                    onChange={(e) => updateSetting('password_min_length', e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="require_password_change"
                    checked={getSetting('require_password_change') === 'true'}
                    onCheckedChange={(checked) => updateSetting('require_password_change', checked.toString())}
                  />
                  <Label htmlFor="require_password_change">Require Password Change on First Login</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enable_audit_log"
                    checked={getSetting('enable_audit_log') === 'true'}
                    onCheckedChange={(checked) => updateSetting('enable_audit_log', checked.toString())}
                  />
                  <Label htmlFor="enable_audit_log">Enable Detailed Audit Logging</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}