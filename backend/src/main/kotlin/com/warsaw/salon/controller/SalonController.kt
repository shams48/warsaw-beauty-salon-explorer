package com.warsaw.salon.controller

import com.warsaw.salon.model.ReviewCreateRequest
import com.warsaw.salon.model.SalonCreateRequest
import com.warsaw.salon.model.SalonDetail
import com.warsaw.salon.model.SalonUpdateRequest
import com.warsaw.salon.service.SalonService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/salons")
@CrossOrigin(origins = ["http://localhost:3000"])
class SalonController(private val salonService: SalonService) {

    @GetMapping
    fun listSalons(
        @RequestParam district: String? = null,
        @RequestParam serviceType: String? = null,
        @RequestParam search: String? = null,
        @RequestParam sort: String? = null,
        @RequestParam(defaultValue = "1")  page: Int,
        @RequestParam(defaultValue = "20") limit: Int,
    ) = salonService.list(district, serviceType, search, sort, page, limit)

    @GetMapping("/meta")
    fun meta() = salonService.meta()

    @GetMapping("/{id}")
    fun detail(@PathVariable id: Long): ResponseEntity<*> =
        runCatching { ResponseEntity.ok(salonService.detail(id)) }
            .getOrElse { ResponseEntity.notFound().build<Unit>() }

    @PatchMapping("/{id}")
    fun update(
        @PathVariable id: Long,
        @RequestBody req: SalonUpdateRequest,
    ): ResponseEntity<*> =
        runCatching { ResponseEntity.ok(salonService.update(id, req)) }
            .getOrElse { ResponseEntity.notFound().build<Unit>() }

    @PostMapping
    fun create(@RequestBody req: SalonCreateRequest): ResponseEntity<SalonDetail> =
        ResponseEntity.status(HttpStatus.CREATED).body(salonService.create(req))

    @GetMapping("/{id}/reviews")
    fun reviews(@PathVariable id: Long) = salonService.listReviews(id)

    @PostMapping("/{id}/reviews")
    fun addReview(@PathVariable id: Long, @RequestBody req: ReviewCreateRequest): ResponseEntity<*> =
        runCatching { ResponseEntity.status(HttpStatus.CREATED).body(salonService.addReview(id, req)) }
            .getOrElse { ResponseEntity.notFound().build<Unit>() }
}
