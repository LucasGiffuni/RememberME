import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0f172a]">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-[#1e293b] border-[#334155]",
            headerTitle: "text-white",
            headerSubtitle: "text-[#94a3b8]",
            formFieldLabel: "text-[#94a3b8]",
            formFieldInput: "bg-[#334155] border-[#475569] text-white",
            footerActionLink: "text-[#818cf8]",
            formButtonPrimary: "bg-[#6366f1] hover:bg-[#818cf8]",
          },
        }}
      />
    </div>
  );
}
