export type EventStatus = "live" | "draft" | "ended" | "scheduled"
export type PaymentStatus = "paid" | "pending" | "failed" | "review"
export type CheckinStatus = "valid" | "checked-in" | "invalid"

export type EventRow = {
  id: string
  name: string
  banner: string
  category: string
  date: string
  venue: string
  ticketsSold: number
  capacity: number
  revenue: number
  status: EventStatus
}

export const events: EventRow[] = [
  {
    id: "evt_001",
    name: "TechCrunch Disrupt 2026",
    banner: "/event-tech-conference-stage.png",
    category: "Conference",
    date: "Mar 14, 2026",
    venue: "Moscone Center, San Francisco",
    ticketsSold: 1842,
    capacity: 2000,
    revenue: 412800,
    status: "live",
  },
  {
    id: "evt_002",
    name: "Sunset Rooftop Sessions",
    banner: "/rooftop-music-party-sunset.png",
    category: "Music",
    date: "Apr 02, 2026",
    venue: "The Edge, New York",
    ticketsSold: 540,
    capacity: 600,
    revenue: 86400,
    status: "live",
  },
  {
    id: "evt_003",
    name: "Founders Brunch & Networking",
    banner: "/business-networking-brunch.png",
    category: "Networking",
    date: "Apr 18, 2026",
    venue: "Soho House, Los Angeles",
    ticketsSold: 128,
    capacity: 150,
    revenue: 19200,
    status: "scheduled",
  },
  {
    id: "evt_004",
    name: "Design Systems Workshop",
    banner: "/design-workshop-classroom.png",
    category: "Workshop",
    date: "May 09, 2026",
    venue: "Online",
    ticketsSold: 312,
    capacity: 500,
    revenue: 28080,
    status: "scheduled",
  },
  {
    id: "evt_005",
    name: "Indie Film Premiere Night",
    banner: "/film-premiere-red-carpet.png",
    category: "Film",
    date: "Feb 21, 2026",
    venue: "Castro Theatre, San Francisco",
    ticketsSold: 720,
    capacity: 720,
    revenue: 50400,
    status: "ended",
  },
  {
    id: "evt_006",
    name: "AI Builders Hackathon",
    banner: "/hackathon-coding-event.png",
    category: "Hackathon",
    date: "Jun 12, 2026",
    venue: "GitHub HQ, San Francisco",
    ticketsSold: 0,
    capacity: 400,
    revenue: 0,
    status: "draft",
  },
  {
    id: "evt_007",
    name: "Wellness & Yoga Retreat",
    banner: "/yoga-retreat-outdoor.png",
    category: "Wellness",
    date: "May 24, 2026",
    venue: "Topanga Canyon, LA",
    ticketsSold: 88,
    capacity: 120,
    revenue: 22000,
    status: "scheduled",
  },
  {
    id: "evt_008",
    name: "StartupGrind Global Meetup",
    banner: "/startup-meetup-crowd.png",
    category: "Networking",
    date: "Jul 03, 2026",
    venue: "Pier 27, San Francisco",
    ticketsSold: 410,
    capacity: 1000,
    revenue: 36900,
    status: "live",
  },
]

export type TicketTier = {
  id: string
  name: string
  price: number
  available: number
  sold: number
  perks: string[]
  accent: string
}

export const ticketTiers: TicketTier[] = [
  {
    id: "tier_vip",
    name: "VIP",
    price: 499,
    available: 200,
    sold: 168,
    perks: ["Front row seating", "Backstage access", "Welcome kit", "Lounge access"],
    accent: "primary",
  },
  {
    id: "tier_general",
    name: "General Admission",
    price: 149,
    available: 1500,
    sold: 1204,
    perks: ["Full event access", "Standard seating", "Event app"],
    accent: "sky",
  },
  {
    id: "tier_early",
    name: "Early Bird",
    price: 99,
    available: 300,
    sold: 300,
    perks: ["Full event access", "Limited release", "Event app"],
    accent: "emerald",
  },
  {
    id: "tier_student",
    name: "Student",
    price: 49,
    available: 250,
    sold: 170,
    perks: ["Valid student ID required", "Standard seating"],
    accent: "amber",
  },
]

