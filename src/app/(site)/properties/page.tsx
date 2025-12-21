import { Metadata } from "next";
import PropertiesListing from "@/app/components/properties/property-list";
import { Suspense } from "react";
export const metadata: Metadata = {
    title: "Property List | Homely",
};

const page = () => {
    return (
        <>
            <Suspense fallback={<div>Loading...</div>}>
                <PropertiesListing />
            </Suspense>
        </>
    );
};

export default page;
