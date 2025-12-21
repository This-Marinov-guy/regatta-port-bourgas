"use client";
import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import PropertyCard from "../../home/properties/card/Card";
import HeroSub from "../../shared/hero-sub";

const PropertiesListing: React.FC = () => {
  const [propertyHomes, setPropertyHomes] = useState<any[]>([]);
  const searchParams = useSearchParams();

  const categoryParam = searchParams.get("category");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/property-data');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setPropertyHomes(data?.propertyHomes || []);
      } catch (error) {
        console.error('Error fetching properties:', error);
      }
    };
    fetchData();
  }, []);

  const filteredProperties = useMemo(() => {
    if (!categoryParam) return propertyHomes;
    return propertyHomes.filter(
      (property: any) =>
        property?.category?.toLowerCase() === categoryParam.toLowerCase()
    );
  }, [propertyHomes, categoryParam]);

  const formatCategory = (text: string) => {
    return text
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };


  return (
    <>
      <HeroSub
        title={categoryParam ? formatCategory(categoryParam) : "Discover inspiring designed homes."}
        description="Experience elegance and comfort with our exclusive luxury villas, designed for sophisticated living."
        badge="Properties"
      />
      <section className='pt-0!'>
        <div className='container max-w-8xl mx-auto px-5 2xl:px-0'>
          <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10'>
            {filteredProperties.map((item: any, index: number) => (
              <div key={index}>
                <PropertyCard item={item} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default PropertiesListing;
