from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Smart Campus Resource Booking API")

# Allow our React frontend to communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Temporary resource data
resources = [
    {
        "id": "LAB001",
        "name": "Computer Lab 1",
        "type": "Laboratory",
        "location": "Block A",
        "capacity": 60,
    },
    {
        "id": "HALL001",
        "name": "Seminar Hall",
        "type": "Seminar Hall",
        "location": "Block B",
        "capacity": 150,
    },
    {
        "id": "SPORT001",
        "name": "Sports Complex",
        "type": "Sports Facility",
        "location": "Block C",
        "capacity": 100,
    },
]

# Temporary booking storage
bookings = []


# Booking request structure
class BookingRequest(BaseModel):
    resource_id: str
    user_name: str
    date: str
    start_time: str
    end_time: str
    purpose: str


@app.get("/")
def root():
    return {
        "message": "Smart Campus Resource Booking API is running"
    }


@app.get("/resources")
def get_resources():
    return resources


@app.get("/bookings")
def get_bookings():
    return bookings


@app.post("/bookings")
def create_booking(booking: BookingRequest):

    # Check whether the requested resource exists
    resource_exists = any(
        resource["id"] == booking.resource_id
        for resource in resources
    )

    if not resource_exists:
        raise HTTPException(
            status_code=404,
            detail="Resource not found"
        )

    # Check that start time is before end time
    if booking.start_time >= booking.end_time:
        raise HTTPException(
            status_code=400,
            detail="Start time must be before end time"
        )

    # Check for booking conflicts
    for existing_booking in bookings:

        if (
            existing_booking["resource_id"] == booking.resource_id
            and existing_booking["date"] == booking.date
            and existing_booking["status"] != "REJECTED"
        ):

            # Check whether the time ranges overlap
            if (
                booking.start_time < existing_booking["end_time"]
                and booking.end_time > existing_booking["start_time"]
            ):
                raise HTTPException(
                    status_code=409,
                    detail="Resource is already booked for this time period"
                )

    # Create a new booking
    new_booking = {
        "id": f"BOOK{len(bookings) + 1:03d}",
        "resource_id": booking.resource_id,
        "user_name": booking.user_name,
        "date": booking.date,
        "start_time": booking.start_time,
        "end_time": booking.end_time,
        "purpose": booking.purpose,
        "status": "PENDING",
    }

    bookings.append(new_booking)

    return {
        "message": "Booking request submitted successfully",
        "booking": new_booking
    }


@app.patch("/bookings/{booking_id}/approve")
def approve_booking(booking_id: str):

    # Find the booking
    for booking in bookings:

        if booking["id"] == booking_id:

            if booking["status"] != "PENDING":
                raise HTTPException(
                    status_code=400,
                    detail="Only pending bookings can be approved"
                )

            booking["status"] = "APPROVED"

            return {
                "message": "Booking approved successfully",
                "booking": booking
            }

    raise HTTPException(
        status_code=404,
        detail="Booking not found"
    )


@app.patch("/bookings/{booking_id}/reject")
def reject_booking(booking_id: str):

    # Find the booking
    for booking in bookings:

        if booking["id"] == booking_id:

            if booking["status"] != "PENDING":
                raise HTTPException(
                    status_code=400,
                    detail="Only pending bookings can be rejected"
                )

            booking["status"] = "REJECTED"

            return {
                "message": "Booking rejected successfully",
                "booking": booking
            }

    raise HTTPException(
        status_code=404,
        detail="Booking not found"
    )