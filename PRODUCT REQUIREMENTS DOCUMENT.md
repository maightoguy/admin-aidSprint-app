PRODUCT REQUIREMENTS DOCUMENT (PRD)
Emergency Help On-Demand App

Executive Summary
Is an on-demand emergency help marketplace platform designed to connect users with qualified contractors within minutes during urgent situations.
The app allows skilled providers(contractors) such as locksmiths, plumbers, electricians, PSWs, cleaners to register, upload document/certifications, get approval/decline, view available emergency jobs(if approved) or reapply(if declined), get paid after completing jobs; similar to how Uber connect drivers to riders. Users select urgency tiers and are matched to nearby contractors based on availability, service skill, and response time.
It will focus on speed ,location-based matching, transparent pricing, and verified contractors. The business model is a commission-based platform (25–40% revenue cut) combined with urgency-tiered pricing to ensure profitability and contractor incentives.

Goals & Objectives
Automate commission-based calculation and payouts.
Create a seamless onboarding experience for contractors
Ensure secure uploading and verification of contractor’s document/certifications

Provide under 15–60-minute response times through contractor
matching.
Create a platform that users trust for urgent, time-sensitive problems.

Target Users Primary Users
Homeowners needing immediate help (senior care, lockouts, power issues, cleaning, etc.)
Renters facing urgent maintenance problems.
Airbnb & property managers needing next or same-day fixes.
Secondary Users
Contractors (plumbers, locksmiths, cleaners, electricians, PSWs etc.)
Admins (for approvals, document verification, payouts, customer support etc.)

Features & Functionality (MVP)
User App Features Emergency Request Flow
Sign up/login with phone number, email or google
Choose service category
Select urgency tier (Standard, Urgent, Emergency, Premium)

Add description + photos/videos
User sees estimated price upfront
User confirms and submits request
Nearby contractors receives request
First contractor to accept gets the job
User sees contractor details + live tracking
Contractor arrives and start the job
Completion confirmation
User pays in-app
Rating & reviews
Customer support chat

Contractor App Features
Sign up with phone number/email
Contractor onboarding & verification
Upload documents (license, ID, certifications)
Status toggle (Available / Busy / Offline) like Uber, only receive jobs when online.
Accept/decline jobs within 10 seconds
Live navigation (Google Maps API)

Mark “Arrived”
Mark “job started”
Mark “completed”
Payment triggered automatically
Earnings dashboard
Job history
Tier-based incentives
Chat with customer/support

Admin Dashboard (Web Portal)
Manage users & contractors
Contractor verification & approvals
Edit service categories
Edit tier pricing
Job monitoring (every job in real-time)
Automatic fraud detection
Track low-rated contractors
Financial payouts & reports
Support tickets & disputes
View contractor performance/suspend or restore accounts

Push notification management
Promo code creation

Dashboards
User Dashboard
“Request service” center
Track active service
View job history
Payment info
Saved addresses
Notifications
Contractor Dashboard
Online/offline
Job queue
Monthly/daily earnings
Job acceptance rate
Reviews & ratings
Certification status
Active jobs
Admin Dashboard

Total jobs today/job tracking
Jobs by category
Average response time
Active contractors/user analytics
Heatmaps
Total revenue
Outstanding disputes
Customer satisfaction rating

Design Requirements Design Style
Clean, fast, emergency-focus
Red/blue/black color palette
High contrast for urgent scenarios
Large call-to-action buttons
Minimal text
Predictable navigation
UX Priorities
User must request help within 20 seconds
Contractor must reach job flow within 10 seconds

UI must feel "urgent but calm"
Accessibility
Large fonts
High-contrast colors
Voice assistance for emergency screens
Simple icons for categories

Success Metrics Core KPIs
Time to match contractor: Target < 2 minutes
Response time: < 30–60 minutes
Job completion rate: 90%+
Contractor acceptance rate: 70%+
Customer satisfaction: 4.5/5+
Retention rate: 30% returning users

Risks & Mitigation
Risk Impact Mitigation
Not enough High Offer bonuses + fast payouts

Risk Impact Mitigation
contractors

Slow response time High
Tier surge pricing + contractor activation bonus

Payment disputes Medium
Require photos, chat logs, pre-approval price

Safety issues High ID verification + background checks Low user trust Medium 100% refund guarantee

Technical failure High
Use battle-tested frameworks (Stripe, Firebase)

User Stories Document User Stories – Customers
“As a user, I want to signup/login so I can request emergency help quickly so I can solve urgent problems fast.”
“As a user, I want to track contractors live so I know when they’re arriving.”
“As a user, I want clear pricing so I’m not surprised.”
“As a user, I want to rate services so I can help others trust providers.”
User Stories – Contractors

“As a contractor, I want to sign up with my contact details so I can
access the platform and start earning.”
“As a contractor, I want to upload my documents so I can get approved to view jobs.”
“As a contractor, I want to get notified of urgent jobs and pick jobs that fit my schedule and distance so I can work flexibly.”
“As a contractor, I want to see payout amounts clearly so I know what I earn.”
“As a contractor, I want navigation built-in so I can get to jobs faster.”
User Stories – Admin
“As an Admin, I want to login to a secure web dashboard so I can manage the system.”
“As an admin, I want to approve contractors so the platform stays safe.”
“As an admin, I want to track every job so I can resolve issues.”
“As an admin, I want analytics so I understand performance.”

Cross-Platform Requirements Web landing page
Mobile App

iOS (React Native)
Android (React Native)
Web Admin Panel
Responsive admin dashboard
Accessible from browser
Cloud
Firebase/Supabase
Stripe Connect for payouts

Notification System User Notifications
Job confirmation
Contractor en route
Contractor arrival
Job completion
Payment processed
Promo codes
Contractor Notifications
New job request
Job accepted

User cancellation
Bonus incentives
Payout notifications
Admin Notifications
New contractor application
Dispute raised
System downtime alerts

Technical Requirements Document Architecture
Mobile: Flutter (IOS, Android)
Backend: Node.js
Frontend: Flutter/React
Database: Firebase/Supabase
Hosting: AWS or Vercel
Authentication: Firebase Auth
Chat: Firebase Chat
Maps: Google Maps API
Payment: Stripe Connect
System Requirements

Handle 5,000 concurrent users
Load times under 3 seconds
Latency under 200ms
APIs Needed
Authentication API
Contractor job matching API
Payment API
Notification API
Live tracking API
Ratings & reviews API
Security
Encrypted data
Secure payment tokens
Two-factor authentication for admin
Encrypted chat logs

Deployment Strategy Stages
Local development
Staging environment

QA testing (7 days)
Beta release (50 selected users)
Production release
Performance monitoring
Weekly updates
App Store Deployment
iOS App Store
Google Play Store

Timeline (MVP ~ Estimated) Week Deliverable
Week 1 Wireframes + UI Design Week 2–3 User app development
Week 3–4 Contractor app development Week 4–5 Admin dashboard
Week 6 Payments + notifications Week 7 QA testing
Week 8 Deployment + launch
