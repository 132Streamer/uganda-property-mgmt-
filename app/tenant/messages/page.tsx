import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function TenantMessagesPage() {
  const messages = [
    {
      id: 1,
      sender: 'Landlord',
      content: 'Hi Jane, just checking in about the property. How is everything?',
      date: '2024-01-15',
      senderType: 'other',
    },
    {
      id: 2,
      sender: 'You',
      content: 'Everything is great! No issues so far.',
      date: '2024-01-15',
      senderType: 'self',
    },
    {
      id: 3,
      sender: 'Landlord',
      content: 'Excellent! Let me know if you need anything.',
      date: '2024-01-15',
      senderType: 'other',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Messages</h1>
        <p className="text-muted-foreground mt-1">Communicate with your landlord</p>
      </div>

      <Card className="flex flex-col h-[500px]">
        <CardHeader>
          <CardTitle>Chat with Landlord</CardTitle>
          <CardDescription>John Property Owner</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.senderType === 'self' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs px-4 py-2 rounded-lg ${
                message.senderType === 'self'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              }`}>
                <p className="text-sm">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">{message.date}</p>
              </div>
            </div>
          ))}
        </CardContent>
        <div className="border-t border-border p-4 space-y-2">
          <Input placeholder="Type your message..." />
          <Button className="w-full">Send</Button>
        </div>
      </Card>
    </div>
  )
}
