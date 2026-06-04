package com.warsaw.salon.model

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "reviews")
data class Review(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(nullable = false)
    var salonId: Long = 0,

    @Column(nullable = false)
    var author: String = "",

    @Column(nullable = false)
    var rating: Int = 5,

    @Column(columnDefinition = "TEXT")
    var comment: String = "",

    // Epoch millis — stored as a plain Long for SQLite friendliness
    @Column(nullable = false)
    var createdAt: Long = Instant.now().toEpochMilli(),
)
