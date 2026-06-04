package com.warsaw.salon.model

import jakarta.persistence.*

@Entity
@Table(name = "salons")
data class Salon(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(nullable = false)
    var name: String = "",

    @Column(nullable = false)
    var address: String = "",

    @Column(nullable = false)
    var district: String = "",

    var zipcode: String? = null,
    var city: String? = "Warszawa",
    var phone: String? = null,
    var website: String? = null,
    var booksyUrl: String? = null,

    // Stored as comma-separated string, mapped to/from List<String>
    @Column(columnDefinition = "TEXT")
    var servicesRaw: String = "",

    var priceRange: String? = null,
    var rating: Double? = null,
    var reviews: Int? = null,
    var lat: Double? = null,
    var lon: Double? = null,

    // Real detail fields sourced from OpenStreetMap
    var openingHours: String? = null,
    var wheelchair: String? = null,
    var email: String? = null,
) {
    var services: List<String>
        get() = if (servicesRaw.isBlank()) emptyList()
                else servicesRaw.split(",").map { it.trim() }
        set(value) { servicesRaw = value.joinToString(",") }
}
