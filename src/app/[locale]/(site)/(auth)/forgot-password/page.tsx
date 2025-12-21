import ForgotPasword from "@/app/components/auth/forgot-password";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password | Homely",
};

const ForgotPasswordPage = () => {
  return (
    <>
        <ForgotPasword/>
    </>
  );
};

export default ForgotPasswordPage;
