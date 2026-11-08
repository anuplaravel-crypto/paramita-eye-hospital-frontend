// Demo data; replace it with API calls as the endpoints are implemented.

export const gradients = [
  'linear-gradient(135deg,#6366f1,#8b5cf6)',
  'linear-gradient(135deg,#06b6d4,#3b82f6)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#10b981,#06b6d4)',
  'linear-gradient(135deg,#ec4899,#8b5cf6)',
  'linear-gradient(135deg,#f43f5e,#f59e0b)',
  'linear-gradient(135deg,#8b5cf6,#6366f1)',
  'linear-gradient(135deg,#0ea5e9,#22d3ee)',
]

export function initials(name) {
  return name
    .replace(/^(Dr\.|Mr\.|Mrs\.|Ms\.)\s*/i, '')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function grad(name) {
  const sum = [...name].reduce((a, c) => a + c.charCodeAt(0), 0)
  return gradients[sum % gradients.length]
}

export const stats = [
  { label: 'Total Patients', value: '1,248', trend: '+12.4%', up: true, note: 'vs last month', tone: 'indigo', icon: 'users' },
  { label: "Today's Appointments", value: '32', trend: '+8.1%', up: true, note: '6 pending', tone: 'cyan', icon: 'calendar' },
  { label: 'Active Doctors', value: '18', trend: '+2 new', up: true, note: '24 total staff', tone: 'emerald', icon: 'stethoscope' },
  { label: "Today's Revenue", value: 'BDT 86,400', trend: '+4.6%', up: true, note: 'vs yesterday', tone: 'amber', icon: 'revenue' },
]

export const appointments = [
  { token: 'T-01', patient: 'Sample Patient 01', age: 54, doctor: 'Dr. Sample 1', dept: 'Cataract', date: '03 Nov 2026', time: '10:30 AM', fee: 800, status: 'confirmed' },
  { token: 'T-02', patient: 'Sample Patient 02', age: 62, doctor: 'Dr. Sample 2', dept: 'Glaucoma', date: '03 Nov 2026', time: '11:15 AM', fee: 700, status: 'pending' },
  { token: 'T-03', patient: 'Sample Patient 03', age: 8, doctor: 'Dr. Sample 5', dept: 'Pediatric', date: '03 Nov 2026', time: '12:00 PM', fee: 650, status: 'confirmed' },
  { token: 'T-04', patient: 'Sample Patient 04', age: 71, doctor: 'Dr. Sample 3', dept: 'Retina', date: '03 Nov 2026', time: '01:30 PM', fee: 900, status: 'pending' },
  { token: 'T-05', patient: 'Sample Patient 05', age: 39, doctor: 'Dr. Sample 4', dept: 'Cornea', date: '03 Nov 2026', time: '02:15 PM', fee: 750, status: 'completed' },
  { token: 'T-06', patient: 'Sample Patient 06', age: 45, doctor: 'Dr. Sample 1', dept: 'Cataract', date: '03 Nov 2026', time: '03:00 PM', fee: 800, status: 'cancelled' },
  { token: 'T-07', patient: 'Sample Patient 07', age: 58, doctor: 'Dr. Sample 6', dept: 'Neuro-Ophthalmology', date: '04 Nov 2026', time: '10:00 AM', fee: 850, status: 'confirmed' },
  { token: 'T-08', patient: 'Sample Patient 08', age: 27, doctor: 'Dr. Sample 2', dept: 'Glaucoma', date: '04 Nov 2026', time: '11:45 AM', fee: 700, status: 'pending' },
]

export const doctors = [
  { name: 'Dr. Sample 1', spec: 'Cataract & Refractive Surgery', qual: 'MBBS, FCPS (Ophthalmology)', fee: 800, schedule: 'Sat–Thu · 10 AM–4 PM', patients: 142, status: 'active' },
  { name: 'Dr. Sample 2', spec: 'Glaucoma Specialist', qual: 'MBBS, MS (Ophthalmology)', fee: 700, schedule: 'Sat–Thu · 11 AM–5 PM', patients: 128, status: 'active' },
  { name: 'Dr. Sample 3', spec: 'Retina & Vitreous', qual: 'MBBS, FCPS, FICO', fee: 900, schedule: 'Sun–Thu · 9 AM–2 PM', patients: 96, status: 'active' },
  { name: 'Dr. Sample 4', spec: 'Cornea & External Disease', qual: 'MBBS, MS (Ophthalmology)', fee: 750, schedule: 'Sat–Wed · 2 PM–8 PM', patients: 87, status: 'active' },
  { name: 'Dr. Sample 5', spec: 'Pediatric Ophthalmology', qual: 'MBBS, DCH, FCPS', fee: 650, schedule: 'Sat–Thu · 10 AM–3 PM', patients: 74, status: 'active' },
  { name: 'Dr. Sample 6', spec: 'Neuro-Ophthalmology', qual: 'MBBS, MD (Ophthalmology)', fee: 850, schedule: 'Sun–Thu · 12 PM–6 PM', patients: 61, status: 'on-leave' },
]

export const staff = [
  { name: 'Sample Staff 1', designation: 'Receptionist', dept: 'Front Desk', phone: '0000000000', joined: '12 Mar 2024', status: 'active' },
  { name: 'Sample Staff 2', designation: 'Senior Nurse', dept: 'OPD', phone: '0000000000', joined: '05 Jan 2023', status: 'active' },
  { name: 'Sample Staff 3', designation: 'Lab Technician', dept: 'Diagnostic', phone: '0000000000', joined: '20 Jul 2024', status: 'active' },
  { name: 'Sample Staff 4', designation: 'Appointment Coordinator', dept: 'OPD', phone: '0000000000', joined: '02 Sep 2025', status: 'active' },
  { name: 'Sample Staff 5', designation: 'Security Supervisor', dept: 'Administration', phone: '0000000000', joined: '18 Nov 2022', status: 'inactive' },
]

export const patients = [
  { id: 'DEMO-1001', name: 'Sample Patient 01', gender: 'Female', age: 58, blood: 'B+', phone: '0000000000', lastVisit: '02 Nov 2026', visits: 14 },
  { id: 'DEMO-1002', name: 'Sample Patient 02', gender: 'Male', age: 45, blood: 'A+', phone: '0000000000', lastVisit: '01 Nov 2026', visits: 9 },
  { id: 'DEMO-1003', name: 'Sample Patient 03', gender: 'Female', age: 67, blood: 'O+', phone: '0000000000', lastVisit: '28 Oct 2026', visits: 21 },
  { id: 'DEMO-1004', name: 'Sample Patient 04', gender: 'Male', age: 32, blood: 'AB+', phone: '0000000000', lastVisit: '25 Oct 2026', visits: 5 },
  { id: 'DEMO-1005', name: 'Sample Patient 05', gender: 'Female', age: 29, blood: 'B-', phone: '0000000000', lastVisit: '21 Oct 2026', visits: 3 },
  { id: 'DEMO-1006', name: 'Sample Patient 06', gender: 'Male', age: 74, blood: 'A-', phone: '0000000000', lastVisit: '18 Oct 2026', visits: 17 },
]

export const departments = [
  { name: 'Cataract Surgery', value: 35, count: 128 },
  { name: 'Glaucoma', value: 22, count: 80 },
  { name: 'Retina & Vitreous', value: 18, count: 66 },
  { name: 'Cornea', value: 14, count: 51 },
  { name: 'Pediatric Eye', value: 11, count: 40 },
]

export const weeklyAppointments = [
  { day: 'Sat', value: 42 },
  { day: 'Sun', value: 58 },
  { day: 'Mon', value: 51 },
  { day: 'Tue', value: 70 },
  { day: 'Wed', value: 64 },
  { day: 'Thu', value: 47 },
  { day: 'Fri', value: 26 },
]