export type Order = {
  id: string
  buyer: string
  email: string
  avatar: string
  ticket: string
  event: string
  quantity: number
  amount: number
  payment: PaymentStatus
  qr: CheckinStatus
  date: string
}

export const orders: Order[] = [
  {
    id: "ORD-7782",
    buyer: "Amara Okafor",
    email: "amara@gmail.com",
    avatar: "/avatar-woman-1.png",
    ticket: "VIP",
    event: "TechCrunch Disrupt 2026",
    quantity: 2,
    amount: 998,
    payment: "paid",
    qr: "valid",
    date: "Feb 10, 2026",
  },
  {
    id: "ORD-7781",
    buyer: "Liam Chen",
    email: "liam.chen@outlook.com",
    avatar: "/avatar-man-1.png",
    ticket: "General Admission",
    event: "Sunset Rooftop Sessions",
    quantity: 1,
    amount: 149,
    payment: "paid",
    qr: "checked-in",
    date: "Feb 10, 2026",
  },
  {
    id: "ORD-7780",
    buyer: "Sofia Rossi",
    email: "sofia.r@proton.me",
    avatar: "/avatar-woman-2.png",
    ticket: "Early Bird",
    event: "Design Systems Workshop",
    quantity: 3,
    amount: 297,
    payment: "pending",
    qr: "invalid",
    date: "Feb 09, 2026",
  },
  {
    id: "ORD-7779",
    buyer: "Marcus Bell",
    email: "marcusb@gmail.com",
    avatar: "/avatar-man-2.png",
    ticket: "VIP",
    event: "TechCrunch Disrupt 2026",
    quantity: 1,
    amount: 499,
    payment: "review",
    qr: "invalid",
    date: "Feb 09, 2026",
  },
  {
    id: "ORD-7778",
    buyer: "Priya Nair",
    email: "priya.nair@gmail.com",
    avatar: "/avatar-woman-3.png",
    ticket: "Student",
    event: "AI Builders Hackathon",
    quantity: 1,
    amount: 49,
    payment: "paid",
    qr: "valid",
    date: "Feb 08, 2026",
  },
  {
    id: "ORD-7777",
    buyer: "Noah Williams",
    email: "noah.w@gmail.com",
    avatar: "/avatar-man-3.png",
    ticket: "General Admission",
    event: "StartupGrind Global Meetup",
    quantity: 4,
    amount: 596,
    payment: "failed",
    qr: "invalid",
    date: "Feb 08, 2026",
  },
  {
    id: "ORD-7776",
    buyer: "Emma Johansson",
    email: "emma.j@gmail.com",
    avatar: "/avatar-woman-4.png",
    ticket: "VIP",
    event: "Indie Film Premiere Night",
    quantity: 2,
    amount: 998,
    payment: "paid",
    qr: "checked-in",
    date: "Feb 07, 2026",
  },
  {
    id: "ORD-7775",
    buyer: "Diego Martín",
    email: "diego.m@gmail.com",
    avatar: "/avatar-man-4.png",
    ticket: "Early Bird",
    event: "Founders Brunch & Networking",
    quantity: 1,
    amount: 99,
    payment: "review",
    qr: "invalid",
    date: "Feb 07, 2026",
  },
]

export type Payment = {
  id: string
  buyer: string
  email: string
  avatar: string
  amount: number
  method: string
  status: PaymentStatus
  event: string
  utr?: string
  date: string
}

