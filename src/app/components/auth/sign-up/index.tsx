"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SocialSignUp from "../SocialSignUp";
import { useState } from "react";
import Logo from "../../layout/header/brand-logo/Logo";
import { validateEmail, validateName, validatePassword } from "@/lib/validation";

const SignUp = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Validate on change
    setErrors((prev) => ({
      ...prev,
      [name]:
        name === "name"
          ? validateName(value)
          : name === "email"
            ? validateEmail(value)
            : validatePassword(value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate all fields before submitting
    const nameError = validateName(formData.name);
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);

    setErrors({ name: nameError, email: emailError, password: passwordError });
    if (nameError || emailError || passwordError) {
      return;
    }
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      localStorage.setItem("user", JSON.stringify({ user: formData.name }));
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

      <SocialSignUp />

      <span className="z-1 relative my-8 block text-center">
        <span className="-z-1 absolute left-0 top-1/2 block h-px w-full bg-black/10 dark:bg-white/20"></span>
        <span className="text-body-secondary relative z-10 inline-block bg-white px-3 text-base dark:bg-black">
          OR
        </span>
      </span>

      <form onSubmit={handleSubmit}>
        <div className="mb-[22px]">
          <input
            type="text"
            placeholder="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full rounded-2xl border placeholder:text-gray-400 border-black/10 dark:border-white/20 border-solid bg-transparent px-5 py-3 text-base text-dark outline-none transition  focus:border-primary focus-visible:shadow-none dark:border-border_color dark:text-white dark:focus:border-primary
              ${errors.name ? 'border-red-500 dark:border-red-500' : 'border-stroke'}`}
          />
          {errors.name && <p className="text-red-500 dark:text-red-500  mt-1">{errors.name}</p>}
        </div>
        <div className="mb-[22px]">
          <input
            type="email"
            placeholder="Email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full rounded-2xl border placeholder:text-gray-400 border-black/10 dark:border-white/20 border-solid bg-transparent px-5 py-3 text-base text-dark outline-none transition  focus:border-primary focus-visible:shadow-none dark:border-border_color dark:text-white dark:focus:border-primary
              ${errors.email ? 'border-red-500 dark:border-red-500' : 'border-stroke'}`}
          />
          {errors.email && <p className="text-red-500 dark:text-red-500  mt-1">{errors.email}</p>}
        </div>
        <div className="mb-[22px]">
          <input
            type="password"
            placeholder="Password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`w-full rounded-2xl border placeholder:text-gray-400 border-black/10 dark:border-white/20 border-solid bg-transparent px-5 py-3 text-base text-dark outline-none transition  focus:border-primary focus-visible:shadow-none dark:border-border_color dark:text-white dark:focus:border-primary
              ${errors.password ? 'border-red-500 dark:border-red-500' : 'border-stroke'}`}
          />
          {errors.password && <p className="text-red-500 dark:text-red-500  mt-1">{errors.password}</p>}
        </div>
        <div className="mb-9">
          <button
            type="submit"
            className="flex w-full cursor-pointer items-center justify-center rounded-2xl border border-primary bg-primary hover:bg-transparent hover:text-primary px-5 py-3 text-base text-white transition duration-300 ease-in-out "
          >
            Sign Up
          </button>
        </div>
      </form>

      <p className="text-center mb-4 text-base">
        By creating an account you are agree with our{" "}
        <Link href="/privacy-policy" className="text-primary hover:underline">
          Privacy
        </Link>{" "}
        and{" "}
        <Link href="/privacy-policy" className="text-primary hover:underline">
          Policy
        </Link>
      </p>

      <p className="text-center text-base">
        Already have an account?
        <Link
          href="/signin"
          className="pl-2 text-primary hover:bg-darkprimary hover:underline"
        >
          Sign In
        </Link>
      </p>
    </>
  );
};

export default SignUp;
