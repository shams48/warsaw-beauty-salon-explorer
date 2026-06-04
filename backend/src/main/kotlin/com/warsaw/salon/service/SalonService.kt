package com.warsaw.salon.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.warsaw.salon.model.*
import com.warsaw.salon.repository.ReviewRepository
import com.warsaw.salon.repository.SalonRepository
import jakarta.annotation.PostConstruct
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.io.File
import java.nio.file.Paths

@Service
class SalonService(
    private val repo: SalonRepository,
    private val reviewRepo: ReviewRepository,
    private val mapper: ObjectMapper,
) {

    /** On startup, seed the DB from salons.json if the table is empty */
    @PostConstruct
    fun seed() {
        if (repo.count() > 0) return

        // Look for salons.json relative to working directory or project root
        val candidates = listOf(
            "../data/salons.json",
            "data/salons.json",
            "../../data/salons.json",
        )
        val file = candidates.map { File(it) }.firstOrNull { it.exists() }
            ?: run {
                println("⚠ salons.json not found — DB will be empty. Run the scraper first.")
                return
            }

        data class RawSalon(
            val id: Long? = null,
            val name: String = "",
            val address: String = "",
            val district: String = "",
            val zipcode: String? = null,
            val city: String? = null,
            val phone: String? = null,
            val website: String? = null,
            val booksy_url: String? = null,
            val services: List<String> = emptyList(),
            val price_range: String? = null,
            val rating: Double? = null,
            val reviews: Int? = null,
            val lat: Double? = null,
            val lon: Double? = null,
            val openingHours: String? = null,
            val wheelchair: String? = null,
            val email: String? = null,
        )

        val raw: List<RawSalon> = mapper.readValue(file)
        val salons = raw.map { r ->
            Salon(
                name      = r.name,
                address   = r.address,
                district  = r.district,
                zipcode   = r.zipcode,
                city      = r.city ?: "Warszawa",
                phone     = r.phone,
                website   = r.website,
                booksyUrl = r.booksy_url,
                priceRange= r.price_range,
                rating    = r.rating,
                reviews   = r.reviews,
                lat       = r.lat,
                lon       = r.lon,
                openingHours = r.openingHours,
                wheelchair   = r.wheelchair,
                email        = r.email,
            ).also { it.services = r.services }
        }
        repo.saveAll(salons)
        println("✅ Seeded ${salons.size} salons from ${file.canonicalPath}")
    }

    fun list(
        district: String?,
        serviceType: String?,
        search: String?,
        sort: String?,
        page: Int,
        limit: Int,
    ): PagedResponse<SalonSummary> {
        val sortBy = when (sort?.lowercase()?.trim()) {
            "rating", "highest rated" -> Sort.by(Sort.Direction.DESC, "rating")
            "name", "a-z", "a–z"      -> Sort.by(Sort.Direction.ASC, "name")
            else                       -> Sort.by(Sort.Direction.DESC, "reviews")
        }
        val pageable = PageRequest.of(page - 1, limit, sortBy)
        val result = repo.findFiltered(
            district?.takeIf { it.isNotBlank() },
            serviceType?.takeIf { it.isNotBlank() },
            search?.takeIf   { it.isNotBlank() },
            pageable,
        )
        return PagedResponse(
            total = result.totalElements,
            page  = page,
            limit = limit,
            data  = result.content.map { it.toSummary() },
        )
    }

    fun detail(id: Long): SalonDetail =
        repo.findById(id).orElseThrow { NoSuchElementException("Salon $id not found") }
            .toDetail()

    @Transactional
    fun update(id: Long, req: SalonUpdateRequest): SalonDetail {
        val salon = repo.findById(id).orElseThrow { NoSuchElementException("Salon $id not found") }
        req.name?.let       { salon.name       = it }
        req.address?.let    { salon.address    = it }
        req.district?.let   { salon.district   = it }
        req.zipcode?.let    { salon.zipcode    = it }
        req.city?.let       { salon.city       = it }
        req.phone?.let      { salon.phone      = it }
        req.website?.let    { salon.website    = it }
        req.services?.let   { salon.services   = it }
        req.priceRange?.let { salon.priceRange = it }
        req.rating?.let     { salon.rating     = it }
        req.reviews?.let    { salon.reviews    = it }
        return repo.save(salon).toDetail()
    }

    fun create(req: SalonCreateRequest): SalonDetail {
        val salon = Salon(
            name      = req.name,
            address   = req.address,
            district  = req.district,
            zipcode   = req.zipcode,
            city      = req.city ?: "Warszawa",
            phone     = req.phone,
            website   = req.website,
            booksyUrl = req.booksyUrl,
            priceRange= req.priceRange,
            rating    = req.rating,
            reviews   = req.reviews,
            lat       = req.lat,
            lon       = req.lon,
        ).also { it.services = req.services }
        return repo.save(salon).toDetail()
    }

    fun meta(): Map<String, List<String>> {
        val districts = repo.findDistinctDistricts()
        val services  = repo.findAllServicesRaw()
            .flatMap { it.split(",") }
            .map { it.trim() }
            .filter { it.isNotBlank() }
            .distinct()
            .sorted()
        return mapOf("districts" to districts, "services" to services)
    }

    fun listReviews(salonId: Long): List<ReviewDto> =
        reviewRepo.findBySalonIdOrderByCreatedAtDesc(salonId).map { it.toDto() }

    @Transactional
    fun addReview(salonId: Long, req: ReviewCreateRequest): ReviewDto {
        val salon = repo.findById(salonId).orElseThrow { NoSuchElementException("Salon $salonId not found") }
        val saved = reviewRepo.save(
            Review(
                salonId = salonId,
                author  = req.author.trim().ifBlank { "Anonymous" },
                rating  = req.rating.coerceIn(1, 5),
                comment = (req.comment ?: "").trim(),
            )
        )
        // Recompute the salon's real rating + review count from stored reviews
        val avg = reviewRepo.avgRating(salonId)
        salon.rating = avg?.let { Math.round(it * 10.0) / 10.0 }
        salon.reviews = reviewRepo.countBySalonId(salonId).toInt()
        repo.save(salon)
        return saved.toDto()
    }
}
