import { RegisterForm } from "@/components/auth/register-form";
import { Card, CardContent } from "@/components/ui/card";

export default function RegisterPage() {
  return (
    <Card>
      <CardContent className="pt-6">
        <RegisterForm />
      </CardContent>
    </Card>
  );
}