export const payments: Payment[] = [
  {
    id: "PAY-9921",
    buyer: "Amara Okafor",
    email: "amara@gmail.com",
    avatar: "/avatar-woman-1.png",
    amount: 998,
    method: "Visa •••• 4242",
    status: "paid",
    event: "TechCrunch Disrupt 2026",
    date: "Feb 10, 2026",
  },
  {
    id: "PAY-9920",
    buyer: "Marcus Bell",
    email: "marcusb@gmail.com",
    avatar: "/avatar-man-2.png",
    amount: 499,
    method: "Bank Transfer (UPI)",
    status: "review",
    event: "TechCrunch Disrupt 2026",
    utr: "UTR4480921773",
    date: "Feb 09, 2026",
  },
  {
    id: "PAY-9919",
    buyer: "Sofia Rossi",
    email: "sofia.r@proton.me",
    avatar: "/avatar-woman-2.png",
    amount: 297,
    method: "PayPal",
    status: "pending",
    event: "Design Systems Workshop",
    date: "Feb 09, 2026",
  },
  {
    id: "PAY-9918",
    buyer: "Diego Martín",
    email: "diego.m@gmail.com",
    avatar: "/avatar-man-4.png",
    amount: 99,
    method: "Bank Transfer (UPI)",
    status: "review",
    event: "Founders Brunch & Networking",
    utr: "UTR7781204993",
    date: "Feb 07, 2026",
  },
  {
    id: "PAY-9917",
    buyer: "Noah Williams",
    email: "noah.w@gmail.com",
    avatar: "/avatar-man-3.png",
    amount: 596,
    method: "Mastercard •••• 8810",
    status: "failed",
    event: "StartupGrind Global Meetup",
    date: "Feb 08, 2026",
  },
  {
    id: "PAY-9916",
    buyer: "Emma Johansson",
    email: "emma.j@gmail.com",
    avatar: "/avatar-woman-4.png",
    amount: 998,
    method: "Visa •••• 1180",
    status: "paid",
    event: "Indie Film Premiere Night",
    date: "Feb 07, 2026",
  },
]

export type Activity = {
  id: string
  type: "sale" | "checkin" | "payout" | "event" | "refund"
  title: string
  meta: string
  time: string
  avatar?: string
}

export const recentActivity: Activity[] = [
  {
    id: "a1",
    type: "sale",
    title: "Amara Okafor bought 2 VIP tickets",
    meta: "TechCrunch Disrupt 2026 · $998",
    time: "2m ago",
    avatar: "/avatar-woman-1.png",
  },
  {
    id: "a2",
    type: "checkin",
    title: "Liam Chen checked in",
    meta: "Sunset Rooftop Sessions",
    time: "11m ago",
    avatar: "/avatar-man-1.png",
  },
  {
    id: "a3",
    type: "payout",
    title: "Payout of $12,400 initiated",
    meta: "To Chase •••• 2291",
    time: "1h ago",
  },
  {
    id: "a4",
    type: "event",
    title: "New event published",
    meta: "Wellness & Yoga Retreat",
    time: "3h ago",
  },
  {
    id: "a5",
    type: "refund",
    title: "Refund processed for Noah Williams",
    meta: "StartupGrind Global Meetup · $596",
    time: "5h ago",
    avatar: "/avatar-man-3.png",
  },
]

export const revenueChart = [
  { month: "Aug", revenue: 28400, target: 30000 },
  { month: "Sep", revenue: 41200, target: 35000 },
  { month: "Oct", revenue: 38900, target: 40000 },
  { month: "Nov", revenue: 56300, target: 48000 },
  { month: "Dec", revenue: 72100, target: 60000 },
  { month: "Jan", revenue: 68400, target: 68000 },
  { month: "Feb", revenue: 91200, target: 75000 },
]

export const ticketSalesChart = [
  { day: "Mon", vip: 24, general: 86, early: 42 },
  { day: "Tue", vip: 31, general: 102, early: 38 },
  { day: "Wed", vip: 28, general: 94, early: 51 },
  { day: "Thu", vip: 42, general: 128, early: 44 },
  { day: "Fri", vip: 56, general: 164, early: 62 },
  { day: "Sat", vip: 68, general: 198, early: 70 },
  { day: "Sun", vip: 44, general: 142, early: 48 },
]

export const checkinChart = [
  { hour: "9a", checkins: 42 },
  { hour: "10a", checkins: 128 },
  { hour: "11a", checkins: 214 },
  { hour: "12p", checkins: 186 },
  { hour: "1p", checkins: 96 },
  { hour: "2p", checkins: 142 },
  { hour: "3p", checkins: 168 },
  { hour: "4p", checkins: 88 },
]

export const topEvents = [
  { name: "TechCrunch Disrupt 2026", revenue: 412800, share: 100 },
  { name: "Sunset Rooftop Sessions", revenue: 86400, share: 21 },
  { name: "Indie Film Premiere Night", revenue: 50400, share: 12 },
  { name: "StartupGrind Global Meetup", revenue: 36900, share: 9 },
  { name: "Design Systems Workshop", revenue: 28080, share: 7 },
]

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value)
}
