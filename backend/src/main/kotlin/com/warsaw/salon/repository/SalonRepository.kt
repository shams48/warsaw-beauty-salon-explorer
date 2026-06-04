package com.warsaw.salon.repository

import com.warsaw.salon.model.Salon
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface SalonRepository : JpaRepository<Salon, Long> {

    @Query("""
        SELECT s FROM Salon s
        WHERE (:district IS NULL OR LOWER(s.district) = LOWER(:district))
          AND (:service  IS NULL OR LOWER(s.servicesRaw) LIKE LOWER(CONCAT('%', :service, '%')))
          AND (:search   IS NULL OR LOWER(s.name)    LIKE LOWER(CONCAT('%', :search, '%'))
                                 OR LOWER(s.address) LIKE LOWER(CONCAT('%', :search, '%'))
                                 OR LOWER(s.district)LIKE LOWER(CONCAT('%', :search, '%')))
    """)
    fun findFiltered(
        @Param("district") district: String?,
        @Param("service")  service:  String?,
        @Param("search")   search:   String?,
        pageable: Pageable,
    ): Page<Salon>

    @Query("SELECT DISTINCT s.district FROM Salon s ORDER BY s.district")
    fun findDistinctDistricts(): List<String>

    @Query("SELECT s.servicesRaw FROM Salon s")
    fun findAllServicesRaw(): List<String>
}
