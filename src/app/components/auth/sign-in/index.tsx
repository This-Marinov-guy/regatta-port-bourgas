"use client";
import Link from "next/link";
import { useState } from "react";
import SocialSignIn from "../SocialSignIn";
import  { Toaster } from 'react-hot-toast';
import Logo from "../../layout/header/brand-logo/Logo";
import { useRouter } from "next/navigation";
import { validateEmail, validatePassword } from "@/lib/validation";

const Signin = () => {
  const router = useRouter();
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  }); 

  const [validationErrors, setValidationErrors] = useState({
    email: "",
    password: "",
  }); 

  const validateForm = () => {
  const emailError = validateEmail(loginData.email);
  const passwordError = validatePassword(loginData.password);

  setValidationErrors({
    email: emailError,
    password: passwordError,
  });

  return !emailError && !passwordError;
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      localStorage.setItem("user", JSON.stringify({ user: loginData.email }));
      router.push("/");
    } catch (error) {
    } finally {
    }
  };

  return (
    <>
      <div className="mb-10 text-center flex justify-center">
        <Logo />
      </div>

      <SocialSignIn />

      <span className="z-1 relative my-8 block text-center">
        <span className="-z-1 absolute left-0 top-1/2 block h-px w-full bg-black/10 dark:bg-white/20"></span>
        <span className="text-body-secondary relative z-10 inline-block bg-white px-3 text-base dark:bg-black">
          OR
        </span>
        <Toaster />
      </span>

      <form onSubmit={handleSubmit}>
        <div className="mb-[22px]">
          <input
            type="email"
            placeholder="Email"
            onChange={(e) =>
              setLoginData({ ...loginData, email: e.target.value })
            }
            className={`w-full rounded-2xl border placeholder:text-gray-400 border-black/10 dark:border-white/20 border-solid bg-transparent px-5 py-3 text-base text-dark outline-none transition  focus:border-primary focus-visible:shadow-none dark:border-border_color dark:text-white dark:focus:border-primary
              ${validationErrors.email ? 'border-red-500' : 'border-black/10'}`}
          />
          {validationErrors.email && (<p className="text-red-500 dark:text-red-500 text-sm mt-1">{validationErrors.email}</p>)}
        </div>
        <div className="mb-[22px]">
          <input
            type="password"
            placeholder="Password"
            onChange={(e) =>
              setLoginData({ ...loginData, password: e.target.value })
            }
            className={`w-full rounded-2xl border border-black/10 dark:border-white/20 border-solid bg-transparent px-5 py-3 text-base text-dark outline-none transition  focus:border-primary focus-visible:shadow-none dark:border-border_color dark:text-white dark:focus:border-primary
              ${validationErrors.password ? 'border-red-500' : 'border-black/10'}`}
          />
          {validationErrors.password && (<p className="text-red-500 text-sm mt-1">{validationErrors.password}</p>)}
        </div>
        <div className="mb-9">
          <button
            type="submit"
            className="flex w-full cursor-pointer items-center justify-center rounded-2xl border border-primary bg-primary hover:bg-transparent hover:text-primary px-5 py-3 text-base text-white transition duration-300 ease-in-out "
          >
            Sign In
          </button>

        </div>
      </form>

      <div className="text-center">
        <Link
          href="/forgot-password"
          className="mb-2 text-base text-dark hover:text-primary dark:text-white dark:hover:text-primary"
        >
          Forget Password?
        </Link>
      </div>
      <p className="text-body-secondary text-base text-center">
        Not a member yet?{" "}
        <Link href="/signup" className="text-primary hover:underline">
          Sign Up
        </Link>
      </p>
    </>
  );
};

export default Signin;