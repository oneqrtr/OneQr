'use client';

import { useParams } from 'next/navigation';
import { MenuContent } from '@/app/menu/[slug]/page';

export default function RestoranMenuPage() {
    const params = useParams();
    const slug = params?.slug as string;
    return <MenuContent slug={slug} restaurantMode />;
}
