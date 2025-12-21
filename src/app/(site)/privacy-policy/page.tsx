import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Privacy Policy | Homely",
};

export default function Page() {
    return (
        <section>
            <div className="relative w-full flex justify-center pt-20">
                <div className="container relative z-10">
                    <div className='flex flex-col gap-5'>
                        <h1 className='md:text-6xl text-4xl font-medium text-center'>
                            Privacy Policy
                        </h1>
                        <div className="p-8">
                            <p className="text-dark/70 dark:text-white/50">
                                This Privacy Statement explains how Personal Information about our (potential) customers and other individuals using our services is collected, used and disclosed by Getnextjstemplates and its respective affiliates ("us", "we", "our" or "Getnextjstemplates"). This Privacy Statement describes our privacy practices in relation to the use of our websites (including any customer portal or interactive customer website) (
                                <Link href="https://getnextjstemplates.com/" className="hover:text-primary">https://getnextjstemplates.com/</Link>), our software (Getnextjstemplates), services, solutions, tools, and related applications, services, and programs, including research and marketing activities, offered by us (the "Services"), as well as your choices regarding use, access, storage and correction of Personal Information. It also describes how we collect, use, disclose and otherwise process Personal Information collected in relation to our Services and otherwise in the course of our business activities.</p>

                            <p className="text-dark/70 dark:text-white/50">By signing up to our Services and by agreeing to our General Terms and Conditions required to use certain of our Services, you agree to the collection, usage, storage and disclosure of information described in this Privacy Statement.</p>

                            <p className="text-dark/70 dark:text-white/50">Our Services may contain links to other websites or services; and information practices and/or the content of such other websites or services shall be governed by the privacy statements of such other websites or services.</p>

                            <p className="text-dark/70 dark:text-white/50">We may change this Privacy Statement from time to time. If we make changes, we will notify you by revising the date at the top of the statement and providing you with additional notifications of such (such as adding a statement to our homepage, in our Getnextjstemplates Preview app or sending you a notification). We encourage you to review the Privacy Statement whenever you use our Services to stay informed about our information practices and the ways you can help protect your privacy.</p>

                            <div className="my-6">
                                <h4 className="font-semibold">Personal information collection </h4>
                                <p className="mt-6 text-dark/70 dark:text-white/50">
                                    While using our Services, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you. For example, we collect information when you create an account, request customer support or otherwise communicate with us. The types of information we may collect include basic user information (such as your name, email address, social media avatar, telephone number and photograph), company information and any other information you choose to provide.
                                </p>

                                <p className="mt-6 text-dark/70 dark:text-white/50">
                                    We will not collect financial information from you (such as your payment card number, expiration date or security code). All payments to us are handled via a third party, Getnextjstemplates
                                    <Link href="https://getnextjstemplates.com/" className="hover:text-primary">(https://getnextjstemplates.com/)</Link>. We refer to their Privacy Statement <Link href="https://getnextjstemplates.com/" className="hover:text-primary">(https://getnextjstemplates.com/)</Link>.
                                </p>

                            </div>
                            <div className="my-6">
                                <h4 className="font-semibold">Personal information you provide to us</h4>
                                <p className="mt-6 text-dark/70 dark:text-white/50">
                                    While using our Services, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you. For example, we collect information when you create an account, request customer support or otherwise communicate with us. The types of information we may collect include basic user information (such as your name, email address, social media avatar, telephone number and photograph), company information and any other information you choose to provide.
                                </p>
                                <p className="mt-6 text-dark/70 dark:text-white/50">
                                    We will not collect financial information from you (such as your payment card number, expiration date or security code). All payments to us are handled via a getnextjstemplates{" "}
                                    <Link href="https://getnextjstemplates.com" className="hover:text-primary">(https://getnextjstemplates.com)</Link>. We refer to their Privacy Statement <Link href="https://getnextjstemplates.com" className="hover:text-primary">https://getnextjstemplates.com/</Link>.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section >
    );
};
