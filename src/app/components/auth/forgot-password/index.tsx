"use client";
import React, { useState } from "react";
import Logo from "../../layout/header/brand-logo/Logo";
import { validateEmail } from "@/lib/validation";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loader, setLoader] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailValidationMsg = validateEmail(email);
    if (emailValidationMsg) {
      setEmailError(emailValidationMsg);
      return;
    }

    setEmailError("");
    setLoader(true);

    setTimeout(() => {
      setLoader(false);
      setIsEmailSent(true);
    }, 2000);
  };

  return (
    <section>
      <div className="relative w-full pt-32 sm:pt-36 pb-16 sm:pb-28 flex items-center justify-center">
        <div className="container">
          <div className="-mx-4 flex flex-wrap">
            <div className="w-full px-4">
              <div className="p-16 container mx-auto max-w-540 rounded-2xl shadow-auth dark:shadow-dark-auth">

                <div className="mb-10 flex justify-center">
                  <Logo />
                </div>

                {isEmailSent ? (
                  <div className="flex flex-col items-center gap-2">
                    <h2 className="text-xl text-dark dark:text-white font-bold">
                      Forgot Your Password?
                    </h2>
                    <p className="text-dark/60 dark:text-white/60">
                      Please check your inbox for the new password.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="mb-5 text-left">
                      <input
                        type="email"
                        placeholder="Email"
                        name="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          validateEmail(e.target.value);
                        }}
                        className={`w-full rounded-2xl border placeholder:text-gray-400 border-black/10 dark:border-white/20 border-solid bg-transparent px-5 py-3 text-base text-dark outline-none transition  focus:border-primary focus-visible:shadow-none dark:border-border_color dark:text-white dark:focus:border-primary
                          ${emailError ? 'border-red-500 dark:border-red-500' : 'border-black/10'}`}
                      />
                      {emailError && (
                        <p className="text-red-500  mt-1">{emailError}</p>
                      )}
                    </div>
                    <div>
                      <button
                        type="submit"
                        className="flex w-full cursor-pointer items-center justify-center rounded-2xl border border-primary bg-primary hover:bg-transparent hover:text-primary px-5 py-3 text-base text-white transition duration-300 ease-in-out "
                        disabled={loader}
                      >
                        Send Email
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ForgotPassword;
