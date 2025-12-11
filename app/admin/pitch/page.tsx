'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  ChevronLeft, 
  ShieldCheck, 
  Zap, 
  Brain, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown, 
  CloudRain, 
  Thermometer, 
  Wind,
  Bot,
  Search,
  FileText,
  Clock,
  Star,
  Users,
  Calendar,
  Wallet,
  ArrowRight,
  Target,
  LayoutDashboard,
  MessageSquare,
  Smartphone,
  CreditCard,
  Send,
  MapPin,
  CheckSquare
} from 'lucide-react';

// UI Components (Importing from your existing structure)
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

// --- MOCK DATA FOR PITCH (Ensures "Happy Path" Demo) ---
const DEMO_DATA = {
  provider: {
    id: '1',
    company_name: 'Elite Security Services',
    contact_email: 'ops@elitesecurity.com',
  },
  weather: {
    condition: 'Rain',
    description: 'Heavy Rain',
    temp: 12.5,
    precipitation_prob: 0.8,
    wind_speed: 15,
  },
  staff: [
    { id: '1', staff_name: 'John Doe', role: 'Supervisor', sia_number: '1010-2020-3030-4040', status: 'Active', expiry: '2026-12-31' },
    { id: '2', staff_name: 'Sarah Smith', role: 'Door Supervisor', sia_number: '9999-8888-7777-6666', status: 'Expired', expiry: '2023-01-01' },
    { id: '3', staff_name: 'Mike Jones', role: 'Steward', sia_number: '1234-5678-9012-3456', status: 'Active', expiry: '2025-06-15' },
  ],
  doubleBooking: {
    staff_name: 'Sarah Jones',
    sia_number: '1111-2222-3333-4444',
    provider1: 'KSS Internal',
    provider2: 'Elite Security',
    score: 0.95
  }
};

// --- DEMO COMPONENTS ---
// These are static recreations of your actual components for stability during presentation

const DemoDashboardWidget = ({ title, value, icon: Icon, trend, trendUp }: any) => (
  <Card className="h-full border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className="h-4 w-4 text-blue-500" />
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-slate-800">{value}</div>
      <div className="flex items-center text-xs mt-1">
        {trendUp ? (
          <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
        ) : (
          <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
        )}
        <span className={trendUp ? "text-green-600" : "text-red-600"}>{trend}</span>
        <span className="text-muted-foreground ml-1">vs last month</span>
      </div>
    </CardContent>
  </Card>
);

const DemoLazyBooking = () => (
  <Card className="border-l-4 border-l-red-500 shadow-lg bg-white">
    <CardHeader className="pb-2">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Upload Reliability Alert
          </CardTitle>
          <CardDescription>AI Detection: "Lazy Booker" Pattern</CardDescription>
        </div>
        <Badge variant="destructive" className="bg-red-600">Risk Score: 85/100</Badge>
      </div>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-slate-600 mb-4 bg-red-50 p-3 rounded-md border border-red-100">
        <strong>Analysis:</strong> Provider consistently uploads staff details &lt; 12 hours before event start time.
      </p>
      
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div className="p-3 bg-slate-50 rounded border">
          <p className="text-muted-foreground uppercase tracking-wider font-semibold">Late Uploads</p>
          <p className="font-bold text-xl text-slate-800">12 <span className="text-muted-foreground font-normal text-xs">/ 15 events</span></p>
        </div>
        <div className="p-3 bg-slate-50 rounded border">
          <p className="text-muted-foreground uppercase tracking-wider font-semibold">Avg Lead Time</p>
          <p className="font-bold text-xl text-slate-800">0.8 days</p>
        </div>
      </div>
      
      <div className="mt-4 flex gap-2">
         <Button size="sm" variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50">Send Warning</Button>
         <Button size="sm" variant="default" className="w-full bg-slate-900">View Profile</Button>
      </div>
    </CardContent>
  </Card>
);

