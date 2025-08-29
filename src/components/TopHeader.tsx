import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import WindowControls from "@/components/WindowControls";

interface Notification {
  id: string;
  type: 'email';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

const TopHeader = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Window states for each component
  const [calendarHidden, setCalendarHidden] = useState(false);
  const [notificationHidden, setNotificationHidden] = useState(false);
  const [clockHidden, setClockHidden] = useState(false);
  const [calendarMaximized, setCalendarMaximized] = useState(false);
  const [notificationMaximized, setNotificationMaximized] = useState(false);
  const [clockMaximized, setClockMaximized] = useState(false);
  
  // Check if all top components are hidden
  const allTopComponentsHidden = calendarHidden && notificationHidden && clockHidden;

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen for Gmail notifications
  useEffect(() => {
    const handleGmailNotification = (event: CustomEvent) => {
      const data = event.detail;
      if (data.type === 'new_email') {
        const newNotification: Notification = {
          id: Date.now().toString(),
          type: 'email',
          title: 'New Email Received',
          message: `From: ${data.data.from_email}\nSubject: ${data.data.subject || 'No Subject'}`,
          timestamp: new Date(),
          read: false
        };
        setNotifications(prev => [newNotification, ...prev.slice(0, 19)]); // Keep last 20
      }
    };

    window.addEventListener('gmail:notification', handleGmailNotification as EventListener);
    return () => window.removeEventListener('gmail:notification', handleGmailNotification as EventListener);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  // Calendar generation
  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.toDateString() === today.toDateString();
      
      days.push({
        date: date.getDate(),
        isCurrentMonth,
        isToday,
        fullDate: date
      });
    }
    
    return days;
  };

