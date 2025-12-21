
import BlogList from "@/app/components/blog";
import HeroSub from "@/app/components/shared/hero-sub";
import { Metadata } from "next";

export const metadata: Metadata = {
    title:
        "Blog Grids | Homely ",
};

const Blog = () => {
    return (
        <>
            <HeroSub
                title="Real estate insights."
                description="Stay ahead in the property market with expert advice and updates."
                badge="Blog"
            />
            <BlogList />
        </>
    );
};

export default Blog;