const DemoDoubleBooking = () => (
  <Card className="border-l-4 border-l-orange-500 shadow-lg bg-white">
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <CardTitle className="text-lg font-medium flex items-center gap-2 text-orange-700">
          <Users className="h-5 w-5" />
          Double-Booking Prevented
        </CardTitle>
        <Badge className="bg-orange-500 hover:bg-orange-600">CRITICAL BLOCK</Badge>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="bg-orange-50/50 p-4 rounded-lg border border-orange-100">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-bold text-slate-800 flex items-center gap-2">
              {DEMO_DATA.doubleBooking.staff_name}
              <Badge variant="outline" className="text-xs border-orange-200 text-orange-700">
                Fuzzy Match 95%
              </Badge>
            </h4>
            <div className="text-xs font-mono text-slate-500 mt-1">
              SIA: {DEMO_DATA.doubleBooking.sia_number}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-3 rounded border shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-slate-200"></div>
            <span className="text-[10px] text-slate-500 uppercase font-bold">Booking 1 (Confirmed)</span>
            <div className="font-semibold text-slate-800">{DEMO_DATA.doubleBooking.provider1}</div>
            <div className="text-xs text-green-600 font-medium">Wembley Stadium (18:00 - 23:00)</div>
          </div>
          <div className="bg-white p-3 rounded border border-red-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
            <span className="text-[10px] text-slate-500 uppercase font-bold">Attempted Booking</span>
            <div className="font-semibold text-slate-800">{DEMO_DATA.doubleBooking.provider2}</div>
            <div className="text-xs text-red-600 font-medium">O2 Arena (19:00 - 00:00)</div>
          </div>
        </div>
        
        <div className="mt-3 text-center">
            <Badge variant="outline" className="bg-white text-red-600 border-red-200">
                <AlertTriangle className="h-3 w-3 mr-1" /> Overlap: 4 Hours
            </Badge>
        </div>
      </div>
    </CardContent>
  </Card>
);