  // Analog clock component
  const AnalogClock = () => {
    const hours = currentTime.getHours() % 12;
    const minutes = currentTime.getMinutes();
    const seconds = currentTime.getSeconds();
    
    const hourAngle = (hours * 30) + (minutes * 0.5);
    const minuteAngle = minutes * 6;
    const secondAngle = seconds * 6;
    
    return (
      <div className="relative w-48 h-48 mx-auto">
        <svg className="w-full h-full" viewBox="0 0 200 200">
          {/* Clock face */}
          <circle cx="100" cy="100" r="95" fill="white" stroke="#e5e7eb" strokeWidth="2" />
          
          {/* Hour markers */}
          {[...Array(12)].map((_, i) => {
            const angle = (i * 30) * (Math.PI / 180);
            const x1 = 100 + 80 * Math.sin(angle);
            const y1 = 100 - 80 * Math.cos(angle);
            const x2 = 100 + 70 * Math.sin(angle);
            const y2 = 100 - 70 * Math.cos(angle);
            
            return (
              <g key={i}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#374151" strokeWidth="2" />
                <text 
                  x={100 + 85 * Math.sin(angle)} 
                  y={100 - 85 * Math.cos(angle) + 5} 
                  textAnchor="middle" 
                  className="text-sm font-medium fill-gray-700"
                >
                  {i === 0 ? 12 : i}
                </text>
              </g>
            );
          })}
          
          {/* Hour hand */}
          <line 
            x1="100" 
            y1="100" 
            x2={100 + 50 * Math.sin(hourAngle * Math.PI / 180)} 
            y2={100 - 50 * Math.cos(hourAngle * Math.PI / 180)} 
            stroke="#374151" 
            strokeWidth="4" 
            strokeLinecap="round"
          />
          
          {/* Minute hand */}
          <line 
            x1="100" 
            y1="100" 
            x2={100 + 70 * Math.sin(minuteAngle * Math.PI / 180)} 
            y2={100 - 70 * Math.cos(minuteAngle * Math.PI / 180)} 
            stroke="#374151" 
            strokeWidth="3" 
            strokeLinecap="round"
          />
          
          {/* Second hand */}
          <line 
            x1="100" 
            y1="100" 
            x2={100 + 75 * Math.sin(secondAngle * Math.PI / 180)} 
            y2={100 - 75 * Math.cos(secondAngle * Math.PI / 180)} 
            stroke="#ef4444" 
            strokeWidth="1" 
            strokeLinecap="round"
          />
          
          {/* Center dot */}
          <circle cx="100" cy="100" r="4" fill="#374151" />
        </svg>
        
        <div className="text-center mt-4">
          <div className="text-lg font-mono font-semibold">
            {currentTime.toLocaleTimeString('en-US', { hour12: true })}
          </div>
          <div className="text-sm text-muted-foreground">
            {currentTime.toLocaleDateString('en-US', { 
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>
      </div>
    );
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className={`grid gap-6 mb-8 ${
      calendarMaximized || notificationMaximized || clockMaximized 
        ? 'grid-cols-1' 
        : 'grid-cols-1 lg:grid-cols-3'
    }`}>
      {/* Full Calendar */}
      <Card className={`${
        calendarMaximized ? 'col-span-full' : 
        (notificationMaximized || clockMaximized) ? 'hidden' : 'lg:col-span-1'
      } ${calendarHidden ? 'h-16' : ''}`}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <span>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
            <div className="flex items-center gap-2">
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                  className="px-2 py-1 text-sm bg-muted rounded hover:bg-muted/80"
                >
                  ‹
                </button>
                <button 
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                  className="px-2 py-1 text-sm bg-muted rounded hover:bg-muted/80"
                >
                  ›
                </button>
              </div>
              <WindowControls
                isMinimized={calendarHidden}
                isMaximized={calendarMaximized}
                onMinimize={() => setCalendarHidden(true)}
                onMaximize={() => { setCalendarMaximized(true); setCalendarHidden(false); }}
                onRestore={() => { setCalendarMaximized(false); setCalendarHidden(false); }}
              />
            </div>
          </CardTitle>
        </CardHeader>
        {!calendarHidden && (
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map(day => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {generateCalendar().map((day, index) => (
                <div 
                  key={index}
                  className={`text-center p-2 text-sm rounded cursor-pointer hover:bg-muted/50 ${
                    day.isToday ? 'bg-primary text-primary-foreground font-semibold' :
                    day.isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {day.date}
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Notifications Panel */}
      <Card className={`${
        notificationMaximized ? 'col-span-full' : 
        (calendarMaximized || clockMaximized) ? 'hidden' : 'lg:col-span-1'
      } ${notificationHidden ? 'h-16' : ''}`}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Email Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <WindowControls
              isMinimized={notificationHidden}
              isMaximized={notificationMaximized}
              onMinimize={() => setNotificationHidden(true)}
              onMaximize={() => { setNotificationMaximized(true); setNotificationHidden(false); }}
              onRestore={() => { setNotificationMaximized(false); setNotificationHidden(false); }}
            />
          </CardTitle>
        </CardHeader>
        {!notificationHidden && (
          <CardContent>
            <ScrollArea className={notificationMaximized ? "h-96" : "h-80"}>
              {notifications.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No notifications yet</p>
                  <p className="text-sm">New email notifications will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        !notification.read 
                          ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' 
                          : 'bg-muted/30 hover:bg-muted/50'
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <Bell className={`w-4 h-4 mt-1 ${
                          !notification.read ? 'text-blue-600' : 'text-muted-foreground'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-medium ${
                              !notification.read ? 'text-blue-900' : 'text-foreground'
                            }`}>
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {notification.timestamp.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        )}
      </Card>

      {/* Analog Clock */}
      <Card className={`${
        clockMaximized ? 'col-span-full' : 
        (calendarMaximized || notificationMaximized) ? 'hidden' : 'lg:col-span-1'
      } ${clockHidden ? 'h-16' : ''}`}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <span>Current Time</span>
            <WindowControls
              isMinimized={clockHidden}
              isMaximized={clockMaximized}
              onMinimize={() => setClockHidden(true)}
              onMaximize={() => { setClockMaximized(true); setClockHidden(false); }}
              onRestore={() => { setClockMaximized(false); setClockHidden(false); }}
            />
          </CardTitle>
        </CardHeader>
        {!clockHidden && (
          <CardContent className="flex items-center justify-center">
            <AnalogClock />
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default TopHeader;