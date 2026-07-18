package com.hethongtruongthpt.repository;

import com.hethongtruongthpt.entity.AiSuggestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface AiSuggestionRepository extends JpaRepository<AiSuggestion, Integer> {
    Optional<AiSuggestion> findByHocSinhIdAndHocKyAndNamHocAndHetHanAfter(
            Integer hocSinhId, Integer hocKy, String namHoc, LocalDateTime now);
}