const DemoWeatherWidget = () => (
  <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl border-none">
    <CardHeader className="pb-3 border-b border-white/10">
      <div className="flex justify-between items-center">
        <CardTitle className="text-lg flex items-center gap-2">
          <CloudRain className="h-5 w-5 text-blue-400" />
          Attendance Prediction
        </CardTitle>
        <Badge variant="outline" className="text-blue-300 border-blue-400/30">AI Model v2.1</Badge>
      </div>
      <CardDescription className="text-slate-400">Event: BST Hyde Park (Outdoor)</CardDescription>
    </CardHeader>
    <CardContent className="space-y-6 pt-6">
      <div className="flex items-center gap-6">
        <div className="flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl text-3xl backdrop-blur-sm">
          🌧️
        </div>
        <div>
          <div className="font-medium text-xl">Heavy Rain Expected</div>
          <div className="text-sm text-slate-400 flex gap-4 mt-1">
            <span className="flex items-center gap-1"><Thermometer className="h-4 w-4" /> 12.5°C</span>
            <span className="flex items-center gap-1"><Wind className="h-4 w-4" /> 15 m/s</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
          <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Predicted Attrition</div>
          <div className="text-3xl font-bold text-orange-400">15.4%</div>
          <div className="text-[10px] text-slate-500 mt-1">Based on historical rainfall data</div>
        </div>
        <div className="bg-green-500/20 p-4 rounded-xl border border-green-500/30">
          <div className="text-xs text-green-300 uppercase font-bold tracking-wider mb-1">Action Required</div>
          <div className="text-3xl font-bold text-green-400">+12 Staff</div>
          <div className="text-[10px] text-green-300/70 mt-1">Recommended Overbooking</div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const DemoProviderScorecard = () => (
  <Card className="shadow-lg border-t-4 border-t-purple-500">
    <CardHeader>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold">
                 ES
             </div>
             <div>
                <CardTitle className="text-lg">{DEMO_DATA.provider.company_name}</CardTitle>
                <CardDescription>{DEMO_DATA.provider.contact_email}</CardDescription>
             </div>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold text-purple-600">92</div>
          <Badge className="mt-1 bg-purple-600 hover:bg-purple-700">Excellent</Badge>
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-slate-700">Acceptance Rate</span>
            <span className="text-sm font-bold text-slate-900">98.5%</span>
          </div>
          <Progress value={98} className="h-2" />
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-slate-700">Attendance Reliability</span>
            <span className="text-sm font-bold text-slate-900">95.2%</span>
          </div>
          <Progress value={95} className="h-2" />
        </div>
      </div>
      
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
        <p className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
          <Brain className="h-3 w-3 text-purple-500" /> AI Sentiment Analysis
        </p>
        <p className="text-sm text-slate-700 italic border-l-2 border-purple-300 pl-3">
          "Recent communications indicate high engagement. Provider is proactive regarding the upcoming Wembley series and has resolved previous uniform queries."
        </p>
      </div>
    </CardContent>
  </Card>
);

const DemoCompliance = () => (
  <Card className="border-red-200 shadow-md">
    <CardHeader className="pb-3 bg-red-50/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-red-600" />
            <CardTitle>Automated Compliance Watch</CardTitle>
        </div>
        <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50">Live SIA Database</Badge>
      </div>
    </CardHeader>
    <CardContent className="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-6">Staff Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Expiry</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {DEMO_DATA.staff.map((staff) => (
            <TableRow key={staff.id} className={staff.status === 'Expired' ? 'bg-red-50' : ''}>
              <TableCell className="pl-6 font-medium">{staff.staff_name}</TableCell>
              <TableCell>{staff.role}</TableCell>
              <TableCell>
                {staff.status === 'Expired' ? (
                  <Badge variant="destructive" className="flex w-fit items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Expired
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 flex w-fit items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> Active
                  </Badge>
                )}
              </TableCell>
              <TableCell className={staff.status === 'Expired' ? 'text-red-600 font-bold' : 'text-slate-600'}>
                {staff.expiry}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="p-4 bg-slate-50 border-t flex justify-between items-center">
        <span className="text-xs text-muted-foreground">Last scanned: 2 mins ago</span>
        <Button size="sm" variant="destructive" className="shadow-sm">
           Auto-Request Updates (1)
        </Button>
      </div>
    </CardContent>
  </Card>
);

const DemoFinancials = () => (
  <Card className="shadow-md border-t-4 border-t-emerald-500 bg-white">
    <CardHeader>
      <div className="flex justify-between items-center">
        <CardTitle className="text-emerald-800 flex items-center gap-2">
          <CreditCard className="h-5 w-5" /> Auto-Invoicing
        </CardTitle>
        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200">
          Ready to Export
        </Badge>
      </div>
      <CardDescription>Convert approved timesheets to Proformas instantly.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex justify-between items-center p-4 bg-slate-50 rounded border border-slate-200">
        <div className="text-sm">
          <p className="font-bold text-slate-800">Wembley Stadium - Eras Tour</p>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
             <Users className="h-3 w-3"/> 150 Staff • <Calendar className="h-3 w-3"/> 12/08/2024
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold text-xl text-slate-900">£18,450.00</p>
          <span className="text-[10px] text-green-600 font-bold uppercase tracking-wider flex items-center justify-end gap-1">
             <CheckSquare className="h-3 w-3"/> Timesheets Approved
          </span>
        </div>
      </div>
      <div className="flex gap-2">
        <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
          <FileText className="mr-2 h-4 w-4" /> Generate Invoice PDF
        </Button>
      </div>
    </CardContent>
  </Card>
);

const DemoCommunication = () => (
  <Card className="shadow-md border-blue-200 bg-white">
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-blue-700">
        <MessageSquare className="h-5 w-5" /> Smart Comms Hub
      </CardTitle>
      <CardDescription>Multi-channel broadcasting</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
        <div className="flex justify-between mb-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Audience</span>
          <Badge variant="secondary" className="bg-slate-200 text-slate-700">45 Providers (Wembley)</Badge>
        </div>
        <div className="bg-white border border-slate-200 p-3 rounded text-sm text-slate-800 mb-3 shadow-sm italic">
          "URGENT: Gate 4 access code has changed to 4455. Please update your teams immediately."
        </div>
        <div className="flex gap-2 mt-3">
           <Badge variant="outline" className="bg-white text-xs border-green-200 text-green-700"><CheckCircle className="h-3 w-3 mr-1 text-green-500"/> Email Sent</Badge>
           <Badge variant="outline" className="bg-white text-xs border-green-200 text-green-700"><CheckCircle className="h-3 w-3 mr-1 text-green-500"/> SMS Sent</Badge>
           <Badge variant="outline" className="bg-white text-xs border-green-200 text-green-700"><CheckCircle className="h-3 w-3 mr-1 text-green-500"/> Push Notif</Badge>
        </div>
      </div>
      <Button variant="outline" className="w-full border-blue-200 text-blue-600 hover:bg-blue-50">
          <Send className="h-4 w-4 mr-2" /> Send New Broadcast
      </Button>
    </CardContent>
  </Card>
);

const DemoProviderMobile = () => (
  <div className="w-[280px] h-[520px] bg-slate-900 rounded-[3rem] border-[8px] border-slate-800 overflow-hidden relative shadow-2xl mx-auto ring-4 ring-slate-200/50">
    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-xl z-20"></div>
    
    {/* Screen Content */}
    <div className="w-full h-full bg-slate-50 flex flex-col pt-10 px-4 pb-4 font-sans">
       {/* App Header */}
       <div className="flex justify-between items-center mb-6">
          <div className="font-bold text-slate-800 text-lg">Hello, John 👋</div>
          <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">JD</div>
       </div>

       {/* Next Shift Card */}
       <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg mb-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-20">
              <MapPin className="h-12 w-12" />
          </div>
          <div className="text-[10px] font-bold opacity-80 mb-1 tracking-widest">NEXT SHIFT • TODAY</div>
          <div className="font-bold text-lg leading-tight mb-1">Wembley Stadium</div>
          <div className="text-sm opacity-90 mb-4 font-light">18:00 - 23:00</div>
          <Button size="sm" variant="secondary" className="w-full text-blue-700 font-bold bg-white h-8 text-xs shadow-sm">
             GPS Check-In
          </Button>
       </div>

       {/* Tasks */}
       <div className="space-y-3">
          <div className="flex justify-between items-center">
             <span className="font-bold text-slate-700 text-xs uppercase tracking-wider">Action Required</span>
             <Badge className="h-5 text-[10px] bg-orange-500">1</Badge>
          </div>
          
          <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
             <div className="h-10 w-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-600 shrink-0">
                <FileText className="h-5 w-5" />
             </div>
             <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-slate-800 truncate">Sign Briefing</div>
                <div className="text-[10px] text-slate-500 truncate">Event Safety Plan v2.pdf</div>
             </div>
             <ChevronRight className="h-4 w-4 text-slate-300" />
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 opacity-60">
             <div className="h-10 w-10 bg-green-50 rounded-full flex items-center justify-center text-green-600 shrink-0">
                <CheckSquare className="h-5 w-5" />
             </div>
             <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-slate-800 truncate">Vetting Complete</div>
                <div className="text-[10px] text-slate-500 truncate">All documents approved</div>
             </div>
             <CheckCircle className="h-4 w-4 text-green-500" />
          </div>
       </div>
       
       {/* Bottom Nav */}
       <div className="mt-auto bg-white border-t border-slate-100 pt-3 pb-1 flex justify-around text-slate-400">
           <div className="flex flex-col items-center gap-1 text-blue-600"><LayoutDashboard className="h-5 w-5" /><span className="text-[9px] font-bold">Home</span></div>
           <div className="flex flex-col items-center gap-1 hover:text-slate-600"><Calendar className="h-5 w-5" /><span className="text-[9px]">Rota</span></div>
           <div className="flex flex-col items-center gap-1 hover:text-slate-600"><Wallet className="h-5 w-5" /><span className="text-[9px]">Pay</span></div>
       </div>
    </div>
  </div>
)

const DemoOpsBot = () => (
  <Card className="w-full border-blue-200 shadow-lg overflow-hidden">
    <CardHeader className="bg-blue-600 text-white pb-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <CardTitle className="text-sm font-medium">KSS Ops Bot (RAG)</CardTitle>
        </div>
        <Badge className="bg-blue-500 hover:bg-blue-500 text-white border-none">Beta</Badge>
      </div>
      <CardDescription className="text-blue-100">Instant answers from your briefing documents.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4 pt-6 bg-slate-50 min-h-[300px]">
      <div className="flex justify-end">
        <div className="bg-blue-600 text-white px-4 py-2 rounded-2xl rounded-tr-sm text-sm shadow-sm max-w-[80%]">
          What is the uniform policy for the VIP area?
        </div>
      </div>
      
      <div className="flex justify-start">
        <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-sm text-sm text-slate-800 shadow-sm max-w-[90%] space-y-3">
          <p className="font-medium text-slate-900">Based on "Briefing_Pack_V2.pdf":</p>
          <p>For the VIP Hospitality suite, all staff must wear:</p>
          <ul className="list-disc pl-4 space-y-1 text-slate-600">
            <li>Black suit (jacket required)</li>
            <li>White collared shirt (ironed)</li>
            <li>Black tie (provided on arrival)</li>
          </ul>
          
          <div className="pt-2 border-t border-slate-100 flex gap-2">
             <Badge variant="secondary" className="text-[10px] h-5 bg-slate-100"><FileText className="h-3 w-3 mr-1"/> Briefing_Pack_V2.pdf</Badge>
             <Badge variant="secondary" className="text-[10px] h-5 bg-slate-100"><FileText className="h-3 w-3 mr-1"/> Client_Email_Oct12.msg</Badge>
          </div>
        </div>
      </div>
    </CardContent>
    <CardFooter className="bg-white border-t p-3">
        <div className="w-full relative flex gap-2">
            <div className="relative flex-1">
                <input type="text" placeholder="Ask a follow up..." className="w-full text-sm p-2 pl-3 border rounded-full bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <Button size="icon" className="rounded-full bg-blue-600 hover:bg-blue-700 h-9 w-9"><ArrowRight className="h-4 w-4" /></Button>
        </div>
    </CardFooter>
  </Card>
);

// --- SLIDE RENDERER ---

export default function PitchDeck() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    // SLIDE 1: INTRO
    {
      id: 'intro',
      render: () => (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100 via-white to-white -z-10 opacity-60"></div>
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="mx-auto w-24 h-24 bg-slate-900 rounded-2xl flex items-center justify-center shadow-2xl mb-8">
                <ShieldCheck className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight">
              KSS Intelligence <span className="text-blue-600">Platform</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-500 font-light max-w-2xl mx-auto">
              The future of operational staffing, compliance, and risk management.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12"
          >
            <Card className="border-blue-100 bg-blue-50/50">
                <CardContent className="pt-6 flex flex-col items-center gap-3">
                    <ShieldCheck className="h-8 w-8 text-blue-600" />
                    <h3 className="font-bold text-blue-900">Protection</h3>
                    <p className="text-sm text-blue-700">Automated Compliance</p>
                </CardContent>
            </Card>
            <Card className="border-green-100 bg-green-50/50">
                <CardContent className="pt-6 flex flex-col items-center gap-3">
                    <Zap className="h-8 w-8 text-green-600" />
                    <h3 className="font-bold text-green-900">Productivity</h3>
                    <p className="text-sm text-green-700">Streamlined Ops</p>
                </CardContent>
            </Card>
            <Card className="border-purple-100 bg-purple-50/50">
                <CardContent className="pt-6 flex flex-col items-center gap-3">
                    <Target className="h-8 w-8 text-purple-600" />
                    <h3 className="font-bold text-purple-900">Prediction</h3>
                    <p className="text-sm text-purple-700">AI Risk Analysis</p>
                </CardContent>
            </Card>
          </motion.div>
        </div>
      )
    },

    // SLIDE 2: THE DASHBOARD
    {
      id: 'dashboard',
      title: "The Command Center",
      subtitle: "Moving from spreadsheets to a real-time operational pulse.",
      render: () => (
        <div className="grid grid-cols-12 gap-6 h-full items-center">
          <div className="col-span-12 md:col-span-3 space-y-4">
             <DemoDashboardWidget title="Active Events" value="12" icon={Calendar} trend="+2" trendUp={true} />
             <DemoDashboardWidget title="Staff Deployed" value="145" icon={Users} trend="+12%" trendUp={true} />
             <DemoDashboardWidget title="Pending Invoices" value="£12.4k" icon={Wallet} trend="+5%" trendUp={true} />
             <DemoDashboardWidget title="Compliance Alerts" value="1" icon={AlertTriangle} trend="-5" trendUp={false} />
          </div>
          
          <div className="col-span-12 md:col-span-9 h-full">
            <Card className="h-full bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
               <LayoutDashboard className="h-16 w-16 mb-4 opacity-20" />
               <p className="font-medium">Interactive Map & Rota Visualization</p>
               <p className="text-sm mt-2 opacity-60">Managers get a 'God View' of all operations.</p>
            </Card>
          </div>
        </div>
      )
    },

    // SLIDE 3: PREDICTION (AI RISKS)
    {
      id: 'prediction-risk',
      title: "Intelligent Risk Detection",
      subtitle: "The system doesn't just store data; it predicts failure points.",
      render: () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center h-full px-8">
          <motion.div 
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
             <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Pattern Recognition</Badge>
             </div>
             <h3 className="text-2xl font-bold text-slate-800">The "Lazy Booker" Agent</h3>
             <p className="text-slate-600 leading-relaxed">
                We identify providers who habitually wait until the last minute. This predicts under-staffing risks days before the event happens.
             </p>
             <div className="pt-4 transform hover:scale-105 transition-transform duration-300">
                <DemoLazyBooking />
             </div>
          </motion.div>
          
          <motion.div 
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
             <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Conflict Logic</Badge>
             </div>
             <h3 className="text-2xl font-bold text-slate-800">Double Booking Prevention</h3>
             <p className="text-slate-600 leading-relaxed">
                Our system acts as a central authority, physically preventing staff from accepting conflicting shifts across different providers.
             </p>
             <div className="pt-4 transform hover:scale-105 transition-transform duration-300">
                <DemoDoubleBooking />
             </div>
          </motion.div>
        </div>
      )
    },

    // SLIDE 4: PREDICTION (WEATHER)
    {
      id: 'prediction-weather',
      title: "Context-Aware Logistics",
      subtitle: "Integrating external factors into operational planning.",
      render: () => (
        <div className="flex flex-col md:flex-row gap-12 items-center justify-center h-full px-8">
          <div className="w-full md:w-1/2">
               <motion.div
                 initial={{ scale: 0.8, rotate: -5, opacity: 0 }}
                 animate={{ scale: 1, rotate: 0, opacity: 1 }}
                 transition={{ type: "spring", stiffness: 100 }}
               >
                 <DemoWeatherWidget />
               </motion.div>
          </div>
          <div className="w-full md:w-1/2 space-y-6">
              <div className="space-y-4">
                  <h3 className="text-3xl font-bold flex items-center gap-3 text-slate-900">
                      <Zap className="h-8 w-8 text-yellow-500 fill-yellow-500" /> 
                      Dynamic Staffing
                  </h3>
                  <p className="text-lg text-slate-600 leading-relaxed">
                      The system doesn't just display weather; it <strong>calculates the impact</strong>.
                  </p>
                  <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                      <p className="text-blue-800 italic">
                          "By analyzing historical data, we know that heavy rain increases no-show rates by 15% for outdoor events. The AI automatically adjusts the staffing buffer."
                      </p>
                  </div>
                  <ul className="space-y-3 pt-4">
                      <li className="flex items-center gap-3 text-slate-700">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span>Reduces on-site shortages</span>
                      </li>
                      <li className="flex items-center gap-3 text-slate-700">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span>Automatic client notifications</span>
                      </li>
                  </ul>
              </div>
          </div>
        </div>
      )
    },

    // SLIDE 5: PROTECTION (COMPLIANCE)
    {
      id: 'protection',
      title: "Automated Protection",
      subtitle: "Your digital fortress against non-compliance.",
      render: () => (
        <div className="flex flex-col h-full gap-8 px-8 justify-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-2">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                    >
                        <DemoCompliance />
                    </motion.div>
                </div>
                <div className="col-span-1 space-y-6 flex flex-col justify-center">
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-slate-900">Real-time SIA Check</h3>
                        <p className="text-slate-600 text-sm">
                            We don't trust uploaded PDFs. We verify directly against the SIA database API every 24 hours.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-slate-900">Right-to-Work</h3>
                        <p className="text-slate-600 text-sm">
                            Expired visas or documents trigger an immediate "Block" status on the scheduling engine.
                        </p>
                    </div>
                    <Button variant="outline" className="w-fit gap-2">
                        <ShieldCheck className="h-4 w-4" /> View Audit Logs
                    </Button>
                </div>
            </div>
        </div>
      )
    },

    // SLIDE 6: ADMIN EFFICIENCY (FINANCE + COMMS)
    {
      id: 'admin-efficiency',
      title: "Admin Efficiency",
      subtitle: "Closing the loop: From instant communication to automated invoicing.",
      render: () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center h-full px-8">
          <motion.div 
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
             <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
               <Wallet className="h-5 w-5 text-emerald-600" /> Financial Workflow
             </h3>
             <DemoFinancials />
             <p className="text-slate-600 text-sm mt-4">
                Approved timesheets are automatically converted into proforma invoices based on stored rate cards, eliminating manual errors.
             </p>
          </motion.div>
          
          <motion.div 
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
             <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
               <MessageSquare className="h-5 w-5 text-blue-600" /> Communication Hub
             </h3>
             <DemoCommunication />
             <p className="text-slate-600 text-sm mt-4">
                Send bulk broadcasts via Push, Email, and SMS simultaneously. Filter by event, location, or role.
             </p>
          </motion.div>
        </div>
      )
    },

    // SLIDE 7: PROVIDER EXPERIENCE
    {
      id: 'provider-experience',
      title: "The Provider Experience",
      subtitle: "A seamless mobile app for staff on the ground.",
      render: () => (
        <div className="flex items-center justify-center h-full px-8 gap-12">
            <div className="w-1/2 space-y-6">
                <h3 className="text-3xl font-bold text-slate-900">Pocket-Sized Operations</h3>
                <ul className="space-y-6">
                    <li className="flex gap-4">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                            <MapPin className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800">GPS Check-In</h4>
                            <p className="text-slate-600 text-sm">Staff can only check in when geofenced within 500m of the venue.</p>
                        </div>
                    </li>
                    <li className="flex gap-4">
                        <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800">Digital Briefings</h4>
                            <p className="text-slate-600 text-sm">Mandatory reading of safety docs before shift acceptance is allowed.</p>
                        </div>
                    </li>
                    <li className="flex gap-4">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                            <Wallet className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800">Live Pay Tracking</h4>
                            <p className="text-slate-600 text-sm">Providers see exactly what they've earned as soon as timesheets are approved.</p>
                        </div>
                    </li>
                </ul>
            </div>
            <div className="w-1/2 flex justify-center">
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 50, delay: 0.2 }}
                >
                    <DemoProviderMobile />
                </motion.div>
            </div>
        </div>
      )
    },

    // SLIDE 8: PROVIDER 360
    {
      id: 'provider-scorecard',
      title: "360° Provider Intelligence",
      subtitle: "Managing relationships with data, not just intuition.",
      render: () => (
        <div className="flex items-center justify-center h-full px-8">
            <div className="w-full max-w-4xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-6">
                        <h3 className="text-3xl font-bold text-slate-900">The Scorecard</h3>
                        <p className="text-lg text-slate-600">
                            Every provider is ranked on:
                        </p>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm border">
                                <span className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">1</span>
                                <span className="font-medium text-slate-700">Reliability (Attendance)</span>
                            </li>
                            <li className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm border">
                                <span className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">2</span>
                                <span className="font-medium text-slate-700">Admin Speed (Uploads)</span>
                            </li>
                            <li className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm border">
                                <span className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold">3</span>
                                <span className="font-medium text-slate-700">Engagement (Sentiment)</span>
                            </li>
                        </ul>
                    </div>
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <DemoProviderScorecard />
                    </motion.div>
                </div>
            </div>
        </div>
      )
    },

    // SLIDE 9: OPS BOT
    {
      id: 'future',
      title: "The Future: Ops Bot",
      subtitle: "Chat with your data. Instant answers for busy managers.",
      render: () => (
        <div className="flex flex-col items-center justify-center h-full gap-8">
             <motion.div 
                className="w-full max-w-lg"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
             >
                <DemoOpsBot />
             </motion.div>
             <p className="text-center text-slate-500 max-w-md">
                 Using RAG (Retrieval-Augmented Generation), managers can query specific event briefing packs instantly.
             </p>
        </div>
      )
    }
  ];

  // KEYBOARD NAVIGATION
  const handleNext = useCallback(() => {
    setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1));
  }, [slides.length]);

  const handlePrev = useCallback(() => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* HEADER */}
      <div className="h-16 border-b bg-white flex items-center justify-between px-6 z-10 relative shadow-sm">
         <div className="flex items-center gap-2">
            <div className="bg-slate-900 text-white p-1 rounded font-bold text-xs tracking-widest">KSS</div>
            <span className="font-semibold text-slate-700">Supplier Intelligence Platform</span>
         </div>
         <div className="flex items-center gap-4 text-sm text-slate-500">
            <span>{currentSlide + 1} / {slides.length}</span>
         </div>
      </div>

      {/* SLIDE CONTENT AREA */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-slate-100/50">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full max-w-7xl mx-auto p-8 flex flex-col"
          >
            {/* Slide Title (Except for Intro) */}
            {currentSlide !== 0 && (
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-slate-900">{slides[currentSlide].title}</h2>
                    <p className="text-xl text-slate-500 mt-2 font-light">{slides[currentSlide].subtitle}</p>
                </div>
            )}
            
            {/* Render Slide Content */}
            <div className="flex-1">
                {slides[currentSlide].render()}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* FOOTER CONTROLS */}
      <div className="h-20 bg-white border-t flex items-center justify-between px-8 z-10">
         <Button variant="ghost" onClick={handlePrev} disabled={currentSlide === 0} className="gap-2">
            <ChevronLeft className="h-4 w-4" /> Previous
         </Button>
         
         <div className="flex gap-2">
            {slides.map((_, idx) => (
                <div 
                    key={idx} 
                    className={`h-2 w-2 rounded-full transition-colors ${idx === currentSlide ? 'bg-blue-600' : 'bg-slate-200'}`}
                />
            ))}
         </div>

         <Button onClick={handleNext} disabled={currentSlide === slides.length - 1} className="gap-2 bg-slate-900 hover:bg-slate-800 text-white">
            Next <ChevronRight className="h-4 w-4" />
         </Button>
      </div>
    </div>
  );
}