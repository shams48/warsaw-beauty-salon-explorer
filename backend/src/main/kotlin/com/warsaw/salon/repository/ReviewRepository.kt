package com.warsaw.salon.repository

import com.warsaw.salon.model.Review
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface ReviewRepository : JpaRepository<Review, Long> {

    fun findBySalonIdOrderByCreatedAtDesc(salonId: Long): List<Review>

    fun countBySalonId(salonId: Long): Long

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.salonId = :salonId")
    fun avgRating(@Param("salonId") salonId: Long): Double?
}
