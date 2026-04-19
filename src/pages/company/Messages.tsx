import { Card, CardContent } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";

export default function CompanyMessagesStatic() {
  return (
    <div className="h-[calc(100vh-8rem)] max-w-4xl mx-auto">
      <Card className="h-full flex flex-col">
        {/* Header */}
        <CardContent className="p-4 border-b">
          <h2 className="text-lg font-semibold text-zinc-900">
            Daksh Dharmani – Frontend Dashboard Project
          </h2>
          <Badge className="mt-1">Developer</Badge>
        </CardContent>

        {/* Messages */}
        <CardContent className="flex-1 overflow-y-auto space-y-4 p-6">
          <div className="flex justify-end">
            <div className="max-w-[70%] bg-zinc-900 text-white rounded-lg px-4 py-2 text-sm">
              Hello Daksh, thank you for applying to the Frontend Dashboard project.
              We have reviewed your submission.
              <div className="text-[11px] opacity-70 mt-1 text-right">10:15 AM</div>
            </div>
          </div>

          <div className="flex justify-start">
            <div className="max-w-[70%] bg-zinc-100 rounded-lg px-4 py-2 text-sm text-zinc-900">
              Good morning. Thank you for reviewing my application.
              I would be happy to clarify any details if required.
              <div className="text-[11px] text-zinc-500 mt-1">10:17 AM</div>
            </div>
          </div>

          <div className="flex justify-end">
            <div className="max-w-[70%] bg-zinc-900 text-white rounded-lg px-4 py-2 text-sm">
              Your experience with React and Tailwind stood out.
              Could you confirm your availability over the next two weeks?
              <div className="text-[11px] opacity-70 mt-1 text-right">10:20 AM</div>
            </div>
          </div>

          <div className="flex justify-start">
            <div className="max-w-[70%] bg-zinc-100 rounded-lg px-4 py-2 text-sm text-zinc-900">
              Yes, I am available for approximately 20–25 hours per week
              over the next two weeks.
              <div className="text-[11px] text-zinc-500 mt-1">10:22 AM</div>
            </div>
          </div>

          <div className="flex justify-end">
            <div className="max-w-[70%] bg-zinc-900 text-white rounded-lg px-4 py-2 text-sm">
              That works well for us. We will proceed with the next steps
              and update you shortly.
              <div className="text-[11px] opacity-70 mt-1 text-right">10:25 AM</div>
            </div>
          </div>
        </CardContent>

        {/* Footer */}
        <CardContent className="p-4 border-t text-sm text-zinc-500 italic">
          Conversation under review
        </CardContent>
      </Card>
    </div>
  );
}
