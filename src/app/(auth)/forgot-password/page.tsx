import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { Card, CardContent } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  return (
    <Card>
      <CardContent className="pt-6">
        <ForgotPasswordForm />
      </CardContent>
    </Card>
  );
}
