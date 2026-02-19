import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { insertVenueSchema } from "@shared/schema";
import type { InsertVenue, Venue } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Checkbox } from "@/components/ui/checkbox";

const sportsOptions = [
    { id: "cricket", label: "Cricket" },
    { id: "football", label: "Football" },
    { id: "volleyball", label: "Volleyball" },
    { id: "tennis", label: "Tennis" },
    { id: "kabaddi", label: "Kabaddi" },
];

interface VenueFormProps {
    onSuccess?: (venue: Venue) => void;
    onCancel?: () => void;
    initialData?: Venue;
}

export default function VenueForm({ onSuccess, onCancel, initialData }: VenueFormProps) {
    const { toast } = useToast();

    const form = useForm<InsertVenue>({
        resolver: zodResolver(insertVenueSchema),
        defaultValues: initialData ? {
            name: initialData.name,
            description: initialData.description,
            address: initialData.address,
            city: initialData.city,
            state: initialData.state,
            latitude: initialData.latitude,
            longitude: initialData.longitude,
            sports: initialData.sports,
            pricePerHour: initialData.pricePerHour,
            facilities: initialData.facilities,
            images: initialData.images,
            timing: initialData.timing || "",
            phoneNumber: initialData.phoneNumber || "",
            ownerEmail: initialData.ownerEmail || "",
            ownerId: initialData.ownerId,
        } : {
            name: "",
            description: "",
            address: "",
            city: "",
            state: "",
            latitude: "",
            longitude: "",
            sports: ["cricket"],
            pricePerHour: "500",
            facilities: [],
            images: [],
            timing: "",
            phoneNumber: "",
            ownerEmail: "",
            ownerId: "temp-id", // Will be replaced by server with actual user ID
        },
    });

    const mutation = useMutation({
        mutationFn: async (data: InsertVenue): Promise<Venue> => {
            const method = initialData ? 'PUT' : 'POST';
            const url = initialData ? `/api/venues/${initialData.id}` : '/api/venues';
            const response = await apiRequest(method, url, data);
            return response.json();
        },
        onSuccess: (venue) => {
            queryClient.invalidateQueries({ queryKey: ["/api/venues"] });
            toast({
                title: initialData ? "Venue updated" : "Venue posted",
                description: `${venue.name} has been ${initialData ? "updated" : "posted"} successfully.`,
            });
            if (onSuccess) onSuccess(venue);
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message || "Something went wrong. Please try again.",
                variant: "destructive",
            });
        },
    });

    const onSubmit = (data: InsertVenue) => {
        mutation.mutate(data);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Ground Name *</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., Lords Cricket Ground" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="timing"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Timing</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., 6:00 AM - 10:00 PM" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormDescription>Opening hours or specific timings</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Describe the ground facilities, surface, etc." {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                            <FormItem className="md:col-span-1">
                                <FormLabel>Address *</FormLabel>
                                <FormControl>
                                    <Input placeholder="Street address" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>City *</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., Mumbai" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>State *</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., Maharashtra" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="pricePerHour"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Price Per Hour (₹) *</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormItem>
                        <FormLabel>Sports Available *</FormLabel>
                        <div className="flex flex-wrap gap-4 mt-2">
                            {sportsOptions.map((sport) => (
                                <FormField
                                    key={sport.id}
                                    control={form.control}
                                    name="sports"
                                    render={({ field }) => {
                                        return (
                                            <FormItem
                                                key={sport.id}
                                                className="flex flex-row items-center space-x-2 space-y-0"
                                            >
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value?.includes(sport.id)}
                                                        onCheckedChange={(checked) => {
                                                            return checked
                                                                ? field.onChange([...field.value, sport.id])
                                                                : field.onChange(
                                                                    field.value?.filter(
                                                                        (value) => value !== sport.id
                                                                    )
                                                                );
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormLabel className="font-normal text-sm">
                                                    {sport.label}
                                                </FormLabel>
                                            </FormItem>
                                        );
                                    }}
                                />
                            ))}
                        </div>
                    </FormItem>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="images"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Ground Photo *</FormLabel>
                                <FormControl>
                                    <div className="flex flex-col gap-2">
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const formData = new FormData();
                                                    formData.append('photo', file);

                                                    try {
                                                        const response = await fetch('/api/upload', {
                                                            method: 'POST',
                                                            body: formData,
                                                        });

                                                        if (!response.ok) throw new Error('Upload failed');
                                                        const data = await response.json();
                                                        field.onChange([data.url]);
                                                    } catch (error) {
                                                        console.error('Upload error:', error);
                                                        toast({
                                                            title: "Upload failed",
                                                            description: "Could not upload image to Cloudinary.",
                                                            variant: "destructive",
                                                        });
                                                    }
                                                }
                                            }}
                                        />
                                        {field.value?.[0] && (
                                            <div className="relative w-full h-32 overflow-hidden rounded-md border">
                                                <img
                                                    src={field.value[0]}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute top-1 right-1 h-6 w-6"
                                                    onClick={() => field.onChange([])}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </FormControl>
                                <FormDescription>Upload a clear photo of the ground</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="googleMapsUrl"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Google Maps Link</FormLabel>
                                <FormControl>
                                    <Input placeholder="https://goo.gl/maps/..." {...field} value={field.value || ""} />
                                </FormControl>
                                <FormDescription>Link to the location on Google Maps</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="phoneNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Contact Phone Number</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., 9876543210" type="tel" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormDescription>Phone number for booking enquiries</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="ownerEmail"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Owner Email Address</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., owner@example.com" type="email" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormDescription>Email for receiving booking details</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    {onCancel && (
                        <Button type="button" variant="outline" onClick={onCancel}>
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                        </Button>
                    )}
                    <Button type="submit" disabled={mutation.isPending}>
                        {mutation.isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                {initialData ? "Updating..." : "Posting..."}
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                {initialData ? "Update Venue" : "Post Venue"}
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
