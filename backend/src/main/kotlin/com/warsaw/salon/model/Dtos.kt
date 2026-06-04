package com.warsaw.salon.model

/** Lightweight summary shown in the listing page */
data class SalonSummary(
    val id: Long,
    val name: String,
    val address: String,
    val district: String,
    val rating: Double?,
    val reviews: Int?,
    val priceRange: String?,
    val lat: Double?,
    val lon: Double?,
    val openingHours: String?,
    val wheelchair: String?,
)

/** Full details shown in the detail view */
data class SalonDetail(
    val id: Long,
    val name: String,
    val address: String,
    val district: String,
    val zipcode: String?,
    val city: String?,
    val phone: String?,
    val website: String?,
    val booksyUrl: String?,
    val services: List<String>,
    val priceRange: String?,
    val rating: Double?,
    val reviews: Int?,
    val lat: Double?,
    val lon: Double?,
    val openingHours: String?,
    val wheelchair: String?,
    val email: String?,
)

/** Wraps a paginated list response */
data class PagedResponse<T>(
    val total: Long,
    val page: Int,
    val limit: Int,
    val data: List<T>,
)

/** Request body for PATCH /api/salons/:id */
data class SalonUpdateRequest(
    val name: String? = null,
    val address: String? = null,
    val district: String? = null,
    val zipcode: String? = null,
    val city: String? = null,
    val phone: String? = null,
    val website: String? = null,
    val services: List<String>? = null,
    val priceRange: String? = null,
    val rating: Double? = null,
    val reviews: Int? = null,
)

/** Request body for POST /api/salons */
data class SalonCreateRequest(
    val name: String,
    val address: String,
    val district: String,
    val zipcode: String? = null,
    val city: String? = null,
    val phone: String? = null,
    val website: String? = null,
    val booksyUrl: String? = null,
    val services: List<String> = emptyList(),
    val priceRange: String? = null,
    val rating: Double? = null,
    val reviews: Int? = null,
    val lat: Double? = null,
    val lon: Double? = null,
)

fun Salon.toSummary() = SalonSummary(id, name, address, district, rating, reviews, priceRange, lat, lon, openingHours, wheelchair)

fun Salon.toDetail() = SalonDetail(
    id, name, address, district, zipcode, city,
    phone, website, booksyUrl, services,
    priceRange, rating, reviews, lat, lon,
    openingHours, wheelchair, email
)

/** Review DTOs */
data class ReviewDto(
    val id: Long,
    val author: String,
    val rating: Int,
    val comment: String,
    val createdAt: Long,
)

data class ReviewCreateRequest(
    val author: String = "",
    val rating: Int = 5,
    val comment: String? = null,
)

fun Review.toDto() = ReviewDto(id, author, rating, comment, createdAt)
