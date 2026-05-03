import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollText } from "lucide-react";

export default function TermsPage() {
  const sections = [
    { title: "1. Membership", text: "Membership in the La Marea Pickleball Association (LAMPA) is open to all registered homeowners of La Marea subdivision. Each homeowner must maintain their own individual account." },
    { title: "2. Monthly Dues", text: "Members are required to pay monthly dues at the start of each month. Payment must be verified by an administrator before game registration is enabled. Proof of payment must be submitted monthly." },
    { title: "3. Game Registration", text: "Daily game registration is limited to 24 players on a first-come, first-served basis. Players may register until 7:30 PM and may cancel their registration until 7:00 PM on the same day. Failure to show without cancelling will be recorded as a no-show." },
    { title: "4. Waitlist", text: "When all 24 slots are filled, additional registrants will be placed on a waitlist. If a registered player cancels, the first person on the waitlist will automatically be promoted to the player list." },
    { title: "5. Waiver", text: "By registering, members acknowledge and accept the inherent risks associated with playing pickleball. LAMPA and La Marea homeowners association shall not be held liable for any injuries sustained during play." },
    { title: "6. Code of Conduct", text: "Members are expected to maintain sportsmanship and respect for fellow players, facilities, and the community. Violation of community rules may result in suspension of membership privileges." },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <ScrollText className="h-5 w-5" />
          </div>
          <CardTitle>Terms & Conditions</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {sections.map((s, i) => (
            <div key={i}>
              {i > 0 && <Separator className="mb-4" />}
              <h3 className="font-semibold text-sm mb-1.5">{s.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
