import Details from "@/app/components/properties/property-detail";
import { Metadata } from "next";
export const metadata: Metadata = {
    title: "Property detail | Homely",
};

const page = () => {
    return (
        <>
            <Details/>
        </>
    );
};

export default page;
