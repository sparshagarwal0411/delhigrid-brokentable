import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ComplaintCategory = 'Air' | 'Water' | 'Soil' | 'Transport' | 'Noise';

export interface Complaint {
    id: string;
    lat: number;
    lng: number;
    category: ComplaintCategory;
    status: 'Pending' | 'Resolved' | 'In Progress';
    description: string;
    ward_number: number;
}

// Helper: Generate Stable Mock Coordinates for Wards
// We use the same deterministic logic as in DelhiMap.tsx to ensure consistency
const getWardCoordinates = (id: number) => {
    const baseLat = 28.6139;
    const baseLng = 77.2090;
    // Deterministic offset based on ID
    const latOffset = (Math.sin(id * 12.9898) * 0.15);
    const lngOffset = (Math.cos(id * 78.233) * 0.18);
    return [baseLat + latOffset, baseLng + lngOffset] as [number, number];
};

const mapDbCategoryToUi = (dbCat: string): ComplaintCategory => {
    const cat = dbCat.toLowerCase();
    if (cat === 'air') return 'Air';
    if (cat === 'water') return 'Water';
    if (cat === 'soil' || cat === 'land') return 'Soil';
    if (cat === 'transport') return 'Transport';
    if (cat === 'noise') return 'Noise';
    return 'Air'; // Fallback
};

const mapDbStatusToUi = (dbStatus: string): 'Pending' | 'Resolved' | 'In Progress' => {
    if (dbStatus === 'pending' || dbStatus === 'received') return 'Pending';
    if (dbStatus === 'resolved') return 'Resolved';
    if (dbStatus === 'in_progress') return 'In Progress';
    return 'Pending';
};

export function useComplaints() {
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [wardAggregation, setWardAggregation] = useState<Record<number, number>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchComplaints = async () => {
        setIsLoading(true);
        try {
            const { data, error: fetchError } = await (supabase.from('complaints') as any)
                .select('*');

            if (fetchError) throw fetchError;

            const mappedComplaints: Complaint[] = (data || []).map((c: any) => {
                const coords = getWardCoordinates(c.ward_number);
                // Add a slight random jitter so markers in same ward don't overlap perfectly
                const jitter = 0.005;
                const lat = coords[0] + (Math.random() - 0.5) * jitter;
                const lng = coords[1] + (Math.random() - 0.5) * jitter;

                return {
                    id: c.id,
                    lat,
                    lng,
                    category: mapDbCategoryToUi(c.category),
                    status: mapDbStatusToUi(c.status),
                    description: c.description,
                    ward_number: c.ward_number
                };
            });

            // Aggregate by ward
            const aggregation: Record<number, number> = {};
            mappedComplaints.forEach(c => {
                aggregation[c.ward_number] = (aggregation[c.ward_number] || 0) + 1;
            });

            setComplaints(mappedComplaints);
            setWardAggregation(aggregation);
        } catch (err) {
            console.error('Error fetching complaints:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, []);

    return {
        complaints,
        wardAggregation,
        isLoading,
        error,
        refetch: fetchComplaints
    };
}
