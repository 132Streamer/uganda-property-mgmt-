'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RentDueCard } from '@/components/tenant/rent-due-card'
import { PaymentHistoryCard } from '@/components/tenant/payment-history-card'
import { MaintenanceRequestForm } from '@/components/tenant/maintenance-request-form'
import { LeaseDocumentCard } from '@/components/tenant/lease-document-card'
import { AlertCircle, MapPin, User, Calendar, Phone } from 'lucide-react'
import Link from 'next/link'

// Mock data - Replace with real data from Supabase
const mockPayments = [
  {
    id: '1',
    date: '2024-05-20',
    amount: 1500000,
    status: 'paid' as const,
    method: 'MTN Mobile Money'
  },
  {
    id: '2',
    date: '2024-04-20',
    amount: 1500000,
    status: 'paid' as const,
    method: 'Airtel Money'
  },
  {
    id: '3',
    date: '2024-03-20',
    amount: 1500000,
    status: 'paid' as const,
    method: 'Bank Transfer'
  },
]

const mockOpenRequests = [
  {
    id: '1',
    issue: 'Leaking bathroom faucet',
    status: 'pending',
    submittedDate: '2024-05-18'
  },
  {
    id: '2',
    issue: 'Bedroom light switch not working',
    status: 'in_progress',
    submittedDate: '2024-05-15'
  }
]

export default function TenantPortal() {
  const propertyAddress = 'Tower Road, Kampala'
  const landlordName = 'John Mutua'
  const landlordPhone = '+256 701 234567'
  const rentalAmount = 1500000 // UGX
  const leaseExpiryDate = '2025-01-14'
  const currentRentStatus = 'pending' // pending, overdue, paid
  const openRequestsCount = mockOpenRequests.length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Your Rental Portal</h1>
        <p className="text-muted-foreground mt-2">
          Manage your rent payments, maintenance requests, and lease details
        </p>
      </div>

      {/* Property & Landlord Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Your Property
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="text-lg font-semibold text-foreground">{propertyAddress}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Monthly Rent</p>
              <p className="text-lg font-semibold text-foreground">
                {(rentalAmount / 1000000).toFixed(1)}M UGX
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Lease Expires</p>
              <p className="text-lg font-semibold text-foreground">{leaseExpiryDate}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Your Landlord
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="text-lg font-semibold text-foreground">{landlordName}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Contact</p>
              <p className="text-lg font-semibold text-foreground font-mono">{landlordPhone}</p>
            </div>
            <Button variant="outline" className="w-full flex items-center justify-center gap-2 mt-2">
              <Phone className="w-4 h-4" />
              <Link href="/tenant/messages">Send Message</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Open Requests</p>
              <p className="text-3xl font-bold text-foreground">{openRequestsCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Maintenance pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Last Payment</p>
              <p className="text-3xl font-bold text-foreground">1.5M</p>
              <p className="text-xs text-muted-foreground mt-1">May 20, 2024</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Lease Status</p>
              <Badge className="mt-2 bg-green-100 text-green-800">Active</Badge>
              <p className="text-xs text-muted-foreground mt-2">8 months remaining</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Left Column - Rent & Payments */}
        <div className="lg:col-span-1 space-y-6">
          <RentDueCard
            rentAmount={rentalAmount}
            dueDate="1st of every month"
            currency="UGX"
            status={currentRentStatus as any}
          />

          <LeaseDocumentCard
            documentName="Lease Agreement - Tower Road"
            uploadDate="2024-01-14"
            expiryDate={leaseExpiryDate}
            onDownload={() => {
              // Handle download
              console.log('Downloading lease document...')
            }}
          />
        </div>

        {/* Middle Column - Payment History & Maintenance */}
        <div className="lg:col-span-2 space-y-6">
          <PaymentHistoryCard
            payments={mockPayments}
            currency="UGX"
          />

          <MaintenanceRequestForm
            propertyAddress={propertyAddress}
            onSubmit={(data) => {
              console.log('Maintenance request submitted:', data)
            }}
          />
        </div>
      </div>

      {/* Open Maintenance Requests */}
      {openRequestsCount > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Open Maintenance Requests ({openRequestsCount})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockOpenRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{request.issue}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Submitted: {request.submittedDate}
                      </p>
                    </div>
                    <Badge
                      className={
                        request.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }
                    >
                      {request.status === 'pending' ? 'Pending' : 'In Progress'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Important Notice */}
      <Card className="border-l-4 border-l-blue-500 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            Important Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-foreground">
          <p>
            • Rent is due on the <strong>1st of every month</strong> at the address: {propertyAddress}
          </p>
          <p>
            • You can pay rent using <strong>MTN Mobile Money, Airtel Money, or Bank Transfer</strong>
          </p>
          <p>
            • For urgent maintenance issues outside business hours, please call your landlord directly
          </p>
          <p>
            • Your lease agreement is valid until <strong>{leaseExpiryDate}</strong>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

