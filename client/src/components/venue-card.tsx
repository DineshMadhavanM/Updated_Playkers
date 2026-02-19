import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Trash2, MapPin, Star, Play, Phone, Clock, CalendarCheck, Mail } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Venue } from "@shared/schema";

interface VenueCardProps {
  venue: Venue;
  isMatchCreationMode?: boolean;
  selectedTeamId?: string | null;
  onEdit?: (venue: Venue) => void;
  onDelete?: (venueId: string) => void;
}

interface BookingFormData {
  name: string;
  phoneNumber: string;
  email: string;
  place: string;
  timing: string;
}

export default function VenueCard({
  venue,
  isMatchCreationMode = false,
  selectedTeamId,
  onEdit,
  onDelete
}: VenueCardProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState<BookingFormData>({
    name: "",
    phoneNumber: "",
    email: "",
    place: "",
    timing: "",
  });
  const [formErrors, setFormErrors] = useState<Partial<BookingFormData>>({});

  const bookingMutation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      const response = await apiRequest("POST", "/api/bookings", {
        venueId: venue.id,
        bookerName: data.name,
        bookerPhone: data.phoneNumber,
        bookerEmail: data.email,
        bookerPlace: data.place,
        preferredTiming: data.timing,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString(),
        totalAmount: venue.pricePerHour,
        status: "pending",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({
        title: "Booking Request Sent! 🎉",
        description: `Your booking request for ${venue.name} has been submitted. The owner will contact you at ${bookingForm.phoneNumber}.`,
      });
      setIsBookingOpen(false);
      setBookingForm({ name: "", phoneNumber: "", email: "", place: "", timing: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Could not submit booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleStartMatch = () => {
    const params = new URLSearchParams();
    params.set('sport', 'cricket');
    params.set('venue', venue.id);
    if (selectedTeamId) {
      params.set('team', selectedTeamId);
    }
    navigate(`/create-match?${params.toString()}`);
  };

  const validateForm = (): boolean => {
    const errors: Partial<BookingFormData> = {};
    if (!bookingForm.name.trim()) errors.name = "Name is required";
    if (!bookingForm.phoneNumber.trim()) errors.phoneNumber = "Phone number is required";
    else if (!/^\d{10}$/.test(bookingForm.phoneNumber.replace(/\s/g, "")))
      errors.phoneNumber = "Enter a valid 10-digit phone number";
    if (!bookingForm.email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bookingForm.email))
      errors.email = "Enter a valid email address";
    if (!bookingForm.place.trim()) errors.place = "Place is required";
    if (!bookingForm.timing.trim()) errors.timing = "Preferred timing is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBookingSubmit = () => {
    if (validateForm()) {
      bookingMutation.mutate(bookingForm);
    }
  };

  return (
    <>
      <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow relative" data-testid={`card-venue-${venue.id}`}>
        {venue.images && venue.images.length > 0 && (
          <img
            src={venue.images[0]}
            alt={venue.name}
            className="w-full h-48 object-cover"
            data-testid={`img-venue-${venue.id}`}
          />
        )}

        {(onEdit || onDelete) && (
          <div className="absolute top-2 right-2 flex gap-2">
            {onEdit && (
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 bg-white/80 hover:bg-white"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(venue);
                }}
                data-testid={`button-edit-venue-${venue.id}`}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="destructive"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(venue.id);
                }}
                data-testid={`button-delete-venue-${venue.id}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl font-semibold" data-testid={`text-venue-name-${venue.id}`}>
              {venue.name}
            </h3>
            <div className="flex items-center text-sm text-muted-foreground">
              <Star className="h-4 w-4 text-yellow-400 mr-1 fill-yellow-400" />
              <span data-testid={`text-venue-rating-${venue.id}`}>
                {venue.rating ? Number(venue.rating).toFixed(1) : "0.0"}
              </span>
            </div>
          </div>

          <p className="text-muted-foreground mb-1 flex items-center" data-testid={`text-venue-address-${venue.id}`}>
            <MapPin className="h-4 w-4 mr-1" />
            {venue.city}, {venue.state}
          </p>

          {venue.timing && (
            <p className="text-muted-foreground mb-1 text-sm flex items-center" data-testid={`text-venue-timing-${venue.id}`}>
              <Clock className="h-3 w-3 mr-1" />
              <span className="font-medium mr-1">Timing:</span> {venue.timing}
            </p>
          )}

          {venue.phoneNumber && (
            <p className="text-muted-foreground mb-1 text-sm flex items-center">
              <Phone className="h-3 w-3 mr-1" />
              <span className="font-medium mr-1">Contact:</span> {venue.phoneNumber}
            </p>
          )}

          {venue.ownerEmail && (
            <p className="text-muted-foreground mb-2 text-sm flex items-center">
              <Mail className="h-3 w-3 mr-1" />
              <span className="font-medium mr-1">Email:</span> {venue.ownerEmail}
            </p>
          )}

          {venue.googleMapsUrl && (
            <div className="mb-4">
              <a
                href={venue.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
                data-testid={`link-google-maps-${venue.id}`}
              >
                <MapPin className="h-3 w-3" />
                View on Google Maps
              </a>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-4">
            {venue.sports.map((sport) => (
              <Badge key={sport} variant="secondary" data-testid={`badge-sport-${sport}`}>
                {sport}
              </Badge>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <div>
              <span className="text-lg font-bold text-primary" data-testid={`text-venue-price-${venue.id}`}>
                ₹{Number(venue.pricePerHour).toLocaleString()}
              </span>
              <span className="text-muted-foreground">/hour</span>
            </div>
            {isMatchCreationMode ? (
              <Button
                onClick={handleStartMatch}
                data-testid={`button-start-match-venue-${venue.id}`}
                className="flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                Start a Match
              </Button>
            ) : (
              <Button
                onClick={() => setIsBookingOpen(true)}
                data-testid={`button-book-venue-${venue.id}`}
                className="flex items-center gap-2"
              >
                <CalendarCheck className="h-4 w-4" />
                Book Now
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Book Now Dialog */}
      <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-primary" />
              Book {venue.name}
            </DialogTitle>
            <DialogDescription>
              Fill in your details to request a booking. The venue owner will contact you to confirm.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Venue Info Summary */}
            <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{venue.address}, {venue.city}, {venue.state}</span>
              </div>
              {venue.timing && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{venue.timing}</span>
                </div>
              )}
              <div className="font-semibold text-primary">
                ₹{Number(venue.pricePerHour).toLocaleString()}/hour
              </div>
            </div>

            {/* Booker Name */}
            <div className="space-y-1">
              <Label htmlFor="booker-name">Your Name *</Label>
              <Input
                id="booker-name"
                placeholder="Enter your full name"
                value={bookingForm.name}
                onChange={(e) => {
                  setBookingForm(prev => ({ ...prev, name: e.target.value }));
                  if (formErrors.name) setFormErrors(prev => ({ ...prev, name: "" }));
                }}
              />
              {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
            </div>

            {/* Phone Number */}
            <div className="space-y-1">
              <Label htmlFor="booker-phone">Phone Number *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="booker-phone"
                  placeholder="e.g., 9876543210"
                  type="tel"
                  className="pl-9"
                  value={bookingForm.phoneNumber}
                  onChange={(e) => {
                    setBookingForm(prev => ({ ...prev, phoneNumber: e.target.value }));
                    if (formErrors.phoneNumber) setFormErrors(prev => ({ ...prev, phoneNumber: "" }));
                  }}
                />
              </div>
              {formErrors.phoneNumber && <p className="text-xs text-destructive">{formErrors.phoneNumber}</p>}
            </div>

            {/* Email ID */}
            <div className="space-y-1">
              <Label htmlFor="booker-email">Email ID *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="booker-email"
                  placeholder="Enter your email address"
                  type="email"
                  className="pl-9"
                  value={bookingForm.email}
                  onChange={(e) => {
                    setBookingForm(prev => ({ ...prev, email: e.target.value }));
                    if (formErrors.email) setFormErrors(prev => ({ ...prev, email: "" }));
                  }}
                />
              </div>
              {formErrors.email && <p className="text-xs text-destructive">{formErrors.email}</p>}
            </div>

            {/* Place / Location */}
            <div className="space-y-1">
              <Label htmlFor="booker-place">Your Location / Place *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="booker-place"
                  placeholder="e.g., Coimbatore, Tamil Nadu"
                  className="pl-9"
                  value={bookingForm.place}
                  onChange={(e) => {
                    setBookingForm(prev => ({ ...prev, place: e.target.value }));
                    if (formErrors.place) setFormErrors(prev => ({ ...prev, place: "" }));
                  }}
                />
              </div>
              {formErrors.place && <p className="text-xs text-destructive">{formErrors.place}</p>}
            </div>

            {/* Preferred Timing */}
            <div className="space-y-1">
              <Label htmlFor="booker-timing">Preferred Timing *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="booker-timing"
                  placeholder="e.g., Saturday 6:00 AM - 9:00 AM"
                  className="pl-9"
                  value={bookingForm.timing}
                  onChange={(e) => {
                    setBookingForm(prev => ({ ...prev, timing: e.target.value }));
                    if (formErrors.timing) setFormErrors(prev => ({ ...prev, timing: "" }));
                  }}
                />
              </div>
              {formErrors.timing && <p className="text-xs text-destructive">{formErrors.timing}</p>}
            </div>

            {/* Owner contact hint */}
            {(venue as any).phoneNumber && (
              <p className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/30 p-2 rounded">
                💡 You can also directly call the owner at <strong>{(venue as any).phoneNumber}</strong>
              </p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsBookingOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBookingSubmit}
              disabled={bookingMutation.isPending}
              className="flex items-center gap-2"
            >
              {bookingMutation.isPending ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Submitting...
                </>
              ) : (
                <>
                  <CalendarCheck className="h-4 w-4" />
                  Confirm Booking
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
